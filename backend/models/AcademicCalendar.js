const mongoose = require('mongoose');

const academicCalendarSchema = new mongoose.Schema({
  academicYear: String,
  semesters: [{
    semesterNumber: Number,
    semesterType: String,
    startDate: Date,
    endDate: Date,
    importantDates: [{
      event: String,
      startDate: Date,
      endDate: Date,
      description: String,
      applicableCourses: [String]
    }],
    examSchedule: {
      midTermExams: {
        startDate: Date,
        endDate: Date
      },
      endSemExams: {
        startDate: Date,
        endDate: Date
      },
      practicalExams: {
        startDate: Date,
        endDate: Date
      },
      supplementaryExams: {
        startDate: Date,
        endDate: Date
      }
    },
    workingDays: Number,
    holidays: [{
      date: Date,
      occasion: String,
      type: String,
      isOptional: Boolean
    }]
  }],
  admissionSchedule: [{
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    courseName: String,
    applicationStartDate: Date,
    applicationEndDate: Date,
    entranceExamDate: Date,
    counselingStartDate: Date,
    admissionStartDate: Date,
    admissionEndDate: Date,
    classesCommenceDate: Date
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('AcademicCalendar', academicCalendarSchema); 