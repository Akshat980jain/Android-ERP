const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const Exam = require('../models/Exam');
const Course = require('../models/Course');
const User = require('../models/User');

const router = express.Router();

// List exams (role-aware)
router.get('/', auth, async (req, res) => {
  try {
    const { role, _id: userId } = req.user;
    let query = {};

    if (role === 'faculty') {
      query.faculty = userId;
    } else if (role === 'student') {
      // Student: show scheduled/active exams for courses they are enrolled in
      // Fallback: if no enrollment relation, show exams by program/course in profile
      const studentCourse = req.user.profile?.course || req.user.program || null;
      const courseDocs = await Course.find({
        $or: [
          { students: userId },
          studentCourse ? { department: studentCourse } : null
        ].filter(Boolean)
      }).select('_id');
      const courseIds = courseDocs.map(c => c._id);
      query = {
        course: { $in: courseIds },
        status: { $in: ['scheduled', 'active'] }
      };
    }

    const exams = await Exam.find(query)
      .populate('course', 'name code')
      .populate('faculty', 'name email')
      .sort({ startTime: 1 });

    res.json({ success: true, exams });
  } catch (error) {
    console.error('List exams error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch exams' });
  }
});

// Create exam (Faculty/Admin)
router.post('/', auth, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const {
      title,
      courseId,
      course: courseField,
      examType,
      duration,
      startTime,
      endTime,
      totalMarks,
      passingMarks,
      instructions,
      description,
      questions,
      settings
    } = req.body;

    // Accept either `courseId` or `course` from frontend
    const resolvedCourseId = courseId || courseField;
    if (!resolvedCourseId) {
      return res.status(400).json({ success: false, message: 'Course is required' });
    }

    const course = await Course.findById(resolvedCourseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    if (req.user.role === 'faculty' && course.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied for this course' });
    }

    const safeTitle = (title || '').trim();
    if (!safeTitle) return res.status(400).json({ success: false, message: 'Title is required' });

    const safeDuration = Math.max(1, Number(duration) || 60);
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid start or end time' });
    }
    if (end <= start) {
      return res.status(400).json({ success: false, message: 'End time must be after start time' });
    }

    const rawQuestions = Array.isArray(questions) ? questions : [];
    const normalizedQuestions = rawQuestions.map((q) => {
      const type = ['mcq', 'short_answer', 'long_answer', 'true_false'].includes(q?.questionType)
        ? q.questionType
        : 'mcq';
      return {
        questionText: (q?.questionText || 'Untitled question').trim(),
        questionType: type,
        options: type === 'mcq' ? (Array.isArray(q?.options) && q.options.length ? q.options : ['Option 1', 'Option 2', 'Option 3', 'Option 4']) : undefined,
        correctAnswer: q?.correctAnswer ?? (type === 'true_false' ? 'true' : ''),
        marks: Math.max(1, Number(q?.marks) || 1),
        explanation: q?.explanation || undefined
      };
    });

    const computedTotal = Number(totalMarks) || normalizedQuestions.reduce((sum, q) => sum + (q.marks || 0), 0) || 100;
    const safePassing = (passingMarks === 0 || passingMarks) ? Number(passingMarks) : Math.floor(computedTotal * 0.4);
    const safeExamType = examType || 'quiz';
    const safeInstructions = instructions ?? description ?? '';

    const mergedSettings = {
      shuffleQuestions: false,
      shuffleOptions: false,
      allowReview: true,
      showResults: true,
      preventCopyPaste: true,
      fullScreenMode: true,
      maxAttempts: 1,
      ...(settings || {})
    };
    mergedSettings.maxAttempts = Math.max(1, Number(mergedSettings.maxAttempts) || 1);

    const exam = await Exam.create({
      title: safeTitle,
      course: course._id,
      faculty: req.user._id,
      examType: safeExamType,
      duration: safeDuration,
      startTime: start,
      endTime: end,
      totalMarks: computedTotal,
      passingMarks: safePassing,
      instructions: safeInstructions,
      questions: normalizedQuestions,
      settings: mergedSettings,
      status: 'scheduled'
    });

    res.status(201).json({ success: true, exam });
  } catch (error) {
    console.error('Create exam error:', error);
    // Surface validation errors clearly
    if (error?.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message, details: error.errors });
    }
    res.status(500).json({ success: false, message: 'Failed to create exam' });
  }
});

// List current student's attempts (Student)
router.get('/my-attempts', auth, authorize('student'), async (req, res) => {
  try {
    const exams = await Exam.find({ 'attempts.student': req.user._id })
      .select('title course startTime endTime duration totalMarks attempts')
      .populate('course', 'name code')
      .lean();

    const attempts = exams.flatMap((exam) => {
      const studentAttempts = (exam.attempts || []).filter(a => String(a.student) === String(req.user._id));
      return studentAttempts.map((a) => ({
        examId: String(exam._id),
        examTitle: exam.title,
        course: exam.course,
        status: a.status,
        totalMarks: a.totalMarks || 0,
        maximumMarks: exam.totalMarks || 0,
        percentage: a.percentage || 0,
        submittedAt: a.submittedAt || null,
        gradedAt: a.gradedAt || null,
        feedback: a.feedback || '',
      }));
    })
    .sort((x, y) => new Date(y.submittedAt || 0).getTime() - new Date(x.submittedAt || 0).getTime());

    res.json({ success: true, attempts });
  } catch (error) {
    console.error('List my attempts error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch attempts' });
  }
});

// Get exam
router.get('/:id', auth, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('course', 'name code')
      .populate('faculty', 'name email');
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    res.json({ success: true, exam });
  } catch (error) {
    console.error('Get exam error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch exam' });
  }
});

// Update exam (Faculty who created it or Admin)
router.put('/:id', auth, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    // Ownership check for faculty
    const isAdmin = req.user.role === 'admin';
    const isOwnerFaculty = exam.faculty?.toString() === req.user._id.toString();
    if (!isAdmin && !isOwnerFaculty) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const {
      title,
      courseId,
      course: courseField,
      examType,
      duration,
      startTime,
      endTime,
      totalMarks,
      passingMarks,
      instructions,
      description,
      questions,
      settings,
      status
    } = req.body;

    // Course update (optional)
    const resolvedCourseId = courseId || courseField;
    if (resolvedCourseId) {
      const course = await Course.findById(resolvedCourseId);
      if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
      if (!isAdmin && course.faculty.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied for this course' });
      }
      exam.course = course._id;
    }

    if (title !== undefined) {
      const safeTitle = String(title).trim();
      if (!safeTitle) return res.status(400).json({ success: false, message: 'Title is required' });
      exam.title = safeTitle;
    }

    if (examType !== undefined) exam.examType = examType || 'quiz';
    if (duration !== undefined) exam.duration = Math.max(1, Number(duration) || 60);

    if (startTime !== undefined) {
      const start = new Date(startTime);
      if (Number.isNaN(start.getTime())) return res.status(400).json({ success: false, message: 'Invalid start time' });
      exam.startTime = start;
    }
    if (endTime !== undefined) {
      const end = new Date(endTime);
      if (Number.isNaN(end.getTime())) return res.status(400).json({ success: false, message: 'Invalid end time' });
      exam.endTime = end;
    }
    if (exam.endTime <= exam.startTime) {
      return res.status(400).json({ success: false, message: 'End time must be after start time' });
    }

    // Questions normalization (optional)
    if (questions !== undefined) {
      const rawQuestions = Array.isArray(questions) ? questions : [];
      exam.questions = rawQuestions.map((q) => {
        const type = ['mcq', 'short_answer', 'long_answer', 'true_false'].includes(q?.questionType)
          ? q.questionType
          : 'mcq';
        return {
          questionText: (q?.questionText || 'Untitled question').trim(),
          questionType: type,
          options: type === 'mcq' ? (Array.isArray(q?.options) && q.options.length ? q.options : ['Option 1', 'Option 2', 'Option 3', 'Option 4']) : undefined,
          correctAnswer: q?.correctAnswer ?? (type === 'true_false' ? 'true' : ''),
          marks: Math.max(1, Number(q?.marks) || 1),
          explanation: q?.explanation || undefined
        };
      });
    }

    // Marks
    if (totalMarks !== undefined) {
      exam.totalMarks = Math.max(1, Number(totalMarks) || 1);
    } else if (questions !== undefined) {
      // Recompute total if questions changed and totalMarks not explicitly provided
      exam.totalMarks = exam.questions.reduce((sum, q) => sum + (q.marks || 0), 0) || exam.totalMarks;
    }
    if (passingMarks !== undefined) {
      exam.passingMarks = Math.max(0, Number(passingMarks) || 0);
    }

    // Instructions / description
    if (instructions !== undefined || description !== undefined) {
      exam.instructions = instructions ?? description ?? exam.instructions;
    }

    // Settings merge
    if (settings && typeof settings === 'object') {
      const next = { ...exam.settings, ...settings };
      if (next.maxAttempts !== undefined) {
        next.maxAttempts = Math.max(1, Number(next.maxAttempts) || 1);
      }
      exam.settings = next;
    }

    if (status !== undefined) {
      exam.status = status;
    }

    await exam.save();
    const populated = await Exam.findById(exam._id)
      .populate('course', 'name code')
      .populate('faculty', 'name email');
    res.json({ success: true, exam: populated });
  } catch (error) {
    console.error('Update exam error:', error);
    if (error?.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message, details: error.errors });
    }
    res.status(500).json({ success: false, message: 'Failed to update exam' });
  }
});

// Delete exam (Faculty who created it or Admin)
router.delete('/:id', auth, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    const isAdmin = req.user.role === 'admin';
    const isOwnerFaculty = exam.faculty?.toString() === req.user._id.toString();
    if (!isAdmin && !isOwnerFaculty) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await Exam.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Exam deleted successfully' });
  } catch (error) {
    console.error('Delete exam error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete exam' });
  }
});

// Start exam (Student)
router.post('/:id/start', auth, authorize('student'), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    const now = new Date();
    if (now < new Date(exam.startTime)) return res.status(400).json({ success: false, message: 'Exam has not started' });
    if (now > new Date(exam.endTime)) return res.status(400).json({ success: false, message: 'Exam has ended' });

    // Enforce max attempts
    const attemptsByStudent = exam.attempts.filter(a => a.student?.toString() === req.user._id.toString());
    const nonTimeoutAttempts = attemptsByStudent.filter(a => a.status !== 'timeout');
    const maxAttempts = exam.settings?.maxAttempts ? Number(exam.settings.maxAttempts) : 1;
    if (nonTimeoutAttempts.length >= maxAttempts) {
      return res.status(400).json({ success: false, message: `Maximum attempts reached (${maxAttempts}).` });
    }

    const existing = attemptsByStudent.find(a => a.status === 'in_progress');
    if (existing) return res.json({ success: true, attempt: existing });

    exam.attempts.push({ student: req.user._id, startedAt: now, status: 'in_progress' });
    await exam.save();
    const attempt = exam.attempts[exam.attempts.length - 1];
    res.json({ success: true, attempt });
  } catch (error) {
    console.error('Start exam error:', error);
    res.status(500).json({ success: false, message: 'Failed to start exam' });
  }
});

// Submit exam (Student)
router.post('/:id/submit', auth, authorize('student'), async (req, res) => {
  try {
    const { answers = [], meta } = req.body; // answers: [{questionIndex, answer}]
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    const attempt = exam.attempts.find(a => a.student?.toString() === req.user._id.toString() && a.status === 'in_progress');
    if (!attempt) return res.status(400).json({ success: false, message: 'No active attempt' });

    // Auto-evaluate objective questions
    let totalMarks = 0;
    const evaluatedAnswers = answers.map(a => {
      const q = exam.questions[a.questionIndex];
      if (!q) return { ...a, isCorrect: false, marksAwarded: 0 };
      const isObjective = ['mcq', 'true_false'].includes(q.questionType);
      const isCorrect = isObjective ? String(a.answer).trim() === String(q.correctAnswer).trim() : false;
      const marksAwarded = isCorrect ? (q.marks || 0) : 0;
      totalMarks += marksAwarded;
      return { ...a, isCorrect, marksAwarded };
    });

    attempt.answers = evaluatedAnswers;
    attempt.submittedAt = new Date();
    attempt.totalMarks = totalMarks;
    attempt.percentage = exam.totalMarks ? Math.round((totalMarks / exam.totalMarks) * 100) : 0;
    attempt.status = 'submitted';
    attempt.timeSpent = attempt.startedAt ? Math.ceil((attempt.submittedAt - attempt.startedAt) / 60000) : undefined;
    attempt.browserInfo = meta?.browserInfo;
    attempt.ipAddress = req.ip;

    await exam.save();
    res.json({ success: true, attempt });
  } catch (error) {
    console.error('Submit exam error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit exam' });
  }
});

// Heartbeat / anti-cheat signals
router.post('/:id/heartbeat', auth, authorize('student'), async (req, res) => {
  try {
    const { visibility, fullscreen } = req.body;
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    const attempt = exam.attempts.find(a => a.student?.toString() === req.user._id.toString() && a.status === 'in_progress');
    if (!attempt) return res.status(400).json({ success: false, message: 'No active attempt' });

    // Save last heartbeat in remarks for simplicity
    attempt.remarks = `visibility:${visibility ? 'visible' : 'hidden'}; fullscreen:${fullscreen ? 'on' : 'off'}; ts:${new Date().toISOString()}`;
    await exam.save();
    res.json({ success: true });
  } catch (error) {
    console.error('Heartbeat error:', error);
    res.status(500).json({ success: false, message: 'Failed to update heartbeat' });
  }
});

// List attempts for an exam (Faculty/Admin)
router.get('/:id/attempts', auth, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('attempts.student', 'name email profile.studentId');
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    // Faculty must own the course
    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && exam.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, attempts: exam.attempts });
  } catch (error) {
    console.error('List attempts error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch attempts' });
  }
});

// Grade an attempt (Faculty/Admin)
router.post('/:id/grade/:studentId', auth, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const { manualMarks = [], feedback } = req.body;
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    // Ownership check
    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && exam.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const attempt = exam.attempts.find(a => a.student?.toString() === req.params.studentId);
    if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });
    if (attempt.status === 'in_progress') {
      return res.status(400).json({ success: false, message: 'Cannot grade an in-progress attempt' });
    }

    // Merge manual marks
    const normalizedMarks = Array.isArray(manualMarks) ? manualMarks : [];
    attempt.manualMarks = normalizedMarks.map(m => ({
      questionIndex: Number(m.questionIndex),
      marksAwarded: Math.max(0, Number(m.marksAwarded) || 0),
      comment: m.comment || ''
    }));

    // Recompute totals: objective marks + manual marks (manual overrides if same index)
    const objectiveMap = new Map(attempt.answers.map(a => [a.questionIndex, a.marksAwarded || 0]));
    const manualMap = new Map(attempt.manualMarks.map(m => [m.questionIndex, m.marksAwarded || 0]));
    let totalMarks = 0;
    const questionCount = Math.max(
      ...[...objectiveMap.keys(), ...manualMap.keys(), -1]
    ) + 1;
    for (let i = 0; i < questionCount; i++) {
      const manual = manualMap.has(i) ? Number(manualMap.get(i)) : undefined;
      const objective = Number(objectiveMap.get(i) || 0);
      totalMarks += manual !== undefined ? manual : objective;
    }
    attempt.totalMarks = totalMarks;
    attempt.percentage = exam.totalMarks ? Math.round((totalMarks / exam.totalMarks) * 100) : 0;
    attempt.feedback = feedback || attempt.feedback;
    attempt.gradedBy = req.user._id;
    attempt.gradedAt = new Date();
    attempt.status = 'graded';

    await exam.save();
    return res.json({ success: true, attempt });
  } catch (error) {
    console.error('Grade attempt error:', error);
    res.status(500).json({ success: false, message: 'Failed to grade attempt' });
  }
});

module.exports = router;


