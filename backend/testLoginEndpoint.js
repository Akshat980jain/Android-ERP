const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function testLoginEndpoint() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your-app-name');
    console.log('Connected to MongoDB');

    // Test finding user
    const user = await User.findOne({ email: 'akshat980jain@gmail.com' }).select('+password');
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (user) {
      console.log('User details:', {
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        hasPassword: !!user.password,
        passwordLength: user.password ? user.password.length : 0
      });
      
      // Test password comparison
      try {
        const isMatch = await user.comparePassword('123456');
        console.log('Password match:', isMatch);
      } catch (error) {
        console.error('Password comparison error:', error);
      }

      // Test direct bcrypt comparison
      try {
        const directMatch = await bcrypt.compare('123456', user.password);
        console.log('Direct bcrypt match:', directMatch);
      } catch (error) {
        console.error('Direct bcrypt error:', error);
      }
    } else {
      console.log('User not found!');
    }

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testLoginEndpoint(); 