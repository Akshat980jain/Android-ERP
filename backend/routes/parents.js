const express = require('express');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const Fee = require('../models/Fee');
const Settings = require('../models/Settings');
const { auth, authorize, checkVerification } = require('../middleware/auth');

const router = express.Router();

// Ensure only parents can use these endpoints
router.use(auth, checkVerification, (req, res, next) => {
  if (req.user.role !== 'parent' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Parent access required' });
  }
  next();
});

// Link child by email or id
router.post('/link', async (req, res) => {
  try {
    const { childEmail, childId } = req.body;
    let child = null;
    if (childId) child = await User.findById(childId);
    if (!child && childEmail) child = await User.findOne({ email: childEmail });
    if (!child) return res.status(404).json({ message: 'Student not found' });
    if (child.role !== 'student') return res.status(400).json({ message: 'Not a student account' });

    await User.findByIdAndUpdate(req.user._id, { $addToSet: { children: child._id } });
    await User.findByIdAndUpdate(child._id, { $addToSet: { parents: req.user._id } });
    res.json({ success: true });
  } catch (e) {
    console.error('Link child error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unlink child
router.delete('/link/:childId', async (req, res) => {
  try {
    const { childId } = req.params;
    await User.findByIdAndUpdate(req.user._id, { $pull: { children: childId } });
    await User.findByIdAndUpdate(childId, { $pull: { parents: req.user._id } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

// List children
router.get('/children', async (req, res) => {
  const parent = await User.findById(req.user._id).populate('children', 'name profile.studentId department');
  res.json({ success: true, children: parent.children || [] });
});

// Attendance summary for child
router.get('/children/:id/attendance', async (req, res) => {
  try {
    const settings = await Settings.findOne();
    const weights = settings?.attendancePolicy?.weights || { present: 1, late: 0.5, absent: 0 };
    const attendance = await Attendance.find({ student: req.params.id });
    const totals = attendance.reduce((acc, rec) => {
      const lc = rec.lectureCount || 1;
      acc.total += lc;
      if (rec.status === 'present') acc.present += lc * weights.present;
      else if (rec.status === 'late') acc.present += lc * weights.late;
      return acc;
    }, { total: 0, present: 0 });
    const percentage = totals.total > 0 ? Math.round((totals.present / totals.total) * 100) : 0;
    res.json({ success: true, total: totals.total, present: totals.present, percentage });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Marks summary for child
router.get('/children/:id/marks', async (req, res) => {
  try {
    const marks = await Marks.find({ student: req.params.id });
    const avg = marks.length > 0 ? Math.round(marks.reduce((s, m) => s + m.percentage, 0) / marks.length) : 0;
    res.json({ success: true, averagePercentage: avg, totalAssessments: marks.length });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Fee receipts summary (placeholder)
router.get('/children/:id/fees/receipts', async (req, res) => {
  try {
    const fees = await Fee.find({ student: req.params.id });
    const receipts = fees.filter(f => f.status === 'paid').map(f => ({ id: f._id, amount: f.paidAmount || f.amount, paidAt: f.updatedAt }));
    res.json({ success: true, receipts });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


