const mongoose = require('mongoose');
const path = require('path');
// Fix: Load .env from the backend root directory
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Course = require('../models/Course');
const Book = require('../models/Book');
const Job = require('../models/Job');
const Fee = require('../models/Fee');
const Notification = require('../models/Notification');

const connectDB = async () => {
  try {
    // MongoDB URI - can be set from environment or fallback to the provided URI
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://akshat980jain:zm3aHd1m1a4pxU7q@cluster0.nkrpubg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    
    // Debug: Check if MONGODB_URI is loaded
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI is not defined in environment variables');
      console.error('Please check your .env file in the backend directory');
      process.exit(1);
    }
    
    console.log('🔗 Connecting to MongoDB...');
    console.log('📍 Database:', MONGODB_URI.split('@')[1]?.split('/')[0] || 'Unknown');
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB Connected for seeding...');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
};

const seedUsers = async () => {
  try {
    const users = [
      {
        name: 'Admin User',
        email: 'admin@educonnect.com',
        password: 'password',
        role: 'admin',
        isVerified: true,
        profile: {
          employeeId: 'AD2024001',
          phone: '9876543210'
        }
      },
      {
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
      },
      {
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
      },
      {
        name: 'Library Staff',
        email: 'library@educonnect.com',
        password: 'password',
        role: 'library',
        isVerified: true,
        profile: {
          employeeId: 'LB2024001',
          phone: '9876543213'
        }
      },
      {
        name: 'Placement Officer',
        email: 'placement@educonnect.com',
        password: 'password',
        role: 'placement',
        isVerified: true,
        profile: {
          employeeId: 'PL2024001',
          phone: '9876543214'
        }
      },
      {
        name: 'Akshat Jain',
        email: 'akshat980jain@gmail.com',
        password: 'Akshat@123',
        role: 'admin',
        isVerified: true,
        profile: {
          employeeId: 'AD2024002',
          phone: '9456609840'
        }
      }
    ];

    // Hash passwords before insertMany
    for (const user of users) {
      user.password = await bcrypt.hash(user.password, 12);
    }

    await User.deleteMany({});
    const createdUsers = await User.insertMany(users);
    console.log('✅ Users seeded successfully');
    return createdUsers;
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  }
};

const seedCourses = async (users) => {
  try {
    const faculty = users.find(u => u.role === 'faculty');
    const student = users.find(u => u.role === 'student');

    // Handle case where faculty or student might not be found
    if (!faculty || !student) {
      console.warn('⚠️ Faculty or student not found, creating basic courses without assignments');
    }

    const courses = [
      {
        name: 'Data Structures',
        code: 'CS101',
        description: 'Introduction to data structures and algorithms',
        credits: 4,
        semester: 'Odd',
        department: 'Computer Science',
        faculty: faculty?._id,
        enrolledStudents: student ? [student._id] : [],
        schedule: [
          { day: 'Monday', time: '9:00 AM', duration: 60, room: 'Room 301' },
          { day: 'Wednesday', time: '9:00 AM', duration: 60, room: 'Room 301' },
          { day: 'Friday', time: '9:00 AM', duration: 60, room: 'Room 301' }
        ]
      },
      {
        name: 'Algorithms',
        code: 'CS102',
        description: 'Advanced algorithms and complexity analysis',
        credits: 3,
        semester: 'Even',
        department: 'Computer Science',
        faculty: faculty?._id,
        enrolledStudents: student ? [student._id] : [],
        schedule: [
          { day: 'Tuesday', time: '10:00 AM', duration: 60, room: 'Room 205' },
          { day: 'Thursday', time: '10:00 AM', duration: 60, room: 'Room 205' }
        ]
      }
    ];

    await Course.deleteMany({});
    const createdCourses = await Course.insertMany(courses);
    console.log('✅ Courses seeded successfully');
    return createdCourses;
  } catch (error) {
    console.error('❌ Error seeding courses:', error);
    throw error;
  }
};

const seedBooks = async () => {
  try {
    const books = [
      {
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
      },
      {
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
      }
    ];

    await Book.deleteMany({});
    await Book.insertMany(books);
    console.log('✅ Books seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding books:', error);
    throw error;
  }
};

const seedJobs = async (users) => {
  try {
    const placementOfficer = users.find(u => u.role === 'placement');

    if (!placementOfficer) {
      console.warn('⚠️ Placement officer not found, skipping job seeding');
      return;
    }

    const jobs = [
      {
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
        postedBy: placementOfficer._id
      },
      {
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
        postedBy: placementOfficer._id
      }
    ];

    await Job.deleteMany({});
    await Job.insertMany(jobs);
    console.log('✅ Jobs seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding jobs:', error);
    throw error;
  }
};

const seedFees = async (users) => {
  try {
    const student = users.find(u => u.role === 'student');

    if (!student) {
      console.warn('⚠️ Student not found, skipping fee seeding');
      return;
    }

    const fees = [
      {
        student: student._id,
        type: 'tuition',
        amount: 45000,
        dueDate: new Date('2024-12-30'),
        status: 'pending',
        semester: 'Spring 2024',
        academicYear: '2024-25'
      },
      {
        student: student._id,
        type: 'library',
        amount: 2000,
        dueDate: new Date('2024-08-15'),
        paidDate: new Date('2024-08-10'),
        status: 'paid',
        semester: 'Spring 2024',
        academicYear: '2024-25',
        paymentMethod: 'upi',
        transactionId: 'TXN123456789'
      }
    ];

    await Fee.deleteMany({});
    await Fee.insertMany(fees);
    console.log('✅ Fees seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding fees:', error);
    throw error;
  }
};

const seedNotifications = async (users) => {
  try {
    const admin = users.find(u => u.role === 'admin');

    if (!admin) {
      console.warn('⚠️ Admin not found, skipping notification seeding');
      return;
    }

    const notifications = [
      {
        title: 'Fee Payment Due',
        message: 'Your semester fee payment is due on December 30, 2024. Please pay to avoid late fees.',
        type: 'warning',
        category: 'finance',
        targetRoles: ['student'],
        createdBy: admin._id
      },
      {
        title: 'New Assignment Posted',
        message: 'Data Structures assignment has been posted. Due date: August 25, 2024.',
        type: 'info',
        category: 'academic',
        targetRoles: ['student'],
        createdBy: admin._id
      },
      {
        title: 'System Maintenance',
        message: 'Scheduled system maintenance on August 15, 2024 from 2:00 AM to 4:00 AM.',
        type: 'info',
        category: 'general',
        targetRoles: ['student', 'faculty', 'admin'],
        createdBy: admin._id
      }
    ];

    await Notification.deleteMany({});
    await Notification.insertMany(notifications);
    console.log('✅ Notifications seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding notifications:', error);
    throw error;
  }
};

const seedDatabase = async () => {
  try {
    await connectDB();
    
    console.log('🌱 Starting database seeding...');
    
    const users = await seedUsers();
    await seedCourses(users);
    await seedBooks();
    await seedJobs(users);
    await seedFees(users);
    await seedNotifications(users);
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Demo Login Credentials:');
    console.log('Student: student@educonnect.com / password');
    console.log('Faculty: faculty@educonnect.com / password');
    console.log('Admin: admin@educonnect.com / password');
    console.log('Library: library@educonnect.com / password');
    console.log('Placement: placement@educonnect.com / password');
    console.log('Akshat: akshat980jain@gmail.com / Akshat@123');
    
    await mongoose.disconnect();
    console.log('🔌 Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

seedDatabase();