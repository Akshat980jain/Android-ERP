const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const Feedback = require('../models/Feedback');
const Course = require('../models/Course');

const router = express.Router();

// Submit feedback (Student)
router.post('/', auth, authorize('student'), async (req, res) => {
  try {
    const { courseId, facultyId, semester, academicYear, ratings, comments, isAnonymous } = req.body;
    if (!courseId || !facultyId || !semester || !academicYear || !ratings) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const payload = {
      student: req.user._id,
      course: courseId,
      faculty: facultyId,
      semester,
      academicYear,
      ratings,
      comments: comments || {},
      isAnonymous: isAnonymous !== false
    };

    const feedback = await Feedback.create(payload);
    res.status(201).json({ success: true, feedback });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Feedback already submitted for this course' });
    }
    console.error('Submit feedback error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit feedback' });
  }
});

// Get feedback summary (Faculty/Admin)
router.get('/summary', auth, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const { courseId, semester, academicYear } = req.query;
    const match = {};
    if (req.user.role === 'faculty') match.faculty = req.user._id;
    if (courseId) match.course = courseId;
    if (semester) match.semester = Number(semester);
    if (academicYear) match.academicYear = academicYear;

    const rounds = await Feedback.aggregate([
      { $match: match },
      {
        $group: {
          _id: { course: '$course' },
          count: { $sum: 1 },
          avgTeaching: { $avg: '$ratings.teachingQuality' },
          avgContent: { $avg: '$ratings.courseContent' },
          avgCommunication: { $avg: '$ratings.communication' },
          avgAvailability: { $avg: '$ratings.availability' },
          avgOverall: { $avg: '$ratings.overallRating' }
        }
      }
    ]);

    // Populate course names
    const courseIds = rounds.map(r => r._id.course);
    const courses = await Course.find({ _id: { $in: courseIds } }).select('name code');
    const courseMap = new Map(courses.map(c => [c._id.toString(), c]));
    const result = rounds.map(r => ({
      course: courseMap.get(r._id.course.toString()) || r._id.course,
      count: r.count,
      averages: {
        teachingQuality: Math.round((r.avgTeaching || 0) * 10) / 10,
        courseContent: Math.round((r.avgContent || 0) * 10) / 10,
        communication: Math.round((r.avgCommunication || 0) * 10) / 10,
        availability: Math.round((r.avgAvailability || 0) * 10) / 10,
        overall: Math.round((r.avgOverall || 0) * 10) / 10
      }
    }));

    res.json({ success: true, summary: result });
  } catch (error) {
    console.error('Feedback summary error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch feedback summary' });
  }
});

module.exports = router;


