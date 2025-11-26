// models/Course.js
const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  department: {
    type: String,
    required: true
  },
  credits: {
    type: Number,
    required: true,
    min: 1,
    max: 6
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  schedule: [{
    day: String,
    time: String,
    endTime: String,
    room: String,
    type: {
      type: String,
      enum: ['lecture', 'lab', 'tutorial', 'seminar'],
      default: 'lecture'
    }
  }],
  description: {
    type: String,
    default: ''
  },
  semester: {
    type: String,
    enum: ['Even', 'Odd', '']
  },
  year: {
    type: Number,
    default: () => new Date().getFullYear()
  },
  maxStudents: {
    type: Number,
    default: 50
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Course', courseSchema);
