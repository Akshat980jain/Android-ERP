const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resume: {
    type: String,
    required: true
  },
  coverLetter: String,
  status: {
    type: String,
    enum: ['applied', 'shortlisted', 'interviewed', 'selected', 'rejected'],
    default: 'applied'
  },
  appliedDate: {
    type: Date,
    default: Date.now
  },
  interviewDate: Date,
  feedback: String,
  remarks: String
}, {
  timestamps: true
});

// Compound index to prevent duplicate applications
jobApplicationSchema.index({ job: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('JobApplication', jobApplicationSchema);