const mongoose = require('mongoose');

const transportSchema = new mongoose.Schema({
  routeNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  routeName: {
    type: String,
    required: true,
    trim: true
  },
  driver: {
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    licenseNumber: String
  },
  vehicle: {
    number: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['bus', 'van', 'car'],
      default: 'bus'
    },
    capacity: {
      type: Number,
      required: true,
      min: 1
    },
    model: String,
    year: Number
  },
  stops: [{
    name: {
      type: String,
      required: true
    },
    time: {
      type: String,
      required: true
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    fare: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  schedule: {
    morningDeparture: String,
    eveningDeparture: String,
    operatingDays: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }]
  },
  lastLocation: {
    latitude: Number,
    longitude: Number,
    timestamp: Date
  },
  subscribers: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    stop: String,
    subscriptionDate: {
      type: Date,
      default: Date.now
    },
    monthlyFee: Number,
    status: {
      type: String,
      enum: ['active', 'suspended', 'cancelled'],
      default: 'active'
    }
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
transportSchema.index({ 'subscribers.student': 1 });
transportSchema.index({ status: 1 });

module.exports = mongoose.model('Transport', transportSchema);