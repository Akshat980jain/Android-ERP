const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const Attendance = require('../models/Attendance');
const Course = require('../models/Course');
const Settings = require('../models/Settings');

// @route   GET /api/attendance
// @desc    Get attendance for current user (student) or all students (faculty/admin)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { courseId, studentId, startDate, endDate } = req.query;
    
    let query = {};
    
    // For students, only show their own attendance
    if (req.user.role === 'student') {
      query.student = req.user._id;
    } else if (studentId) {
      // For faculty/admin, allow filtering by specific student
      query.student = studentId;
    }
    
    if (courseId) {
      query.course = courseId;
    }
    
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const attendance = await Attendance.find(query)
      .populate('course', 'name code')
      .populate('student', 'name profile.studentId email')
      .populate('markedBy', 'name')
      .sort({ date: -1 });

    // Load attendance policy
    const settings = await Settings.findOne();
    const weights = settings?.attendancePolicy?.weights || { present: 1, late: 0.5, absent: 0 };

    // Calculate attendance statistics
    const attendanceStats = {};
    attendance.forEach(record => {
      const courseId = record.course._id.toString();
      if (!attendanceStats[courseId]) {
        attendanceStats[courseId] = {
          course: record.course,
          total: 0,
          present: 0,
          late: 0,
          absent: 0,
          percentage: 0
        };
      }
      
      const lectureCount = record.lectureCount || 1;
      attendanceStats[courseId].total += lectureCount;
      
      if (record.status === 'present') {
        attendanceStats[courseId].present += lectureCount;
      } else if (record.status === 'late') {
        attendanceStats[courseId].late += lectureCount;
      } else if (record.status === 'absent') {
        attendanceStats[courseId].absent += lectureCount;
      }
    });

    // Calculate percentages
    Object.keys(attendanceStats).forEach(courseId => {
      const stats = attendanceStats[courseId];
      const weightedPresent = (stats.present * weights.present) + (stats.late * weights.late);
      stats.percentage = stats.total > 0 ? Math.round((weightedPresent / stats.total) * 100) : 0;
    });

    res.json({
      success: true,
      attendance,
      stats: Object.values(attendanceStats),
      averageAttendance: Object.values(attendanceStats).length > 0 
        ? Math.round(Object.values(attendanceStats).reduce((sum, stat) => sum + stat.percentage, 0) / Object.values(attendanceStats).length)
        : 0
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/attendance/summary
// @desc    Get attendance summary for current user
// @access  Private
router.get('/summary', auth, async (req, res) => {
  try {
    const { studentId } = req.query;
    
    let query = {};
    if (req.user.role === 'student') {
      query.student = req.user._id;
    } else if (studentId) {
      query.student = studentId;
    }

    const attendance = await Attendance.find(query)
      .populate('course', 'name code')
      .populate('student', 'name profile.studentId');

    // Load attendance policy
    const settings = await Settings.findOne();
    const weights = settings?.attendancePolicy?.weights || { present: 1, late: 0.5, absent: 0 };

    // Calculate overall attendance percentage
    let totalLectures = 0;
    let weightedPresent = 0;
    
    attendance.forEach(record => {
      const lectureCount = record.lectureCount || 1;
      totalLectures += lectureCount;
      
      if (record.status === 'present') {
        weightedPresent += lectureCount * weights.present;
      } else if (record.status === 'late') {
        weightedPresent += lectureCount * weights.late;
      }
    });

    const averageAttendance = totalLectures > 0 ? Math.round((weightedPresent / totalLectures) * 100) : 0;

    res.json({
      success: true,
      averageAttendance,
      totalLectures,
      totalRecords: attendance.length
    });
  } catch (error) {
    console.error('Get attendance summary error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/attendance/student/:studentId
// @desc    Get attendance for specific student (faculty/admin only)
// @access  Private
router.get('/student/:studentId', auth, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const { studentId } = req.params;
    const { courseId } = req.query;
    
    let query = { student: studentId };
    if (courseId) {
      query.course = courseId;
    }

    const attendance = await Attendance.find(query)
      .populate('course', 'name code')
      .populate('student', 'name profile.studentId email')
      .populate('markedBy', 'name')
      .sort({ date: -1 });

    // Load attendance policy
    const settings = await Settings.findOne();
    const weights = settings?.attendancePolicy?.weights || { present: 1, late: 0.5, absent: 0 };

    // Calculate attendance statistics
    const attendanceStats = {};
    attendance.forEach(record => {
      const courseId = record.course._id.toString();
      if (!attendanceStats[courseId]) {
        attendanceStats[courseId] = {
          course: record.course,
          total: 0,
          present: 0,
          late: 0,
          absent: 0,
          percentage: 0
        };
      }
      
      const lectureCount = record.lectureCount || 1;
      attendanceStats[courseId].total += lectureCount;
      
      if (record.status === 'present') {
        attendanceStats[courseId].present += lectureCount;
      } else if (record.status === 'late') {
        attendanceStats[courseId].late += lectureCount;
      } else if (record.status === 'absent') {
        attendanceStats[courseId].absent += lectureCount;
      }
    });

    // Calculate percentages
    Object.keys(attendanceStats).forEach(courseId => {
      const stats = attendanceStats[courseId];
      const weightedPresent = (stats.present * weights.present) + (stats.late * weights.late);
      stats.percentage = stats.total > 0 ? Math.round((weightedPresent / stats.total) * 100) : 0;
    });

    res.json({
      success: true,
      attendance,
      stats: Object.values(attendanceStats),
      averageAttendance: Object.values(attendanceStats).length > 0 
        ? Math.round(Object.values(attendanceStats).reduce((sum, stat) => sum + stat.percentage, 0) / Object.values(attendanceStats).length)
        : 0
    });
  } catch (error) {
    console.error('Get student attendance error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/attendance
// @desc    Mark attendance (faculty/admin only)
// @access  Private
router.post('/', auth, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const { courseId, studentId, date, status, remarks, lectureCount } = req.body;
    
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Check if the faculty owns the course or is admin
    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && course.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'You are not authorized to mark attendance for this course' 
      });
    }

    // Check if attendance already exists
    const existingAttendance = await Attendance.findOne({
      student: studentId,
      course: courseId,
      date: new Date(date)
    });

    if (existingAttendance) {
      return res.status(400).json({ 
        success: false, 
        message: 'Attendance already marked for this date' 
      });
    }

    const attendance = new Attendance({
      student: studentId,
      course: courseId,
      date: new Date(date),
      status,
      markedBy: req.user._id,
      remarks,
      lectureCount: lectureCount || 1
    });

    await attendance.save();

    res.status(201).json({
      success: true,
      attendance
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/attendance/:id
// @desc    Update attendance record (faculty/admin only)
// @access  Private
router.put('/:id', auth, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks, lectureCount } = req.body;

    const attendance = await Attendance.findById(id)
      .populate('course', 'faculty');

    if (!attendance) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    // Check if the faculty owns the course or is admin
    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && attendance.course.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'You are not authorized to update this attendance record' 
      });
    }

    attendance.status = status || attendance.status;
    attendance.remarks = remarks !== undefined ? remarks : attendance.remarks;
    attendance.lectureCount = lectureCount !== undefined ? lectureCount : attendance.lectureCount;
    attendance.markedBy = req.user._id;

    await attendance.save();

    res.json({
      success: true,
      attendance
    });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/attendance/:id
// @desc    Delete attendance record (faculty/admin only)
// @access  Private
router.delete('/:id', auth, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const attendance = await Attendance.findById(id)
      .populate('course', 'faculty');

    if (!attendance) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    // Check if the faculty owns the course or is admin
    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && attendance.course.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'You are not authorized to delete this attendance record' 
      });
    }

    await Attendance.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Attendance record deleted successfully'
    });
  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
