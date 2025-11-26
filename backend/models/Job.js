const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  company: {
    type: String,
    required: true,
    trim: true
  },
  position: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  requirements: [{
    type: String,
    required: true
  }],
  package: {
    min: Number,
    max: Number,
    currency: {
      type: String,
      default: 'INR'
    }
  },
  location: String,
  type: {
    type: String,
    enum: ['full-time', 'internship', 'part-time'],
    required: true
  },
  deadline: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'closed', 'draft'],
    default: 'active'
  },
  eligibleDepartments: [String],
  minimumCGPA: {
    type: Number,
    min: 0,
    max: 10
  },
  applicationCount: {
    type: Number,
    default: 0
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyLogo: String,
  contactEmail: String,
  contactPhone: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Job', jobSchema);