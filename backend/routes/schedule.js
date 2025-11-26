// routes/schedule.js
const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const { auth } = require('../middleware/auth');

// Helper function to convert time string to minutes
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper function to migrate existing schedule items to include endTime and type
const migrateScheduleItem = (slot) => {
  if (!slot.endTime) {
    slot.endTime = slot.time; // Default to same as start time
  }
  if (!slot.type) {
    slot.type = 'lecture'; // Default to lecture
  }
  return slot;
};

// GET schedule for the current user
router.get('/', auth, async (req, res) => {
  try {
    let courses;
    
    switch (req.user.role) {
      case 'admin':
        // Admin can see all courses
        courses = await Course.find()
          .populate('faculty', 'name email')
          .populate('students', 'name email');
        break;
      case 'faculty':
        // Faculty can see courses they teach
        courses = await Course.find({ faculty: req.user._id })
          .populate('faculty', 'name email')
          .populate('students', 'name email');
        break;
      case 'student':
        // Students can see courses they're enrolled in
        courses = await Course.find({ students: req.user._id })
          .populate('faculty', 'name email');
        break;
      default:
        courses = [];
    }
    
    // Transform courses into schedule items
    const schedule = [];
    courses.forEach(course => {
      if (course.schedule && course.schedule.length > 0) {
        course.schedule.forEach(slot => {
          // Migrate the slot to ensure it has all required fields
          const migratedSlot = migrateScheduleItem(slot);
          
          // Calculate lecture count based on duration
          const startMinutes = timeToMinutes(migratedSlot.time);
          const endMinutes = timeToMinutes(migratedSlot.endTime);
          const durationMinutes = endMinutes - startMinutes;
          const standardLectureDuration = 50;
          const lectureCount = Math.max(1, Math.ceil(durationMinutes / standardLectureDuration));

          schedule.push({
            _id: `${course._id}-${migratedSlot.day}-${migratedSlot.time}`,
            course: {
              _id: course._id,
              name: course.name,
              code: course.code
            },
            dayOfWeek: migratedSlot.day,
            startTime: migratedSlot.time,
            endTime: migratedSlot.endTime,
            room: migratedSlot.room || '',
            type: migratedSlot.type,
            faculty: {
              _id: course.faculty._id,
              name: course.faculty.name
            },
            lectureCount: lectureCount
          });
        });
      }
    });
    
    res.json({ success: true, schedule });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch schedule', error: error.message });
  }
});

// POST new schedule item (add to course)
router.post('/', auth, async (req, res) => {
  try {
    const { courseId, dayOfWeek, startTime, endTime, room, type } = req.body;
    
    if (!courseId || !dayOfWeek || !startTime) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    // Check if user has permission to modify this course
    const isAdmin = req.user.role === 'admin';
    const isCourseFaculty = course.faculty.toString() === req.user._id.toString();
    
    if (!isAdmin && !isCourseFaculty) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    // Add schedule slot to course with complete data
    course.schedule.push({
      day: dayOfWeek,
      time: startTime,
      endTime: endTime || startTime, // Use startTime if endTime not provided
      room: room || '',
      type: type || 'lecture' // Default to lecture if type not provided
    });
    
    await course.save();
    
    res.json({ success: true, message: 'Schedule item added successfully' });
  } catch (error) {
    console.error('Error adding schedule item:', error);
    res.status(500).json({ success: false, message: 'Failed to add schedule item', error: error.message });
  }
});

// PUT update schedule item
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      courseId: targetCourseIdFromBody,
      dayOfWeek,
      startTime,
      endTime,
      room,
      type,
      originalCourseId,
      originalDayOfWeek,
      originalStartTime
    } = req.body;

    const courseIdParam = req.params.id;
    const sourceCourseId = originalCourseId || targetCourseIdFromBody || courseIdParam;
    const targetCourseId = targetCourseIdFromBody || courseIdParam;

    if (!sourceCourseId || !dayOfWeek || !startTime) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Load source course
    const sourceCourse = await Course.findById(sourceCourseId);
    if (!sourceCourse) {
      return res.status(404).json({ success: false, message: 'Source course not found' });
    }

    // Auth check for source course
    const isAdmin = req.user.role === 'admin';
    const isSourceFaculty = sourceCourse.faculty.toString() === req.user._id.toString();
    if (!isAdmin && !isSourceFaculty) {
      return res.status(403).json({ success: false, message: 'Access denied for source course' });
    }

    // Identify the existing slot in the source course using original keys if provided
    const locatorDay = originalDayOfWeek || dayOfWeek;
    const locatorStart = originalStartTime || startTime;
    const slotIndex = sourceCourse.schedule.findIndex(
      (slot) => slot.day === locatorDay && slot.time === locatorStart
    );

    if (slotIndex === -1) {
      return res.status(404).json({ success: false, message: 'Schedule item not found' });
    }

    // If course is unchanged, update in-place
    if (targetCourseId === sourceCourseId) {
      sourceCourse.schedule[slotIndex] = {
        day: dayOfWeek,
        time: startTime,
        endTime: endTime || startTime,
        room: room || '',
        type: type || 'lecture'
      };
      await sourceCourse.save();
      return res.json({ success: true, message: 'Schedule item updated successfully' });
    }

    // Otherwise, move the slot to the target course
    const targetCourse = await Course.findById(targetCourseId);
    if (!targetCourse) {
      return res.status(404).json({ success: false, message: 'Target course not found' });
    }

    // Auth check for target course
    const isTargetFaculty = targetCourse.faculty.toString() === req.user._id.toString();
    if (!isAdmin && !isTargetFaculty) {
      return res.status(403).json({ success: false, message: 'Access denied for target course' });
    }

    // Remove from source
    sourceCourse.schedule.splice(slotIndex, 1);
    await sourceCourse.save();

    // Add to target with complete data
    targetCourse.schedule.push({
      day: dayOfWeek,
      time: startTime,
      endTime: endTime || startTime,
      room: room || '',
      type: type || 'lecture'
    });
    await targetCourse.save();

    return res.json({ success: true, message: 'Schedule item moved and updated successfully' });
  } catch (error) {
    console.error('Error updating schedule item:', error);
    res.status(500).json({ success: false, message: 'Failed to update schedule item', error: error.message });
  }
});

// DELETE schedule item
router.delete('/:id', auth, async (req, res) => {
  try {
    const { courseId, dayOfWeek, startTime } = req.body;
    
    if (!courseId || !dayOfWeek || !startTime) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    // Check if user has permission to modify this course
    const isAdmin = req.user.role === 'admin';
    const isCourseFaculty = course.faculty.toString() === req.user._id.toString();
    
    if (!isAdmin && !isCourseFaculty) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    // Remove schedule slot from course
    course.schedule = course.schedule.filter(slot => 
      !(slot.day === dayOfWeek && slot.time === startTime)
    );
    
    await course.save();
    
    res.json({ success: true, message: 'Schedule item deleted successfully' });
  } catch (error) {
    console.error('Error deleting schedule item:', error);
    res.status(500).json({ success: false, message: 'Failed to delete schedule item', error: error.message });
  }
});

module.exports = router; 