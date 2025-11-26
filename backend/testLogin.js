const mongoose = require('mongoose');
const User = require('./models/User');

async function testLogin() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect('mongodb+srv://akshat980jain:gg81I8BnmGzUSl6P@cluster0.gtqycfa.mongodb.net/erp?retryWrites=true&w=majority&appName=Cluster0');
    console.log('Connected to MongoDB Atlas');

    // Test login with the user
    const email = 'student@educonnect.com';
    const password = 'password';

    console.log(`\nTesting login for: ${email}`);

    // Find user by email (case-insensitive) and include password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      console.log('❌ User not found for email:', email);
      return;
    }

    console.log('✅ User found:', {
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      hasPassword: !!user.password
    });

    // Check if user is verified
    if (!user.isVerified) {
      console.log('❌ User not verified:', email);
      return;
    }

    console.log('✅ User is verified');

    // Compare password using the model method
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('❌ Password mismatch for user:', email);
      return;
    }

    console.log('✅ Password match successful');
    console.log('✅ Login test passed!');

    // Close connection
    await mongoose.connection.close();
    console.log('\nConnection closed');

  } catch (error) {
    console.error('Error:', error);
  }
}

testLogin(); 