const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  semester: {
    type: Number,
    required: true
  },
  performance: {
    cgpa: Number,
    sgpa: Number,
    totalCredits: Number,
    completedCredits: Number,
    failedSubjects: Number,
    averageAttendance: Number,
    rank: {
      class: Number,
      department: Number,
      overall: Number
    }
  },
  predictions: {
    dropoutRisk: {
      score: Number,
      level: {
        type: String,
        enum: ['low', 'medium', 'high']
      },
      factors: [String]
    },
    expectedCGPA: Number,
    graduationProbability: Number,
    recommendedActions: [String]
  },
  behaviorMetrics: {
    loginFrequency: Number,
    assignmentSubmissionRate: Number,
    libraryUsage: Number,
    eventParticipation: Number,
    forumActivity: Number
  },
  trends: {
    attendanceTrend: [{
      month: String,
      percentage: Number
    }],
    marksTrend: [{
      month: String,
      average: Number
    }],
    engagementTrend: [{
      month: String,
      score: Number
    }]
  },
  alerts: [{
    type: {
      type: String,
      enum: ['attendance_low', 'marks_declining', 'fee_overdue', 'assignment_pending']
    },
    message: String,
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical']
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
analyticsSchema.index({ student: 1, academicYear: 1, semester: 1 });
analyticsSchema.index({ 'predictions.dropoutRisk.level': 1 });
analyticsSchema.index({ lastUpdated: 1 });

module.exports = mongoose.model('Analytics', analyticsSchema);