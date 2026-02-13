const mongoose = require('mongoose');

// Role Request Schema
const roleRequestSchema = new mongoose.Schema({
  // User reference - optional for registration requests
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },

  // For registration requests, store user data directly
  name: { type: String },
  email: { type: String },
  password: { type: String },
  branch: { type: String },
  phone: { type: String },
  course: { type: String },
  courses: [{
    type: String,
    trim: true
  }],
  subjects: [{
    type: String,
    trim: true
  }],
  requestedRole: {
    type: String,
    enum: ['student', 'admin', 'faculty', 'library', 'placement'],
    required: true
  },

  currentRole: {
    type: String,
    enum: ['student', 'admin', 'faculty', 'library', 'placement', 'none'],
    required: true,
    default: 'none'
  },

  reason: {
    type: String,
    required: false,
    default: 'New user registration request'
  },

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  reviewedAt: Date,
  remarks: String,
  program: {
    type: String,
    enum: ['B.Tech', 'M.Tech', 'B.Pharma', 'MCA', 'MBA']
  },
  adminType: {
    type: String,
    enum: ['head', 'program', 'branch'],
  }
});

// Indexes for efficient querying
roleRequestSchema.index({ user: 1, status: 1 });
roleRequestSchema.index({ status: 1, createdAt: -1 });
roleRequestSchema.index({ email: 1 });

module.exports = mongoose.model('RoleRequest', roleRequestSchema);
