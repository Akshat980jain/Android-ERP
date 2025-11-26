const express = require('express');
const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/placement/jobs
// @desc    Get all active jobs
// @access  Private
router.get('/jobs', auth, async (req, res) => {
  try {
    const { type, status = 'active' } = req.query;
    
    let query = { status };
    
    if (type && type !== 'all') {
      query.type = type;
    }

    const jobs = await Job.find(query)
      .populate('postedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      jobs
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/placement/jobs
// @desc    Create new job (placement officer only)
// @access  Private
router.post('/jobs', auth, authorize('placement', 'admin'), async (req, res) => {
  try {
    const job = new Job({
      ...req.body,
      postedBy: req.user._id
    });

    await job.save();

    res.status(201).json({
      success: true,
      job
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/placement/applications
// @desc    Get job applications
// @access  Private
router.get('/applications', auth, async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'student') {
      query.student = req.user._id;
    }

    const applications = await JobApplication.find(query)
      .populate('job', 'company position type package location')
      .populate('student', 'name profile.studentId email')
      .sort({ appliedDate: -1 });

    res.json({
      success: true,
      applications
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/placement/apply
// @desc    Apply for a job (students only)
// @access  Private
router.post('/apply', auth, authorize('student'), async (req, res) => {
  try {
    const { jobId, resume, coverLetter } = req.body;

    // Check if already applied
    const existingApplication = await JobApplication.findOne({
      job: jobId,
      student: req.user._id
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'Already applied for this job' });
    }

    // Check if job is still active
    const job = await Job.findById(jobId);
    if (!job || job.status !== 'active') {
      return res.status(400).json({ message: 'Job is not available' });
    }

    // Check deadline
    if (new Date() > new Date(job.deadline)) {
      return res.status(400).json({ message: 'Application deadline has passed' });
    }

    const application = new JobApplication({
      job: jobId,
      student: req.user._id,
      resume,
      coverLetter
    });

    await application.save();

    // Update application count
    job.applicationCount += 1;
    await job.save();

    res.status(201).json({
      success: true,
      application
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/placement/applications/:id/status
// @desc    Update application status (placement officer only)
// @access  Private
router.put('/applications/:id/status', auth, authorize('placement', 'admin'), async (req, res) => {
  try {
    const { status, feedback, interviewDate } = req.body;

    const application = await JobApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    application.status = status;
    application.feedback = feedback;
    if (interviewDate) {
      application.interviewDate = new Date(interviewDate);
    }

    await application.save();

    res.json({
      success: true,
      application
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/placement/stats
// @desc    Get placement statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const totalJobs = await Job.countDocuments({ status: 'active' });
    const totalApplications = await JobApplication.countDocuments();
    const selectedApplications = await JobApplication.countDocuments({ status: 'selected' });
    
    const companies = await Job.distinct('company');
    const totalCompanies = companies.length;

    // Calculate average package (this would need more complex aggregation in real scenario)
    const avgPackage = '₹12.5 LPA'; // Mock data
    const highestPackage = '₹45 LPA'; // Mock data
    const placementRate = totalApplications > 0 ? ((selectedApplications / totalApplications) * 100).toFixed(1) + '%' : '0%';

    res.json({
      success: true,
      stats: {
        totalJobs,
        totalApplications,
        selectedApplications,
        totalCompanies,
        avgPackage,
        highestPackage,
        placementRate
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;