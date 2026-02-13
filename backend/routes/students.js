const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Course = require('../models/Course');
const { auth } = require('../middleware/auth');

// GET students
// - Admin: sees all students
// - Faculty: sees only students enrolled in courses they teach
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'faculty') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    let students = [];

    if (req.user.role === 'admin') {
      const { adminType, adminPrograms } = req.user;
      const effectiveAdminType = adminType || ((!adminPrograms || !adminPrograms.length) ? 'head' : 'program');

      if (effectiveAdminType === 'head') {
        // Head Admin sees all students
        students = await User.find({ role: 'student' })
          .select('name email program profile department branch createdAt');
      } else if (effectiveAdminType === 'program') {
        // Program Admin sees students in their program
        // adminPrograms is an array, check if student's program is in it
        students = await User.find({
          role: 'student',
          $or: [
            { program: { $in: adminPrograms } },
            { 'profile.course': { $in: adminPrograms } }
          ]
        }).select('name email program profile department branch createdAt');
      } else if (effectiveAdminType === 'branch') {
        // Branch Admin sees students in their program AND branch
        const programs = adminPrograms || [];
        const branchName = req.user.branch;

        const query = {
          role: 'student',
          $and: [
            {
              $or: [
                { program: { $in: programs } },
                { 'profile.course': { $in: programs } }
              ]
            }
          ]
        };

        if (branchName) {
          query.$and.push({
            $or: [
              { branch: { $regex: new RegExp(`^${branchName.trim()}$`, 'i') } },
              { department: { $regex: new RegExp(`^${branchName.trim()}$`, 'i') } },
              { 'profile.branch': { $regex: new RegExp(`^${branchName.trim()}$`, 'i') } }
            ]
          });
        }

        students = await User.find(query).select('name email program profile department branch createdAt');
      }
    } else if (req.user.role === 'faculty') {
      // Faculty sees only students enrolled in courses they teach AND matching their department
      const facultyProgram = req.user.program || null;
      const facultyBranch = req.user.branch || req.user.department || null;

      try {
        // Get all courses taught by this faculty
        const facultyCourses = await Course.find({ faculty: req.user._id })
          .select('_id name code students')
          .populate('students', 'name email program branch profile department createdAt');

        // Extract unique students from all courses
        const studentMap = new Map();

        facultyCourses.forEach(course => {
          if (course.students && Array.isArray(course.students)) {
            course.students.forEach(student => {
              if (student && student._id) {
                // Add course information to student data
                const studentData = student.toObject();
                if (!studentData.enrolledCourses) {
                  studentData.enrolledCourses = [];
                }
                studentData.enrolledCourses.push({
                  courseId: course._id,
                  courseName: course.name,
                  courseCode: course.code
                });

                // If student already exists, merge course information
                if (studentMap.has(student._id.toString())) {
                  const existingStudent = studentMap.get(student._id.toString());
                  existingStudent.enrolledCourses.push({
                    courseId: course._id,
                    courseName: course.name,
                    courseCode: course.code
                  });
                } else {
                  studentMap.set(student._id.toString(), studentData);
                }
              }
            });
          }
        });

        // Convert map to array
        students = Array.from(studentMap.values());

        // Filter students by faculty's program and branch
        if (facultyProgram) {
          students = students.filter(s => {
            const studentProgram = s.program || s.profile?.course || '';
            const studentBranch = s.branch || s.department || s.profile?.branch || '';
            const programMatch = studentProgram === facultyProgram;
            const branchMatch = !facultyBranch || studentBranch === facultyBranch;
            return programMatch && branchMatch;
          });
        }

        // Sort students by name for better organization
        students.sort((a, b) => a.name.localeCompare(b.name));
      } catch (courseError) {
        console.error('Error fetching faculty courses:', courseError);
        // Fallback to department-based filtering if course fetching fails
        const facultyProgram = req.user.program || null;
        const facultyBranch = req.user.branch || req.user.department || null;

        if (facultyProgram) {
          // Use $and to require BOTH program AND branch match
          const conditions = [
            {
              $or: [
                { program: facultyProgram },
                { 'profile.course': facultyProgram }
              ]
            }
          ];

          // Always require branch match when faculty has a branch
          if (facultyBranch) {
            conditions.push({
              $or: [
                { branch: facultyBranch },
                { department: facultyBranch },
                { 'profile.branch': facultyBranch }
              ]
            });
          }

          const baseQuery = { role: 'student', $and: conditions };
          students = await User.find(baseQuery)
            .select('name email profile department branch createdAt');
        }
      }
    }

    res.json({ success: true, students });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch students', error: error.message });
  }
});

// GET students for a specific course (faculty who teaches the course or admin)
router.get('/course/:courseId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'faculty') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { courseId } = req.params;

    // Verify course exists and faculty has access
    const course = await Course.findById(courseId)
      .populate('students', 'name email profile department branch createdAt');

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Check if faculty teaches this course
    if (req.user.role === 'faculty' && course.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied - you do not teach this course' });
    }

    // Add course information to each student
    const studentsWithCourseInfo = course.students.map(student => {
      const studentData = student.toObject();
      studentData.enrolledCourses = [{
        courseId: course._id,
        courseName: course.name,
        courseCode: course.code
      }];
      return studentData;
    });

    res.json({
      success: true,
      students: studentsWithCourseInfo,
      course: {
        id: course._id,
        name: course.name,
        code: course.code
      }
    });
  } catch (error) {
    console.error('Error fetching course students:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch course students', error: error.message });
  }
});

module.exports = router; 