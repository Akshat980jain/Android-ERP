const mongoose = require('mongoose');

const studentServiceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['bonafide', 'no_dues', 'backlog_form', 'transcript', 'recommendation', 'fee_receipt'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  approvedDate: Date,
  completedDate: Date,
  reason: String,
  remarks: String,
  documents: [String],
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  fee: {
    type: Number,
    default: 0
  },
  isPaid: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('StudentService', studentServiceSchema);