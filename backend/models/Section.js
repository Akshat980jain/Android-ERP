// models/Section.js
const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        uppercase: true
    },
    semester: {
        type: Number,
        required: true,
        min: 1,
        max: 8
    },
    program: {
        type: String,
        required: true,
        enum: ['B.Tech', 'M.Tech', 'B.Pharma', 'MCA', 'MBA']
    },
    branch: {
        type: String,
        trim: true
    },
    academicYear: {
        type: String,
        required: true,
        trim: true
    },
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    maxStudents: {
        type: Number,
        default: 60,
        min: 1
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['active', 'archived'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Prevent duplicate sections (same name + semester + branch + program + academicYear)
sectionSchema.index(
    { name: 1, semester: 1, program: 1, branch: 1, academicYear: 1 },
    { unique: true }
);

module.exports = mongoose.model('Section', sectionSchema);
