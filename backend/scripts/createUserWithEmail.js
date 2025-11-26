const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function createUserWithEmail() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your-app-name');
    console.log('Connected to MongoDB');

    const email = 'akshat890jain@gmail.com';
    const name = 'Akshat Jain';
    const password = '123456';
    const role = 'admin';

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('User already exists');
      console.log('Name:', existingUser.name);
      console.log('Email:', existingUser.email);
      console.log('Role:', existingUser.role);
      console.log('Is Verified:', existingUser.isVerified);
    } else {
      // Create new user
      const user = new User({
        name: name,
        email: email.toLowerCase(),
        password: password,
        role: role,
        isVerified: true,
        profile: {
          employeeId: 'ADMIN002'
        },
        adminPrograms: ['Computer Science', 'Information Technology', 'Data Science']
      });

      await user.save();
      console.log('User created successfully');
      console.log('Name:', user.name);
      console.log('Email:', user.email);
      console.log('Role:', user.role);
      console.log('Is Verified:', user.isVerified);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createUserWithEmail(); 