const express = require('express');
const Course = require('../models/Course');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const User = require('../models/User'); // Added User model import
const { auth, authorize } = require('../middleware/auth');
const Settings = require('../models/Settings');
const Leave = require('../models/Leave');

const router = express.Router();

// Helper function to convert time string to minutes
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// @route   GET /api/academic/courses
// @desc    Get courses for current user
// @access  Private
router.get('/courses', auth, async (req, res) => {
  try {
    let courses;
    
    if (req.user.role === 'student') {
      courses = await Course.find({ enrolledStudents: req.user._id })
        .populate('faculty', 'name email');
    } else if (req.user.role === 'faculty') {
      courses = await Course.find({ faculty: req.user._id })
        .populate('enrolledStudents', 'name profile.studentId');
    } else {
      courses = await Course.find()
        .populate('faculty', 'name email')
        .populate('enrolledStudents', 'name profile.studentId');
    }

    res.json({
      success: true,
      courses
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/academic/attendance
// @desc    Get attendance for current user
// @access  Private
router.get('/attendance', auth, async (req, res) => {
  try {
    const { courseId } = req.query;
    
    let query = {};
    if (req.user.role === 'student') {
      query.student = req.user._id;
    }
    
    if (courseId) {
      query.course = courseId;
    }

    const attendance = await Attendance.find(query)
      .populate('course', 'name code')
      .populate('student', 'name profile.studentId')
      .sort({ date: -1 });

    // Load attendance policy
    const settings = await Settings.findOne();
    const weights = settings?.attendancePolicy?.weights || { present: 1, late: 0.5, absent: 0 };

    // Calculate attendance percentage by course (accounting for lecture counts and policy weights)
    const attendanceStats = {};
    attendance.forEach(record => {
      const courseId = record.course._id.toString();
      if (!attendanceStats[courseId]) {
        attendanceStats[courseId] = {
          course: record.course,
          total: 0,
          present: 0,
          percentage: 0
        };
      }
      // Use lectureCount to determine how many lectures this attendance represents
      const lectureCount = record.lectureCount || 1;
      attendanceStats[courseId].total += lectureCount;
      const add = (status) => {
        if (status === 'present') return weights.present;
        if (status === 'late') return weights.late;
        if (status === 'absent') return weights.absent;
        return 0;
      };
      attendanceStats[courseId].present += lectureCount * add(record.status);
    });

    // Calculate percentages
    Object.keys(attendanceStats).forEach(courseId => {
      const stats = attendanceStats[courseId];
      stats.percentage = stats.total > 0 ? (stats.present / stats.total) * 100 : 0;
    });

    res.json({
      success: true,
      attendance,
      stats: Object.values(attendanceStats)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/academic/attendance
// @desc    Mark attendance (faculty only)
// @access  Private
router.post('/attendance', auth, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const { courseId, studentId, date, status, remarks } = req.body;
    const course = await Course.findById(courseId);
    console.log('[ATTENDANCE] User:', req.user && req.user._id, 'Role:', req.user && req.user.role, 'Course faculty:', course && course.faculty);

    // Check if the faculty owns the course or is admin
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && course.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: `You are not authorized to mark attendance for this course. Your user ID: ${req.user._id}, course faculty: ${course.faculty}` });
    }

    // Check if attendance already exists
    const existingAttendance = await Attendance.findOne({
      student: studentId,
      course: courseId,
      date: new Date(date)
    });

    if (existingAttendance) {
      return res.status(400).json({ message: 'Attendance already marked for this date' });
    }

    const attendance = new Attendance({
      student: studentId,
      course: courseId,
      date: new Date(date),
      status,
      markedBy: req.user._id,
      remarks
    });

    await attendance.save();

    res.status(201).json({
      success: true,
      attendance
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/academic/attendance
// @desc    Update attendance (faculty only)
// @access  Private
router.put('/attendance', auth, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const { courseId, studentId, date, status, remarks } = req.body;
    const course = await Course.findById(courseId);
    console.log('[ATTENDANCE UPDATE] User:', req.user && req.user._id, 'Role:', req.user && req.user.role, 'Course faculty:', course && course.faculty);

    // Check if the faculty owns the course or is admin
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && course.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: `You are not authorized to update attendance for this course. Your user ID: ${req.user._id}, course faculty: ${course.faculty}` });
    }

    // Find existing attendance record
    const existingAttendance = await Attendance.findOne({
      student: studentId,
      course: courseId,
      date: new Date(date)
    });

    if (!existingAttendance) {
      // If no record exists, create one to allow updates anytime
      const attendance = new Attendance({
        student: studentId,
        course: courseId,
        date: new Date(date),
        status,
        markedBy: req.user._id,
        remarks
      });
      await attendance.save();
      return res.json({ success: true, attendance });
    }

    // Update the attendance record
    existingAttendance.status = status;
    if (remarks !== undefined) {
      existingAttendance.remarks = remarks;
    }
    existingAttendance.markedBy = req.user._id;

    await existingAttendance.save();

    res.json({
      success: true,
      attendance: existingAttendance
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/academic/marks
// @desc    Get marks for current user
// @access  Private
router.get('/marks', auth, async (req, res) => {
  try {
    const { courseId } = req.query;
    
    let query = {};
    if (req.user.role === 'student') {
      query.student = req.user._id;
    }
    
    if (courseId) {
      query.course = courseId;
    }

    const marks = await Marks.find(query)
      .populate('course', 'name code')
      .populate('student', 'name profile.studentId')
      .sort({ examDate: -1 });

    res.json({
      success: true,
      marks
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/academic/marks
// @desc    Add marks (faculty only)
// @access  Private
router.post('/marks', auth, authorize('faculty'), async (req, res) => {
  try {
    const { studentId, courseId, type, title, marksObtained, totalMarks, examDate, remarks } = req.body;

    const marks = new Marks({
      student: studentId,
      course: courseId,
      type,
      title,
      marksObtained,
      totalMarks,
      examDate: new Date(examDate),
      uploadedBy: req.user._id,
      remarks
    });

    await marks.save();

    res.status(201).json({
      success: true,
      marks
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/academic/schedule-attendance
// @desc    Get schedule-based attendance for a course and date
// @access  Private
router.get('/schedule-attendance', auth, async (req, res) => {
  try {
    const { courseId, date } = req.query;
    
    if (!courseId || !date) {
      return res.status(400).json({ message: 'Course ID and date are required' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Get the day of week for the given date
    const attendanceDate = new Date(date);
    const dayOfWeek = attendanceDate.toLocaleDateString('en-US', { weekday: 'long' });

    // Get schedule slots for this day
    const daySchedule = course.schedule.filter(slot => slot.day === dayOfWeek);
    
    // Get existing attendance for this date
    const existingAttendance = await Attendance.find({
      course: courseId,
      date: attendanceDate
    }).populate('student', 'name email profile.studentId');

    // Get all students enrolled in this course
    const students = await User.find({ _id: { $in: course.students } })
      .select('name email profile.studentId');

    // Create attendance matrix
    const attendanceMatrix = daySchedule.map(slot => {
      const slotAttendance = students.map(student => {
        const existingRecord = existingAttendance.find(att => 
          att.student._id.toString() === student._id.toString() &&
          att.scheduleSlot.startTime === slot.time
        );

        return {
          student,
          status: existingRecord ? existingRecord.status : null,
          markedAt: existingRecord ? existingRecord.markedAt : null,
          isWithinSchedule: existingRecord ? existingRecord.isWithinSchedule : false,
          remarks: existingRecord ? existingRecord.remarks : '',
          lectureCount: existingRecord ? existingRecord.lectureCount : 1
        };
      });

      return {
        slot,
        attendance: slotAttendance
      };
    });

    res.json({
      success: true,
      course: {
        _id: course._id,
        name: course.name,
        code: course.code
      },
      date: attendanceDate,
      dayOfWeek,
      schedule: daySchedule,
      attendanceMatrix
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/academic/schedule-attendance
// @desc    Mark schedule-based attendance (faculty only)
// @access  Private
router.post('/schedule-attendance', auth, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const { courseId, date, scheduleSlot, attendanceData } = req.body;
    
    if (!courseId || !date || !scheduleSlot || !attendanceData) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if the faculty owns the course or is admin
    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && course.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to mark attendance for this course' });
    }

    // Validate that the schedule slot exists
    const attendanceDate = new Date(date);
    const dayOfWeek = attendanceDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    const validSlot = course.schedule.find(slot => 
      slot.day === dayOfWeek && 
      slot.time === scheduleSlot.startTime
    );

    if (!validSlot) {
      return res.status(400).json({ message: 'Invalid schedule slot for this date' });
    }

    // Check if attendance is being marked within the scheduled time window
    const now = new Date();
    const slotStartTime = new Date(date + 'T' + scheduleSlot.startTime);
    // Prefer endTime from the course schedule; fallback to provided endTime or startTime
    const effectiveEndTime = (validSlot && validSlot.endTime) || scheduleSlot.endTime || scheduleSlot.startTime;
    const slotEndTime = new Date(date + 'T' + effectiveEndTime);
    
    // Allow marking attendance 15 minutes before and 30 minutes after the scheduled time
    const earlyWindow = new Date(slotStartTime.getTime() - 15 * 60 * 1000);
    const lateWindow = new Date(slotEndTime.getTime() + 30 * 60 * 1000);
    
    const isWithinTimeWindow = now >= earlyWindow && now <= lateWindow;

    const results = [];
    const errors = [];

    // Preload approved leaves for date to auto-mark duty/medical
    const approvedLeaves = await Leave.find({ status: 'approved', startDate: { $lte: attendanceDate }, endDate: { $gte: attendanceDate } })
      .select('student type');
    const leaveMap = new Map(approvedLeaves.map(l => [l.student.toString(), l.type]));

    // Process each student's attendance
    for (const record of attendanceData) {
      try {
        // Check if attendance already exists for this student, course, date, and time slot
        const existingAttendance = await Attendance.findOne({
          student: record.studentId,
          course: courseId,
          date: attendanceDate,
          'scheduleSlot.day': dayOfWeek,
          'scheduleSlot.startTime': scheduleSlot.startTime
        });

        if (existingAttendance) {
          // Update existing record
          existingAttendance.status = record.status;
          existingAttendance.remarks = record.remarks || '';
          existingAttendance.markedAt = now;
          existingAttendance.isWithinSchedule = isWithinTimeWindow;
          // If student has approved leave on this date, set reason
          const leaveType = leaveMap.get(record.studentId);
          if (leaveType === 'duty') existingAttendance.attendanceReason = 'dutyLeave';
          else if (leaveType === 'medical') existingAttendance.attendanceReason = 'medicalLeave';
          // Ensure schedule endTime stays in sync
          if (!existingAttendance.scheduleSlot) {
            existingAttendance.scheduleSlot = { day: dayOfWeek, startTime: scheduleSlot.startTime, endTime: effectiveEndTime, room: validSlot.room || '' };
          } else {
            existingAttendance.scheduleSlot.endTime = effectiveEndTime;
          }
          
          // Recalculate lecture count based on schedule duration
          const startMinutes = timeToMinutes(scheduleSlot.startTime);
          const endMinutes = timeToMinutes(effectiveEndTime);
          const durationMinutes = endMinutes - startMinutes;
          const standardLectureDuration = 50;
          existingAttendance.lectureCount = Math.max(1, Math.ceil(durationMinutes / standardLectureDuration));
          
          await existingAttendance.save();
          results.push({ studentId: record.studentId, status: 'updated' });
        } else {
          // Create new record
          const attendance = new Attendance({
            student: record.studentId,
            course: courseId,
            date: attendanceDate,
            status: record.status,
            markedBy: req.user._id,
            remarks: record.remarks || '',
            scheduleSlot: {
              day: dayOfWeek,
              startTime: scheduleSlot.startTime,
              endTime: effectiveEndTime,
              room: validSlot.room || ''
            },
            markedAt: now,
            isWithinSchedule: isWithinTimeWindow,
            attendanceReason: (leaveMap.get(record.studentId) === 'duty' ? 'dutyLeave' : (leaveMap.get(record.studentId) === 'medical' ? 'medicalLeave' : 'regular'))
          });

          await attendance.save();
          results.push({ studentId: record.studentId, status: 'created' });
        }
      } catch (error) {
        errors.push({ studentId: record.studentId, error: error.message });
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Some attendance records failed to save',
        results,
        errors
      });
    }

    res.json({
      success: true,
      message: 'Attendance marked successfully',
      results,
      isWithinTimeWindow
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/academic/attendance-schedule
// @desc    Get attendance schedule for a course
// @access  Private
router.get('/attendance-schedule', auth, async (req, res) => {
  try {
    const { courseId } = req.query;
    
    if (!courseId) {
      return res.status(400).json({ message: 'Course ID is required' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Get today's date and day of week
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });

    // Get schedule for today
    const todaySchedule = course.schedule.filter(slot => slot.day === dayOfWeek);
    
    // Get attendance for today
    const todayAttendance = await Attendance.find({
      course: courseId,
      date: today
    }).populate('student', 'name email profile.studentId');

    // Create schedule with attendance status
    const scheduleWithAttendance = todaySchedule.map(slot => {
      const slotAttendance = todayAttendance.filter(att => 
        att.scheduleSlot.startTime === slot.time
      );

      return {
        ...slot,
        attendanceCount: slotAttendance.length,
        markedCount: slotAttendance.filter(att => att.status).length
      };
    });

    res.json({
      success: true,
      course: {
        _id: course._id,
        name: course.name,
        code: course.code
      },
      date: todayString,
      dayOfWeek,
      schedule: scheduleWithAttendance
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;