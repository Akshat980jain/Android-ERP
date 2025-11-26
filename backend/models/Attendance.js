const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late'],
    required: true
  },
  attendanceReason: {
    type: String,
    enum: ['regular', 'dutyLeave', 'medicalLeave'],
    default: 'regular'
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  remarks: String,
  // New fields for schedule-based attendance
  scheduleSlot: {
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true
    },
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    },
    room: String
  },
  markedAt: {
    type: Date,
    default: Date.now
  },
  isWithinSchedule: {
    type: Boolean,
    default: false
  },
  // New field to track how many lectures this attendance represents
  lectureCount: {
    type: Number,
    default: 1,
    min: 1
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate attendance records
attendanceSchema.index({ student: 1, course: 1, date: 1, 'scheduleSlot.day': 1, 'scheduleSlot.startTime': 1 }, { unique: true });

// Helper function to calculate lecture count based on duration
const calculateLectureCount = (startTime, endTime) => {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const durationMinutes = endMinutes - startMinutes;
  
  // Standard lecture duration is 50 minutes
  const standardLectureDuration = 50;
  
  // Calculate how many standard lectures this duration represents
  const lectureCount = Math.ceil(durationMinutes / standardLectureDuration);
  
  return Math.max(1, lectureCount); // Minimum 1 lecture
};

// Helper function to convert time string to minutes
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Pre-save middleware to validate schedule and calculate lecture count
attendanceSchema.pre('save', async function(next) {
  try {
    // Get the course to check its schedule
    const Course = mongoose.model('Course');
    const course = await Course.findById(this.course);
    
    if (!course) {
      return next(new Error('Course not found'));
    }

    // Check if the attendance is being marked for a scheduled day and time
    const attendanceDate = new Date(this.date);
    const dayOfWeek = attendanceDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Find matching schedule slot
    const matchingSlot = course.schedule.find(slot => 
      slot.day === dayOfWeek && 
      slot.time === this.scheduleSlot.startTime
    );

    if (matchingSlot) {
      this.scheduleSlot = {
        day: matchingSlot.day,
        startTime: matchingSlot.time,
        endTime: matchingSlot.endTime || matchingSlot.time, // Use endTime from schedule
        room: matchingSlot.room || ''
      };
      this.isWithinSchedule = true;
      
      // Calculate lecture count based on duration
      this.lectureCount = calculateLectureCount(this.scheduleSlot.startTime, this.scheduleSlot.endTime);
    } else {
      this.isWithinSchedule = false;
      // Default to 1 lecture if not within schedule
      this.lectureCount = 1;
    }

    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Attendance', attendanceSchema);