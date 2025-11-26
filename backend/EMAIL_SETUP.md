# Email Service Setup Guide

This guide explains how to set up and configure the email service for your EduConnect ERP application.

## Overview

The email service uses Nodemailer to send various types of notifications and emails to users. It supports multiple email providers and includes beautiful HTML templates.

## Features

- ✅ Welcome emails for new users
- ✅ Password reset emails
- ✅ Assignment notifications
- ✅ Exam reminders
- ✅ Fee payment reminders
- ✅ Attendance alerts
- ✅ Event notifications
- ✅ Grade updates
- ✅ General notifications
- ✅ Bulk email sending
- ✅ Email templates with responsive design
- ✅ Development testing with Ethereal Email

## Email Templates

The following email templates are available:

1. **welcome.html** - Welcome email for new users
2. **password-reset.html** - Password reset emails
3. **assignment-notification.html** - New assignment notifications
4. **fee-reminder.html** - Fee payment reminders
5. **test.html** - Test email template

## Configuration

### Environment Variables

Add these variables to your `.env` file:

```env
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=EduConnect <your-email@gmail.com>

# Test Email
TEST_EMAIL=test@example.com

# Client URL (for email links)
CLIENT_URL=http://localhost:5173
```

### Email Service Options

#### 1. Gmail (Recommended for Development)

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

**Setup Steps:**
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password: Google Account → Security → App Passwords
3. Use the generated password as `EMAIL_PASSWORD`

#### 2. SendGrid (Recommended for Production)

```env
EMAIL_SERVICE=sendgrid
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
```

**Setup Steps:**
1. Create a SendGrid account
2. Generate an API key
3. Use `apikey` as `EMAIL_USER` and your API key as `EMAIL_PASSWORD`

#### 3. Outlook/Hotmail

```env
EMAIL_SERVICE=outlook
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

#### 4. Custom SMTP

```env
EMAIL_HOST=smtp.yourdomain.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@yourdomain.com
EMAIL_PASSWORD=your-password
```

## Development Setup

For development, the email service automatically uses Ethereal Email (a fake SMTP service) when `NODE_ENV` is not set to 'production'. This allows you to test email functionality without sending real emails.

### Testing the Email Service

1. **Test Email Service:**
   ```bash
   POST /api/email/test
   Content-Type: application/json
   Authorization: Bearer <admin-token>
   
   {
     "email": "test@example.com"
   }
   ```

2. **Get Email Service Status:**
   ```bash
   GET /api/email/status
   Authorization: Bearer <admin-token>
   ```

3. **Get Available Templates:**
   ```bash
   GET /api/email/templates
   Authorization: Bearer <admin-token>
   ```

## API Endpoints

### Email Management

- `POST /api/email/test` - Test email service
- `POST /api/email/send-bulk` - Send bulk emails
- `POST /api/email/send-notification` - Send notification to specific users
- `GET /api/email/status` - Get email service status
- `GET /api/email/templates` - Get available templates

### Authentication

- `POST /api/auth/forgot-password` - Send password reset email
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/test-email` - Test email service (admin only)

## Integration Points

The email service is automatically integrated with:

1. **User Registration** - Sends welcome email
2. **Assignment Creation** - Sends notifications to enrolled students
3. **Password Reset** - Sends reset link via email
4. **Notifications** - Can send email notifications for various events

## Usage Examples

### Sending Welcome Email

```javascript
const emailService = require('./services/emailService');

// Automatically sent when user registers
await emailService.sendWelcomeEmail(user);
```

### Sending Assignment Notification

```javascript
// Automatically sent when faculty creates assignment
await emailService.sendAssignmentNotification(student, assignment);
```

### Sending Bulk Email

```javascript
// Send to all students
const users = await User.find({ role: 'student' });
await emailService.sendBulkEmail(users, 'Subject', 'template-name', data);
```

### Sending Custom Email

```javascript
await emailService.sendEmail(
  'user@example.com',
  'Custom Subject',
  'template-name',
  { customData: 'value' }
);
```

## Email Templates

Templates are located in `services/templates/` and use handlebars-style placeholders:

- `{{name}}` - User's name
- `{{subject}}` - Email subject
- `{{message}}` - Email message
- `{{actionUrl}}` - Call-to-action URL
- `{{currentYear}}` - Current year
- `{{institutionName}}` - Institution name

## Troubleshooting

### Common Issues

1. **Email not sending in development:**
   - Check console for Ethereal Email preview URL
   - Verify email service configuration

2. **Gmail authentication failed:**
   - Ensure 2FA is enabled
   - Use App Password, not regular password
   - Check if "Less secure app access" is enabled (if not using App Password)

3. **SendGrid emails not sending:**
   - Verify API key is correct
   - Check SendGrid account status
   - Verify sender email is verified

4. **Template not found:**
   - Check template file exists in `services/templates/`
   - Verify template name spelling

### Debug Mode

Enable debug logging by setting:

```env
NODE_ENV=development
```

This will show detailed email service logs in the console.

## Security Considerations

1. **Environment Variables:** Never commit email credentials to version control
2. **Rate Limiting:** Email endpoints are rate-limited to prevent abuse
3. **Authentication:** Email management endpoints require admin privileges
4. **Token Expiry:** Password reset tokens expire after 24 hours
5. **User Consent:** Only send emails to users who haven't opted out

## Production Deployment

For production deployment:

1. Use a reliable email service (SendGrid, AWS SES, etc.)
2. Set up proper DNS records (SPF, DKIM, DMARC)
3. Monitor email delivery rates
4. Set up email bounce handling
5. Implement email queue for high-volume sending

## Support

For issues with the email service:

1. Check the console logs for error messages
2. Verify environment variable configuration
3. Test with the `/api/email/test` endpoint
4. Check email service provider status

