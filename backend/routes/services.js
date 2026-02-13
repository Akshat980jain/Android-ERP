const express = require('express');
const StudentService = require('../models/StudentService');
const { auth, authorize, getEffectiveAdminType } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/services
// @desc    Get student services
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'student') {
      query.student = req.user._id;
    } else if (req.user.role === 'admin') {
      const effectiveAdminType = getEffectiveAdminType(req.user);
      const { adminPrograms } = req.user;

      if (effectiveAdminType === 'branch') {
        // Branch Admin: only see service requests from students in their program + branch
        // We need to filter by the student's program/branch — fetched via populate
        // For now, we load all and filter after populate (until we denormalize program/branch on StudentService)
      } else if (effectiveAdminType === 'program') {
        // Program Admin: see their program's service requests
      }
      // Head Admin: see all
    }

    const services = await StudentService.find(query)
      .populate('student', 'name profile.studentId program branch')
      .populate('approvedBy', 'name')
      .sort({ requestDate: -1 });

    // Post-populate filtering for scoped admins
    let filtered = services;
    if (req.user.role === 'admin') {
      const effectiveAdminType = getEffectiveAdminType(req.user);
      const { adminPrograms } = req.user;

      if (effectiveAdminType === 'branch') {
        const adminBranch = (req.user.branch || req.user.profile?.branch || '').toLowerCase();
        filtered = services.filter(s => {
          const studentProgram = s.student?.program || s.student?.profile?.course || '';
          const studentBranch = (s.student?.branch || s.student?.profile?.branch || '').toLowerCase();
          const programMatch = !adminPrograms || adminPrograms.length === 0 || adminPrograms.includes(studentProgram);
          const branchMatch = !adminBranch || !studentBranch || studentBranch === adminBranch;
          return programMatch && branchMatch;
        });
      } else if (effectiveAdminType === 'program') {
        filtered = services.filter(s => {
          const studentProgram = s.student?.program || s.student?.profile?.course || '';
          return !adminPrograms || adminPrograms.length === 0 || adminPrograms.includes(studentProgram);
        });
      }
      // Head Admin: no filter
    }

    res.json({
      success: true,
      services: filtered
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
// @desc    Approve/reject student service — scoped by admin hierarchy
// @access  Private (admin only)
router.put('/:id/approve', auth, authorize('admin'), async (req, res) => {
  try {
    const { status, remarks } = req.body;

    const service = await StudentService.findById(req.params.id)
      .populate('student', 'name program branch profile');
    if (!service) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    // Scope check: Branch Admin can only approve for their program+branch
    const effectiveAdminType = getEffectiveAdminType(req.user);
    const { adminPrograms } = req.user;

    if (effectiveAdminType === 'branch') {
      const studentProgram = service.student?.program || service.student?.profile?.course || '';
      const studentBranch = (service.student?.branch || service.student?.profile?.branch || '').toLowerCase();
      const adminBranch = (req.user.branch || req.user.profile?.branch || '').toLowerCase();

      if (adminPrograms && adminPrograms.length > 0 && studentProgram && !adminPrograms.includes(studentProgram)) {
        return res.status(403).json({ message: 'Cross-program service approval denied' });
      }
      if (adminBranch && studentBranch && studentBranch !== adminBranch) {
        return res.status(403).json({ message: 'Cross-branch service approval denied' });
      }
    } else if (effectiveAdminType === 'program') {
      const studentProgram = service.student?.program || service.student?.profile?.course || '';
      if (adminPrograms && adminPrograms.length > 0 && studentProgram && !adminPrograms.includes(studentProgram)) {
        return res.status(403).json({ message: 'Cross-program service approval denied' });
      }
    }
    // Head Admin: no restrictions

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