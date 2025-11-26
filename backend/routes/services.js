const express = require('express');
const StudentService = require('../models/StudentService');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/services
// @desc    Get student services
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'student') {
      query.student = req.user._id;
    }

    const services = await StudentService.find(query)
      .populate('student', 'name profile.studentId')
      .populate('approvedBy', 'name')
      .sort({ requestDate: -1 });

    res.json({
      success: true,
      services
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/services
// @desc    Apply for student service
// @access  Private (Students only)
router.post('/', auth, authorize('student'), async (req, res) => {
  try {
    const { type, reason, documents } = req.body;

    const service = new StudentService({
      student: req.user._id,
      type,
      reason,
      documents
    });

    await service.save();

    res.status(201).json({
      success: true,
      service
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/services/:id/approve
// @desc    Approve/reject student service (admin only)
// @access  Private
router.put('/:id/approve', auth, authorize('admin'), async (req, res) => {
  try {
    const { status, remarks } = req.body;

    const service = await StudentService.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    service.status = status;
    service.remarks = remarks;
    service.approvedBy = req.user._id;
    
    if (status === 'approved') {
      service.approvedDate = new Date();
    }

    await service.save();

    res.json({
      success: true,
      service
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;