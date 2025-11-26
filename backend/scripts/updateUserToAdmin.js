const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function updateUserToAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your-app-name');
    console.log('Connected to MongoDB');

    const email = 'akshat890jain@gmail.com';

    // Find the user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('Current user details:');
    console.log('Name:', user.name);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Is Verified:', user.isVerified);

    // Update user to admin
    user.role = 'admin';
    user.name = 'Akshat Jain';
    user.profile = {
      employeeId: 'ADMIN002'
    };
    user.adminPrograms = ['B.Tech', 'M.Tech', 'MCA'];

    await user.save();
    console.log('User updated to admin successfully');
    console.log('New role:', user.role);
    console.log('New name:', user.name);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

updateUserToAdmin(); 