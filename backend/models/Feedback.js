const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  semester: {
    type: Number,
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  ratings: {
    teachingQuality: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    courseContent: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    communication: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    availability: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    overallRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    }
  },
  comments: {
    positiveAspects: String,
    improvementAreas: String,
    suggestions: String,
    additionalComments: String
  },
  isAnonymous: {
    type: Boolean,
    default: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['submitted', 'reviewed', 'archived'],
    default: 'submitted'
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate feedback
feedbackSchema.index({ student: 1, course: 1, semester: 1, academicYear: 1 }, { unique: true });
feedbackSchema.index({ faculty: 1, semester: 1, academicYear: 1 });

module.exports = mongoose.model('Feedback', feedbackSchema);