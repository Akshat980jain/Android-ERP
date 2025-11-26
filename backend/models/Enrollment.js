const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  semesterNumber: Number,
  academicYear: String,
  enrollmentDate: { type: Date, default: Date.now },
  enrollmentType: String,
  enrollmentStatus: String,
  attendance: {
    totalClassesConducted: Number,
    classesAttended: Number,
    attendancePercentage: Number,
    attendanceStatus: String,
    minimumRequired: Number
  },
  assessments: {
    internalAssessments: [{
      assessmentType: String,
      maxMarks: Number,
      marksObtained: Number,
      conductedDate: Date,
      submissionDate: Date
    }],
    practicalAssessments: [{
      practicalNumber: Number,
      title: String,
      maxMarks: Number,
      marksObtained: Number,
      conductedDate: Date
    }],
    projectAssessment: {
      title: String,
      guide: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      maxMarks: Number,
      marksObtained: Number,
      submissionDate: Date,
      presentationDate: Date
    }
  },
  examResults: {
    internalMarks: Number,
    practicalMarks: Number,
    endSemMarks: Number,
    totalMarks: Number,
    maxTotalMarks: Number,
    percentage: Number,
    grade: String,
    gradePoints: Number,
    credits: Number,
    result: String,
    attemptNumber: Number
  },
  facultyAssigned: {
    theoryFaculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    labFaculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    tutorialFaculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Enrollment', enrollmentSchema); 