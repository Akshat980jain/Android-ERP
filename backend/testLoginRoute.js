const mongoose = require('mongoose');
const User = require('./models/User');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Mock the login route logic
async function testLoginRoute() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your-app-name');
    console.log('Connected to MongoDB');

    const email = 'akshat980jain@gmail.com';
    const password = '123456';

    console.log('Testing login with:', { email, password: '***' });

    // Validate input
    if (!email || !password) {
      console.log('Missing email or password');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Invalid email format:', email);
      return;
    }

    // Find user by email (case-insensitive) and include password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      console.log('User not found for email:', email);
      return;
    }

    console.log('User found:', {
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified
    });

    // Check if user is verified
    if (!user.isVerified) {
      console.log('User not verified:', email);
      return;
    }

    // Compare password using the model method
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Password mismatch for user:', email);
      return;
    }

    console.log('Password match successful');

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'your-secret-key', {
      expiresIn: process.env.JWT_EXPIRES_IN || '30d',
    });
    
    console.log('Token generated successfully');

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    console.log('Login successful!');
    console.log('Response:', {
      success: true,
      token: token.substring(0, 20) + '...',
      user: {
        name: userResponse.name,
        email: userResponse.email,
        role: userResponse.role
      }
    });

  } catch (error) {
    console.error('Login route error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testLoginRoute(); 