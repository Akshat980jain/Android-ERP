const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    console.log('Auth middleware - Headers:', req.headers);
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    console.log('Token received:', token.substring(0, 20) + '...');
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, secret);
    console.log('Token decoded:', { id: decoded.id });
    
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      console.log('User not found for token');
      return res.status(401).json({ message: 'Token is not valid' });
    }

    console.log('User authenticated:', { id: user._id, role: user.role, email: user.email });
    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
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

module.exports = { auth, authorize, checkVerification };