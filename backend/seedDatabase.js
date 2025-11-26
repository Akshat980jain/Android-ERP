const mongoose = require('mongoose');
require('dotenv').config();

// Import all models
const User = require('./models/User');
const Course = require('./models/Course');
const Subject = require('./models/Subject');
const Book = require('./models/Book');
const Job = require('./models/Job');
const Fee = require('./models/Fee');
const Notification = require('./models/Notification');
const Attendance = require('./models/Attendance');
const Marks = require('./models/Marks');
const RoleRequest = require('./models/RoleRequest');
const StudentService = require('./models/StudentService');
const AcademicCalendar = require('./models/AcademicCalendar');
const Curriculum = require('./models/Curriculum');
const Faculty = require('./models/Faculty');
const Enrollment = require('./models/Enrollment');
const Result = require('./models/Result');
const JobApplication = require('./models/JobApplication');
const BookIssue = require('./models/BookIssue');

async function seedDatabase() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('\nClearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Course.deleteMany({}),
      Subject.deleteMany({}),
      Book.deleteMany({}),
      Job.deleteMany({}),
      Fee.deleteMany({}),
      Notification.deleteMany({}),
      Attendance.deleteMany({}),
      Marks.deleteMany({}),
      RoleRequest.deleteMany({}),
      StudentService.deleteMany({}),
      AcademicCalendar.deleteMany({}),
      Curriculum.deleteMany({}),
      Faculty.deleteMany({}),
      Enrollment.deleteMany({}),
      Result.deleteMany({}),
      JobApplication.deleteMany({}),
      BookIssue.deleteMany({})
    ]);
    console.log('Existing data cleared');

    // Create Admin User
    console.log('\nCreating admin user...');
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@erp.com',
      password: 'admin123',
      role: 'admin',
      isVerified: true,
      profile: {
        course: 'Administration',
        branch: 'IT',
        phone: '9876543210',
        address: 'Admin Address',
        employeeId: 'ADM001'
      }
    });
    console.log('Admin user created:', adminUser.email);

    // Create Faculty Users
    console.log('\nCreating faculty users...');
    const faculty1 = await User.create({
      name: 'Dr. John Smith',
      email: 'john.smith@erp.com',
      password: 'faculty123',
      role: 'faculty',
      isVerified: true,
      profile: {
        course: 'B.Tech',
        branch: 'Computer Science',
        phone: '9876543211',
        address: 'Faculty Address 1',
        employeeId: 'FAC001'
      }
    });

    const faculty2 = await User.create({
      name: 'Prof. Sarah Johnson',
      email: 'sarah.johnson@erp.com',
      password: 'faculty123',
      role: 'faculty',
      isVerified: true,
      profile: {
        course: 'B.Tech',
        branch: 'Information Technology',
        phone: '9876543212',
        address: 'Faculty Address 2',
        employeeId: 'FAC002'
      }
    });
    console.log('Faculty users created');

    // Create Student Users
    console.log('\nCreating student users...');
    const student1 = await User.create({
      name: 'Alice Johnson',
      email: 'alice.johnson@erp.com',
      password: 'student123',
      role: 'student',
      isVerified: true,
      profile: {
        course: 'B.Tech',
        branch: 'Computer Science',
        phone: '9876543213',
        address: 'Student Address 1',
        studentId: 'STU001',
        semester: '3rd',
        section: 'A'
      }
    });

    const student2 = await User.create({
      name: 'Bob Wilson',
      email: 'bob.wilson@erp.com',
      password: 'student123',
      role: 'student',
      isVerified: true,
      profile: {
        course: 'B.Tech',
        branch: 'Information Technology',
        phone: '9876543214',
        address: 'Student Address 2',
        studentId: 'STU002',
        semester: '5th',
        section: 'B'
      }
    });
    console.log('Student users created');

    // Create Subjects
    console.log('\nCreating subjects...');
    const subject1 = await Subject.create({
      subjectCode: 'CS301',
      subjectName: 'Data Structures',
      subjectType: 'Core',
      credits: 4,
      contactHours: {
        theory: 3,
        practical: 2,
        tutorial: 1,
        totalHours: 6
      },
      department: 'Computer Science',
      applicableCourses: ['B.Tech'],
      description: 'Advanced data structures and algorithms'
    });

    const subject2 = await Subject.create({
      subjectCode: 'IT401',
      subjectName: 'Web Development',
      subjectType: 'Core',
      credits: 3,
      contactHours: {
        theory: 2,
        practical: 2,
        tutorial: 0,
        totalHours: 4
      },
      department: 'Information Technology',
      applicableCourses: ['B.Tech'],
      description: 'Modern web development technologies'
    });
    console.log('Subjects created');

    // Create Courses
    console.log('\nCreating courses...');
    const course1 = await Course.create({
      name: 'Data Structures and Algorithms',
      code: 'CS301',
      department: 'Computer Science',
      credits: 4,
      faculty: faculty1._id,
      students: [student1._id],
      schedule: [
        { day: 'Monday', time: '09:00-10:00', room: 'Lab 101' },
        { day: 'Wednesday', time: '10:00-11:00', room: 'Lab 101' }
      ],
      description: 'Advanced data structures course',
      semester: 'Odd',
      year: 2024
    });

    const course2 = await Course.create({
      name: 'Web Development',
      code: 'IT401',
      department: 'Information Technology',
      credits: 3,
      faculty: faculty2._id,
      students: [student2._id],
      schedule: [
        { day: 'Tuesday', time: '14:00-15:00', room: 'Lab 102' },
        { day: 'Thursday', time: '15:00-16:00', room: 'Lab 102' }
      ],
      description: 'Modern web development course',
      semester: 'Odd',
      year: 2024
    });
    console.log('Courses created');

    // Create Books
    console.log('\nCreating books...');
    const book1 = await Book.create({
      isbn: '9780132350884',
      title: 'Clean Code',
      author: 'Robert C. Martin',
      publisher: 'Prentice Hall',
      publishYear: 2008,
      category: 'Programming',
      description: 'A handbook of agile software craftsmanship',
      totalCopies: 5,
      availableCopies: 3,
      location: 'Shelf A1',
      price: 45.99,
      language: 'English'
    });

    const book2 = await Book.create({
      isbn: '9780201633610',
      title: 'Design Patterns',
      author: 'Erich Gamma',
      publisher: 'Addison-Wesley',
      publishYear: 1994,
      category: 'Software Design',
      description: 'Elements of reusable object-oriented software',
      totalCopies: 3,
      availableCopies: 2,
      location: 'Shelf A2',
      price: 54.99,
      language: 'English'
    });
    console.log('Books created');

    // Create Jobs
    console.log('\nCreating jobs...');
    const job1 = await Job.create({
      company: 'Tech Corp',
      position: 'Software Engineer',
      description: 'Full-stack development role',
      requirements: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
      package: { min: 600000, max: 1200000, currency: 'INR' },
      location: 'Bangalore',
      type: 'full-time',
      deadline: new Date('2024-12-31'),
      eligibleDepartments: ['Computer Science', 'Information Technology'],
      minimumCGPA: 7.5,
      postedBy: adminUser._id
    });

    const job2 = await Job.create({
      company: 'Startup Inc',
      position: 'Frontend Developer',
      description: 'React and Vue.js development',
      requirements: ['React', 'Vue.js', 'CSS', 'JavaScript'],
      package: { min: 400000, max: 800000, currency: 'INR' },
      location: 'Mumbai',
      type: 'full-time',
      deadline: new Date('2024-11-30'),
      eligibleDepartments: ['Computer Science', 'Information Technology'],
      minimumCGPA: 7.0,
      postedBy: adminUser._id
    });
    console.log('Jobs created');

    // Create Fees
    console.log('\nCreating fees...');
    const fee1 = await Fee.create({
      student: student1._id,
      type: 'tuition',
      amount: 50000,
      dueDate: new Date('2024-12-31'),
      status: 'pending',
      academicYear: '2024-2025',
      semester: '3rd'
    });

    const fee2 = await Fee.create({
      student: student2._id,
      type: 'hostel',
      amount: 25000,
      dueDate: new Date('2024-12-31'),
      status: 'paid',
      academicYear: '2024-2025',
      semester: '5th'
    });
    console.log('Fees created');

    // Create Notifications
    console.log('\nCreating notifications...');
    await Notification.create({
      title: 'Welcome to ERP System',
      message: 'Welcome to the new ERP system. Please explore all features.',
      type: 'info',
      category: 'general',
      targetUsers: [student1._id, student2._id],
      createdBy: adminUser._id
    });

    await Notification.create({
      title: 'Exam Schedule Updated',
      message: 'The exam schedule for semester 3 has been updated.',
      type: 'warning',
      category: 'academic',
      targetUsers: [student1._id],
      createdBy: faculty1._id
    });
    console.log('Notifications created');

    // Create Attendance
    console.log('\nCreating attendance records...');
    await Attendance.create({
      student: student1._id,
      course: course1._id,
      date: new Date(),
      status: 'present',
      markedBy: faculty1._id,
      scheduleSlot: {
        day: 'Monday',
        startTime: '09:00',
        endTime: '10:00',
        room: 'Lab 101'
      }
    });

    await Attendance.create({
      student: student2._id,
      course: course2._id,
      date: new Date(),
      status: 'present',
      markedBy: faculty2._id,
      scheduleSlot: {
        day: 'Tuesday',
        startTime: '14:00',
        endTime: '15:00',
        room: 'Lab 102'
      }
    });
    console.log('Attendance records created');

    // Create Marks
    console.log('\nCreating marks...');
    await Marks.create({
      student: student1._id,
      course: course1._id,
      type: 'internal',
      title: 'Data Structures Internal Assessment',
      marksObtained: 85,
      totalMarks: 100,
      examDate: new Date(),
      uploadedBy: faculty1._id,
      remarks: 'Good performance in internal assessment'
    });

    await Marks.create({
      student: student2._id,
      course: course2._id,
      type: 'external',
      title: 'Web Development Final Exam',
      marksObtained: 82,
      totalMarks: 100,
      examDate: new Date(),
      uploadedBy: faculty2._id,
      remarks: 'Satisfactory performance in final exam'
    });
    console.log('Marks created');

    // Create Role Requests
    console.log('\nCreating role requests...');
    await RoleRequest.create({
      name: 'New Faculty Member',
      email: 'new.faculty@erp.com',
      password: 'newfaculty123',
      requestedRole: 'faculty',
      currentRole: 'none',
      reason: 'New faculty member registration',
      status: 'pending',
      program: 'B.Tech'
    });
    console.log('Role requests created');

    // Create Student Services
    console.log('\nCreating student services...');
    await StudentService.create({
      student: student1._id,
      type: 'bonafide',
      reason: 'Request for bonafide certificate',
      status: 'pending',
      requestDate: new Date()
    });
    console.log('Student services created');

    // Create Academic Calendar
    console.log('\nCreating academic calendar...');
    await AcademicCalendar.create({
      academicYear: '2024-2025',
      semesters: [
        {
          semesterNumber: 1,
          semesterType: 'Odd',
          startDate: new Date('2024-08-01'),
          endDate: new Date('2024-12-31'),
          importantDates: [
            {
              event: 'Mid Semester Exams',
              startDate: new Date('2024-10-15'),
              endDate: new Date('2024-10-20'),
              description: 'Mid semester examination period',
              applicableCourses: ['B.Tech']
            }
          ],
          examSchedule: {
            midTermExams: {
              startDate: new Date('2024-10-15'),
              endDate: new Date('2024-10-20')
            },
            endSemExams: {
              startDate: new Date('2024-12-15'),
              endDate: new Date('2024-12-25')
            },
            practicalExams: {
              startDate: new Date('2024-12-10'),
              endDate: new Date('2024-12-14')
            },
            supplementaryExams: {
              startDate: new Date('2025-01-15'),
              endDate: new Date('2025-01-25')
            }
          },
          workingDays: 90
        }
      ]
    });
    console.log('Academic calendar created');

    // Create Curriculum
    console.log('\nCreating curriculum...');
    await Curriculum.create({
      courseId: course1._id,
      specialization: 'Computer Science',
      academicYear: '2024-2025',
      curriculumVersion: '2024',
      semesters: [
        {
          semesterNumber: 3,
          subjects: [
            {
              subjectId: subject1._id,
              subjectCode: 'CS301',
              subjectName: 'Data Structures',
              credits: 4,
              subjectType: 'Core',
              isElective: false,
              isMandatory: true
            }
          ],
          semesterCredits: 4,
          minimumCreditsRequired: 4
        }
      ],
      totalCredits: 160,
      minimumCreditsForGraduation: 160
    });
    console.log('Curriculum created');

    // Create Faculty Profile
    console.log('\nCreating faculty profiles...');
    await Faculty.create({
      employeeId: 'FAC001',
      personalInfo: {
        title: 'Dr.',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@erp.com',
        phone: '9876543211',
        dateOfBirth: new Date('1980-05-15'),
        gender: 'Male'
      },
      professionalInfo: {
        designation: 'Assistant Professor',
        department: 'Computer Science',
        joiningDate: new Date('2020-08-01'),
        employmentType: 'Permanent',
        currentSalary: 80000,
        qualifications: [
          {
            degree: 'Ph.D.',
            specialization: 'Computer Science',
            university: 'IIT Delhi',
            yearOfCompletion: 2018,
            percentage: 85
          }
        ],
        experience: {
          totalExperience: 8,
          teachingExperience: 6,
          industryExperience: 2
        },
        expertise: ['Data Structures', 'Algorithms', 'Database Systems']
      }
    });
    console.log('Faculty profiles created');

    // Create Enrollments
    console.log('\nCreating enrollments...');
    await Enrollment.create({
      studentId: student1._id,
      subjectId: subject1._id,
      courseId: course1._id,
      semesterNumber: 3,
      academicYear: '2024-2025',
      enrollmentType: 'Regular',
      enrollmentStatus: 'Active',
      attendance: {
        totalClassesConducted: 30,
        classesAttended: 28,
        attendancePercentage: 93.33,
        attendanceStatus: 'Good',
        minimumRequired: 75
      },
      facultyAssigned: {
        theoryFaculty: faculty1._id,
        labFaculty: faculty1._id
      }
    });
    console.log('Enrollments created');

    // Create Results
    console.log('\nCreating results...');
    await Result.create({
      studentId: student1._id,
      courseId: course1._id,
      specialization: 'Computer Science',
      semesterNumber: 3,
      academicYear: '2024-2025',
      subjects: [
        {
          subjectId: subject1._id,
          subjectCode: 'CS301',
          subjectName: 'Data Structures',
          subjectType: 'Core',
          credits: 4,
          internalMarks: 85,
          practicalMarks: 90,
          endSemMarks: 88,
          totalMarks: 263,
          maxMarks: 300,
          percentage: 87.67,
          grade: 'A',
          gradePoints: 8.5,
          result: 'Pass'
        }
      ],
      semesterPerformance: {
        totalCreditsRegistered: 4,
        creditsEarned: 4,
        totalGradePoints: 34,
        semesterGPA: 8.5,
        semesterPercentage: 87.67,
        semesterResult: 'Pass'
      }
    });
    console.log('Results created');

    // Create Job Applications
    console.log('\nCreating job applications...');
    await JobApplication.create({
      job: job1._id,
      student: student1._id,
      resume: 'resume_alice_johnson.pdf',
      coverLetter: 'I am interested in the software engineer position...',
      status: 'applied',
      appliedDate: new Date()
    });
    console.log('Job applications created');

    // Create Book Issues
    console.log('\nCreating book issues...');
    await BookIssue.create({
      book: book1._id,
      student: student1._id,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      status: 'issued',
      issuedBy: adminUser._id
    });
    console.log('Book issues created');

    console.log('\n=== DATABASE SEEDING COMPLETED ===');
    console.log('All collections have been created with sample data!');
    
    // List all collections
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('\n=== CREATED COLLECTIONS ===');
    collections.forEach((collection, index) => {
      console.log(`${index + 1}. ${collection.name}`);
    });
    console.log(`\nTotal collections: ${collections.length}`);

    // Close connection
    await mongoose.connection.close();
    console.log('\nConnection closed');

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase(); 