const express = require('express');
const router = express.Router();
const Assessment = require('../models/Assessment');
const Marks = require('../models/Marks');
const Course = require('../models/Course');
const { auth, authorize } = require('../middleware/auth');

// GET /api/assessments?course=COURSE_ID
router.get('/', auth, async (req, res) => {
  try {
    const { course } = req.query;
    if (!course) {
      return res.status(400).json({ success: false, message: 'course is required' });
    }

    // Authorization: students enrolled, course faculty, or admin
    const courseDoc = await Course.findById(course).select('faculty students');
    if (!courseDoc) return res.status(404).json({ success: false, message: 'Course not found' });
    const isAdmin = req.user.role === 'admin';
    const isFaculty = req.user.role === 'faculty' && courseDoc.faculty?.toString() === req.user._id.toString();
    const isStudent = req.user.role === 'student' && courseDoc.students?.some(id => id.toString() === req.user._id.toString());
    if (!(isAdmin || isFaculty || isStudent)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const assessments = await Assessment.find({ course })
      .sort({ date: -1 });
    res.json({ success: true, assessments });
  } catch (error) {
    console.error('Get assessments error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/assessments
router.post('/', auth, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const { name, type, maxMarks, date, course } = req.body;
    if (!name || !type || !maxMarks || !date || !course) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const courseDoc = await Course.findById(course);
    if (!courseDoc) return res.status(404).json({ success: false, message: 'Course not found' });
    const isAdmin = req.user.role === 'admin';
    const isCourseFaculty = courseDoc.faculty?.toString() === req.user._id.toString();
    if (!(isAdmin || isCourseFaculty)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const assessment = await Assessment.create({
      name: name.trim(),
      type,
      maxMarks,
      course,
      date: new Date(date),
      createdBy: req.user._id
    });
    res.status(201).json({ success: true, assessment });
  } catch (error) {
    console.error('Create assessment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/assessments/:id
router.delete('/:id', auth, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found' });
    const courseDoc = await Course.findById(assessment.course).select('faculty');
    const isAdmin = req.user.role === 'admin';
    const isCourseFaculty = courseDoc && courseDoc.faculty?.toString() === req.user._id.toString();
    if (!(isAdmin || isCourseFaculty)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    await Assessment.findByIdAndDelete(req.params.id);
    await Marks.deleteMany({ course: assessment.course, title: assessment.name, type: assessment.type });
    res.json({ success: true, message: 'Assessment deleted' });
  } catch (error) {
    console.error('Delete assessment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;


