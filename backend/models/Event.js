const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  eventType: {
    type: String,
    enum: ['workshop', 'seminar', 'conference', 'cultural', 'sports', 'academic', 'placement', 'other'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  venue: {
    type: String,
    required: true,
    trim: true
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  maxParticipants: {
    type: Number,
    min: 1
  },
  registrationDeadline: Date,
  eligibleRoles: [{
    type: String,
    enum: ['student', 'faculty', 'admin', 'library_staff', 'placement_officer']
  }],
  eligibleDepartments: [String],
  eligiblePrograms: [String],
  registrations: [{
    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['registered', 'attended', 'absent', 'cancelled'],
      default: 'registered'
    },
    feedback: String,
    rating: {
      type: Number,
      min: 1,
      max: 5
    }
  }],
  resources: [{
    title: String,
    url: String,
    type: {
      type: String,
      enum: ['document', 'video', 'link', 'image']
    }
  }],
  speakers: [{
    name: String,
    designation: String,
    organization: String,
    bio: String,
    photo: String
  }],
  agenda: [{
    time: String,
    activity: String,
    speaker: String,
    duration: Number
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'ongoing', 'completed', 'cancelled'],
    default: 'draft'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  registrationFee: {
    type: Number,
    default: 0,
    min: 0
  },
  certificate: {
    template: String,
    issueToAll: Boolean,
    criteria: String
  }
}, {
  timestamps: true
});

// Indexes
eventSchema.index({ startDate: 1, status: 1 });
eventSchema.index({ eventType: 1 });
eventSchema.index({ organizer: 1 });

module.exports = mongoose.model('Event', eventSchema);