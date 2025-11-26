const mongoose = require('mongoose');
const User = require('./models/User');

async function addMissingUser() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect('mongodb+srv://akshat980jain:gg81I8BnmGzUSl6P@cluster0.gtqycfa.mongodb.net/erp?retryWrites=true&w=majority&appName=Cluster0');
    console.log('Connected to MongoDB Atlas');

    // Check if user already exists
    const existingUser = await User.findOne({ email: 'student@educonnect.com' });
    
    if (existingUser) {
      console.log('User already exists:', existingUser.email);
      console.log('User details:', {
        name: existingUser.name,
        role: existingUser.role,
        isVerified: existingUser.isVerified
      });
    } else {
      // Create the missing user
      console.log('Creating missing user...');
      const newUser = await User.create({
        name: 'Test Student',
        email: 'student@educonnect.com',
        password: 'password',
        role: 'student',
        isVerified: true, // Set to true so they can login
        profile: {
          course: 'B.Tech',
          branch: 'Computer Science',
          phone: '9876543215',
          address: 'Test Student Address',
          studentId: 'STU003',
          semester: '3rd',
          section: 'A'
        }
      });
      console.log('User created successfully:', newUser.email);
    }

    // List all users
    console.log('\n=== ALL USERS IN DATABASE ===');
    const allUsers = await User.find({}, 'name email role isVerified');
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role} - Verified: ${user.isVerified}`);
    });

    // Close connection
    await mongoose.connection.close();
    console.log('\nConnection closed');

  } catch (error) {
    console.error('Error:', error);
  }
}

addMissingUser(); 

async function addAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://akshat980jain:gg81I8BnmGzUSl6P@cluster0.gtqycfa.mongodb.net/erp?retryWrites=true&w=majority&appName=Cluster0');
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: 'akshat980jain@gmail.com' });
    if (existingUser) {
      console.log('User already exists:', existingUser.email);
      return;
    }

    // Create the admin user
    const newUser = await User.create({
      name: 'Akshat Jain',
      email: 'akshat980jain@gmail.com',
      password: '123456',
      role: 'admin',
      isVerified: true,
      profile: {
        course: 'Administration',
        branch: 'IT',
        phone: '9876543210',
        address: 'Admin Address',
        employeeId: 'ADM002'
      },
      adminPrograms: []
    });
    console.log('Admin user created successfully:', newUser.email);
    await mongoose.connection.close();
    console.log('Connection closed');
  } catch (error) {
    console.error('Error:', error);
  }
}

addAdminUser(); 