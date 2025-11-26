const express = require('express');
const User = require('../models/User');
const Course = require('../models/Course');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const Fee = require('../models/Fee');
const Assignment = require('../models/Assignment');
const Exam = require('../models/Exam');
const { auth, authorize, checkVerification } = require('../middleware/auth');

const router = express.Router();

// Get academic performance report
router.get('/academic', auth, authorize('admin', 'faculty'), async (req, res) => {
  try {
    const { department, semester, academicYear, courseId } = req.query;
    
    let query = { role: 'student' };
    if (department) query.department = department;
    if (semester) query.semester = semester;
    
    const students = await User.find(query);
    const studentIds = students.map(s => s._id);
    
    const [marks, assignments, exams] = await Promise.all([
      Marks.find({ student: { $in: studentIds } }),
      Assignment.find({ course: courseId }).populate('submissions'),
      Exam.find({ course: courseId }).populate('results')
    ]);

    const report = {
      totalStudents: students.length,
      department: department || 'All',
      semester: semester || 'All',
      academicYear: academicYear || new Date().getFullYear(),
      performance: {
        averageMarks: marks.length > 0 ? 
          Math.round(marks.reduce((sum, mark) => sum + mark.percentage, 0) / marks.length) : 0,
        passRate: marks.length > 0 ? 
          Math.round((marks.filter(m => m.percentage >= 40).length / marks.length) * 100) : 0,
        topPerformers: getTopPerformers(marks, 10),
        subjectWisePerformance: getSubjectWisePerformance(marks)
      },
      assignments: {
        total: assignments.length,
        averageSubmissionRate: assignments.length > 0 ? 
          Math.round(assignments.reduce((sum, assignment) => 
            sum + (assignment.submissions.length / students.length * 100), 0) / assignments.length) : 0
      },
      exams: {
        total: exams.length,
        averageScore: exams.length > 0 ? 
          Math.round(exams.reduce((sum, exam) => 
            sum + (exam.results.reduce((s, result) => s + result.score, 0) / exam.results.length), 0) / exams.length) : 0
      }
    };

    res.json({ report });
  } catch (error) {
    console.error('Get academic report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get financial report
router.get('/financial', auth, authorize('admin'), async (req, res) => {
  try {
    const { department, academicYear, month } = req.query;
    
    let query = {};
    if (department) query.department = department;
    
    const fees = await Fee.find(query).populate('student', 'name department');
    
    const report = {
      totalFees: fees.reduce((sum, fee) => sum + fee.amount, 0),
      collectedFees: fees.filter(f => f.status === 'paid').reduce((sum, fee) => sum + fee.paidAmount, 0),
      pendingFees: fees.filter(f => f.status !== 'paid').reduce((sum, fee) => sum + (fee.amount - fee.paidAmount), 0),
      collectionRate: fees.length > 0 ? 
        Math.round((fees.filter(f => f.status === 'paid').reduce((sum, fee) => sum + fee.paidAmount, 0) / 
        fees.reduce((sum, fee) => sum + fee.amount, 0)) * 100) : 0,
      departmentWise: getDepartmentWiseFinancials(fees),
      monthlyCollection: getMonthlyCollection(fees, academicYear),
      overduePayments: fees.filter(f => f.dueDate < new Date() && f.status !== 'paid')
    };

    res.json({ report });
  } catch (error) {
    console.error('Get financial report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get attendance report
router.get('/attendance', auth, authorize('admin', 'faculty'), async (req, res) => {
  try {
    const { department, courseId, startDate, endDate } = req.query;
    
    let query = {};
    if (courseId) query.course = courseId;
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    
    const attendance = await Attendance.find(query).populate('student', 'name department');
    
    const weighted = attendance.reduce((acc, rec) => {
      const weight = typeof rec.lectureCount === 'number' && rec.lectureCount > 0 ? rec.lectureCount : 1;
      acc.total += weight;
      if (rec.status === 'present') acc.present += weight;
      else if (rec.status === 'late') acc.present += weight * 0.5;
      return acc;
    }, { total: 0, present: 0 });

    const report = {
      totalClasses: weighted.total,
      averageAttendance: weighted.total > 0 ? Math.round((weighted.present / weighted.total) * 100) : 0,
      departmentWise: getDepartmentWiseAttendance(attendance),
      courseWise: getCourseWiseAttendance(attendance),
      dateWise: getDateWiseAttendance(attendance),
      lowAttendanceStudents: getLowAttendanceStudents(attendance, 75)
    };

    res.json({ report });
  } catch (error) {
    console.error('Get attendance report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get performance report
router.get('/performance', auth, authorize('admin', 'faculty'), async (req, res) => {
  try {
    const { department, semester, courseId } = req.query;
    
    let query = { role: 'student' };
    if (department) query.department = department;
    if (semester) query.semester = semester;
    
    const students = await User.find(query);
    const studentIds = students.map(s => s._id);
    
    const [marks, assignments, exams] = await Promise.all([
      Marks.find({ student: { $in: studentIds } }),
      Assignment.find({ course: courseId }).populate('submissions'),
      Exam.find({ course: courseId }).populate('results')
    ]);

    const report = {
      totalStudents: students.length,
      performanceMetrics: {
        averageCGPA: calculateAverageCGPA(marks),
        gradeDistribution: getGradeDistribution(marks),
        improvementTrend: getImprovementTrend(marks),
        subjectRankings: getSubjectRankings(marks)
      },
      comparativeAnalysis: {
        departmentComparison: await getDepartmentComparison(department),
        semesterComparison: getSemesterComparison(marks),
        yearOverYear: getYearOverYearComparison(marks)
      },
      recommendations: generatePerformanceRecommendations(marks, assignments, exams)
    };

    res.json({ report });
  } catch (error) {
    console.error('Get performance report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Export report to CSV/PDF (placeholder for future implementation)
router.post('/export', auth, authorize('admin', 'faculty'), async (req, res) => {
  try {
    const { reportType, format, filters } = req.body;
    
    // This would integrate with a library like jsPDF or csv-writer
    // For now, return the data that would be exported
    
    res.json({ 
      message: 'Export functionality will be implemented soon',
      reportType,
      format,
      filters
    });
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper functions
function getTopPerformers(marks, limit = 10) {
  const studentMarks = {};
  marks.forEach(mark => {
    if (!studentMarks[mark.student]) {
      studentMarks[mark.student] = { total: 0, count: 0 };
    }
    studentMarks[mark.student].total += mark.percentage;
    studentMarks[mark.student].count += 1;
  });

  return Object.entries(studentMarks)
    .map(([studentId, data]) => ({
      studentId,
      average: Math.round(data.total / data.count),
      totalMarks: data.count
    }))
    .sort((a, b) => b.average - a.average)
    .slice(0, limit);
}

function getSubjectWisePerformance(marks) {
  const subjectMarks = {};
  marks.forEach(mark => {
    if (!subjectMarks[mark.subject]) {
      subjectMarks[mark.subject] = [];
    }
    subjectMarks[mark.subject].push(mark.percentage);
  });

  return Object.entries(subjectMarks).map(([subject, percentages]) => ({
    subject,
    average: Math.round(percentages.reduce((sum, p) => sum + p, 0) / percentages.length),
    totalStudents: percentages.length
  }));
}

function getDepartmentWiseFinancials(fees) {
  const deptFees = {};
  fees.forEach(fee => {
    const dept = fee.student?.department || 'Unknown';
    if (!deptFees[dept]) {
      deptFees[dept] = { total: 0, collected: 0, pending: 0 };
    }
    deptFees[dept].total += fee.amount;
    deptFees[dept].collected += fee.paidAmount || 0;
    deptFees[dept].pending += fee.amount - (fee.paidAmount || 0);
  });

  return Object.entries(deptFees).map(([dept, data]) => ({
    department: dept,
    ...data,
    collectionRate: Math.round((data.collected / data.total) * 100)
  }));
}

function getMonthlyCollection(fees, academicYear) {
  const monthly = {};
  fees.forEach(fee => {
    if (fee.paidAt) {
      const month = new Date(fee.paidAt).getMonth();
      if (!monthly[month]) monthly[month] = 0;
      monthly[month] += fee.paidAmount || 0;
    }
  });

  return Object.entries(monthly).map(([month, amount]) => ({
    month: new Date(2024, parseInt(month)).toLocaleString('default', { month: 'long' }),
    amount
  }));
}

function getDepartmentWiseAttendance(attendance) {
  const deptAttendance = {};
  attendance.forEach(record => {
    const dept = record.student?.department || 'Unknown';
    const weight = typeof record.lectureCount === 'number' && record.lectureCount > 0 ? record.lectureCount : 1;
    if (!deptAttendance[dept]) {
      deptAttendance[dept] = { total: 0, present: 0 };
    }
    deptAttendance[dept].total += weight;
    if (record.status === 'present') deptAttendance[dept].present += weight;
    else if (record.status === 'late') deptAttendance[dept].present += weight * 0.5;
  });

  return Object.entries(deptAttendance).map(([dept, data]) => ({
    department: dept,
    totalClasses: data.total,
    presentClasses: data.present,
    percentage: Math.round((data.present / data.total) * 100)
  }));
}

function getCourseWiseAttendance(attendance) {
  const courseAttendance = {};
  attendance.forEach(record => {
    const course = record.course || 'Unknown';
    const weight = typeof record.lectureCount === 'number' && record.lectureCount > 0 ? record.lectureCount : 1;
    if (!courseAttendance[course]) {
      courseAttendance[course] = { total: 0, present: 0 };
    }
    courseAttendance[course].total += weight;
    if (record.status === 'present') courseAttendance[course].present += weight;
    else if (record.status === 'late') courseAttendance[course].present += weight * 0.5;
  });

  return Object.entries(courseAttendance).map(([course, data]) => ({
    course,
    totalClasses: data.total,
    presentClasses: data.present,
    percentage: Math.round((data.present / data.total) * 100)
  }));
}

function getDateWiseAttendance(attendance) {
  const dateAttendance = {};
  attendance.forEach(record => {
    const date = record.date.toISOString().split('T')[0];
    const weight = typeof record.lectureCount === 'number' && record.lectureCount > 0 ? record.lectureCount : 1;
    if (!dateAttendance[date]) {
      dateAttendance[date] = { total: 0, present: 0 };
    }
    dateAttendance[date].total += weight;
    if (record.status === 'present') dateAttendance[date].present += weight;
    else if (record.status === 'late') dateAttendance[date].present += weight * 0.5;
  });

  return Object.entries(dateAttendance)
    .map(([date, data]) => ({
      date,
      totalStudents: data.total,
      presentStudents: data.present,
      percentage: Math.round((data.present / data.total) * 100)
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

function getLowAttendanceStudents(attendance, threshold) {
  const studentAttendance = {};
  attendance.forEach(record => {
    const weight = typeof record.lectureCount === 'number' && record.lectureCount > 0 ? record.lectureCount : 1;
    if (!studentAttendance[record.student]) {
      studentAttendance[record.student] = { total: 0, present: 0, name: record.student?.name };
    }
    studentAttendance[record.student].total += weight;
    if (record.status === 'present') studentAttendance[record.student].present += weight;
    else if (record.status === 'late') studentAttendance[record.student].present += weight * 0.5;
  });

  return Object.entries(studentAttendance)
    .map(([studentId, data]) => ({
      studentId,
      name: data.name,
      totalClasses: data.total,
      presentClasses: data.present,
      percentage: Math.round((data.present / data.total) * 100)
    }))
    .filter(student => student.percentage < threshold)
    .sort((a, b) => a.percentage - b.percentage);
}

function calculateAverageCGPA(marks) {
  if (marks.length === 0) return 0;
  const totalPercentage = marks.reduce((sum, mark) => sum + mark.percentage, 0);
  return (totalPercentage / marks.length / 10).toFixed(2);
}

function getGradeDistribution(marks) {
  const grades = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  marks.forEach(mark => {
    if (mark.percentage >= 90) grades.A++;
    else if (mark.percentage >= 80) grades.B++;
    else if (mark.percentage >= 70) grades.C++;
    else if (mark.percentage >= 60) grades.D++;
    else grades.F++;
  });
  return grades;
}

function getImprovementTrend(marks) {
  // Group by subject and sort by date to see improvement
  const subjectMarks = {};
  marks.forEach(mark => {
    if (!subjectMarks[mark.subject]) {
      subjectMarks[mark.subject] = [];
    }
    subjectMarks[mark.subject].push({
      percentage: mark.percentage,
      date: mark.date || new Date()
    });
  });

  return Object.entries(subjectMarks).map(([subject, markData]) => {
    const sorted = markData.sort((a, b) => new Date(a.date) - new Date(b.date));
    const first = sorted[0]?.percentage || 0;
    const last = sorted[sorted.length - 1]?.percentage || 0;
    return {
      subject,
      improvement: last - first,
      trend: last > first ? 'improving' : last < first ? 'declining' : 'stable'
    };
  });
}

function getSubjectRankings(marks) {
  const subjectMarks = {};
  marks.forEach(mark => {
    if (!subjectMarks[mark.subject]) {
      subjectMarks[mark.subject] = [];
    }
    subjectMarks[mark.subject].push(mark.percentage);
  });

  return Object.entries(subjectMarks)
    .map(([subject, percentages]) => ({
      subject,
      average: Math.round(percentages.reduce((sum, p) => sum + p, 0) / percentages.length),
      totalStudents: percentages.length
    }))
    .sort((a, b) => b.average - a.average);
}

async function getDepartmentComparison(currentDept) {
  const departments = await User.distinct('department', { role: 'student' });
  const comparison = [];

  for (const dept of departments) {
    const students = await User.find({ department: dept, role: 'student' });
    const studentIds = students.map(s => s._id);
    const marks = await Marks.find({ student: { $in: studentIds } });

    const avgMarks = marks.length > 0 ? 
      Math.round(marks.reduce((sum, mark) => sum + mark.percentage, 0) / marks.length) : 0;

    comparison.push({
      department: dept,
      totalStudents: students.length,
      averageMarks: avgMarks,
      isCurrent: dept === currentDept
    });
  }

  return comparison.sort((a, b) => b.averageMarks - a.averageMarks);
}

function getSemesterComparison(marks) {
  const semesterMarks = {};
  marks.forEach(mark => {
    if (!semesterMarks[mark.semester]) {
      semesterMarks[mark.semester] = [];
    }
    semesterMarks[mark.semester].push(mark.percentage);
  });

  return Object.entries(semesterMarks)
    .map(([semester, percentages]) => ({
      semester,
      average: Math.round(percentages.reduce((sum, p) => sum + p, 0) / percentages.length),
      totalAssessments: percentages.length
    }))
    .sort((a, b) => parseInt(a.semester) - parseInt(b.semester));
}

function getYearOverYearComparison(marks) {
  const yearMarks = {};
  marks.forEach(mark => {
    const year = new Date(mark.date || new Date()).getFullYear();
    if (!yearMarks[year]) {
      yearMarks[year] = [];
    }
    yearMarks[year].push(mark.percentage);
  });

  return Object.entries(yearMarks)
    .map(([year, percentages]) => ({
      year: parseInt(year),
      average: Math.round(percentages.reduce((sum, p) => sum + p, 0) / percentages.length),
      totalAssessments: percentages.length
    }))
    .sort((a, b) => a.year - b.year);
}

function generatePerformanceRecommendations(marks, assignments, exams) {
  const recommendations = [];
  
  // Analyze marks
  if (marks.length > 0) {
    const avgMarks = marks.reduce((sum, mark) => sum + mark.percentage, 0) / marks.length;
    if (avgMarks < 60) {
      recommendations.push('Implement remedial classes for low-performing students');
    }
    if (avgMarks > 80) {
      recommendations.push('Consider advanced courses for high-achieving students');
    }
  }

  // Analyze assignments
  if (assignments.length > 0) {
    const avgSubmissionRate = assignments.reduce((sum, assignment) => 
      sum + (assignment.submissions.length / assignment.enrolledStudents?.length || 1), 0) / assignments.length;
    if (avgSubmissionRate < 0.8) {
      recommendations.push('Improve assignment submission rates through better engagement strategies');
    }
  }

  // Analyze exams
  if (exams.length > 0) {
    const avgExamScore = exams.reduce((sum, exam) => 
      sum + (exam.results.reduce((s, result) => s + result.score, 0) / exam.results.length), 0) / exams.length;
    if (avgExamScore < 60) {
      recommendations.push('Review exam difficulty and provide additional study resources');
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('Performance is meeting expectations. Continue current strategies.');
  }

  return recommendations;
}

module.exports = router;
