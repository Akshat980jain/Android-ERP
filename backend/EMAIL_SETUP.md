# Email Service Setup Guide (Resend)

This guide explains how to set up and configure the email service using **Resend** for your EduConnect ERP application.

## Overview

The email service uses [Resend](https://resend.com) to send various types of notifications and emails to users. Resend provides a simple API for sending emails with excellent deliverability.

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

## Configuration

### Step 1: Get a Resend API Key

1. Go to [resend.com](https://resend.com) and sign up
2. In the dashboard, go to **API Keys**
3. Click **Create API Key**
4. Copy the API key (starts with `re_`)

### Step 2: Configure Environment Variables

Add these variables to your `.env` file:

```env
# Resend Email Configuration
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=your-email@gmail.com

# Test Email (for testing email service)
TEST_EMAIL=your-email@gmail.com

# Client URL (for email links)
CLIENT_URL=http://localhost:5173
```

### Step 3: Domain Verification (Optional but Recommended)

For production, verify your domain in Resend:

1. Go to Resend Dashboard → **Domains**
2. Click **Add Domain**
3. Add the DNS records to your domain
4. Wait for verification (usually takes a few minutes)

Once verified, update your `RESEND_FROM_EMAIL` to use your domain:
```env
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

## Testing the Email Service

### Test Email Service:
```bash
cd backend
node test-email.js
```

### Via API:
```bash
POST /api/email/test
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "email": "test@example.com"
}
```

### Get Email Service Status:
```bash
GET /api/email/status
Authorization: Bearer <admin-token>
```

## Email Templates

Located in `backend/services/templates/`:

1. **welcome.html** - New user welcome emails
2. **password-reset.html** - Password reset links
3. **assignment-notification.html** - New assignment notifications
4. **fee-reminder.html** - Fee payment reminders
5. **test.html** - Test email template

## Troubleshooting

### "Email service not configured" error
- Make sure `RESEND_API_KEY` is set in your `.env` file
- Ensure the API key is valid and not expired

### Email not being delivered
- Check the Resend dashboard for delivery status
- Verify your domain for better deliverability
- Check spam folder

### "The from address is not verified" error
- You need to verify a domain in Resend, or
- Use the Resend test domain: `onboarding@resend.dev`

## Free Tier Limits

Resend offers:
- **100 emails/day** for free
- **3,000 emails/month** on the free tier

For higher volumes, upgrade your Resend plan.
