const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  // The user who applied (student OR faculty)
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Snapshot of the applicant's role at the time of application
  applicantRole: { type: String, enum: ['student', 'faculty'], default: 'student' },
  type: { type: String, enum: ['duty', 'medical', 'casual'], required: true },
  reason: { type: String, default: '' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  documents: [{ type: String }],
  // Denormalized program & branch for admin-scoped filtering
  program: { type: String },
  branch: { type: String },
}, { timestamps: true });

leaveSchema.index({ student: 1, startDate: 1, endDate: 1 });
leaveSchema.index({ program: 1, branch: 1, status: 1 });

module.exports = mongoose.model('Leave', leaveSchema);
