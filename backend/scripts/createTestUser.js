const mongoose = require('mongoose');
const User = require('../models/User');
const Course = require('../models/Course');
const Book = require('../models/Book');
const Job = require('../models/Job');
const Fee = require('../models/Fee');
const Notification = require('../models/Notification');
require('dotenv').config();

async function createTestData() {
  try {
    // MongoDB URI - can be set from environment or fallback to the provided URI
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://akshat980jain:zm3aHd1m1a4pxU7q@cluster0.nkrpubg.mongodb.net/educonnect?retryWrites=true&w=majority&appName=Cluster0';
    
    // Debug: Check if MONGODB_URI is loaded
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI is not defined');
      console.error('Please check your .env file or update the fallback URI in the code');
      return;
    }
    
    console.log('🔗 Connecting to MongoDB...');
    console.log('📍 Database:', MONGODB_URI.split('@')[1]?.split('/')[0] || 'Unknown');
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Create Test Users
    console.log('Creating test users...');
    
    // Admin User
    await User.deleteOne({ email: 'admin@educonnect.com' });
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@educonnect.com',
      password: 'password',
      role: 'admin',
      isVerified: true,
      profile: {
        employeeId: 'AD2024001',
        phone: '9876543210'
      }
    });
    await adminUser.save();
    console.log('✅ Admin user created:', adminUser.email);

    // Faculty User
    await User.deleteOne({ email: 'faculty@educonnect.com' });
    const facultyUser = new User({
      name: 'John Faculty',
      email: 'faculty@educonnect.com',
      password: 'password',
      role: 'faculty',
      isVerified: true,
      profile: {
        employeeId: 'FC2024001',
        phone: '9876543211',
        department: 'Computer Science'
      }
    });
    await facultyUser.save();
    console.log('✅ Faculty user created:', facultyUser.email);

    // Student User
    await User.deleteOne({ email: 'student@educonnect.com' });
    const studentUser = new User({
      name: 'Jane Student',
      email: 'student@educonnect.com',
      password: 'password',
      role: 'student',
      isVerified: true,
      profile: {
        rollNumber: 'ST2024001',
        phone: '9876543212',
        department: 'Computer Science',
        semester: 6,
        cgpa: 8.5
      }
    });
    await studentUser.save();
    console.log('✅ Student user created:', studentUser.email);

    // Library Staff
    await User.deleteOne({ email: 'library@educonnect.com' });
    const libraryUser = new User({
      name: 'Library Staff',
      email: 'library@educonnect.com',
      password: 'password',
      role: 'library',
      isVerified: true,
      profile: {
        employeeId: 'LB2024001',
        phone: '9876543213'
      }
    });
    await libraryUser.save();
    console.log('✅ Library user created:', libraryUser.email);

    // Placement Officer
    await User.deleteOne({ email: 'placement@educonnect.com' });
    const placementUser = new User({
      name: 'Placement Officer',
      email: 'placement@educonnect.com',
      password: 'password',
      role: 'placement',
      isVerified: true,
      profile: {
        employeeId: 'PL2024001',
        phone: '9876543214'
      }
    });
    await placementUser.save();
    console.log('✅ Placement user created:', placementUser.email);

    // Akshat Jain (Admin)
    await User.deleteOne({ email: 'akshat980jain@gmail.com' });
    const akshatUser = new User({
      name: 'Akshat Jain',
      email: 'akshat980jain@gmail.com',
      password: 'Akshat@123',
      role: 'admin',
      isVerified: true,
      profile: {
        employeeId: 'AD2024002',
        phone: '9456609840'
      }
    });
    await akshatUser.save();
    console.log('✅ Akshat user created:', akshatUser.email);

    // Create Test Courses
    console.log('Creating test courses...');
    
    await Course.deleteOne({ code: 'CS101' });
    const course1 = new Course({
      name: 'Data Structures',
      code: 'CS101',
      description: 'Introduction to data structures and algorithms',
      credits: 4,
      semester: 'Odd',
      department: 'Computer Science',
      faculty: facultyUser._id,
      enrolledStudents: [studentUser._id],
      schedule: [
        { day: 'Monday', time: '9:00 AM', duration: 60, room: 'Room 301' },
        { day: 'Wednesday', time: '9:00 AM', duration: 60, room: 'Room 301' },
        { day: 'Friday', time: '9:00 AM', duration: 60, room: 'Room 301' }
      ]
    });
    await course1.save();
    console.log('✅ Course created:', course1.name);

    await Course.deleteOne({ code: 'CS102' });
    const course2 = new Course({
      name: 'Algorithms',
      code: 'CS102',
      description: 'Advanced algorithms and complexity analysis',
      credits: 3,
      semester: 'Even',
      department: 'Computer Science',
      faculty: facultyUser._id,
      enrolledStudents: [studentUser._id],
      schedule: [
        { day: 'Tuesday', time: '10:00 AM', duration: 60, room: 'Room 205' },
        { day: 'Thursday', time: '10:00 AM', duration: 60, room: 'Room 205' }
      ]
    });
    await course2.save();
    console.log('✅ Course created:', course2.name);

    // Create Test Books
    console.log('Creating test books...');
    
    await Book.deleteOne({ isbn: '978-0262033848' });
    const book1 = new Book({
      isbn: '978-0262033848',
      title: 'Introduction to Algorithms',
      author: 'Thomas H. Cormen',
      publisher: 'MIT Press',
      publishYear: 2009,
      category: 'Computer Science',
      description: 'Comprehensive guide to algorithms',
      totalCopies: 5,
      availableCopies: 3,
      location: 'CS Section - Shelf A1',
      price: 5000
    });
    await book1.save();
    console.log('✅ Book created:', book1.title);

    await Book.deleteOne({ isbn: '978-0134685991' });
    const book2 = new Book({
      isbn: '978-0134685991',
      title: 'Effective Java',
      author: 'Joshua Bloch',
      publisher: 'Addison-Wesley',
      publishYear: 2017,
      category: 'Programming',
      description: 'Best practices for Java programming',
      totalCopies: 4,
      availableCopies: 2,
      location: 'Programming Section - Shelf B2',
      price: 3500
    });
    await book2.save();
    console.log('✅ Book created:', book2.title);

    // Create Test Jobs
    console.log('Creating test jobs...');
    
    await Job.deleteOne({ company: 'Microsoft', position: 'Software Engineer' });
    const job1 = new Job({
      company: 'Microsoft',
      position: 'Software Engineer',
      description: 'Join Microsoft as a Software Engineer and work on cutting-edge technologies.',
      requirements: ['B.Tech/B.E in CS/IT', 'Strong programming skills', 'CGPA > 7.5'],
      package: { min: 1800000, max: 2200000 },
      location: 'Bangalore',
      type: 'full-time',
      deadline: new Date('2024-12-15'),
      eligibleDepartments: ['Computer Science', 'Information Technology'],
      minimumCGPA: 7.5,
      postedBy: placementUser._id
    });
    await job1.save();
    console.log('✅ Job created:', `${job1.company} - ${job1.position}`);

    await Job.deleteOne({ company: 'Google', position: 'Software Development Intern' });
    const job2 = new Job({
      company: 'Google',
      position: 'Software Development Intern',
      description: 'Summer internship program at Google with mentorship and real project experience.',
      requirements: ['B.Tech/B.E in CS/IT', 'Strong problem-solving skills', 'CGPA > 8.0'],
      package: { min: 80000, max: 80000 },
      location: 'Hyderabad',
      type: 'internship',
      deadline: new Date('2024-12-10'),
      eligibleDepartments: ['Computer Science', 'Information Technology'],
      minimumCGPA: 8.0,
      postedBy: placementUser._id
    });
    await job2.save();
    console.log('✅ Job created:', `${job2.company} - ${job2.position}`);

    // Create Test Fees
    console.log('Creating test fees...');
    
    await Fee.deleteOne({ student: studentUser._id, type: 'tuition' });
    const fee1 = new Fee({
      student: studentUser._id,
      type: 'tuition',
      amount: 45000,
      dueDate: new Date('2024-12-30'),
      status: 'pending',
      semester: 'Spring 2024',
      academicYear: '2024-25'
    });
    await fee1.save();
    console.log('✅ Fee created: Tuition fee (pending)');

    await Fee.deleteOne({ student: studentUser._id, type: 'library' });
    const fee2 = new Fee({
      student: studentUser._id,
      type: 'library',
      amount: 2000,
      dueDate: new Date('2024-08-15'),
      paidDate: new Date('2024-08-10'),
      status: 'paid',
      semester: 'Spring 2024',
      academicYear: '2024-25',
      paymentMethod: 'upi',
      transactionId: 'TXN123456789'
    });
    await fee2.save();
    console.log('✅ Fee created: Library fee (paid)');

    // Create Test Notifications
    console.log('Creating test notifications...');
    
    await Notification.deleteOne({ title: 'Fee Payment Due' });
    const notification1 = new Notification({
      title: 'Fee Payment Due',
      message: 'Your semester fee payment is due on December 30, 2024. Please pay to avoid late fees.',
      type: 'warning',
      category: 'finance',
      targetRoles: ['student'],
      createdBy: adminUser._id
    });
    await notification1.save();
    console.log('✅ Notification created:', notification1.title);

    await Notification.deleteOne({ title: 'New Assignment Posted' });
    const notification2 = new Notification({
      title: 'New Assignment Posted',
      message: 'Data Structures assignment has been posted. Due date: August 25, 2024.',
      type: 'info',
      category: 'academic',
      targetRoles: ['student'],
      createdBy: adminUser._id
    });
    await notification2.save();
    console.log('✅ Notification created:', notification2.title);

    await Notification.deleteOne({ title: 'System Maintenance' });
    const notification3 = new Notification({
      title: 'System Maintenance',
      message: 'Scheduled system maintenance on August 15, 2024 from 2:00 AM to 4:00 AM.',
      type: 'info',
      category: 'general',
      targetRoles: ['student', 'faculty', 'admin'],
      createdBy: adminUser._id
    });
    await notification3.save();
    console.log('✅ Notification created:', notification3.title);

    console.log('\n🎉 All test data created successfully!');
    console.log('\n📋 Demo Login Credentials:');
    console.log('Student: student@educonnect.com / password');
    console.log('Faculty: faculty@educonnect.com / password');
    console.log('Admin: admin@educonnect.com / password');
    console.log('Library: library@educonnect.com / password');
    console.log('Placement: placement@educonnect.com / password');
    console.log('Akshat: akshat980jain@gmail.com / Akshat@123');

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
  }
}

createTestData();