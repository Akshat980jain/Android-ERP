const express = require('express');
const Fee = require('../models/Fee');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/finance/fees
// @desc    Get fees for current user
// @access  Private
router.get('/fees', auth, async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'student') {
      query.student = req.user._id;
    }

    const fees = await Fee.find(query)
      .populate('student', 'name profile.studentId')
      .sort({ dueDate: -1 });

    // Calculate totals
    const totalPending = fees
      .filter(fee => fee.status === 'pending' || fee.status === 'overdue')
      .reduce((sum, fee) => sum + fee.amount, 0);

    const totalPaid = fees
      .filter(fee => fee.status === 'paid')
      .reduce((sum, fee) => sum + fee.amount, 0);

    res.json({
      success: true,
      fees,
      summary: {
        totalPending,
        totalPaid,
        totalFees: fees.length
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/finance/fees
// @desc    Create new fee record (admin only)
// @access  Private
router.post('/fees', auth, authorize('admin'), async (req, res) => {
  try {
    const fee = new Fee(req.body);
    await fee.save();

    res.status(201).json({
      success: true,
      fee
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/finance/fees/:id/pay
// @desc    Pay fee
// @access  Private
router.put('/fees/:id/pay', auth, async (req, res) => {
  try {
    const { paymentMethod, transactionId } = req.body;

    const fee = await Fee.findById(req.params.id);
    if (!fee) {
      return res.status(404).json({ message: 'Fee record not found' });
    }

    // Check if user owns this fee (for students)
    if (req.user.role === 'student' && fee.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    fee.status = 'paid';
    fee.paidDate = new Date();
    fee.paymentMethod = paymentMethod;
    fee.transactionId = transactionId;

    await fee.save();

    res.json({
      success: true,
      fee
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/finance/payment-history
// @desc    Get payment history
// @access  Private
router.get('/payment-history', auth, async (req, res) => {
  try {
    let query = { status: 'paid' };
    
    if (req.user.role === 'student') {
      query.student = req.user._id;
    }

    const payments = await Fee.find(query)
      .populate('student', 'name profile.studentId')
      .sort({ paidDate: -1 });

    res.json({
      success: true,
      payments
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;