const mongoose = require('mongoose');
const User = require('./models/User');

// Test script for new features
async function testNewFeatures() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect('mongodb+srv://akshat980jain:zm3aHd1m1a4pxU7q@cluster0.nkrpubg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
    console.log('✅ Connected to MongoDB');

    // Test 1: Check if departments endpoint would work
    console.log('\n📊 Testing Departments Endpoint...');
    try {
      const departments = await User.distinct('department', { role: 'student' });
      console.log('✅ Departments found:', departments);
    } catch (error) {
      console.log('❌ Error getting departments:', error.message);
    }

    // Test 2: Check if we have enough data for reports
    console.log('\n📈 Testing Reports Data...');
    try {
      const studentCount = await User.countDocuments({ role: 'student' });
      const facultyCount = await User.countDocuments({ role: 'faculty' });
      const adminCount = await User.countDocuments({ role: 'admin' });
      
      console.log('✅ User counts:');
      console.log(`   Students: ${studentCount}`);
      console.log(`   Faculty: ${facultyCount}`);
      console.log(`   Admins: ${adminCount}`);
    } catch (error) {
      console.log('❌ Error counting users:', error.message);
    }

    // Test 3: Check if we have the required models
    console.log('\n🏗️  Testing Required Models...');
    try {
      const models = ['Course', 'Attendance', 'Marks', 'Fee', 'Assignment', 'Exam'];
      for (const modelName of models) {
        try {
          const Model = require(`./models/${modelName}`);
          const count = await Model.countDocuments();
          console.log(`✅ ${modelName}: ${count} documents`);
        } catch (error) {
          console.log(`❌ ${modelName}: ${error.message}`);
        }
      }
    } catch (error) {
      console.log('❌ Error checking models:', error.message);
    }

    console.log('\n🎉 New Features Test Complete!');
    console.log('\n📝 Next Steps:');
    console.log('1. Start the backend server: npm start');
    console.log('2. Start the frontend: cd frontend && npm run dev');
    console.log('3. Test the new Reports and Settings modules');
    console.log('4. Check the admin dashboard for new features');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

// Run the test
testNewFeatures();
