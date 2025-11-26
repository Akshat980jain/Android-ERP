const express = require('express');
const { body, validationResult } = require('express-validator');
const Assignment = require('../models/Assignment');
const Course = require('../models/Course'); 
const { auth, authorize, checkVerification } = require('../middleware/auth');
const { assignmentAttachmentsUpload, submissionFilesUpload } = require('../middleware/upload');
const emailService = require('../services/emailService');
const User = require('../models/User');

const router = express.Router();

// Get assignments
// Note: Do NOT block students from viewing assignments due to verification status
// so we intentionally skip `checkVerification` here.
router.get('/', auth, async (req, res) => {
  try {
    const { courseId, status } = req.query;
    
    let query = {};
    
    if (req.user.role === 'student') {
      // Students see published assignments from their enrolled courses (including upcoming ones)
      const enrolledCourses = await Course.find({ students: req.user._id }).select('_id');
      const courseIds = Array.isArray(enrolledCourses) ? enrolledCourses.map(c => c._id) : [];
      query.course = { $in: courseIds };
      query.status = 'published';
    } else if (req.user.role === 'faculty') {
      // Faculty see assignments they created
      query.faculty = req.user._id;
    }
    
    if (courseId) query.course = courseId;
    if (status) query.status = status;

    const assignments = await Assignment.find(query)
      .populate('course', 'name code')
      .populate('faculty', 'name firstName lastName')
      .sort({ dueDate: 1 });

    // For students, add submission status
    if (req.user.role === 'student') {
      const assignmentsWithStatus = assignments.map(assignment => {
        const a = assignment.toObject();
        const submissions = Array.isArray(a.submissions) ? a.submissions : [];
        const submission = submissions.find(
          (sub) => sub && sub.student && sub.student.toString() === req.user._id.toString()
        );
        // Normalize file fields for frontend: use `attachments` with filename/url/size
        const attachments = Array.isArray(a.attachments)
          ? a.attachments.map(f => ({
              filename: f.filename,
              url: f.url,
              size: f.size || 0
            }))
          : [];
        return {
          ...a,
          attachments,
          hasSubmitted: !!submission,
          submissionStatus: submission?.status,
          marks: submission?.marks,
          feedback: submission?.feedback
        };
      });
      return res.json({ assignments: assignmentsWithStatus });
    }

    // Normalize attachments for non-student responses too
    const normalized = assignments.map(a => {
      const obj = a.toObject();
      return {
        ...obj,
        attachments: Array.isArray(obj.attachments)
          ? obj.attachments.map(f => ({ filename: f.filename, url: f.url, size: f.size || 0 }))
          : []
      };
    });
    res.json({ assignments: normalized });
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create assignment (Faculty/Admin) with optional attachments
router.post('/', auth, authorize('faculty', 'admin'), assignmentAttachmentsUpload.array('attachments', 10), [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('courseId').isMongoId().withMessage('Valid course ID required'),
  body('startDate').isISO8601().withMessage('Valid start date required'),
  body('dueDate').isISO8601().withMessage('Valid due date required'),
  body('maxMarks').isNumeric().withMessage('Max marks must be a number')
], async (req, res) => {
  try {
    console.log('Create assignment request received:', {
      body: req.body,
      files: req.files ? req.files.length : 0,
      user: req.user._id,
      role: req.user.role
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, courseId, startDate, dueDate, maxMarks, instructions, allowLateSubmission, lateSubmissionPenalty } = req.body;

    // Verify course exists and faculty has access
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (req.user.role === 'faculty' && course.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const attachments = Array.isArray(req.files)
      ? req.files.map(f => ({
          filename: f.originalname,
          url: `/uploads/assignments/questions/${f.filename}`,
          size: f.size
        }))
      : [];

    console.log('Creating assignment with data:', {
      title,
      description,
      courseId,
      startDate,
      dueDate,
      maxMarks,
      instructions,
      allowLateSubmission,
      lateSubmissionPenalty,
      attachmentsCount: attachments.length
    });

    const assignment = new Assignment({
      title,
      description,
      course: courseId,
      faculty: req.user._id,
      startDate: new Date(startDate),
      dueDate: new Date(dueDate),
      maxMarks,
      instructions,
      attachments,
      allowLateSubmission: allowLateSubmission || false,
      lateSubmissionPenalty: lateSubmissionPenalty || 0,
      status: 'published'
    });

    await assignment.save();
    await assignment.populate(['course', 'faculty']);

    // Send email notifications to enrolled students
    try {
      const enrolledStudents = await User.find({ 
        _id: { $in: course.students },
        'preferences.notifications.email': { $ne: false }
      });

      for (const student of enrolledStudents) {
        await emailService.sendAssignmentNotification(student, {
          ...assignment.toObject(),
          courseName: course.name
        });
      }
      
      console.log(`Sent assignment notifications to ${enrolledStudents.length} students`);
    } catch (emailError) {
      console.error('Assignment notification email error:', emailError);
      // Don't fail assignment creation if email fails
    }

    console.log('Assignment created successfully:', assignment._id);
    res.status(201).json({ message: 'Assignment created successfully', assignment });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit assignment (Student) with files
router.post('/:assignmentId/submit', auth, authorize('student'), checkVerification, submissionFilesUpload.array('files', 10), async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { content } = req.body;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (assignment.status !== 'published') {
      return res.status(400).json({ message: 'Assignment is not available for submission' });
    }

    // Check if already submitted
    const existingSubmission = assignment.submissions.find(
      sub => sub.student.toString() === req.user._id.toString()
    );

    if (existingSubmission) {
      return res.status(400).json({ message: 'Assignment already submitted' });
    }

    // Check due date
    const now = new Date();
    const isLate = now > assignment.dueDate;

    if (isLate && !assignment.allowLateSubmission) {
      return res.status(400).json({ message: 'Assignment submission deadline has passed' });
    }

    const files = Array.isArray(req.files)
      ? req.files.map(f => ({
          filename: f.originalname,
          url: `/uploads/assignments/submissions/${f.filename}`,
          size: f.size
        }))
      : [];

    assignment.submissions.push({
      student: req.user._id,
      content,
      files,
      status: isLate ? 'late' : 'submitted'
    });

    await assignment.save();

    res.json({ message: 'Assignment submitted successfully' });
  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Grade assignment (Faculty/Admin)
router.patch('/:assignmentId/grade/:studentId', auth, authorize('faculty', 'admin'), [
  body('marks').isNumeric().withMessage('Marks must be a number'),
  body('feedback').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { assignmentId, studentId } = req.params;
    const { marks, feedback } = req.body;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (req.user.role === 'faculty' && assignment.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const submission = assignment.submissions.find(
      sub => sub.student.toString() === studentId
    );

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    if (marks > assignment.maxMarks) {
      return res.status(400).json({ message: 'Marks cannot exceed maximum marks' });
    }

    submission.marks = marks;
    submission.feedback = feedback;
    submission.gradedBy = req.user._id;
    submission.gradedAt = new Date();
    submission.status = 'graded';

    await assignment.save();

    res.json({ message: 'Assignment graded successfully' });
  } catch (error) {
    console.error('Grade assignment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get assignment submissions (Faculty/Admin)
router.get('/:assignmentId/submissions', auth, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findById(assignmentId)
      .populate('course', 'name code')
      // Populate student with correct fields from User model
      // User has 'name' and 'profile.studentId'
      .populate('submissions.student', 'name profile.studentId')
      .populate('submissions.gradedBy', 'name');

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (req.user.role === 'faculty' && assignment.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ assignment });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;