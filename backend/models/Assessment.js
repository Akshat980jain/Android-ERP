const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['quiz', 'assignment', 'midterm', 'final', 'project'],
    required: true,
    default: 'quiz'
  },
  maxMarks: {
    type: Number,
    required: true,
    min: 1
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

assessmentSchema.index({ course: 1, date: -1 });

module.exports = mongoose.model('Assessment', assessmentSchema);


