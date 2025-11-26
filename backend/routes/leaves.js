const express = require('express');
const Leave = require('../models/Leave');
const { auth, authorize, checkVerification } = require('../middleware/auth');

const router = express.Router();

// Apply for leave (student)
router.post('/', auth, authorize('student'), checkVerification, async (req, res) => {
  try {
    const { type, reason, startDate, endDate, documents } = req.body;
    if (!type || !startDate || !endDate) return res.status(400).json({ message: 'Missing required fields' });

    const leave = await Leave.create({
      student: req.user._id,
      type,
      reason: reason || '',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      documents: documents || []
    });
    res.json({ success: true, leave });
  } catch (error) {
    console.error('Apply leave error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve/Reject leave (faculty/admin)
router.put('/:id/decision', auth, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const { status } = req.body; // 'approved' | 'rejected'
    if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: 'Leave not found' });

    leave.status = status;
    leave.approvedBy = req.user._id;
    await leave.save();

    res.json({ success: true, leave });
  } catch (error) {
    console.error('Leave decision error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// List my leaves (student) or all (faculty/admin)
router.get('/', auth, checkVerification, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'student') query.student = req.user._id;
    const leaves = await Leave.find(query).populate('student', 'name profile.studentId').sort({ createdAt: -1 });
    res.json({ success: true, leaves });
  } catch (error) {
    console.error('List leaves error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


