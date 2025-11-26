# Gmail Email Setup Guide

## Quick Setup Steps

### 1. Enable 2-Step Verification
- Go to https://myaccount.google.com/
- Security → 2-Step Verification → Turn it on
- Follow the verification steps

### 2. Generate App Password
- Go to https://myaccount.google.com/
- Security → App passwords
- Select: Mail + Other (Custom name)
- Name: "EduConnect"
- Click Generate
- Copy the 16-character password

### 3. Create .env File
Create `backend/.env` with this content:

```env
# Production mode - uses real email
NODE_ENV=production

# Gmail Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=YOUR_ACTUAL_EMAIL@gmail.com
EMAIL_PASSWORD=YOUR_16_DIGIT_APP_PASSWORD
EMAIL_FROM=EduConnect <YOUR_ACTUAL_EMAIL@gmail.com>

# Test Email
TEST_EMAIL=YOUR_ACTUAL_EMAIL@gmail.com

# Client URL
CLIENT_URL=http://localhost:5173

# Database Configuration
MONGODB_URI=mongodb+srv://akshat980jain:zm3aHd1m1a4pxU7q@cluster0.nkrpubg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=30d

# Server Configuration
PORT=5000

# CORS Configuration
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=1000
```

### 4. Replace Values
- `YOUR_ACTUAL_EMAIL@gmail.com` → Your real Gmail address
- `YOUR_16_DIGIT_APP_PASSWORD` → App password (remove spaces)

### 5. Test Configuration
```bash
cd backend
node test-real-email.js
```

## Example Configuration
```env
EMAIL_SERVICE=gmail
EMAIL_USER=john.doe@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
EMAIL_FROM=EduConnect <john.doe@gmail.com>
TEST_EMAIL=john.doe@gmail.com
```

## Troubleshooting

### "Invalid credentials" error
- Make sure you're using App Password, not regular password
- Ensure 2-Step Verification is enabled
- Check for extra spaces in the password

### "Less secure app access" error
- Use App Passwords (more secure)
- Regular passwords won't work with modern Gmail

### "Authentication failed" error
- Double-check email and password
- Remove any extra spaces from App Password
- Make sure 2-Step Verification is enabled
