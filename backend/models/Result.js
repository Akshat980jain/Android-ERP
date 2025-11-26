const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  specialization: String,
  semesterNumber: Number,
  academicYear: String,
  subjects: [{
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    subjectCode: String,
    subjectName: String,
    subjectType: String,
    credits: Number,
    internalMarks: Number,
    practicalMarks: Number,
    endSemMarks: Number,
    totalMarks: Number,
    maxMarks: Number,
    percentage: Number,
    grade: String,
    gradePoints: Number,
    result: String,
    attemptNumber: Number
  }],
  semesterPerformance: {
    totalCreditsRegistered: Number,
    creditsEarned: Number,
    totalGradePoints: Number,
    semesterGPA: Number,
    semesterPercentage: Number,
    semesterResult: String
  },
  cumulativePerformance: {
    totalCreditsEarned: Number,
    cumulativeGradePoints: Number,
    cumulativeCGPA: Number,
    cumulativePercentage: Number,
    overallResult: String
  },
  backlogs: [{
    subjectCode: String,
    subjectName: String,
    semesterFailed: Number,
    attemptsTaken: Number
  }],
  rank: {
    semesterRank: Number,
    classRank: Number,
    batchRank: Number
  },
  resultStatus: String,
  resultDate: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Result', resultSchema); 