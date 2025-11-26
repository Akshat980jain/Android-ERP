const express = require('express');
const Notification = require('../models/Notification');
const Fee = require('../models/Fee');
const Assignment = require('../models/Assignment');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get notifications for current user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { category, read } = req.query;
    
    let query = {
      $or: [
        { targetRoles: req.user.role },
        { targetUsers: req.user._id }
      ],
      isActive: true
    };

    if (category && category !== 'all') {
      query.category = category;
    }

    const notifications = await Notification.find(query)
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 });

    // Filter by read status if specified
    let filteredNotifications = notifications;
    if (read === 'false') {
      filteredNotifications = notifications.filter(notification => 
        !notification.readBy.some(read => read.user.toString() === req.user._id.toString())
      );
    }

    // Add read status to each notification
    const notificationsWithReadStatus = filteredNotifications.map(notification => {
      const isRead = notification.readBy.some(read => 
        read.user.toString() === req.user._id.toString()
      );
      return {
        ...notification.toObject(),
        read: isRead
      };
    });

    res.json({
      success: true,
      notifications: notificationsWithReadStatus
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/notifications
// @desc    Create notification (admin/faculty only)
// @access  Private
router.post('/', auth, authorize('admin', 'faculty', 'library', 'placement'), async (req, res) => {
  try {
    const { title, message, type, category, targetRoles, targetUsers } = req.body;

    const notification = new Notification({
      title,
      message,
      type,
      category,
      targetRoles,
      targetUsers,
      createdBy: req.user._id
    });

    await notification.save();

    // Emit realtime events: to roles (broadcast) and to specific users
    try {
      if (global.io) {
        // Emit to target users' personal rooms
        if (Array.isArray(notification.targetUsers) && notification.targetUsers.length > 0) {
          notification.targetUsers.forEach((uid) => {
            global.io.to(uid.toString()).emit('notification', {
              _id: notification._id,
              title: notification.title,
              message: notification.message,
              type: notification.type,
              category: notification.category,
              createdAt: notification.createdAt,
              targetRoles: notification.targetRoles,
              read: false
            });
          });
        }
        // Optionally broadcast to roles (frontends already filter by role via GET)
      }
    } catch (e) {
      // non-fatal
      console.warn('Socket emit failed:', e?.message);
    }

    res.status(201).json({
      success: true,
      notification
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Check if already read by user
    const alreadyRead = notification.readBy.some(read => 
      read.user.toString() === req.user._id.toString()
    );

    if (!alreadyRead) {
      notification.readBy.push({
        user: req.user._id,
        readAt: new Date()
      });
      await notification.save();
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/notifications/mark-all-read
// @desc    Mark all notifications as read for current user
// @access  Private
router.put('/mark-all-read', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({
      $or: [
        { targetRoles: req.user.role },
        { targetUsers: req.user._id }
      ],
      isActive: true
    });

    for (let notification of notifications) {
      const alreadyRead = notification.readBy.some(read => 
        read.user.toString() === req.user._id.toString()
      );

      if (!alreadyRead) {
        notification.readBy.push({
          user: req.user._id,
          readAt: new Date()
        });
        await notification.save();
      }
    }

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
 
// @route   POST /api/notifications/generate-reminders
// @desc    Generate scheduled reminders (fees due, assignment due, attendance shortfall)
// @access  Private (admin/faculty)
router.post('/generate-reminders', auth, authorize('admin', 'faculty'), async (req, res) => {
  try {
    const now = new Date();
    const inDays = (n) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000);
    const sevenDays = inDays(7);
    const threeDays = inDays(3);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let createdCount = 0;

    // 1) Fees: pending or overdue within 7 days
    const pendingFees = await Fee.find({
      status: { $in: ['pending', 'overdue'] },
      dueDate: { $lte: sevenDays }
    }).populate('student', '_id role');

    for (const fee of pendingFees) {
      if (!fee.student) continue;
      // Avoid duplicate reminders within last 1 day per fee
      const recent = await Notification.findOne({
        category: 'finance',
        'targetUsers': fee.student._id,
        title: { $regex: new RegExp(`${fee.type}`, 'i') },
        createdAt: { $gte: inDays(-1) }
      });
      if (recent) continue;

      await Notification.create({
        title: `Fee ${fee.status === 'overdue' ? 'overdue' : 'due soon'}: ${fee.type}`,
        message: `Amount ₹${fee.amount} ${fee.status === 'overdue' ? 'is overdue' : 'is due by ' + fee.dueDate.toLocaleDateString()}.`,
        type: fee.status === 'overdue' ? 'warning' : 'info',
        category: 'finance',
        targetUsers: [fee.student._id],
        createdBy: req.user._id,
      });
      createdCount += 1;
    }

    // 2) Assignments: due in next 3 days → send a summary to students
    const upcomingAssignments = await Assignment.find({
      dueDate: { $gte: now, $lte: threeDays },
      status: { $in: ['published'] }
    }).select('title dueDate');

    if (upcomingAssignments.length > 0) {
      const recent = await Notification.findOne({
        category: 'academic',
        title: /Assignments due soon/i,
        createdAt: { $gte: inDays(-1) }
      });
      if (!recent) {
        const doc = await Notification.create({
          title: 'Assignments due soon',
          message: `${upcomingAssignments.length} assignment(s) due within 3 days. Please review and submit on time.`,
          type: 'info',
          category: 'academic',
          targetRoles: ['student'],
          createdBy: req.user._id,
        });
        try { if (global.io) { global.io.emit('notification', { _id: doc._id, title: doc.title, message: doc.message, type: doc.type, category: doc.category, createdAt: doc.createdAt, targetRoles: doc.targetRoles, read: false }); } } catch {}
        createdCount += 1;
      }
    }

    // 3) Attendance shortfall: last 30 days < 75%
    const pipeline = [
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: {
          _id: { student: '$student' },
          total: { $sum: 1 },
          presents: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } }
        }
      },
      { $addFields: { percentage: { $multiply: [{ $divide: ['$presents', '$total'] }, 100] } } },
      { $match: { percentage: { $lt: 75 } } }
    ];

    const lowAttendance = await Attendance.aggregate(pipeline);
    const studentIds = lowAttendance.map(a => a._id.student).filter(Boolean);

    if (studentIds.length > 0) {
      // Avoid flooding: one summary notification per student per day
      for (const sid of studentIds) {
        const recent = await Notification.findOne({
          category: 'academic',
          'targetUsers': sid,
          title: /Low attendance alert/i,
          createdAt: { $gte: inDays(-1) }
        });
        if (recent) continue;
        await Notification.create({
          title: 'Low attendance alert',
          message: 'Your attendance in the last 30 days is below 75%. Please improve attendance.',
          type: 'warning',
          category: 'academic',
          targetUsers: [sid],
          createdBy: req.user._id,
        });
        try { if (global.io) { global.io.to(String(sid)).emit('notification', { title: 'Low attendance alert', message: 'Your attendance in the last 30 days is below 75%. Please improve attendance.', type: 'warning', category: 'academic', createdAt: new Date(), targetRoles: [], read: false }); } } catch {}
        createdCount += 1;
      }
    }

    res.json({ success: true, created: createdCount });
  } catch (error) {
    console.error('generate-reminders error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate reminders' });
  }
});