const mongoose = require('mongoose');

const curriculumSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  specialization: String,
  academicYear: String,
  curriculumVersion: String,
  semesters: [{
    semesterNumber: Number,
    subjects: [{
      subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
      subjectCode: String,
      subjectName: String,
      credits: Number,
      subjectType: String,
      isElective: Boolean,
      electiveGroup: String,
      isMandatory: Boolean
    }],
    semesterCredits: Number,
    minimumCreditsRequired: Number
  }],
  totalCredits: Number,
  minimumCreditsForGraduation: Number,
  electiveCreditsRequired: {
    professionalElectives: Number,
    openElectives: Number,
    departmentalElectives: Number,
    honorsElectives: Number
  },
  projectRequirements: {
    minorProject: {
      semester: Number,
      credits: Number,
      duration: String
    },
    majorProject: {
      semester: Number,
      credits: Number,
      duration: String
    }
  },
  internshipRequirements: {
    isMandatory: Boolean,
    minimumDuration: String,
    semester: Number,
    credits: Number
  },
  approvedBy: String,
  approvedDate: Date,
  effectiveFrom: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('Curriculum', curriculumSchema); 