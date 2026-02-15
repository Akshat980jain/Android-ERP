const mongoose = require('mongoose');

const attendancePolicySchema = new mongoose.Schema({
  weights: {
    present: { type: Number, default: 1 },
    late: { type: Number, default: 0.5 },
    absent: { type: Number, default: 0 },
    dutyLeave: { type: Number, default: 1 },
    medicalLeave: { type: Number, default: 1 },
  },
  graceRules: {
    lateGraceMinutes: { type: Number, default: 0 },
    maxLatePerSemester: { type: Number, default: 0 },
  },
  perCourseOverrides: [{
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    weights: {
      present: Number,
      late: Number,
      absent: Number,
      dutyLeave: Number,
      medicalLeave: Number,
    },
  }],
}, { _id: false });

const settingsSchema = new mongoose.Schema({
  // Institution Information
  institution: {
    name: { type: String, default: 'EduConnect University' },
    address: { type: String, default: '123 Education Street, Learning City' },
    phone: { type: String, default: '+1-555-0123' },
    email: { type: String, default: 'info@educonnect.edu' },
    website: { type: String, default: 'www.educonnect.edu' },
    logo: { type: String, default: '/uploads/logo.png' }
  },

  // Academic Settings
  academic: {
    currentAcademicYear: { type: String, default: () => new Date().getFullYear().toString() },
    currentSemester: { type: String, default: '1st' },
    gradingSystem: { type: String, default: 'percentage' },
    passPercentage: { type: Number, default: 40 },
    maxAttendancePercentage: { type: Number, default: 75 },
    assignmentSubmissionDeadline: { type: Number, default: 24 }, // hours
    examDuration: { type: Number, default: 180 }, // minutes
    semesterPromotionEnabled: { type: Boolean, default: false }
  },

  // Notification Settings
  notifications: {
    emailNotifications: { type: Boolean, default: false },
    smsNotifications: { type: Boolean, default: false },
    pushNotifications: { type: Boolean, default: false },
    notificationRetentionDays: { type: Number, default: 30 }
  },

  // Security Settings
  security: {
    passwordMinLength: { type: Number, default: 8 },
    passwordComplexity: { type: String, default: 'medium' },
    sessionTimeout: { type: Number, default: 3600 }, // seconds
    maxLoginAttempts: { type: Number, default: 5 },
    twoFactorAuth: { type: Boolean, default: false }
  },

  // Feature Flags
  features: {
    chatEnabled: { type: Boolean, default: false },
    fileUploadEnabled: { type: Boolean, default: false },
    analyticsEnabled: { type: Boolean, default: false },
    backupEnabled: { type: Boolean, default: false }
  },

  // Attendance Policy
  attendancePolicy: { type: attendancePolicySchema, default: () => ({}) },
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);


