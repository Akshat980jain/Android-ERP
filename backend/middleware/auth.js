const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET not configured');
      return res.status(500).json({ message: 'Server configuration error' });
    }
    const decoded = jwt.verify(token, secret);

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Ensure only verified accounts (or admins) can access certain routes
const checkVerification = (req, res, next) => {
  try {
    // Allow admins regardless of verification status
    if (req.user?.role === 'admin') {
      return next();
    }

    // Block if role is pending or explicit isVerified flag is false
    const isPending = req.user?.role === 'pending';
    const isExplicitlyUnverified = req.user && Object.prototype.hasOwnProperty.call(req.user, 'isVerified') && req.user.isVerified === false;

    if (isPending || isExplicitlyUnverified) {
      return res.status(403).json({ message: 'Account not verified. Please complete verification or wait for approval.' });
    }

    return next();
  } catch (error) {
    console.error('Verification check error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Restrict route to admin users with specific adminType(s)
// Usage: authorizeAdmin('head', 'program')
const authorizeAdmin = (...adminTypes) => {
  return (req, res, next) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    const effective = getEffectiveAdminType(req.user);
    if (adminTypes.length > 0 && !adminTypes.includes(effective)) {
      return res.status(403).json({
        message: `This action requires ${adminTypes.join(' or ')} admin access. You are ${effective || 'unknown'} admin.`
      });
    }
    req.effectiveAdminType = effective;
    next();
  };
};

// Resolve effective admin type with fallback logic
function getEffectiveAdminType(user) {
  if (user.role !== 'admin') return null;
  if (user.adminType) return user.adminType;
  // Fallback: no adminPrograms → head, has programs → program
  if (!user.adminPrograms || user.adminPrograms.length === 0) return 'head';
  return 'program';
}

module.exports = { auth, authorize, checkVerification, authorizeAdmin, getEffectiveAdminType };