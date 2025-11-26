# Android ERP - Educational Management System

A comprehensive full-stack Educational ERP (Enterprise Resource Planning) system built with modern web and mobile technologies. This platform provides a complete solution for managing educational institutions, including student management, faculty operations, administrative tasks, and real-time communication.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## 🎯 Overview

Android ERP is a modern, scalable educational management system designed to streamline operations for educational institutions. The system consists of three main components:

- **Backend API** - RESTful API built with Node.js and Express
- **Web Frontend** - Modern web application built with React, TypeScript, and Vite
- **Mobile App** - Cross-platform mobile application built with React Native and Expo

## ✨ Features

### 🔐 Authentication & Security
- Multi-factor authentication with email OTP verification
- JWT-based token authentication
- Role-based access control (Student, Faculty, Admin)
- Secure password reset functionality
- Session management with automatic token refresh
- Rate limiting and security headers (Helmet)

### 👨‍🎓 Student Features
- **Dashboard** - Personalized academic overview with quick actions
- **Academic Module** - Course enrollment, grades, and academic progress tracking
- **Assignments** - Submit assignments, track deadlines, and view feedback
- **Schedule** - Interactive class timetable with event management
- **Library** - Browse catalog, issue books, and track returns
- **Finance** - View fee status, payment history, and pending dues
- **Notifications** - Real-time updates and alerts via Socket.IO
- **Profile Management** - Update personal information and preferences

### 👨‍🏫 Faculty Features
- **Dashboard** - Teaching overview with upcoming classes and tasks
- **Course Management** - Manage assigned courses and course materials
- **Attendance** - Mark and track student attendance with analytics
- **Marks Management** - Grade assignments, exams, and provide feedback
- **Schedule** - View teaching schedule and manage office hours
- **Student Management** - Access student records and performance data
- **Reports** - Generate attendance and performance reports

### 👨‍💼 Admin Features
- **Dashboard** - System-wide analytics and key metrics
- **User Management** - Create, update, and manage user accounts
- **Course Management** - Configure courses, programs, and curriculum
- **Reports & Analytics** - Comprehensive reporting with data visualization
- **Events Management** - Create and manage institutional events
- **Finance Management** - Oversee fee collection and financial operations
- **System Settings** - Configure system parameters and preferences
- **Audit Logs** - Track system activities and user actions

### 🔄 Real-time Features
- Live notifications via WebSocket (Socket.IO)
- Real-time attendance updates
- Instant messaging and announcements
- Live dashboard updates

## 🛠 Technology Stack

### Backend
- **Runtime**: Node.js (v16+)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken), bcryptjs
- **Real-time**: Socket.IO
- **Email**: Nodemailer
- **Security**: Helmet, express-rate-limit, express-validator
- **File Upload**: Multer
- **Scheduling**: node-cron
- **2FA**: Speakeasy, QRCode

### Frontend (Web)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM v7
- **Forms**: React Hook Form with Zod validation
- **UI Components**: Custom components with class-variance-authority
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Real-time**: Socket.IO Client

### Mobile (Android/iOS)
- **Framework**: React Native with Expo SDK 54
- **Language**: TypeScript
- **Navigation**: React Navigation (Stack, Drawer, Bottom Tabs)
- **UI Library**: React Native Paper
- **Storage**: AsyncStorage
- **Animations**: React Native Reanimated
- **Real-time**: Socket.IO Client
- **Notifications**: Expo Notifications

## 📁 Project Structure

```
Android-ERP/
├── backend/                    # Backend API server
│   ├── config/                # Configuration files
│   ├── controllers/           # Route controllers
│   ├── middleware/            # Custom middleware
│   ├── models/                # MongoDB models (29 models)
│   ├── routes/                # API routes (26 route files)
│   ├── services/              # Business logic services
│   ├── scripts/               # Utility scripts
│   ├── uploads/               # File upload directory
│   ├── app.js                 # Main application file
│   ├── package.json           # Backend dependencies
│   └── .env                   # Environment variables (not in git)
│
├── frontend/                  # Web application
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── admin/       # Admin-specific components
│   │   │   ├── auth/        # Authentication components
│   │   │   ├── dashboard/   # Dashboard components
│   │   │   ├── layout/      # Layout components
│   │   │   ├── modules/     # Feature modules
│   │   │   └── ui/          # Reusable UI components
│   │   ├── contexts/        # React contexts (Auth, Background)
│   │   ├── types/           # TypeScript type definitions
│   │   ├── utils/           # Utility functions
│   │   ├── App.tsx          # Main app component
│   │   └── main.tsx         # Application entry point
│   ├── public/              # Static assets
│   ├── index.html           # HTML template
│   ├── vite.config.ts       # Vite configuration
│   ├── tailwind.config.js   # Tailwind CSS configuration
│   └── package.json         # Frontend dependencies
│
├── android/                   # Mobile application
│   ├── src/
│   │   ├── components/      # React Native components
│   │   ├── contexts/        # React contexts
│   │   ├── navigation/      # Navigation configuration
│   │   ├── screens/         # Screen components
│   │   │   ├── auth/       # Authentication screens
│   │   │   ├── dashboard/  # Dashboard screens
│   │   │   ├── modules/    # Feature modules
│   │   │   └── common/     # Common screens
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   ├── assets/             # Images, icons, fonts
│   ├── App.tsx             # Main app component
│   ├── app.json            # Expo configuration
│   └── package.json        # Mobile dependencies
│
├── .gitignore              # Git ignore rules
└── README.md               # This file
```

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16.0.0 or higher)
- **npm** or **yarn** package manager
- **MongoDB** (v4.0 or higher) - local or cloud instance
- **Git** for version control

For mobile development:
- **Expo CLI** - `npm install -g @expo/cli`
- **Android Studio** (for Android development)
- **Xcode** (for iOS development, macOS only)

### System Requirements

- **OS**: Windows, macOS, or Linux
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 2GB free space
- **Network**: Stable internet connection for package installation

## 📦 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Akshat980jain/Android-ERP.git
cd Android-ERP
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp env-template.txt .env

# Edit .env file with your configuration
# See Configuration section below
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install
```

### 4. Mobile App Setup

```bash
# Navigate to android directory
cd ../android

# Install dependencies
npm install

# Update network configuration (if needed)
npm run setup-network
```

## ⚙️ Configuration

### Backend Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/erp_database
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/erp_database

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRE=7d

# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
EMAIL_FROM=your-email@gmail.com

# SMTP Configuration (Alternative)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false

# Application URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# Session
SESSION_SECRET=your_session_secret_here
```

> **Note**: For Gmail setup, you need to generate an App Password. See `backend/GMAIL_SETUP.md` for detailed instructions.

### Frontend Configuration

The frontend automatically connects to `http://localhost:5000` for the backend API. To change this, update the API base URL in your frontend configuration.

### Mobile App Configuration

Update the API endpoint in `android/src/services/api.ts` to point to your backend server:

```typescript
// For local development
const API_BASE_URL = 'http://YOUR_LOCAL_IP:5000/api';

// For production
const API_BASE_URL = 'https://your-production-api.com/api';
```

Use the network configuration script to automatically update your IP:

```bash
cd android
npm run setup-network
```

## 🏃 Running the Application

### Quick Start (All Services)

Use the provided batch scripts to start all services at once:

```bash
# Start all servers (backend + frontend)
start-all-servers.bat

# Quick start (without waiting)
start-servers-quick.bat

# Stop all servers
stop-all-servers.bat
```

> **Note**: `.bat` files are excluded from git tracking as per `.gitignore` configuration.

### Manual Start

#### 1. Start MongoDB

```bash
# If using local MongoDB
mongod
```

#### 2. Start Backend Server

```bash
cd backend

# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The backend API will be available at `http://localhost:5000`

#### 3. Start Frontend Application

```bash
cd frontend

# Development mode
npm run dev

# The app will open at http://localhost:5173
```

#### 4. Start Mobile App

```bash
cd android

# Start Expo development server
npm start

# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios

# Run on web
npm run web
```

### First-Time Setup

#### Seed the Database

```bash
cd backend
node seedDatabase.js
```

This will create:
- Default admin account
- Sample students and faculty
- Sample courses and programs
- Test data for all modules

#### Default Login Credentials

After seeding, you can login with:

**Admin Account:**
- Email: `admin@example.com`
- Password: `admin123`

**Student Account:**
- Email: `student@example.com`
- Password: `student123`

**Faculty Account:**
- Email: `faculty@example.com`
- Password: `faculty123`

> **Important**: Change these default passwords in production!

## 🌐 Deployment

### Backend Deployment

#### Option 1: Traditional Hosting (VPS/Cloud)

```bash
# Build and prepare for production
cd backend

# Install production dependencies only
npm install --production

# Start with PM2 (process manager)
npm install -g pm2
pm2 start app.js --name erp-backend
pm2 save
pm2 startup
```

#### Option 2: Docker

```bash
# Create Dockerfile in backend directory
docker build -t erp-backend .
docker run -p 5000:5000 erp-backend
```

#### Option 3: Cloud Platforms

- **Heroku**: Use the Heroku CLI and deploy directly
- **AWS**: Deploy to EC2, Elastic Beanstalk, or ECS
- **Google Cloud**: Deploy to App Engine or Cloud Run
- **Azure**: Deploy to App Service

### Frontend Deployment

```bash
cd frontend

# Build for production
npm run build

# The build output will be in the 'dist' directory
```

Deploy the `dist` folder to:
- **Vercel**: `vercel deploy`
- **Netlify**: `netlify deploy`
- **GitHub Pages**: Use GitHub Actions
- **AWS S3 + CloudFront**: Upload to S3 bucket

### Mobile App Deployment

#### Android (Google Play Store)

```bash
cd android

# Build APK
expo build:android

# Or build AAB (recommended for Play Store)
eas build --platform android
```

#### iOS (App Store)

```bash
cd android

# Build for iOS
expo build:ios

# Or use EAS Build
eas build --platform ios
```

## 📚 API Documentation

### Base URL

```
http://localhost:5000/api
```

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | User login |
| POST | `/auth/verify-otp` | Verify OTP for 2FA |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password |
| GET | `/auth/me` | Get current user |
| POST | `/auth/logout` | Logout user |

### Student Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/students/dashboard` | Get student dashboard |
| GET | `/students/courses` | Get enrolled courses |
| GET | `/students/assignments` | Get assignments |
| POST | `/students/assignments/:id/submit` | Submit assignment |
| GET | `/students/schedule` | Get class schedule |
| GET | `/students/grades` | Get grades |
| GET | `/students/library` | Get library records |
| GET | `/students/finance` | Get fee status |

### Faculty Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/faculty/dashboard` | Get faculty dashboard |
| GET | `/faculty/courses` | Get assigned courses |
| POST | `/faculty/attendance` | Mark attendance |
| GET | `/faculty/students` | Get student list |
| POST | `/faculty/grades` | Submit grades |
| GET | `/faculty/schedule` | Get teaching schedule |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/dashboard` | Get admin dashboard |
| GET | `/admin/users` | Get all users |
| POST | `/admin/users` | Create new user |
| PUT | `/admin/users/:id` | Update user |
| DELETE | `/admin/users/:id` | Delete user |
| GET | `/admin/reports` | Get system reports |
| POST | `/admin/events` | Create event |
| GET | `/admin/analytics` | Get analytics data |

### WebSocket Events

The application uses Socket.IO for real-time communication:

```javascript
// Client-side connection
const socket = io('http://localhost:5000');

// Listen for notifications
socket.on('notification', (data) => {
  console.log('New notification:', data);
});

// Listen for attendance updates
socket.on('attendance-update', (data) => {
  console.log('Attendance updated:', data);
});
```

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Workflow

1. **Fork the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Android-ERP.git
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Follow the existing code style
   - Write meaningful commit messages
   - Add tests if applicable

4. **Commit your changes**
   ```bash
   git commit -m "Add: amazing feature description"
   ```

5. **Push to your branch**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open a Pull Request**
   - Provide a clear description of changes
   - Reference any related issues
   - Ensure all tests pass

### Code Style Guidelines

- **TypeScript**: Use strict type checking
- **React**: Use functional components with hooks
- **Naming**: Use camelCase for variables, PascalCase for components
- **Comments**: Write clear, concise comments for complex logic
- **Formatting**: Use Prettier for consistent formatting

### Commit Message Convention

```
Type: Brief description

- Add: New feature
- Fix: Bug fix
- Update: Update existing feature
- Refactor: Code refactoring
- Docs: Documentation changes
- Style: Code style changes
- Test: Add or update tests
```

## 🐛 Troubleshooting

### Common Issues

#### Backend Issues

**MongoDB Connection Error**
```bash
# Check if MongoDB is running
mongod --version

# Start MongoDB service
# Windows: net start MongoDB
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

**Port Already in Use**
```bash
# Find process using port 5000
# Windows: netstat -ano | findstr :5000
# macOS/Linux: lsof -i :5000

# Kill the process or change PORT in .env
```

**Email Not Sending**
- Verify Gmail App Password is correct
- Check `backend/GMAIL_SETUP.md` for setup instructions
- Ensure 2FA is enabled on Gmail account
- Test with `node test-email.js`

#### Frontend Issues

**Build Errors**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf .vite
npm run dev
```

**API Connection Issues**
- Verify backend is running on port 5000
- Check CORS configuration in backend
- Ensure API base URL is correct

#### Mobile App Issues

**Metro Bundler Issues**
```bash
# Clear cache
npx expo start --clear

# Reset Metro bundler
rm -rf .expo
npm start
```

**Network Connection Issues**
```bash
# Update IP configuration
npm run setup-network

# Ensure backend allows connections from your IP
# Check firewall settings
```

**Android Build Issues**
```bash
# Clean Android build
cd android && ./gradlew clean

# Rebuild
npm run android
```

**Dependency Conflicts**
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install

# For Expo-specific issues
expo doctor
```

### Getting Help

- **Documentation**: Check the docs in each module directory
- **Issues**: Create an issue on GitHub with detailed information
- **Email Setup**: See `backend/GMAIL_SETUP.md`
- **Email Configuration**: See `backend/EMAIL_SETUP.md`

## 📄 License

This project is licensed under the ISC License.

## 🙏 Acknowledgments

- **Express.js** - Fast, unopinionated web framework
- **React** - UI library for building user interfaces
- **Expo** - Platform for universal React applications
- **MongoDB** - NoSQL database
- **Socket.IO** - Real-time bidirectional communication
- **Tailwind CSS** - Utility-first CSS framework
- **React Native Paper** - Material Design for React Native

## 📞 Support

For support and questions:
- **GitHub Issues**: [Create an issue](https://github.com/Akshat980jain/Android-ERP/issues)
- **Email**: Contact the repository owner
- **Documentation**: Check module-specific README files

---

**Built with ❤️ for Educational Institutions**

*Last Updated: November 2025*
