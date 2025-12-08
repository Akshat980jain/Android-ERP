const { Resend } = require('resend');
const path = require('path');
const fs = require('fs').promises;

class EmailService {
  constructor() {
    this.resend = null;
    this.isConfigured = false;
    this.fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    this.init();
  }

  async init() {
    try {
      // Check if Resend API key is set
      const apiKey = process.env.RESEND_API_KEY;

      if (!apiKey) {
        console.error('❌ Missing RESEND_API_KEY environment variable');
        this.isConfigured = false;
        return;
      }

      // Initialize Resend client
      this.resend = new Resend(apiKey);
      this.isConfigured = true;
      console.log('✅ Email service (Resend) configured successfully');
    } catch (error) {
      console.error('❌ Email service configuration failed:', error.message);
      this.isConfigured = false;
    }
  }

  // Load email template
  async loadTemplate(templateName, data = {}) {
    try {
      const templatePath = path.join(__dirname, 'templates', `${templateName}.html`);
      let template = await fs.readFile(templatePath, 'utf8');

      // Replace placeholders with data
      Object.keys(data).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        template = template.replace(regex, data[key]);
      });

      return template;
    } catch (error) {
      console.error(`Error loading template ${templateName}:`, error);
      return this.getDefaultTemplate(data);
    }
  }

  // Default template fallback
  getDefaultTemplate(data) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${data.subject || 'EduConnect Notification'}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>EduConnect</h1>
          </div>
          <div class="content">
            <h2>${data.subject || 'Notification'}</h2>
            <p>${data.message || 'You have a new notification from EduConnect.'}</p>
            ${data.actionUrl ? `<p><a href="${data.actionUrl}" class="button">View Details</a></p>` : ''}
          </div>
          <div class="footer">
            <p>This is an automated message from EduConnect. Please do not reply to this email.</p>
            <p>© ${new Date().getFullYear()} EduConnect. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Send email with template
  async sendEmail(to, subject, templateName, data = {}) {
    if (!this.isConfigured) {
      console.warn('Email service not configured, skipping email send');
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const htmlContent = await this.loadTemplate(templateName, {
        ...data,
        subject,
        currentYear: new Date().getFullYear(),
        institutionName: process.env.INSTITUTION_NAME || 'EduConnect University'
      });

      const recipients = Array.isArray(to) ? to : [to];

      const result = await this.resend.emails.send({
        from: `EduConnect <${this.fromEmail}>`,
        to: recipients,
        subject: subject,
        html: htmlContent
      });

      if (result.error) {
        console.error('Resend error:', result.error);
        return { success: false, error: result.error.message };
      }

      console.log('📧 Email sent successfully via Resend:', result.data?.id);
      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }
  }

  // Send welcome email
  async sendWelcomeEmail(user) {
    return this.sendEmail(
      user.email,
      'Welcome to EduConnect!',
      'welcome',
      {
        name: user.firstName || user.name,
        role: user.role,
        loginUrl: process.env.CLIENT_URL || 'http://localhost:5173'
      }
    );
  }

  // Send password reset email
  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    return this.sendEmail(
      user.email,
      'Password Reset Request',
      'password-reset',
      {
        name: user.firstName || user.name,
        resetUrl,
        expiryHours: 24
      }
    );
  }

  // Send verification email
  async sendVerificationEmail(user, verificationToken) {
    const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;

    return this.sendEmail(
      user.email,
      'Verify Your Email Address',
      'email-verification',
      {
        name: user.firstName || user.name,
        verificationUrl
      }
    );
  }

  // Send assignment notification
  async sendAssignmentNotification(user, assignment) {
    return this.sendEmail(
      user.email,
      'New Assignment Posted',
      'assignment-notification',
      {
        name: user.firstName || user.name,
        assignmentTitle: assignment.title,
        courseName: assignment.courseName,
        dueDate: new Date(assignment.dueDate).toLocaleDateString(),
        description: assignment.description,
        actionUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/assignments/${assignment._id}`
      }
    );
  }

  // Send exam notification
  async sendExamNotification(user, exam) {
    return this.sendEmail(
      user.email,
      'Upcoming Exam Reminder',
      'exam-notification',
      {
        name: user.firstName || user.name,
        examTitle: exam.title,
        courseName: exam.courseName,
        examDate: new Date(exam.examDate).toLocaleDateString(),
        examTime: new Date(exam.examDate).toLocaleTimeString(),
        duration: exam.duration,
        actionUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/exams/${exam._id}`
      }
    );
  }

  // Send fee reminder
  async sendFeeReminder(user, feeDetails) {
    return this.sendEmail(
      user.email,
      'Fee Payment Reminder',
      'fee-reminder',
      {
        name: user.firstName || user.name,
        amount: feeDetails.amount,
        dueDate: new Date(feeDetails.dueDate).toLocaleDateString(),
        feeType: feeDetails.type,
        actionUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/finance`
      }
    );
  }

  // Send attendance alert
  async sendAttendanceAlert(user, attendanceData) {
    return this.sendEmail(
      user.email,
      'Attendance Alert',
      'attendance-alert',
      {
        name: user.firstName || user.name,
        currentPercentage: attendanceData.percentage,
        requiredPercentage: attendanceData.requiredPercentage,
        courseName: attendanceData.courseName,
        actionUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/attendance`
      }
    );
  }

  // Send event notification
  async sendEventNotification(user, event) {
    return this.sendEmail(
      user.email,
      'Upcoming Event',
      'event-notification',
      {
        name: user.firstName || user.name,
        eventTitle: event.title,
        eventDate: new Date(event.date).toLocaleDateString(),
        eventTime: new Date(event.date).toLocaleTimeString(),
        location: event.location,
        description: event.description,
        actionUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/events/${event._id}`
      }
    );
  }

  // Send grade notification
  async sendGradeNotification(user, gradeData) {
    return this.sendEmail(
      user.email,
      'Grade Update',
      'grade-notification',
      {
        name: user.firstName || user.name,
        courseName: gradeData.courseName,
        assignmentName: gradeData.assignmentName,
        grade: gradeData.grade,
        maxGrade: gradeData.maxGrade,
        percentage: gradeData.percentage,
        actionUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/grades`
      }
    );
  }

  // Send general notification
  async sendGeneralNotification(user, notification) {
    return this.sendEmail(
      user.email,
      notification.title,
      'general-notification',
      {
        name: user.firstName || user.name,
        title: notification.title,
        message: notification.message,
        category: notification.category,
        actionUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/notifications`
      }
    );
  }

  // Send bulk emails
  async sendBulkEmail(users, subject, templateName, data = {}) {
    const results = [];

    for (const user of users) {
      const result = await this.sendEmail(
        user.email,
        subject,
        templateName,
        { ...data, name: user.firstName || user.name }
      );
      results.push({ user: user._id, ...result });
    }

    return results;
  }

  // Test email service
  async testEmailService() {
    if (!this.isConfigured) {
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const testResult = await this.sendEmail(
        process.env.TEST_EMAIL || 'test@example.com',
        'Email Service Test',
        'test',
        {
          name: 'Test User',
          timestamp: new Date().toISOString()
        }
      );

      return testResult;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();
