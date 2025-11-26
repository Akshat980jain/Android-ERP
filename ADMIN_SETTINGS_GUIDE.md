# Admin Settings - Quick Reference Guide

## Accessing Settings

1. **Login** as an administrator
2. Find **Settings** in the left sidebar under "System & Settings" section
3. Click to open the Settings module

## Settings Overview

### 🏢 System Settings Tab

#### Institution Information
Configure your institution's basic information:
- **Name:** Your institution's official name
- **Email:** Primary contact email
- **Phone:** Contact phone number
- **Website:** Official website URL
- **Address:** Complete physical address

💡 **Tip:** This information appears in official documents and communications.

#### Academic Configuration
Manage academic year and semester settings:
- **Academic Year:** Current academic year (e.g., 2024)
- **Current Semester:** Active semester (1st through 8th)
- **Pass Percentage:** Minimum percentage to pass (default: 40%)
- **Attendance Requirement:** Minimum attendance percentage (default: 75%)

💡 **Tip:** These settings affect all students and faculty.

#### Security & Authentication
Control system security settings:
- **Password Length:** Minimum characters required (default: 8)
- **Login Attempts:** Maximum failed attempts before lockout (default: 5)
- **Two-Factor Auth:** Enable/disable 2FA requirement

⚠️ **Important:** Changing security settings affects all users.

#### Your 2FA Setup (Personal)
Secure your admin account:
1. Click **"Enable Two-Factor"**
2. Scan QR code with authenticator app (Google Authenticator, Authy, etc.)
3. Enter 6-digit code from app
4. Click **"Verify & Enable"**

✅ **Recommended:** Enable 2FA for admin accounts.

### 👤 User Preferences Tab

#### Appearance Settings
- **Theme:** Light, Dark, or Auto (follows system)
- **Language:** English, Hindi, or Spanish
- **Timezone:** Set your timezone for accurate timestamps

#### Dashboard Customization
- **Default View:** Choose which dashboard section opens first
- **Refresh Interval:** How often dashboard auto-updates (in seconds)

💡 **Tip:** Set refresh interval based on your network speed.

#### Privacy Controls
Control who can see your information:
- **Profile Visibility:** Who can view your profile
- **Contact Info:** Who can see your contact details
- **Academic Info:** Who can access your academic data

### 🔔 Notification Settings Tab

#### General Notifications
Choose how you receive notifications:
- ✉️ **Email Notifications:** Receive updates via email
- 📱 **SMS Notifications:** Get text message alerts
- 🔔 **Push Notifications:** Browser/app push notifications

#### Academic Alerts
Control academic notifications:
- 📝 Assignment Updates
- 📋 Exam Notifications
- 🎓 Grade Updates
- ✅ Attendance Alerts

#### Financial Alerts
Manage financial notifications:
- 💰 Fee Reminders
- ✅ Payment Confirmations
- ⚠️ Overdue Notices

#### Event Notifications
Stay informed about events:
- 📅 Upcoming Events
- ⏰ Event Reminders
- 🔄 Schedule Changes

## Common Tasks

### Update Institution Name
1. Go to **Settings** → **System Settings**
2. Find **Institution Information** section
3. Update **Institution Name** field
4. Click **Save Settings** at bottom

### Enable Two-Factor Authentication
1. Go to **Settings** → **System Settings**
2. Scroll to **Two-Factor Authentication** section
3. Click **Enable Two-Factor**
4. Scan QR code with authenticator app
5. Enter verification code
6. Click **Verify & Enable**

### Change Theme
1. Go to **Settings** → **User Preferences**
2. Select desired theme from **Theme** dropdown
3. Click **Save Preferences**

### Turn Off Email Notifications
1. Go to **Settings** → **Notification Settings**
2. Uncheck **Email Notifications** under General
3. Click **Save Notification Settings**

## Troubleshooting

### Can't See Settings Tab
- **Issue:** Settings option not visible in sidebar
- **Solution:** Verify you're logged in as admin

### Changes Not Saving
- **Issue:** Settings don't persist after refresh
- **Solution:** 
  1. Check internet connection
  2. Look for error messages
  3. Try logging out and back in

### 2FA QR Code Not Showing
- **Issue:** QR code doesn't appear
- **Solution:**
  1. Click **Enable Two-Factor** again
  2. Wait a few seconds
  3. Check browser console for errors

### Settings Appear Grayed Out
- **Issue:** Can't edit certain settings
- **Solution:** Some settings require super-admin privileges

## Best Practices

✅ **Do's:**
- Enable 2FA for enhanced security
- Keep institution information up to date
- Review notification settings regularly
- Test changes in development first
- Document configuration changes
- Backup settings before major changes

❌ **Don'ts:**
- Don't disable security features without reason
- Don't set password length below 8 characters
- Don't ignore error messages
- Don't make changes during active exams
- Don't share 2FA codes

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + S` | Save settings (when in form) |
| `Esc` | Close modals/popups |
| `Tab` | Navigate between fields |

## Support & Help

If you encounter issues:
1. Check this guide first
2. Review error messages
3. Contact system administrator
4. Check server logs (if technical)

## Additional Resources

- Full implementation details: See `SETTINGS_IMPLEMENTATION.md`
- API documentation: `/api/settings` endpoints
- Security guide: Contact IT department
- Training videos: [Coming soon]

---

**Last Updated:** October 28, 2025
**Version:** 1.0.0

💡 **Quick Tip:** Bookmark this page for easy access!

