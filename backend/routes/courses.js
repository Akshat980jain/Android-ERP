// routes/courses.js
const express = require('express');
const router = express.Router();
const Course = require('../models/Course'); // Adjust path as needed
const User = require('../models/User'); // Adjust path as needed
const { auth } = require('../middleware/auth'); // Adjust path as needed

// GET all courses (Admin access or filtered by role)
router.get('/', auth, async (req, res) => {
  try {
    console.log('GET /courses - User:', { id: req.user._id, role: req.user.role, email: req.user.email });
    
    let courses;
    
    switch (req.user.role) {
      case 'admin':
        // Admin can see all courses
        console.log('Fetching all courses for admin');
        courses = await Course.find()
          .populate('faculty', 'name email')
          .populate('students', 'name email');
        break;
      case 'faculty':
        // Faculty can see courses they teach
        console.log('Fetching courses for faculty:', req.user._id);
        courses = await Course.find({ faculty: req.user._id })
          .populate('faculty', 'name email')
          .populate('students', 'name email');
        break;
      case 'student':
        // Students can see courses they're enrolled in
        console.log('Fetching enrolled courses for student:', req.user._id);
        courses = await Course.find({ students: req.user._id })
          .populate('faculty', 'name email');
        break;
      default:
        console.log('Unknown role:', req.user.role);
        courses = [];
    }
    
    console.log(`Found ${courses.length} courses for user ${req.user.role}`);
    res.json({ success: true, courses });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch courses', error: error.message });
  }
});

// GET courses for faculty
router.get('/faculty-courses', auth, async (req, res) => {
  try {
    if (req.user.role !== 'faculty' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const courses = await Course.find({ faculty: req.user._id })
      .populate('faculty', 'name email')
      .populate('students', 'name email rollNumber');
    
    res.json({ success: true, courses });
  } catch (error) {
    console.error('Error fetching faculty courses:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch faculty courses', error: error.message });
  }
});

// GET courses for students (enrolled courses)
router.get('/my-courses', auth, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const courses = await Course.find({ students: req.user._id })
      .populate('faculty', 'name email')
      .select('-students'); // Don't send all student data to individual student
    
    res.json({ success: true, courses });
  } catch (error) {
    console.error('Error fetching student courses:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch student courses', error: error.message });
  }
});

// GET single course by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('faculty', 'name email')
      .populate('students', 'name email rollNumber');
    
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    // Check if user has access to this course
    const hasAccess = 
      req.user.role === 'admin' ||
      course.faculty._id.toString() === req.user._id ||
      course.students.some(student => student._id.toString() === req.user._id);
    
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    res.json({ success: true, course });
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch course', error: error.message });
  }
});

// POST create new course (Faculty and Admin only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'faculty' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const {
      name,
      code,
      department,
      credits,
      schedule,
      description,
      semester,
      year,
      maxStudents
    } = req.body;
    
    // Validate required fields
    if (!name || !code || !department || !credits) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, code, department, and credits are required' 
      });
    }
    
    // Check if course code already exists
    const existingCourse = await Course.findOne({ code });
    if (existingCourse) {
      return res.status(400).json({ 
        success: false, 
        message: 'Course code already exists' 
      });
    }
    
    const course = new Course({
      name,
      code: code.toUpperCase(),
      department,
      credits,
      faculty: req.user._id,
      schedule: schedule || [],
      description: description || '',
      semester: semester || '',
      year: year || new Date().getFullYear(),
      maxStudents: maxStudents || 50,
      students: [],
      status: 'active'
    });
    
    await course.save();
    
    // Populate faculty info before sending response
    await course.populate('faculty', 'name email');
    
    res.status(201).json({ success: true, course });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ success: false, message: 'Failed to create course', error: error.message });
  }
});

// PUT update course (Faculty who owns it, Admin, or Program Admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    // Debug logging
    console.log('UPDATE Course - User:', {
      userId: req.user._id,
      userRole: req.user.role,
      courseFaculty: course.faculty.toString(),
      courseId: course._id
    });
    
    // Allow if admin, course faculty, or any faculty (for testing)
    const isAdmin = req.user.role === 'admin';
    const isCourseFaculty = course.faculty.toString() === req.user._id.toString();
    const isAnyFaculty = req.user.role === 'faculty';
    const adminPrograms = Array.isArray(req.user.adminPrograms) ? req.user.adminPrograms : [];
    const courseProgram = course.program || course.department;
    const isProgramAdmin = isAdmin && adminPrograms.some(p => p === course.department || p === courseProgram);
    
    console.log('Authorization check:', {
      isAdmin,
      isCourseFaculty,
      isAnyFaculty,
      isProgramAdmin,
      allowed: isAdmin || isCourseFaculty || isAnyFaculty || isProgramAdmin
    });
    
    if (!(isAdmin || isCourseFaculty || isAnyFaculty || isProgramAdmin)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const {
      name,
      code,
      department,
      credits,
      schedule,
      description,
      semester,
      year,
      maxStudents
    } = req.body;
    
    // Check if new code conflicts with existing courses (excluding current course)
    if (code && code !== course.code) {
      const existingCourse = await Course.findOne({ 
        code: code.toUpperCase(), 
        _id: { $ne: req.params.id } 
      });
      if (existingCourse) {
        return res.status(400).json({ 
          success: false, 
          message: 'Course code already exists' 
        });
      }
    }
    
    // Update course fields
    if (name) course.name = name;
    if (code) course.code = code.toUpperCase();
    if (department) course.department = department;
    if (credits) course.credits = credits;
    if (schedule) course.schedule = schedule;
    if (description !== undefined) course.description = description;
    if (semester) course.semester = semester;
    if (year) course.year = year;
    if (maxStudents) course.maxStudents = maxStudents;
    
    await course.save();
    
    // Populate faculty info before sending response
    await course.populate('faculty', 'name email');
    
    res.json({ success: true, course });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ success: false, message: 'Failed to update course', error: error.message });
  }
});

// DELETE course (Faculty who owns it, Admin, or Program Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    // Debug logging
    console.log('DELETE Course - User:', {
      userId: req.user._id,
      userRole: req.user.role,
      courseFaculty: course.faculty.toString(),
      courseId: course._id,
      enrolledStudents: course.students?.length || 0
    });
    
    // Allow if admin, course faculty, or any faculty (for testing)
    const isAdmin = req.user.role === 'admin';
    const isCourseFaculty = course.faculty.toString() === req.user._id.toString();
    const isAnyFaculty = req.user.role === 'faculty';
    const adminPrograms = Array.isArray(req.user.adminPrograms) ? req.user.adminPrograms : [];
    const courseProgram = course.program || course.department;
    const isProgramAdmin = isAdmin && adminPrograms.some(p => p === course.department || p === courseProgram);
    
    console.log('Authorization check:', {
      isAdmin,
      isCourseFaculty,
      isAnyFaculty,
      isProgramAdmin,
      allowed: isAdmin || isCourseFaculty || isAnyFaculty || isProgramAdmin
    });
    
    if (!(isAdmin || isCourseFaculty || isAnyFaculty || isProgramAdmin)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    // Check if course has enrolled students - only prevent deletion for non-faculty users
    if (course.students && course.students.length > 0 && !isAnyFaculty && !isCourseFaculty) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete course with enrolled students' 
      });
    }
    
    // If faculty is deleting and there are enrolled students, log it but allow deletion
    if (course.students && course.students.length > 0 && (isAnyFaculty || isCourseFaculty)) {
      console.log(`Faculty ${req.user._id} is deleting course ${course._id} with ${course.students.length} enrolled students`);
    }
    
    await Course.findByIdAndDelete(req.params.id);
    
    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ success: false, message: 'Failed to delete course', error: error.message });
  }
});

  // POST enroll student in course
  router.post('/:id/enroll', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    const isAdmin = req.user.role === 'admin';
    const isStudent = req.user.role === 'student';
    const isFaculty = req.user.role === 'faculty' && course.faculty.toString() === req.user._id.toString();
    if (!(isAdmin || isStudent || isFaculty)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const studentId = req.body.studentId || req.user._id;
    
    // Check if student is already enrolled in this specific course
    if (course.students.some(id => id.toString() === studentId.toString())) {
      return res.status(200).json({ 
        success: true,
        message: `Student is already enrolled in ${course.name} (${course.code})`,
        alreadyEnrolled: true
      });
    }
    
    // Check if course is full
    if (course.maxStudents && course.students.length >= course.maxStudents) {
      return res.status(400).json({ 
        success: false, 
        message: `Course ${course.name} is full (${course.students.length}/${course.maxStudents} students)`,
        courseFull: true
      });
    }
    
    course.students.push(studentId);
    await course.save();
    
    res.json({ 
      success: true, 
      message: `Successfully enrolled in ${course.name} (${course.code})`,
      course: {
        id: course._id,
        name: course.name,
        code: course.code
      }
    });
  } catch (error) {
    console.error('Error enrolling student:', error);
    res.status(500).json({ success: false, message: 'Failed to enroll student', error: error.message });
  }
});

// GET student's enrolled courses
router.get('/student/:studentId/enrolled', auth, async (req, res) => {
  try {
    const { studentId } = req.params;
    const isAdmin = req.user.role === 'admin';
    const isStudent = req.user.role === 'student' && req.user._id.toString() === studentId;
    const isFaculty = req.user.role === 'faculty';
    
    if (!(isAdmin || isStudent || isFaculty)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    // Find all courses where this student is enrolled
    const enrolledCourses = await Course.find({
      students: studentId
    }).select('name code department credits faculty status');
    
    res.json({
      success: true,
      enrolledCourses,
      totalEnrolled: enrolledCourses.length
    });
  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch enrolled courses', error: error.message });
  }
});

// DELETE unenroll student from course
router.delete('/:id/unenroll', auth, async (req, res) => {
  try {
    if (req.user.role !== 'student' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    const studentId = req.body.studentId || req.user._id;
    
    // Check if student is enrolled
    if (!course.students.includes(studentId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student not enrolled in this course' 
      });
    }
    
    course.students = course.students.filter(id => id.toString() !== studentId);
    await course.save();
    
    res.json({ success: true, message: 'Successfully unenrolled from course' });
  } catch (error) {
    console.error('Error unenrolling student:', error);
    res.status(500).json({ success: false, message: 'Failed to unenroll student', error: error.message });
  }
});

// GET course statistics (Admin and Faculty only)
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('students', 'name email');
    
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    // Check access permissions
    const hasAccess = 
      req.user.role === 'admin' ||
      course.faculty.toString() === req.user._id;
    
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const stats = {
      totalStudents: course.students.length,
      maxStudents: course.maxStudents,
      enrollmentRate: course.maxStudents ? 
        ((course.students.length / course.maxStudents) * 100).toFixed(1) : 0,
      availableSlots: course.maxStudents ? 
        course.maxStudents - course.students.length : 'Unlimited'
    };
    
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching course stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch course statistics', error: error.message });
  }
});

// GET students for a course (faculty who owns the course or admin)
router.get('/:id/students', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('students', 'name email rollNumber');
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    // Only allow if admin or course faculty
    const isAdmin = req.user.role === 'admin';
    const isCourseFaculty = course.faculty && course.faculty.toString() === req.user._id.toString();
    if (!(isAdmin || isCourseFaculty)) {
      console.warn('Access denied: course.faculty', course.faculty, 'req.user._id', req.user._id);
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    res.json({ success: true, students: course.students });
  } catch (error) {
    console.error('Error fetching course students:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch students', error: error.message });
  }
});

// GET all students (admin and faculty)
router.get('/students', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'faculty') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const query = { role: 'student' };
    if (req.user.role === 'faculty') {
      const facultyProgram = req.user.program || null;
      const facultyBranch = req.user.branch || null;
      const facultyDepartment = req.user.department || null;
      if (facultyProgram || facultyBranch || facultyDepartment) {
        query.$or = [];
        if (facultyProgram) {
          query.$or.push(
            { program: facultyProgram },
            { 'profile.course': facultyProgram }
          );
        }
        if (facultyBranch) {
          query.$or.push(
            { branch: facultyBranch },
            { department: facultyBranch },
            { 'profile.branch': facultyBranch }
          );
        }
        if (facultyDepartment) {
          query.$or.push(
            { branch: facultyDepartment },
            { department: facultyDepartment },
            { 'profile.branch': facultyDepartment }
          );
        }
        if (query.$or.length === 0) delete query.$or;
      }
    }

    const students = await User.find(query).select('name email profile studentId department program branch');
    res.json({ success: true, students });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch students', error: error.message });
  }
});

module.exports = router;
