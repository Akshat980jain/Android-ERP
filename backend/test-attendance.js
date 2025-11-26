const mongoose = require('mongoose');
const Attendance = require('./models/Attendance');
const Course = require('./models/Course');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/erp_app', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testAttendanceSchema() {
  try {
    console.log('Testing new attendance schema...');
    
    // Create a test course with schedule
    const testCourse = new Course({
      name: 'Test Course',
      code: 'TEST101',
      department: 'Computer Science',
      credits: 3,
      faculty: new mongoose.Types.ObjectId(),
      students: [new mongoose.Types.ObjectId()],
      schedule: [
        {
          day: 'Monday',
          time: '09:00',
          room: 'Room 101'
        },
        {
          day: 'Wednesday',
          time: '14:00',
          room: 'Room 102'
        }
      ]
    });
    
    await testCourse.save();
    console.log('Test course created:', testCourse._id);
    
    // Create a test attendance record
    const testAttendance = new Attendance({
      student: new mongoose.Types.ObjectId(),
      course: testCourse._id,
      date: new Date('2024-01-15'), // Monday
      status: 'present',
      markedBy: new mongoose.Types.ObjectId(),
      remarks: 'Test attendance',
      scheduleSlot: {
        day: 'Monday',
        startTime: '09:00',
        endTime: '10:00',
        room: 'Room 101'
      },
      markedAt: new Date(),
      isWithinSchedule: true
    });
    
    await testAttendance.save();
    console.log('Test attendance record created:', testAttendance._id);
    
    // Test the pre-save middleware
    const testAttendance2 = new Attendance({
      student: new mongoose.Types.ObjectId(),
      course: testCourse._id,
      date: new Date('2024-01-17'), // Wednesday
      status: 'present',
      markedBy: new mongoose.Types.ObjectId(),
      remarks: 'Test attendance 2',
      scheduleSlot: {
        day: 'Wednesday',
        startTime: '14:00',
        endTime: '15:00',
        room: 'Room 102'
      },
      markedAt: new Date(),
      isWithinSchedule: true
    });
    
    await testAttendance2.save();
    console.log('Test attendance record 2 created:', testAttendance2._id);
    
    // Query attendance records
    const attendanceRecords = await Attendance.find({ course: testCourse._id })
      .populate('course', 'name code')
      .populate('student', 'name email');
    
    console.log('Attendance records found:', attendanceRecords.length);
    attendanceRecords.forEach(record => {
      console.log(`- ${record.status} on ${record.date.toDateString()} at ${record.scheduleSlot.startTime}`);
    });
    
    console.log('✅ Attendance schema test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing attendance schema:', error);
  } finally {
    mongoose.connection.close();
  }
}

testAttendanceSchema(); 