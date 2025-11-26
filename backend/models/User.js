const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: ['student', 'admin', 'faculty', 'library', 'placement', 'parent', 'pending'],
    default: 'student'
  },
  // Academic program/course of the user (e.g., B.Tech, M.Tech, B.Pharma, MCA, MBA)
  program: {
    type: String,
    enum: ['B.Tech', 'M.Tech', 'B.Pharma', 'MCA', 'MBA'],
  },
  branch: {
    type: String,
    // This logic is now handled in the route/service layer
  },
  department: {
    type: String,
    // For storing department information like "B.Tech - CS"
  },
  courses: [{
    type: String,
    trim: true
  }],
  subjects: [{
    type: String,
    trim: true
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorMethod: {
    type: String,
    enum: ['totp', 'sms', null],
    default: null
  },
  twoFactorSecret: {
    type: String,
    select: false
  },
  twoFactorTempSecret: {
    type: String,
    select: false
  },
  twoFactorPhone: {
    type: String
  },
  twoFactorSMSCode: {
    type: String,
    select: false
  },
  twoFactorSMSExpiresAt: {
    type: Date
  },
  // Email OTP for passwordless login or verification
  emailOTP: {
    type: String,
    select: false
  },
  emailOTPExpiresAt: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  profile: {
    course: String,
    branch: String,
    phone: String,
    address: String,
    studentId: String,
    employeeId: String,
    semester: String,
    section: String
  },
  adminPrograms: [{
    type: String,
    enum: ['B.Tech', 'M.Tech', 'B.Pharma', 'MCA', 'MBA']
  }]
});

// Optional relations for parent/student linkage
userSchema.add({
  parents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

// Password hashing middleware
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const hashedPassword = await bcrypt.hash(this.password, 12);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);