const express = require('express');
const Leave = require('../models/Leave');
const User = require('../models/User');
const { auth, authorize, checkVerification, getEffectiveAdminType } = require('../middleware/auth');

const router = express.Router();

// Apply for leave (student OR faculty)
router.post('/', auth, authorize('student', 'faculty'), checkVerification, async (req, res) => {
  try {
    const { type, reason, startDate, endDate, documents } = req.body;
    if (!type || !startDate || !endDate) return res.status(400).json({ message: 'Missing required fields' });

    // Denormalize the applicant's program & branch for scoped filtering
    const applicantProgram = req.user.program || req.user.profile?.course || '';
    const applicantBranch = req.user.branch || req.user.profile?.branch || '';

    const leave = await Leave.create({
      student: req.user._id,
      applicantRole: req.user.role, // 'student' or 'faculty'
      type,
      reason: reason || '',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      documents: documents || [],
      program: applicantProgram,
      branch: applicantBranch,
    });
    res.json({ success: true, leave });
  } catch (error) {
    console.error('Apply leave error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve/Reject leave — hierarchical authorization
router.put('/:id/decision', auth, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const { status } = req.body; // 'approved' | 'rejected'
    if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const leave = await Leave.findById(req.params.id).populate('student', 'name program branch profile');
    if (!leave) return res.status(404).json({ message: 'Leave not found' });

    const { role, adminPrograms, branch: reviewerBranch } = req.user;

    if (role === 'faculty') {
      // Faculty can only approve STUDENT leaves in their same program + branch
      if (leave.applicantRole !== 'student') {
        return res.status(403).json({ message: 'Faculty can only approve student leave requests' });
      }
      const userProgram = req.user.program || req.user.profile?.course;
      const userBranch = req.user.branch || req.user.profile?.branch;
      if (userProgram && leave.program && leave.program !== userProgram) {
        return res.status(403).json({ message: 'Cross-program leave approval denied' });
      }
      if (userBranch && leave.branch && leave.branch.toLowerCase() !== userBranch.toLowerCase()) {
        return res.status(403).json({ message: 'Cross-branch leave approval denied' });
      }
    } else if (role === 'admin') {
      const effectiveAdminType = getEffectiveAdminType(req.user);

      if (effectiveAdminType === 'branch') {
        // Branch Admin: approve student + faculty leaves within their program + branch
        if (adminPrograms && adminPrograms.length > 0 && leave.program && !adminPrograms.includes(leave.program)) {
          return res.status(403).json({ message: 'Cross-program leave approval denied' });
        }
        const adminBranch = reviewerBranch || req.user.profile?.branch;
        if (adminBranch && leave.branch && leave.branch.toLowerCase() !== adminBranch.toLowerCase()) {
          return res.status(403).json({ message: 'Cross-branch leave approval denied' });
        }
      } else if (effectiveAdminType === 'program') {
        // Program Admin: approve faculty leaves within their program (student leaves go to branch admin)
        if (adminPrograms && adminPrograms.length > 0 && leave.program && !adminPrograms.includes(leave.program)) {
          return res.status(403).json({ message: 'Cross-program leave approval denied' });
        }
        // Program admin can approve faculty leaves and act as fallback for student leaves
      }
      // Head Admin: no scope restrictions — can approve any leave
    }

    leave.status = status;
    leave.approvedBy = req.user._id;
    await leave.save();

    res.json({ success: true, leave });
  } catch (error) {
    console.error('Leave decision error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// List leaves — scoped by role and admin hierarchy
router.get('/', auth, checkVerification, async (req, res) => {
  try {
    let query = {};
    const { role, adminPrograms } = req.user;

    if (role === 'student' || role === 'faculty') {
      // Students and faculty see only their own leaves
      query.student = req.user._id;
    } else if (role === 'admin') {
      const effectiveAdminType = getEffectiveAdminType(req.user);

      if (effectiveAdminType === 'branch') {
        // Branch Admin: see leaves in their program + branch only
        if (adminPrograms && adminPrograms.length > 0) {
          query.program = { $in: adminPrograms };
        }
        const adminBranch = req.user.branch || req.user.profile?.branch;
        if (adminBranch) {
          query.branch = { $regex: new RegExp(`^${adminBranch.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };
        }
      } else if (effectiveAdminType === 'program') {
        // Program Admin: see leaves in their program
        if (adminPrograms && adminPrograms.length > 0) {
          query.program = { $in: adminPrograms };
        }
      }
      // Head Admin: no filter — sees everything
    }

    const leaves = await Leave.find(query)
      .populate('student', 'name profile.studentId program branch role')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, leaves });
  } catch (error) {
    console.error('List leaves error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
