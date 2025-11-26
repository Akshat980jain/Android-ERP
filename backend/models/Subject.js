const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  subjectCode: { type: String, required: true, unique: true },
  subjectName: { type: String, required: true },
  subjectType: { type: String, enum: ['Core', 'Elective', 'Lab', 'Project', 'Internship'], required: true },
  credits: { type: Number, required: true },
  contactHours: {
    theory: Number,
    practical: Number,
    tutorial: Number,
    totalHours: Number
  },
  department: String,
  applicableCourses: [String],
  prerequisites: [String],
  corequisites: [String],
  description: String,
  subjectObjectives: [String],
  learningOutcomes: [String],
  syllabus: {
    modules: [{
      moduleNumber: Number,
      title: String,
      topics: [String],
      hours: Number,
      weightage: Number
    }]
  },
  assessmentPattern: {
    internalAssessment: Number,
    endSemExam: Number,
    practicalExam: Number,
    project: Number,
    assignment: Number,
    viva: Number
  },
  textBooks: [{
    title: String,
    author: String,
    edition: String,
    publisher: String,
    year: Number,
    isbn: String
  }],
  referenceBooks: [{
    title: String,
    author: String,
    edition: String,
    publisher: String,
    year: Number,
    isbn: String
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('Subject', subjectSchema); 