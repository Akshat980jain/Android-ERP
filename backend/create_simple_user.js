const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://akshat980jain:zm3aHd1m1a4pxU7q@cluster0.nkrpubg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function createSimpleUser() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if user already exists
    const existingUser = await User.findOne({ email: 'test@test.com' });
    if (existingUser) {
      console.log('User already exists:', existingUser.email);
      process.exit(0);
    }

    // Create a simple test user
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    const user = new User({
      name: 'Test User',
      email: 'test@test.com',
      password: hashedPassword,
      role: 'student',
      studentId: 'STU001',
      phone: '1234567890',
      isActive: true,
      isEmailVerified: true,
      program: 'B.Tech',
      branch: 'Computer Science'
    });

    await user.save();
    console.log('✅ Test user created successfully!');
    console.log('Email: test@test.com');
    console.log('Password: test123');
    console.log('Role: student');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createSimpleUser();
