const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['duty', 'medical', 'casual'], required: true },
  reason: { type: String, default: '' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  documents: [{ type: String }],
}, { timestamps: true });

leaveSchema.index({ student: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model('Leave', leaveSchema);


