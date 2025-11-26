const express = require('express');
const Analytics = require('../models/Analytics');
const User = require('../models/User');
const Course = require('../models/Course');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const Fee = require('../models/Fee');
const { auth, authorize, checkVerification } = require('../middleware/auth');
const Settings = require('../models/Settings');

const router = express.Router();

// Get student analytics
router.get('/student/:studentId?', auth, checkVerification, async (req, res) => {
  try {
    const studentId = req.params.studentId || req.user._id;
    
    // Students can only view their own analytics
    if (req.user.role === 'student' && studentId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const analytics = await generateStudentAnalytics(studentId);
    res.json({ analytics });
  } catch (error) {
    console.error('Get student analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get department analytics (Admin/Faculty)
router.get('/department/:department', auth, authorize('admin', 'faculty'), async (req, res) => {
  try {
    const { department } = req.params;
    const { academicYear, semester } = req.query;

    const analytics = await generateDepartmentAnalytics(department, academicYear, semester);
    res.json({ analytics });
  } catch (error) {
    console.error('Get department analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get course analytics (Faculty/Admin)
router.get('/course/:courseId', auth, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Faculty can only view analytics for their courses
    if (req.user.role === 'faculty' && course.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const analytics = await generateCourseAnalytics(courseId);
    res.json({ analytics });
  } catch (error) {
    console.error('Get course analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get predictive analytics (Admin only)
router.get('/predictions', auth, authorize('admin'), async (req, res) => {
  try {
    const predictions = await generatePredictiveAnalytics();
    res.json({ predictions });
  } catch (error) {
    console.error('Get predictions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper functions
async function generateStudentAnalytics(studentId) {
  const [student, attendance, marks, fees] = await Promise.all([
    User.findById(studentId),
    Attendance.find({ student: studentId }),
    Marks.find({ student: studentId }),
    Fee.find({ student: studentId })
  ]);

  if (!student) throw new Error('Student not found');

  // Calculate attendance statistics (weighted by lectureCount)
  const settings = await Settings.findOne();
  const weights = settings?.attendancePolicy?.weights || { present: 1, late: 0.5, absent: 0 };

  const totals = attendance.reduce((acc, rec) => {
    const weight = typeof rec.lectureCount === 'number' && rec.lectureCount > 0 ? rec.lectureCount : 1;
    acc.total += weight;
    if (rec.status === 'present') acc.present += weight * weights.present;
    else if (rec.status === 'late') acc.present += weight * weights.late;
    return acc;
  }, { total: 0, present: 0 });
  const attendanceStats = {
    totalClasses: totals.total,
    presentClasses: totals.present,
    percentage: totals.total > 0 ? Math.round((totals.present / totals.total) * 100) : 0
  };

  // Calculate academic performance
  const academicStats = {
    totalAssessments: marks.length,
    averagePercentage: marks.length > 0 ? 
      Math.round(marks.reduce((sum, mark) => sum + mark.percentage, 0) / marks.length) : 0,
    cgpa: marks.length > 0 ? 
      (marks.reduce((sum, mark) => sum + mark.percentage, 0) / marks.length / 10).toFixed(2) : 0
  };

  // Calculate financial status
  const financialStats = {
    totalFees: fees.reduce((sum, fee) => sum + fee.amount, 0),
    paidFees: fees.filter(f => f.status === 'paid').reduce((sum, fee) => sum + fee.paidAmount, 0),
    pendingFees: fees.filter(f => f.status !== 'paid').reduce((sum, fee) => sum + (fee.amount - fee.paidAmount), 0)
  };

  // Generate predictions
  const dropoutRisk = calculateDropoutRisk(attendanceStats.percentage, academicStats.averagePercentage);
  
  return {
    student: {
      name: `${student.firstName} ${student.lastName}`,
      studentId: student.studentId,
      department: student.department,
      semester: student.semester
    },
    attendance: attendanceStats,
    academic: academicStats,
    financial: financialStats,
    predictions: {
      dropoutRisk,
      expectedCGPA: academicStats.cgpa,
      recommendedActions: generateRecommendations(attendanceStats.percentage, academicStats.averagePercentage, financialStats.pendingFees)
    }
  };
}

async function generateDepartmentAnalytics(department, academicYear, semester) {
  let query = { department, role: 'student' };
  
  const students = await User.find(query);
  const studentIds = students.map(s => s._id);

  const [attendance, marks, fees] = await Promise.all([
    Attendance.find({ student: { $in: studentIds } }),
    Marks.find({ student: { $in: studentIds } }),
    Fee.find({ student: { $in: studentIds } })
  ]);

  const deptTotals = attendance.reduce((acc, rec) => {
    const weight = typeof rec.lectureCount === 'number' && rec.lectureCount > 0 ? rec.lectureCount : 1;
    acc.total += weight;
    if (rec.status === 'present') acc.present += weight * weights.present;
    else if (rec.status === 'late') acc.present += weight * weights.late;
    return acc;
  }, { total: 0, present: 0 });

  return {
    totalStudents: students.length,
    averageAttendance: deptTotals.total > 0 ? Math.round((deptTotals.present / deptTotals.total) * 100) : 0,
    averageMarks: marks.length > 0 ? 
      Math.round(marks.reduce((sum, mark) => sum + mark.percentage, 0) / marks.length) : 0,
    feeCollection: {
      total: fees.reduce((sum, fee) => sum + fee.amount, 0),
      collected: fees.filter(f => f.status === 'paid').reduce((sum, fee) => sum + fee.paidAmount, 0)
    }
  };
}

async function generateCourseAnalytics(courseId) {
  const course = await Course.findById(courseId).populate('enrolledStudents');
  const studentIds = course.enrolledStudents.map(s => s._id);

  const [attendance, marks] = await Promise.all([
    Attendance.find({ course: courseId }),
    Marks.find({ course: courseId })
  ]);

  const courseTotals = attendance.reduce((acc, rec) => {
    const weight = typeof rec.lectureCount === 'number' && rec.lectureCount > 0 ? rec.lectureCount : 1;
    acc.total += weight;
    if (rec.status === 'present') acc.present += weight * weights.present;
    else if (rec.status === 'late') acc.present += weight * weights.late;
    return acc;
  }, { total: 0, present: 0 });

  return {
    enrolledStudents: course.enrolledStudents.length,
    averageAttendance: courseTotals.total > 0 ? Math.round((courseTotals.present / courseTotals.total) * 100) : 0,
    averageMarks: marks.length > 0 ? 
      Math.round(marks.reduce((sum, mark) => sum + mark.percentage, 0) / marks.length) : 0,
    passRate: marks.length > 0 ? 
      Math.round((marks.filter(m => m.percentage >= 40).length / marks.length) * 100) : 0
  };
}

async function generatePredictiveAnalytics() {
  const students = await User.find({ role: 'student' });
  const predictions = [];

  for (const student of students) {
    const analytics = await generateStudentAnalytics(student._id);
    if (analytics.predictions.dropoutRisk.level === 'high') {
      predictions.push({
        studentId: student._id,
        name: `${student.firstName} ${student.lastName}`,
        department: student.department,
        risk: analytics.predictions.dropoutRisk,
        recommendations: analytics.predictions.recommendedActions
      });
    }
  }

  return predictions;
}

function calculateDropoutRisk(attendancePercentage, academicPercentage) {
  let score = 0;
  let level = 'low';
  let factors = [];

  if (attendancePercentage < 75) {
    score += 30;
    factors.push('Low attendance');
  }

  if (academicPercentage < 50) {
    score += 40;
    factors.push('Poor academic performance');
  }

  if (score >= 50) level = 'high';
  else if (score >= 25) level = 'medium';

  return { score, level, factors };
}

function generateRecommendations(attendance, marks, pendingFees) {
  const recommendations = [];

  if (attendance < 75) {
    recommendations.push('Improve attendance to meet minimum requirements');
  }

  if (marks < 60) {
    recommendations.push('Seek academic support and tutoring');
  }

  if (pendingFees > 0) {
    recommendations.push('Clear pending fee payments');
  }

  if (recommendations.length === 0) {
    recommendations.push('Keep up the good work!');
  }

  return recommendations;
}

module.exports = router;