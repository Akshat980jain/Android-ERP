const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your-app-name');
    console.log('Connected to MongoDB');

    // Check if admin user already exists
    const existingUser = await User.findOne({ email: 'akshat980jain@gmail.com' });
    if (existingUser) {
      console.log('Admin user already exists');
      console.log('Name: Akshat Jain');
      console.log('Email: akshat980jain@gmail.com');
      console.log('Password: 123456');
      console.log('Role: admin');
      return;
    }

    // Create admin user (password will be hashed by middleware)
    const adminUser = new User({
      name: 'Akshat Jain',
      email: 'akshat980jain@gmail.com',
      password: '123456', // Will be hashed by pre-save middleware
      role: 'admin',
      isVerified: true,
      adminPrograms: ['B.Tech', 'M.Tech', 'B.Pharma', 'MCA', 'MBA'], // Full admin access
      profile: {
        employeeId: 'ADMIN001',
        department: 'Administration'
      }
    });

    await adminUser.save();
    console.log('Admin user created successfully!');
    console.log('Name: Akshat Jain');
    console.log('Email: akshat980jain@gmail.com');
    console.log('Password: 123456');
    console.log('Role: admin');
    console.log('Admin Programs: B.Tech, M.Tech, B.Pharma, MCA, MBA');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createAdminUser(); 