const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RoleRequest = require('../models/RoleRequest');
const { auth, authorize } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const Course = require('../models/Course');
const Fee = require('../models/Fee');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const emailService = require('../services/emailService');
const crypto = require('crypto');

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
  try {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const expiresIn = process.env.JWT_EXPIRES_IN || '30d';

    console.log('Generating token with:', {
      id,
      secret: secret.substring(0, 10) + '...',
      expiresIn
    });

    return jwt.sign({ id }, secret, {
      expiresIn,
    });
  } catch (error) {
    console.error('Token generation error:', error);
    throw error;
  }
};

// Generate short-lived token for pending 2FA verification during login
const generateTwoFactorTempToken = (id) => {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  return jwt.sign({ id, twoFactorPending: true }, secret, { expiresIn: '10m' });
};

// @route   POST /api/auth/dev-login
// @desc    Development login without OTP (for testing)
// @access  Public
router.post('/dev-login', async (req, res) => {
  try {
    console.log('Dev login request received:', req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Prepare user response (split name into firstName and lastName for mobile app)
    const nameParts = user.name ? user.name.split(' ') : ['User', ''];
    const userResponse = {
      _id: user._id,
      email: user.email,
      firstName: nameParts[0] || 'User',
      lastName: nameParts.slice(1).join(' ') || '',
      role: user.role,
      studentId: user.studentId,
      phone: user.phone,
      isActive: user.isActive,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.json({
      success: true,
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Dev login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/auth/register
// @desc    Request registration (creates verification request, requires admin approval)
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, firstName, lastName, email, password, role, profile, department, course, branch, phone, confirmPassword, program, adminType } = req.body;

    // Handle name from firstName+lastName or name field
    let fullName = name;
    if (!fullName && firstName) {
      fullName = lastName ? `${firstName} ${lastName}`.trim() : firstName;
    }

    // Input validation
    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    // Password confirmation validation (if provided)
    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Check if there's already a pending request for this email
    const existingRequest = await RoleRequest.findOne({
      email: email.toLowerCase(),
      status: 'pending'
    });
    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'Registration request already submitted. Please wait for admin approval.'
      });
    }

    // Determine requested role
    const requestedRole = role || 'student';

    // Determine program for admin role
    let requestProgram = program || course;
    if (requestedRole === 'admin' && requestProgram === 'Head Admin (No specific program)') {
      requestProgram = undefined;
    }

    // Create verification request instead of user
    const roleRequest = new RoleRequest({
      name: fullName.trim(),
      email: email.toLowerCase().trim(),
      password: password, // Will be hashed when user is created
      requestedRole: requestedRole,
      currentRole: 'none',
      branch: branch || profile?.branch,
      program: requestProgram,
      course: course,
      phone: phone || profile?.phone,
      adminType: requestedRole === 'admin' ? (adminType || 'head') : undefined,
      status: 'pending',
      reason: 'New user registration request',
      createdAt: new Date()
    });

    await roleRequest.save();

    console.log('✅ Registration request created:', {
      name: fullName,
      email: email.toLowerCase(),
      requestedRole: requestedRole,
      program: requestProgram,
      branch: branch
    });

    res.status(201).json({
      success: true,
      message: 'Registration request submitted. Please wait for admin approval before you can login.',
      requestId: roleRequest._id
    });
  } catch (error) {
    console.error('Registration request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/auth/request-registration
// @desc    Request new user registration (for non-registered users)
// @access  Public
router.post('/request-registration', async (req, res) => {
  console.log('Received registration request with body:', req.body);
  try {
    const { name, email, password, confirmPassword, requestedRole, branch, course, program, adminType } = req.body;

    // Base field validation
    if (!name || !email || !password || !confirmPassword || !requestedRole) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    // Password confirmation validation
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Password strength validation
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Role-specific field validation
    const needsCourse = ['student', 'faculty', 'placement'].includes(requestedRole);
    const branchEligibleCourses = new Set(['B.Tech', 'M.Tech']);
    const needsBranch = needsCourse && branchEligibleCourses.has(course);

    if (needsCourse && !course) {
      return res.status(400).json({
        success: false,
        message: 'Course is required for the selected role'
      });
    }

    if (needsBranch && !branch) {
      return res.status(400).json({
        success: false,
        message: 'Branch is required for B.Tech and M.Tech'
      });
    }

    // Check for existing user
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Check for existing pending request
    const existingPendingRequest = await RoleRequest.findOne({
      email: email.toLowerCase(),
      status: 'pending'
    });
    if (existingPendingRequest) {
      return res.status(400).json({
        success: false,
        message: 'Registration request already pending for this email'
      });
    }

    // Check for existing approved request
    const existingApprovedRequest = await RoleRequest.findOne({
      email: email.toLowerCase(),
      status: 'approved'
    });
    if (existingApprovedRequest) {
      return res.status(400).json({
        success: false,
        message: 'Registration request already approved for this email. You can now login.'
      });
    }

    // Check for existing rejected request - allow resubmission
    const existingRejectedRequest = await RoleRequest.findOne({
      email: email.toLowerCase(),
      status: 'rejected'
    });
    if (existingRejectedRequest) {
      // Update the rejected request instead of creating a new one
      existingRejectedRequest.name = name.trim();
      existingRejectedRequest.password = password;
      existingRejectedRequest.requestedRole = requestedRole;
      existingRejectedRequest.branch = branch ? branch.trim() : null;
      existingRejectedRequest.course = course ? course.trim() : null;
      existingRejectedRequest.program = program ? program.trim() : (course ? course.trim() : null);
      existingRejectedRequest.status = 'pending';
      existingRejectedRequest.reviewedBy = null;
      existingRejectedRequest.reviewedAt = null;
      existingRejectedRequest.remarks = null;

      await existingRejectedRequest.save();

      console.log('✅ Rejected request updated and resubmitted:', {
        name: existingRejectedRequest.name,
        email: existingRejectedRequest.email,
        requestedRole: existingRejectedRequest.requestedRole
      });

      res.json({
        success: true,
        message: 'Registration request resubmitted successfully. Please wait for admin approval.'
      });
      return;
    }

    // Store plain password in role request (will be hashed when user is created)
    const roleRequestData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password, // Store plain password
      requestedRole,
      // Only include branch for B.Tech/M.Tech (or Branch Admin)
      branch: branch ? branch.trim() : ((course && ['B.Tech', 'M.Tech'].includes(course)) ? null : null),
      course: course ? course.trim() : null,
      program: program ? program.trim() : (course ? course.trim() : null),
      adminType: requestedRole === 'admin' ? (adminType || 'head') : undefined,
      currentRole: 'none',
      reason: 'New user registration request'
    };

    const roleRequest = new RoleRequest(roleRequestData);
    await roleRequest.save();

    console.log('✅ Registration request created successfully:', {
      name: roleRequest.name,
      email: roleRequest.email,
      requestedRole: roleRequest.requestedRole,
      hasPassword: !!roleRequest.password
    });

    res.json({
      success: true,
      message: 'Registration request submitted successfully. Please wait for admin approval.'
    });
  } catch (error) {
    console.error('Registration request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    console.log('Login request received:', {
      body: req.body,
      headers: req.headers['content-type']
    });

    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Invalid email format:', email);
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    console.log('Looking for user with email:', email.toLowerCase());

    // Find user by email (case-insensitive) and include password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      console.log('User not found for email:', email);
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log('User found:', {
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      hasPassword: !!user.password
    });

    // Check if user is verified
    if (!user.isVerified) {
      console.log('User not verified:', email);
      return res.status(400).json({
        success: false,
        message: 'Account not verified. Please contact administrator.'
      });
    }

    console.log('Attempting password comparison...');

    // Compare password using the model method
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Password mismatch for user:', email);
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log('Password match successful');

    // Always require email OTP before granting access
    const tempToken = generateTwoFactorTempToken(user._id);
    try {
      const otp = (Math.floor(100000 + Math.random() * 900000)).toString();
      const expiryMinutes = Number(process.env.OTP_EXPIRY_MINUTES || 10);
      const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
      user.emailOTP = otpHash;
      user.emailOTPExpiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
      await user.save();

      await emailService.sendEmail(
        user.email,
        'Your One-Time Password (OTP)',
        'email-otp',
        {
          name: user.firstName || user.name || 'User',
          otp,
          purpose: 'log in to your account',
          expiryMinutes
        }
      );
    } catch (e) {
      console.error('Email OTP send error:', e.message);
      return res.status(500).json({ success: false, message: 'Failed to send OTP. Please try again.' });
    }

    return res.json({ success: true, otpRequired: true, tempToken });
  } catch (error) {
    console.error('Login error details:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
});

// =========================
// Two-Factor Authentication
// =========================

const maskPhone = (phone) => {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return phone;
  return phone.slice(0, -4).replace(/\d/g, '*') + phone.slice(-4);
};

// @route   POST /api/auth/2fa/setup
// @desc    Initiate 2FA setup (TOTP or SMS). Returns QR for TOTP or sends SMS code.
// @access  Private
router.post('/2fa/setup', auth, async (req, res) => {
  try {
    const { method = 'totp', phone } = req.body || {};
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (method === 'sms') {
      if (!phone) {
        return res.status(400).json({ success: false, message: 'Phone number is required' });
      }
      user.twoFactorPhone = phone;
      const smsCode = String(Math.floor(100000 + Math.random() * 900000));
      user.twoFactorSMSCode = smsCode;
      user.twoFactorSMSExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      try {
        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER) {
          const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
          await twilio.messages.create({ to: phone, from: process.env.TWILIO_FROM_NUMBER, body: `Your EduConnect verification code is ${smsCode}` });
        } else {
          console.log('Twilio not configured. SMS code:', smsCode);
        }
      } catch (e) {
        console.error('SMS send error:', e.message);
      }

      return res.json({ success: true, method: 'sms', maskedPhone: maskPhone(phone), devCode: ((process.env.NODE_ENV || 'development') !== 'production') ? smsCode : undefined });
    }

    // Default TOTP setup
    const secret = speakeasy.generateSecret({ length: 20, name: `EduConnect (${user.email})` });
    user.twoFactorTempSecret = secret.base32;
    await user.save();

    const otpauthUrl = secret.otpauth_url;
    const qrDataUrl = await QRCode.toDataURL(otpauthUrl);
    res.json({ success: true, method: 'totp', otpauthUrl, qrDataUrl, base32: secret.base32 });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/auth/2fa/verify-setup
// @desc    Verify TOTP against temp secret and enable 2FA
// @access  Private
router.post('/2fa/verify-setup', auth, async (req, res) => {
  try {
    const { code, method = 'totp' } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Code is required' });
    }
    if (method === 'sms') {
      const user = await User.findById(req.user.id).select('+twoFactorSMSCode');
      if (!user || !user.twoFactorSMSCode) {
        return res.status(400).json({ success: false, message: 'No SMS setup in progress' });
      }
      if (!user.twoFactorSMSExpiresAt || user.twoFactorSMSExpiresAt < new Date()) {
        return res.status(400).json({ success: false, message: 'Code expired' });
      }
      if (user.twoFactorSMSCode !== code) {
        return res.status(400).json({ success: false, message: 'Invalid code' });
      }
      user.twoFactorEnabled = true;
      user.twoFactorMethod = 'sms';
      user.twoFactorSMSCode = undefined;
      user.twoFactorSMSExpiresAt = undefined;
      await user.save();
      return res.json({ success: true, message: 'Two-factor authentication (SMS) enabled' });
    }

    const user = await User.findById(req.user.id).select('+twoFactorTempSecret');
    if (!user || !user.twoFactorTempSecret) {
      return res.status(400).json({ success: false, message: 'No 2FA setup in progress' });
    }
    const verified = speakeasy.totp.verify({ secret: user.twoFactorTempSecret, encoding: 'base32', token: code, window: 1 });
    if (!verified) return res.status(400).json({ success: false, message: 'Invalid code' });
    user.twoFactorSecret = user.twoFactorTempSecret;
    user.twoFactorTempSecret = undefined;
    user.twoFactorEnabled = true;
    user.twoFactorMethod = 'totp';
    await user.save();
    res.json({ success: true, message: 'Two-factor authentication enabled' });
  } catch (error) {
    console.error('2FA verify setup error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/auth/2fa/disable
// @desc    Disable 2FA after validating current TOTP code
// @access  Private
router.post('/2fa/disable', auth, async (req, res) => {
  try {
    const { code } = req.body;
    const user = await User.findById(req.user.id).select('+twoFactorSecret +twoFactorSMSCode');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (!user.twoFactorEnabled || (!user.twoFactorSecret && !user.twoFactorPhone)) {
      return res.status(400).json({ success: false, message: 'Two-factor is not enabled' });
    }

    let verified = false;
    if (user.twoFactorMethod === 'sms') {
      if (!user.twoFactorSMSCode || !user.twoFactorSMSExpiresAt || user.twoFactorSMSExpiresAt < new Date() || user.twoFactorSMSCode !== code) {
        return res.status(400).json({ success: false, message: 'Invalid or expired code' });
      }
      verified = true;
    } else if (user.twoFactorSecret) {
      verified = speakeasy.totp.verify({ secret: user.twoFactorSecret, encoding: 'base32', token: code, window: 1 });
      if (!verified) return res.status(400).json({ success: false, message: 'Invalid code' });
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.twoFactorTempSecret = undefined;
    user.twoFactorMethod = null;
    await user.save();

    res.json({ success: true, message: 'Two-factor authentication disabled' });
  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/auth/2fa/verify-login
// @desc    Verify TOTP during login and issue full JWT
// @access  Public (uses temp token)
router.post('/2fa/verify-login', async (req, res) => {
  try {
    const { tempToken, code } = req.body;
    if (!tempToken || !code) {
      return res.status(400).json({ success: false, message: 'tempToken and code are required' });
    }

    const secret = process.env.JWT_SECRET || 'your-secret-key';
    let decoded;
    try {
      decoded = jwt.verify(tempToken, secret);
    } catch (e) {
      return res.status(401).json({ success: false, message: 'Invalid or expired temp token' });
    }

    if (!decoded.twoFactorPending || !decoded.id) {
      return res.status(400).json({ success: false, message: 'Invalid temp token' });
    }

    const user = await User.findById(decoded.id).select('+twoFactorSecret +twoFactorSMSCode +password');
    if (!user || !user.twoFactorEnabled) {
      return res.status(400).json({ success: false, message: 'Two-factor not enabled for user' });
    }

    let verified = false;
    if (user.twoFactorMethod === 'sms') {
      if (!user.twoFactorSMSCode || !user.twoFactorSMSExpiresAt || user.twoFactorSMSExpiresAt < new Date() || user.twoFactorSMSCode !== code) {
        return res.status(400).json({ success: false, message: 'Invalid or expired code' });
      }
      verified = true;
      // Clear used SMS code
      user.twoFactorSMSCode = undefined;
      user.twoFactorSMSExpiresAt = undefined;
    } else {
      if (!user.twoFactorSecret) return res.status(400).json({ success: false, message: 'Two-factor not enabled for user' });
      verified = speakeasy.totp.verify({ secret: user.twoFactorSecret, encoding: 'base32', token: code, window: 1 });
      if (!verified) return res.status(400).json({ success: false, message: 'Invalid code' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Issue full JWT
    const token = generateToken(user._id);
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({ success: true, token, user: userResponse });
  } catch (error) {
    console.error('2FA verify login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Resend SMS code during setup (authenticated) or login (with temp token)
router.post('/2fa/resend', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.twoFactorMethod !== 'sms' || !user.twoFactorPhone) {
      return res.status(400).json({ success: false, message: 'SMS 2FA not configured' });
    }
    const smsCode = String(Math.floor(100000 + Math.random() * 900000));
    user.twoFactorSMSCode = smsCode;
    user.twoFactorSMSExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    try {
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER) {
        const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await twilio.messages.create({ to: user.twoFactorPhone, from: process.env.TWILIO_FROM_NUMBER, body: `Your EduConnect verification code is ${smsCode}` });
      } else {
        console.log('Twilio not configured. SMS code:', smsCode);
      }
    } catch (e) {
      console.error('SMS send error:', e.message);
    }

    res.json({ success: true, maskedPhone: maskPhone(user.twoFactorPhone), devCode: ((process.env.NODE_ENV || 'development') !== 'production') ? smsCode : undefined });
  } catch (error) {
    console.error('2FA resend error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/auth/me
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('courses').select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      studentId,
      employeeId,
      semester,
      section,
      department
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('Profile update - Current user email:', user.email);
    console.log('Profile update - Requested email:', email);

    // Update basic fields with validation
    if (name && name.trim()) {
      user.name = name.trim();
    }

    // Handle email update with proper validation
    if (email && email !== user.email) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid email address'
        });
      }

      console.log('Email is being changed from', user.email, 'to', email);

      // Check if email is already taken by another user
      const existingUser = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: req.user.id }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
      user.email = email.toLowerCase().trim();
    }

    // Initialize profile object if it doesn't exist
    if (!user.profile) {
      user.profile = {};
    }

    // Update profile fields only if provided
    if (phone !== undefined) user.profile.phone = phone;
    if (address !== undefined) user.profile.address = address;
    if (studentId !== undefined) user.profile.studentId = studentId;
    if (employeeId !== undefined) user.profile.employeeId = employeeId;
    if (semester !== undefined) user.profile.semester = semester;
    if (section !== undefined) user.profile.section = section;
    if (department !== undefined) user.department = department;

    console.log('Saving user with updated data');
    await user.save();

    // Return updated user data without password
    const updatedUser = await User.findById(req.user.id)
      .populate('courses')
      .select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Profile update error:', error);

    // Handle MongoDB duplicate key error specifically
    if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// @route   POST /api/auth/send-password-otp
// @desc    Send OTP to user's email for password change verification
// @access  Private
router.post('/send-password-otp', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.passwordOtp = otp;
    user.passwordOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    // Send OTP via email (use emailService if configured, otherwise log)
    try {
      const emailService = require('../services/emailService');
      await emailService.sendEmail(
        user.email,
        'Password Change Verification - EduConnect',
        'email-otp',
        {
          name: user.name || 'User',
          purpose: 'verify your password change request',
          otp: otp,
          expiryMinutes: '10'
        }
      );
    } catch (emailError) {
      console.log('Email service not configured. Password OTP:', otp);
    }

    // Mask email for response
    const maskedEmail = user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3');

    res.json({
      success: true,
      message: 'OTP sent to your email',
      maskedEmail,
      // In dev mode, return the OTP for testing
      devOtp: (process.env.NODE_ENV || 'development') !== 'production' ? otp : undefined
    });
  } catch (error) {
    console.error('Send password OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/auth/verify-password-otp
// @desc    Verify OTP without consuming it (step 1 of 2-step password change)
// @access  Private
router.post('/verify-password-otp', auth, async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ success: false, message: 'OTP is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.passwordOtp || !user.passwordOtpExpiresAt) {
      return res.status(400).json({ success: false, message: 'No OTP was requested. Please request a new OTP first.' });
    }
    if (new Date() > user.passwordOtpExpiresAt) {
      user.passwordOtp = undefined;
      user.passwordOtpExpiresAt = undefined;
      await user.save();
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }
    if (user.passwordOtp !== otp.trim()) {
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });
    }

    // OTP is valid — don't consume it yet, will be consumed when password is actually changed
    res.json({ success: true, message: 'OTP verified successfully. You can now set your new password.' });
  } catch (error) {
    console.error('Verify password OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/auth/change-password
// @desc    Change password with current password OR email OTP verification
// @access  Private
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, otp, newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'New password and confirmation are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'New passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify identity: either current password or OTP
    if (otp) {
      // OTP verification
      if (!user.passwordOtp || !user.passwordOtpExpiresAt) {
        return res.status(400).json({ success: false, message: 'No OTP was requested. Please request a new OTP first.' });
      }
      if (new Date() > user.passwordOtpExpiresAt) {
        user.passwordOtp = undefined;
        user.passwordOtpExpiresAt = undefined;
        await user.save();
        return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
      }
      if (user.passwordOtp !== otp.trim()) {
        return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });
      }
      // Clear OTP after successful verification
      user.passwordOtp = undefined;
      user.passwordOtpExpiresAt = undefined;
    } else if (currentPassword) {
      // Current password verification
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }
    } else {
      return res.status(400).json({ success: false, message: 'Either current password or OTP is required for verification' });
    }

    // Update password (pre-save hook will hash it)
    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/auth/request-verification
// @desc    Request role change for existing users
// @access  Private
router.post('/request-verification', auth, async (req, res) => {
  try {
    const { requestedRole, reason, program } = req.body;

    if (!requestedRole || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Requested role and reason are required'
      });
    }

    if (req.user.role === requestedRole) {
      return res.status(400).json({
        success: false,
        message: 'You already have this role'
      });
    }

    // Check for existing pending request
    const existing = await RoleRequest.findOne({
      user: req.user._id,
      status: 'pending'
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending role change request'
      });
    }

    const request = new RoleRequest({
      user: req.user._id,
      requestedRole,
      currentRole: req.user.role,
      reason: reason.trim(),
      program: program ? program.trim() : null
    });

    await request.save();

    res.json({
      success: true,
      message: 'Role change request submitted successfully',
      request
    });
  } catch (error) {
    console.error('Role change request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/auth/verification-requests
// @desc    Get pending verification requests based on user role
// @access  Private (admin/faculty)
router.get('/verification-requests', auth, authorize('admin', 'faculty'), async (req, res) => {
  try {
    // Accept optional ?status= query param. Default: 'pending'. Use 'all' to get all statuses.
    const statusParam = req.query.status || 'pending';
    let query = {};
    if (statusParam !== 'all') {
      query.status = statusParam;
    }
    const { role, adminPrograms, adminType, program: userProgram } = req.user;

    // Determine admin type if not explicitly set (failed migration fallback)
    const effectiveAdminType = adminType ||
      (role === 'admin' ? (
        (!adminPrograms || adminPrograms.length === 0) ? 'head' :
          'program' // Default to program admin if has programs but no type
      ) : null);

    if (role === 'faculty') {
      // Faculty can only see student requests FROM THEIR PROGRAM AND BRANCH
      query.requestedRole = 'student';
      if (userProgram) {
        query.program = userProgram;
        // Also filter by branch if faculty has one
        const facultyBranch = req.user.branch || req.user.profile?.branch;
        if (facultyBranch) {
          query.branch = { $regex: new RegExp(`^${facultyBranch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };
        }
      } else {
        query.program = '__none__';
      }
    } else if (effectiveAdminType === 'head') {
      // Head Admin sees:
      // 1. Program Admin requests
      // 2. Library/Placement requests
      // 3. Unassigned Student/Faculty requests (no program)
      query.$or = [
        { requestedRole: 'admin', adminType: 'program' },
        { requestedRole: { $in: ['library', 'placement'] } },
        {
          requestedRole: { $in: ['student', 'faculty'] },
          $or: [{ program: null }, { program: '' }, { program: { $exists: false } }]
        }
      ];
    } else if (effectiveAdminType === 'program') {
      // Program Admin sees:
      // 1. Branch Admin requests (for their program) only
      // Faculty requests are handled by Branch Admin
      query.program = { $in: adminPrograms };
      query.requestedRole = 'admin';
      query.adminType = 'branch';
    } else if (effectiveAdminType === 'branch') {
      // Branch Admin sees:
      // 1. Student requests (for their program AND branch)
      // 2. Faculty requests (for their program AND branch)
      query.program = { $in: adminPrograms };
      query.requestedRole = { $in: ['student', 'faculty'] };

      const adminBranch = req.user.branch || req.user.profile?.branch;
      if (adminBranch) {
        query.branch = { $regex: new RegExp(`^${adminBranch.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };
      }
    }

    const requests = await RoleRequest.find(query)
      .populate('user', 'name email role')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    // Return in format expected by frontend (both 'requests' and 'data' for compatibility)
    res.json({
      success: true,
      requests,
      data: requests // Also include as 'data' for Android compatibility
    });
  } catch (error) {
    console.error('Get verification requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/auth/verification-requests/:id/decision
// @desc    Approve or reject verification requests with guaranteed user creation
// @access  Private (admin/faculty)
router.post('/verification-requests/:id/decision', auth, authorize('admin', 'faculty'), async (req, res) => {
  try {
    const { status, remarks } = req.body;

    console.log(`\n🔄 Processing verification request decision:`, {
      requestId: req.params.id,
      status,
      reviewer: req.user.email,
      reviewerRole: req.user.role
    });

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "approved" or "rejected"'
      });
    }

    const request = await RoleRequest.findById(req.params.id).populate('user');
    if (!request) {
      console.log('❌ Request not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    console.log('📋 Request details:', {
      name: request.name,
      email: request.email,
      requestedRole: request.requestedRole,
      currentStatus: request.status,
      hasUser: !!request.user
    });

    if (request.status !== 'pending') {
      console.log('❌ Request already processed:', request.status);
      return res.status(400).json({
        success: false,
        message: 'Request already processed'
      });
    }

    // Authorization Check
    const { role, adminPrograms, adminType } = req.user;
    const effectiveAdminType = adminType || (role === 'admin' ? ((!adminPrograms || !adminPrograms.length) ? 'head' : 'program') : null);

    if (role === 'faculty') {
      if (request.requestedRole !== 'student') {
        return res.status(403).json({ success: false, message: 'Faculty can only approve student requests' });
      }
      // Check program/branch match
      const userProgram = req.user.program;
      const userBranch = req.user.branch;
      if (userProgram && request.program !== userProgram) {
        return res.status(403).json({ success: false, message: 'Cross-program approval denied' });
      }
      if (userBranch && request.branch && request.branch.toLowerCase() !== userBranch.toLowerCase()) {
        return res.status(403).json({ success: false, message: 'Cross-branch approval denied' });
      }
    } else if (role === 'admin') {
      if (effectiveAdminType === 'head') {
        // Head Admin approves: Program Admin, Library, Placement
        // Cannot approve Branch Admin or Faculty (delegated to Program Admin)
        // Cannot approve Students (delegated to Branch Admin)
        const allowed = ['admin', 'library', 'placement'];
        if (!allowed.includes(request.requestedRole) || (request.requestedRole === 'admin' && request.adminType !== 'program')) {
          // Allow approving unassigned/generic requests as fallback
          if (request.program) {
            return res.status(403).json({ success: false, message: 'Head Admin approves Program Admins. Branch Admins/Faculty are handled by Program Admins.' });
          }
        }
      } else if (effectiveAdminType === 'program') {
        // Program Admin approves: Branch Admin only (for their program)
        // Faculty requests are handled by Branch Admin
        if (!adminPrograms.includes(request.program)) {
          return res.status(403).json({ success: false, message: 'Cross-program approval denied' });
        }
        if (request.requestedRole !== 'admin' || request.adminType !== 'branch') {
          return res.status(403).json({ success: false, message: 'Program Admin can only approve Branch Admin requests. Faculty requests are handled by Branch Admin.' });
        }
      } else if (effectiveAdminType === 'branch') {
        // Branch Admin approves: Students AND Faculty (for their program + branch)
        if (!adminPrograms.includes(request.program)) {
          return res.status(403).json({ success: false, message: 'Cross-program approval denied' });
        }
        const adminBranch = req.user.branch;
        if (adminBranch && request.branch && request.branch.toLowerCase() !== adminBranch.toLowerCase()) {
          return res.status(403).json({ success: false, message: 'Cross-branch approval denied' });
        }
        if (!['student', 'faculty'].includes(request.requestedRole)) {
          return res.status(403).json({ success: false, message: 'Branch Admin can only approve Student and Faculty requests.' });
        }
      }
    }

    // Process approval with guaranteed user creation
    if (status === 'approved') {
      console.log('✅ Processing approval...');

      if (request.user) {
        // Existing user role change
        console.log('🔄 Updating existing user role...');
        const updateData = {
          role: request.requestedRole
        };

        // Use $set for fields and $addToSet for arrays
        if (request.requestedRole === 'admin') {
          updateData.$set = updateData.$set || {};
          if (request.program) {
            updateData.$addToSet = { adminPrograms: request.program };
          }
          if (request.branch) {
            updateData.$set.branch = request.branch.trim();
            updateData.$set['profile.branch'] = request.branch.trim();
          }
        }

        await User.findByIdAndUpdate(request.user._id, updateData, { new: true });
        console.log('✅ Existing user updated successfully');
      } else {
        // New user registration - GUARANTEED CREATION
        console.log('🆕 Creating new user from approved request...');

        // Validate required data
        if (!request.name || !request.email || !request.password) {
          console.log('❌ Missing required user data:', {
            hasName: !!request.name,
            hasEmail: !!request.email,
            hasPassword: !!request.password
          });
          return res.status(400).json({
            success: false,
            message: 'Cannot approve request: missing required user data'
          });
        }

        // Check if user already exists (double-check)
        const existingUser = await User.findOne({ email: request.email.toLowerCase() });
        if (existingUser) {
          console.log('⚠️ User already exists, updating instead of creating');
          existingUser.role = request.requestedRole;
          existingUser.isVerified = true;
          existingUser.branch = request.branch;
          existingUser.program = request.program || request.course || existingUser.program;
          existingUser.profile = {
            course: request.course,
            branch: request.branch
          };

          // Set admin type and programs
          if (request.requestedRole === 'admin') {
            existingUser.adminType = request.adminType || 'head';
            if (request.program) {
              existingUser.adminPrograms = [request.program];
            } else {
              existingUser.adminPrograms = [];
            }
          }

          await existingUser.save();
          request.user = existingUser._id;
          console.log('✅ Existing user updated successfully');
        } else {
          // Create new user with comprehensive data
          console.log('🆕 Creating new user with data:', {
            name: request.name,
            email: request.email,
            requestedRole: request.requestedRole,
            branch: request.branch,
            program: request.program,
            course: request.course
          });

          const newUser = new User({
            name: request.name.trim(),
            email: request.email.toLowerCase().trim(),
            password: request.password, // Will be hashed by pre-save middleware
            role: request.requestedRole,
            branch: request.branch ? request.branch.trim() : null,
            program: request.program ? request.program.trim() : (request.course ? request.course.trim() : null),
            profile: {
              course: request.course ? request.course.trim() : null,
              branch: request.branch ? request.branch.trim() : null
            },
            isVerified: true,
            createdBy: req.user._id,
            createdAt: new Date()
          });

          // Set admin type and programs
          if (request.requestedRole === 'admin') {
            newUser.adminType = request.adminType || 'head';
            if (request.program) {
              newUser.adminPrograms = [request.program];
            } else {
              newUser.adminPrograms = [];
            }
          }

          // GUARANTEED USER CREATION with retry logic
          let userCreated = false;
          let retryCount = 0;
          const maxRetries = 3;

          while (!userCreated && retryCount < maxRetries) {
            try {
              await newUser.save();
              userCreated = true;
              console.log('✅ New user created successfully:', newUser.email);

              // Update the request to reference the new user
              request.user = newUser._id;

              // Verify user was actually created
              const verifyUser = await User.findById(newUser._id);
              if (!verifyUser) {
                throw new Error('User creation verification failed');
              }
              console.log('✅ User creation verified in database');

            } catch (error) {
              retryCount++;
              console.error(`❌ User creation attempt ${retryCount} failed:`, error.message);

              if (retryCount >= maxRetries) {
                console.error('❌ All user creation attempts failed');
                return res.status(500).json({
                  success: false,
                  message: 'Failed to create user after multiple attempts. Please try again.'
                });
              }

              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
      }
    }

    // Update request status with comprehensive logging
    console.log('📝 Updating request status...');
    request.status = status;
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    if (remarks) {
      request.remarks = remarks.trim();
    }

    await request.save();
    console.log('✅ Request status updated successfully');

    // Final verification - ensure user exists if approved
    if (status === 'approved' && request.user) {
      const finalUserCheck = await User.findById(request.user);
      if (!finalUserCheck) {
        console.error('❌ CRITICAL: User not found after approval process');
        return res.status(500).json({
          success: false,
          message: 'User creation verification failed. Please contact administrator.'
        });
      }
      console.log('✅ Final user verification passed');
    }

    console.log('🎉 Verification process completed successfully');

    res.json({
      success: true,
      message: `Request ${status} successfully. ${status === 'approved' ? 'User has been created and can now login.' : ''}`,
      request
    });
  } catch (error) {
    console.error('❌ Error processing verification request:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during verification process'
    });
  }
});

// @route   GET /api/auth/verification-status
// @desc    Check verification status and user creation
// @access  Private (admin only)
router.get('/verification-status', auth, authorize('admin'), async (req, res) => {
  try {
    console.log('🔍 Checking verification status...');

    // Get all approved requests
    const approvedRequests = await RoleRequest.find({ status: 'approved' });
    console.log(`Found ${approvedRequests.length} approved requests`);

    const verificationResults = [];

    for (const request of approvedRequests) {
      const user = await User.findOne({ email: request.email });
      const status = user ? '✅ User Created' : '❌ User Missing';

      verificationResults.push({
        requestId: request._id,
        name: request.name,
        email: request.email,
        requestedRole: request.requestedRole,
        status: status,
        userExists: !!user,
        userVerified: user ? user.isVerified : false,
        createdAt: request.createdAt,
        reviewedAt: request.reviewedAt
      });

      console.log(`${status} - ${request.email} (${request.requestedRole})`);
    }

    // Get all pending requests
    const pendingRequests = await RoleRequest.find({ status: 'pending' });
    console.log(`Found ${pendingRequests.length} pending requests`);

    // Get all rejected requests
    const rejectedRequests = await RoleRequest.find({ status: 'rejected' });
    console.log(`Found ${rejectedRequests.length} rejected requests`);

    res.json({
      success: true,
      summary: {
        totalApproved: approvedRequests.length,
        totalPending: pendingRequests.length,
        totalRejected: rejectedRequests.length,
        usersCreated: verificationResults.filter(r => r.userExists).length,
        usersMissing: verificationResults.filter(r => !r.userExists).length
      },
      approvedRequests: verificationResults,
      pendingRequests: pendingRequests.map(r => ({
        id: r._id,
        name: r.name,
        email: r.email,
        requestedRole: r.requestedRole,
        createdAt: r.createdAt
      })),
      rejectedRequests: rejectedRequests.map(r => ({
        id: r._id,
        name: r.name,
        email: r.email,
        requestedRole: r.requestedRole,
        remarks: r.remarks,
        reviewedAt: r.reviewedAt
      }))
    });
  } catch (error) {
    console.error('Error checking verification status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/auth/fix-missing-users
// @desc    Fix missing users for approved requests
// @access  Private (admin only)
router.post('/fix-missing-users', auth, authorize('admin'), async (req, res) => {
  try {
    console.log('🔧 Fixing missing users...');

    const approvedRequests = await RoleRequest.find({ status: 'approved' });
    const fixedUsers = [];
    const errors = [];

    for (const request of approvedRequests) {
      const existingUser = await User.findOne({ email: request.email });

      if (!existingUser) {
        try {
          console.log(`🔄 Creating missing user for ${request.email}...`);

          const newUser = new User({
            name: request.name.trim(),
            email: request.email.toLowerCase().trim(),
            password: request.password,
            role: request.requestedRole,
            branch: request.branch ? request.branch.trim() : null,
            program: request.program ? request.program.trim() : null,
            profile: {
              course: request.course ? request.course.trim() : null,
              branch: request.branch ? request.branch.trim() : null
            },
            isVerified: true,
            createdBy: req.user._id,
            createdAt: new Date()
          });

          if (request.requestedRole === 'admin') {
            newUser.adminType = request.adminType || 'head';
            if (request.program) {
              newUser.adminPrograms = [request.program];
            } else {
              newUser.adminPrograms = [];
            }
          }

          await newUser.save();

          // Update request to reference the new user
          request.user = newUser._id;
          await request.save();

          fixedUsers.push({
            email: request.email,
            name: request.name,
            role: request.requestedRole
          });

          console.log(`✅ Fixed user for ${request.email}`);

        } catch (error) {
          console.error(`❌ Failed to fix user for ${request.email}:`, error.message);
          errors.push({
            email: request.email,
            error: error.message
          });
        }
      }
    }

    res.json({
      success: true,
      message: `Fixed ${fixedUsers.length} missing users`,
      fixedUsers,
      errors
    });

  } catch (error) {
    console.error('Error fixing missing users:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/auth/all-users
// @desc    Get all users (for admin viewing)
// @access  Private (admin only)
router.get('/all-users', auth, authorize('admin'), async (req, res) => {
  try {
    console.log('🔍 Admin requesting all users...');

    const users = await User.find({})
      .select('-password') // Don't send passwords
      .sort({ createdAt: -1 });

    console.log(`Found ${users.length} users`);

    res.json({
      success: true,
      totalUsers: users.length,
      users: users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        branch: user.branch,
        program: user.program,
        profile: user.profile,
        adminPrograms: user.adminPrograms,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }))
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/auth/departments
// @desc    Get all departments
// @access  Private
router.get('/departments', auth, async (req, res) => {
  try {
    const departments = await User.distinct('department', { role: 'student' });
    res.json({ departments });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/users-by-role/:role
// @desc    Get users by specific role
// @access  Private (admin only)
router.get('/users-by-role/:role', auth, authorize('admin'), async (req, res) => {
  try {
    const { role } = req.params;
    console.log(`🔍 Admin requesting users with role: ${role}`);

    const users = await User.find({ role })
      .select('-password')
      .sort({ createdAt: -1 });

    console.log(`Found ${users.length} users with role: ${role}`);

    res.json({
      success: true,
      role: role,
      totalUsers: users.length,
      users: users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        branch: user.branch,
        program: user.program,
        profile: user.profile,
        createdAt: user.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching users by role:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/auth/admin-stats
// @desc    Get admin dashboard statistics
// @access  Private (admin only)
router.get('/admin-stats', auth, authorize('admin'), async (req, res) => {
  try {
    const [totalStudents, totalFaculty, activePrograms, totalRevenue] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'faculty' }),
      User.distinct('program', {
        program: { $ne: null, $ne: '', $exists: true },
        role: { $in: ['student', 'faculty'] }
      }),
      Fee.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const totalCourses = activePrograms.length;
    const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

    res.json({
      success: true,
      stats: {
        totalStudents,
        totalFaculty,
        totalCourses,
        totalRevenue: revenue
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/auth/department-enrollment
// @desc    Get department-wise student enrollment
// @access  Private (admin only)
router.get('/department-enrollment', auth, authorize('admin'), async (req, res) => {
  try {
    const pipeline = [
      { $match: { role: 'student' } },
      {
        $group: {
          _id: '$branch',
          students: { $sum: 1 }
        }
      },
      {
        $project: {
          department: { $ifNull: ['$_id', 'Unknown'] },
          students: 1,
          _id: 0
        }
      },
      { $sort: { students: -1 } }
    ];

    const departments = await User.aggregate(pipeline);
    res.json({ success: true, departments });
  } catch (error) {
    console.error('Department enrollment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/auth/monthly-revenue
// @desc    Get monthly revenue trend
// @access  Private (admin only)
router.get('/monthly-revenue', auth, authorize('admin'), async (req, res) => {
  try {
    const pipeline = [
      {
        $match: {
          status: 'paid',
          paidDate: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$paidDate' } },
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { '_id': 1 } },
      {
        $project: {
          month: '$_id',
          amount: 1,
          _id: 0
        }
      }
    ];

    const revenue = await Fee.aggregate(pipeline);
    res.json({ success: true, revenue });
  } catch (error) {
    console.error('Monthly revenue error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/auth/admins-by-program
// @desc    Get all admins for a specific program
// @access  Private (admin only)
router.get('/admins-by-program', auth, authorize('admin'), async (req, res) => {
  try {
    const { program } = req.query;

    if (!program) {
      return res.status(400).json({
        success: false,
        message: 'Program parameter is required'
      });
    }

    const admins = await User.find({
      role: 'admin',
      adminPrograms: program
    }).select('-password');

    res.json({ success: true, admins });
  } catch (error) {
    console.error('Get admins by program error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { id: user._id, type: 'password-reset' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Send password reset email
    try {
      await emailService.sendPasswordResetEmail(user, resetToken);
      res.json({
        success: true,
        message: 'Password reset email sent successfully'
      });
    } catch (emailError) {
      console.error('Password reset email error:', emailError);
      res.status(500).json({
        success: false,
        message: 'Failed to send password reset email'
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    if (decoded.type !== 'password-reset') {
      return res.status(400).json({
        success: false,
        message: 'Invalid token type'
      });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/auth/test-email
// @desc    Test email service
// @access  Private (admin only)
router.post('/test-email', auth, authorize('admin'), async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    const testResult = await emailService.testEmailService();

    if (testResult.success) {
      res.json({
        success: true,
        message: 'Email service test completed successfully',
        details: testResult
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Email service test failed',
        details: testResult
      });
    }
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// ============ EMAIL OTP: REQUEST & VERIFY ============

// @route   POST /api/auth/request-otp
// @desc    Generate and send OTP to user's email
// @access  Public
router.post('/request-otp', async (req, res) => {
  try {
    const { email, purpose } = req.body; // purpose: 'login' | 'verify-email' | '2fa'

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate 6-digit OTP
    const otp = (Math.floor(100000 + Math.random() * 900000)).toString();
    const expiryMinutes = Number(process.env.OTP_EXPIRY_MINUTES || 10);
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Optionally hash OTP before storing
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    user.emailOTP = otpHash;
    user.emailOTPExpiresAt = expiresAt;
    await user.save();

    // Send email
    await emailService.sendEmail(
      user.email,
      'Your One-Time Password (OTP)',
      'email-otp',
      {
        name: user.firstName || user.name || 'User',
        otp,
        purpose: purpose || 'continue',
        expiryMinutes
      }
    );

    return res.json({ success: true, message: 'OTP sent to email' });
  } catch (error) {
    console.error('Request OTP error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify email OTP and (optionally) log in
// @access  Public
router.post('/verify-otp', async (req, res) => {
  try {
    console.log('Verify OTP request received:', {
      body: req.body,
      hasEmail: !!req.body?.email,
      hasOtp: !!req.body?.otp
    });

    const { email, otp, tempToken, issueToken = true } = req.body;

    if (!email || !otp) {
      console.log('Missing email or OTP:', { email: !!email, otp: !!otp });
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+emailOTP');
    if (!user || !user.emailOTP || !user.emailOTPExpiresAt) {
      return res.status(400).json({ success: false, message: 'No OTP pending for this user' });
    }

    if (user.emailOTPExpiresAt < new Date()) {
      user.emailOTP = undefined;
      user.emailOTPExpiresAt = undefined;
      await user.save();
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }

    // Compare hashed OTP
    const providedHash = crypto.createHash('sha256').update(otp).digest('hex');
    if (providedHash !== user.emailOTP) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // Invalidate OTP on success
    user.emailOTP = undefined;
    user.emailOTPExpiresAt = undefined;
    user.isVerified = true;
    await user.save();

    if (issueToken) {
      // Successful login: update lastLogin
      user.lastLogin = new Date();
      await user.save();
      const token = generateToken(user._id);
      const userResponse = user.toObject();
      delete userResponse.password;
      return res.json({ success: true, message: 'OTP verified', token, user: userResponse });
    }

    return res.json({ success: true, message: 'OTP verified' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email (public — no auth required)
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ success: true, message: 'If an account exists with that email, a reset link has been sent.' });
    }

    // Generate a secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Store hash in DB with 1-hour expiry
    user.passwordResetToken = hashedToken;
    user.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save({ validateBeforeSave: false });

    // Build the reset URL (frontend page)
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

    // Send email using the existing password-reset template
    const emailService = require('../services/emailService');
    await emailService.sendEmail(
      user.email,
      'Password Reset Request - EduConnect',
      'password-reset',
      {
        name: user.name,
        resetUrl: resetUrl,
        expiryHours: '1',
        institutionName: 'EduConnect',
        currentYear: new Date().getFullYear().toString()
      }
    );

    console.log(`Password reset email sent to ${user.email}`);
    res.json({ success: true, message: 'If an account exists with that email, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Failed to process password reset request' });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password using token from email link
// @access  Public
router.post('/reset-password', async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;

    if (!token || !email || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token, email, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    // Hash the received token and look up the user
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
      passwordResetToken: hashedToken,
      passwordResetExpiresAt: { $gt: Date.now() }
    }).select('+passwordResetToken');

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset link. Please request a new one.' });
    }

    // Update password (pre-save hook will hash it)
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpiresAt = undefined;
    await user.save();

    console.log(`Password reset successfully for ${user.email}`);
    res.json({ success: true, message: 'Password has been reset successfully. You can now log in with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
});

// @route   GET /api/auth/sidebar-stats
// @desc    Get role-specific badge counts for sidebar
// @access  Private
router.get('/sidebar-stats', auth, async (req, res) => {
  try {
    const Notification = require('../models/Notification');
    const Assignment = require('../models/Assignment');
    const Leave = require('../models/Leave');
    const Marks = require('../models/Marks');

    const userId = req.user._id;
    const role = req.user.role;
    const stats = {};

    // Unread notifications count (common for all roles)
    try {
      const allNotifications = await Notification.find({
        $or: [
          { targetRoles: role },
          { targetUsers: userId }
        ],
        isActive: true
      }).select('readBy');

      stats.unreadNotifications = allNotifications.filter(n =>
        !n.readBy.some(r => r.user.toString() === userId.toString())
      ).length;
    } catch (e) {
      stats.unreadNotifications = 0;
    }

    if (role === 'faculty') {
      // Courses taught by this faculty
      try {
        const facultyCourses = await Course.find({ faculty: userId });
        stats.coursesCount = facultyCourses.length;

        // Students enrolled in faculty's courses
        let studentIds = new Set();
        for (const course of facultyCourses) {
          if (course.students && Array.isArray(course.students)) {
            course.students.forEach(s => studentIds.add(s.toString()));
          }
        }
        stats.studentsCount = studentIds.size;
      } catch (e) {
        stats.coursesCount = 0;
        stats.studentsCount = 0;
      }

      // Pending marks (assignments created by faculty that need grading)
      try {
        const pendingAssignments = await Assignment.find({
          createdBy: userId,
          status: 'published'
        }).select('submissions');
        let pendingCount = 0;
        pendingAssignments.forEach(a => {
          if (a.submissions) {
            pendingCount += a.submissions.filter(s => s.status === 'submitted' && !s.grade).length;
          }
        });
        stats.pendingMarksCount = pendingCount;
      } catch (e) {
        stats.pendingMarksCount = 0;
      }

      // Active assignments
      try {
        const activeAssignments = await Assignment.countDocuments({
          createdBy: userId,
          status: 'published'
        });
        stats.activeAssignments = activeAssignments;
      } catch (e) {
        stats.activeAssignments = 0;
      }

      // Pending leave requests to review
      try {
        const pendingLeaves = await Leave.countDocuments({ status: 'pending' });
        stats.pendingLeaves = pendingLeaves;
      } catch (e) {
        stats.pendingLeaves = 0;
      }

    } else if (role === 'student') {
      // Courses enrolled
      try {
        const enrolledCourses = await Course.find({ students: userId });
        stats.coursesCount = enrolledCourses.length;
      } catch (e) {
        stats.coursesCount = 0;
      }

      // Pending assignments
      try {
        const pendingAssignments = await Assignment.countDocuments({
          status: 'published',
          dueDate: { $gte: new Date() }
        });
        stats.pendingAssignments = pendingAssignments;
      } catch (e) {
        stats.pendingAssignments = 0;
      }

      // Pending leave requests
      try {
        const pendingLeaves = await Leave.countDocuments({
          student: userId,
          status: 'pending'
        });
        stats.pendingLeaves = pendingLeaves;
      } catch (e) {
        stats.pendingLeaves = 0;
      }

    } else if (role === 'admin') {
      // Total users
      try {
        stats.totalUsers = await User.countDocuments();
      } catch (e) {
        stats.totalUsers = 0;
      }

      // Pending verification requests
      try {
        stats.pendingVerifications = await RoleRequest.countDocuments({ status: 'pending' });
      } catch (e) {
        stats.pendingVerifications = 0;
      }

      // Total courses
      try {
        stats.totalCourses = await Course.countDocuments();
      } catch (e) {
        stats.totalCourses = 0;
      }
    }

    res.json({ success: true, stats });
  } catch (error) {
    console.error('Sidebar stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch sidebar stats' });
  }
});

module.exports = router;