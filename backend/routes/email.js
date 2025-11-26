const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const emailService = require('../services/emailService');
const User = require('../models/User');

const router = express.Router();

// @route   POST /api/email/test
// @desc    Test email service
// @access  Private (admin only)
router.post('/test', auth, authorize('admin'), async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email address is required' 
      });
    }

    const testResult = await emailService.testEmailService();
    
    res.json({ 
      success: true, 
      message: 'Email service test completed',
      result: testResult
    });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   POST /api/email/send-bulk
// @desc    Send bulk emails to users
// @access  Private (admin only)
router.post('/send-bulk', auth, authorize('admin'), async (req, res) => {
  try {
    const { 
      targetRoles, 
      subject, 
      templateName, 
      data,
      testMode = false 
    } = req.body;

    if (!subject || !templateName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Subject and template name are required' 
      });
    }

    // Build query for target users
    let query = { 'preferences.notifications.email': { $ne: false } };
    if (targetRoles && targetRoles.length > 0) {
      query.role = { $in: targetRoles };
    }

    const users = await User.find(query).select('email firstName lastName name');
    
    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No users found matching the criteria' 
      });
    }

    if (testMode) {
      // Send to first user only for testing
      const testUser = users[0];
      const result = await emailService.sendEmail(
        testUser.email,
        subject,
        templateName,
        { ...data, name: testUser.firstName || testUser.name }
      );
      
      res.json({ 
        success: true, 
        message: 'Test email sent successfully',
        sentTo: testUser.email,
        result
      });
    } else {
      // Send to all users
      const results = await emailService.sendBulkEmail(
        users,
        subject,
        templateName,
        data
      );
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;
      
      res.json({ 
        success: true, 
        message: `Bulk email completed. Success: ${successCount}, Failed: ${failureCount}`,
        totalUsers: users.length,
        results
      });
    }
  } catch (error) {
    console.error('Send bulk email error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   POST /api/email/send-notification
// @desc    Send notification email to specific users
// @access  Private (admin, faculty only)
router.post('/send-notification', auth, authorize('admin', 'faculty'), async (req, res) => {
  try {
    const { 
      userIds, 
      subject, 
      message, 
      category = 'general',
      actionUrl 
    } = req.body;

    if (!userIds || !subject || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'User IDs, subject, and message are required' 
      });
    }

    const users = await User.find({ 
      _id: { $in: userIds },
      'preferences.notifications.email': { $ne: false }
    }).select('email firstName lastName name');

    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No users found' 
      });
    }

    const results = [];
    for (const user of users) {
      const result = await emailService.sendGeneralNotification(user, {
        title: subject,
        message,
        category,
        actionUrl
      });
      results.push({ user: user._id, email: user.email, ...result });
    }

    const successCount = results.filter(r => r.success).length;
    
    res.json({ 
      success: true, 
      message: `Notification sent to ${successCount} users`,
      totalUsers: users.length,
      results
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   GET /api/email/status
// @desc    Get email service status
// @access  Private (admin only)
router.get('/status', auth, authorize('admin'), async (req, res) => {
  try {
    const status = {
      configured: emailService.isConfigured,
      environment: process.env.NODE_ENV || 'development',
      emailService: process.env.EMAIL_SERVICE || 'ethereal',
      fromEmail: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      clientUrl: process.env.CLIENT_URL || 'http://localhost:5173'
    };

    res.json({ 
      success: true, 
      status 
    });
  } catch (error) {
    console.error('Get email status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   GET /api/email/templates
// @desc    Get available email templates
// @access  Private (admin only)
router.get('/templates', auth, authorize('admin'), async (req, res) => {
  try {
    const templates = [
      { name: 'welcome', description: 'Welcome email for new users' },
      { name: 'password-reset', description: 'Password reset email' },
      { name: 'email-verification', description: 'Email verification' },
      { name: 'assignment-notification', description: 'New assignment notification' },
      { name: 'exam-notification', description: 'Exam reminder' },
      { name: 'fee-reminder', description: 'Fee payment reminder' },
      { name: 'attendance-alert', description: 'Attendance alert' },
      { name: 'event-notification', description: 'Event notification' },
      { name: 'grade-notification', description: 'Grade update' },
      { name: 'general-notification', description: 'General notification' },
      { name: 'test', description: 'Test email template' }
    ];

    res.json({ 
      success: true, 
      templates 
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

module.exports = router;

