const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  personalInfo: {
    title: String,
    firstName: String,
    middleName: String,
    lastName: String,
    email: String,
    alternateEmail: String,
    phone: String,
    dateOfBirth: Date,
    gender: String,
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: String
    }
  },
  professionalInfo: {
    designation: String,
    department: String,
    joiningDate: Date,
    employmentType: String,
    currentSalary: Number,
    qualifications: [{
      degree: String,
      specialization: String,
      university: String,
      yearOfCompletion: Number,
      percentage: Number,
      cgpa: Number
    }],
    experience: {
      totalExperience: Number,
      industryExperience: Number,
      teachingExperience: Number,
      researchExperience: Number,
      previousEmployments: [{
        organization: String,
        designation: String,
        fromDate: Date,
        toDate: Date,
        experience: Number
      }]
    },
    expertise: [String],
    coursesQualifiedToTeach: [String]
  },
  currentAssignments: {
    coursesTeaching: [{
      subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
      subjectCode: String,
      subjectName: String,
      courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
      specialization: String,
      semester: Number,
      section: String,
      academicYear: String,
      teachingRole: String,
      hoursPerWeek: Number
    }],
    administrativeRoles: [{
      role: String,
      department: String,
      fromDate: Date,
      toDate: Date,
      isActive: Boolean
    }],
    totalTeachingLoad: Number,
    maxTeachingLoad: Number
  },
  researchProfile: {
    researchInterests: [String],
    phdStudentsGuided: Number,
    mtechStudentsGuided: Number,
    publications: [{
      type: String,
      title: String,
      authors: [String],
      journal: String,
      conference: String,
      volume: String,
      issue: String,
      pages: String,
      year: Number,
      impactFactor: Number,
      citations: Number,
      doi: String
    }],
    projects: [{
      title: String,
      fundingAgency: String,
      amount: Number,
      role: String,
      startDate: Date,
      endDate: Date,
      status: String
    }],
    patents: [{
      title: String,
      patentNumber: String,
      filingDate: Date,
      status: String
    }]
  },
  performance: {
    studentFeedback: [{
      semester: String,
      academicYear: String,
      averageRating: Number,
      totalResponses: Number
    }],
    achievements: [{
      type: String,
      title: String,
      awardedBy: String,
      date: Date,
      description: String
    }]
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Faculty', facultySchema); 