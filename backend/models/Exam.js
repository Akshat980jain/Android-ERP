const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
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
  examType: {
    type: String,
    enum: ['quiz', 'midterm', 'final', 'assignment'],
    required: true
  },
  duration: {
    type: Number,
    required: true, // in minutes
    min: 1
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  totalMarks: {
    type: Number,
    required: true,
    min: 1
  },
  passingMarks: {
    type: Number,
    required: true,
    min: 0
  },
  instructions: {
    type: String,
    trim: true
  },
  questions: [{
    questionText: {
      type: String,
      required: true
    },
    questionType: {
      type: String,
      enum: ['mcq', 'short_answer', 'long_answer', 'true_false'],
      required: true
    },
    options: [String], // For MCQ
    correctAnswer: String,
    marks: {
      type: Number,
      required: true,
      min: 1
    },
    explanation: String
  }],
  attempts: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    startedAt: Date,
    submittedAt: Date,
    answers: [{
      questionIndex: Number,
      answer: String,
      isCorrect: Boolean,
      marksAwarded: Number
    }],
    // Manual grading support
    manualMarks: [{
      questionIndex: Number,
      marksAwarded: { type: Number, min: 0 },
      comment: String
    }],
    totalMarks: Number,
    percentage: Number,
    grade: String,
    status: {
      type: String,
      enum: ['in_progress', 'submitted', 'graded', 'timeout'],
      default: 'in_progress'
    },
    timeSpent: Number, // in minutes
    ipAddress: String,
    browserInfo: String,
    feedback: String,
    gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    gradedAt: Date
  }],
  settings: {
    shuffleQuestions: {
      type: Boolean,
      default: false
    },
    shuffleOptions: {
      type: Boolean,
      default: false
    },
    allowReview: {
      type: Boolean,
      default: true
    },
    showResults: {
      type: Boolean,
      default: true
    },
    preventCopyPaste: {
      type: Boolean,
      default: true
    },
    fullScreenMode: {
      type: Boolean,
      default: true
    },
    maxAttempts: {
      type: Number,
      default: 1,
      min: 1
    }
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'active', 'completed', 'cancelled'],
    default: 'draft'
  }
}, {
  timestamps: true
});

// Indexes
examSchema.index({ course: 1, startTime: 1 });
examSchema.index({ faculty: 1 });
examSchema.index({ 'attempts.student': 1 });

module.exports = mongoose.model('Exam', examSchema);