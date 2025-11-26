const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function recreateAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your-app-name');
    console.log('Connected to MongoDB');

    // Delete existing admin user
    const deletedUser = await User.findOneAndDelete({ email: 'akshat980jain@gmail.com' });
    if (deletedUser) {
      console.log('Deleted existing admin user');
    }

    // Create new admin user (password will be hashed by middleware)
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
    console.log('Admin user recreated successfully!');
    console.log('Name: Akshat Jain');
    console.log('Email: akshat980jain@gmail.com');
    console.log('Password: 123456');
    console.log('Role: admin');
    console.log('Admin Programs: B.Tech, M.Tech, B.Pharma, MCA, MBA');

  } catch (error) {
    console.error('Error recreating admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

recreateAdminUser(); 