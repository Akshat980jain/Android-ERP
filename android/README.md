# EduConnect Mobile ERP App

A comprehensive React Native Expo application that mirrors the functionality of the web-based Educational ERP System. This mobile app provides students, faculty, and administrators with access to all essential educational management features on their mobile devices.

## 🚀 Features

### Authentication & Security
- **Multi-factor Authentication** with email OTP verification
- **Role-based Access Control** (Student, Faculty, Admin)
- **Secure Token Management** with AsyncStorage
- **Password Reset** functionality
- **User Registration** with role selection

### Student Features
- **Dashboard** with academic overview and quick actions
- **Academic Module** - View courses, grades, and progress
- **Assignments** - Submit and track assignment status
- **Schedule** - View class timetables and events
- **Library** - Browse and manage book issues
- **Finance** - View fee status and payments
- **Notifications** - Real-time updates and alerts

### Faculty Features
- **Dashboard** with teaching overview and quick actions
- **Course Management** - Manage assigned courses
- **Attendance** - Mark and track student attendance
- **Marks Management** - Grade assignments and exams
- **Schedule** - View teaching schedule
- **Student Management** - View and manage student records

### Admin Features
- **Dashboard** with system overview and analytics
- **User Management** - Create and manage user accounts
- **Reports** - Generate and view system reports
- **Events Management** - Create and manage institutional events
- **Finance Management** - Oversee financial operations
- **System Settings** - Configure system parameters

## 🛠 Technology Stack

- **React Native** with Expo SDK
- **TypeScript** for type safety
- **React Navigation** for navigation
- **React Native Paper** for UI components
- **Expo Linear Gradient** for beautiful gradients
- **AsyncStorage** for local data persistence
- **Socket.IO Client** for real-time communication
- **React Native Charts** for data visualization

## 📱 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- Android Studio (for Android development)
- iOS Simulator (for iOS development, macOS only)

### Installation Steps

1. **Clone the repository**
   ```bash
   cd "E:\Android ERP\android"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on device/simulator**
   ```bash
   # For Android
   npm run android
   
   # For iOS (macOS only)
   npm run ios
   
   # For web
   npm run web
   ```

## 🏗 Project Structure

```
android/
├── src/
│   ├── components/          # Reusable UI components
│   ├── contexts/           # React contexts (Auth, etc.)
│   ├── navigation/         # Navigation configuration
│   ├── screens/           # Screen components
│   │   ├── auth/         # Authentication screens
│   │   ├── dashboard/    # Dashboard screens
│   │   ├── modules/      # Feature modules
│   │   └── common/       # Common screens
│   ├── services/         # API services
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions
├── assets/              # Images, icons, fonts
├── App.tsx             # Main app component
└── package.json        # Dependencies and scripts
```

## 🔧 Configuration

### Backend Integration
The app is configured to connect to the existing ERP backend at `http://localhost:5000`. Update the API base URL in `src/services/api.ts` if your backend runs on a different port or domain.

### Environment Variables
Create a `.env` file in the root directory for environment-specific configurations:

```env
API_BASE_URL=http://localhost:5000/api
SOCKET_URL=http://localhost:5000
```

## 📱 Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm run web` - Run in web browser
- `npm run build` - Build the app for production
- `npm run lint` - Run ESLint for code quality

## 🎨 UI/UX Features

- **Modern Design** with Material Design principles
- **Responsive Layout** that adapts to different screen sizes
- **Dark/Light Theme** support
- **Smooth Animations** and transitions
- **Intuitive Navigation** with bottom tabs and drawer
- **Pull-to-Refresh** functionality
- **Loading States** and error handling

## 🔐 Security Features

- **JWT Token Authentication**
- **Secure Storage** of sensitive data
- **API Request Interceptors** for automatic token handling
- **Input Validation** and sanitization
- **Error Handling** with user-friendly messages

## 📊 Data Management

- **Offline Support** with AsyncStorage
- **Real-time Updates** via Socket.IO
- **Data Synchronization** with backend
- **Caching Strategy** for improved performance

## 🚀 Deployment

### Android APK
```bash
# Build for Android
expo build:android
```

### iOS App Store
```bash
# Build for iOS
expo build:ios
```

### Web Deployment
```bash
# Build for web
expo build:web
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Development Guidelines

- Follow TypeScript best practices
- Use functional components with hooks
- Implement proper error handling
- Write meaningful commit messages
- Test on both Android and iOS devices
- Follow the existing code style and structure

## 🐛 Troubleshooting

### Common Issues

1. **Metro bundler issues**
   ```bash
   npx expo start --clear
   ```

2. **Android build issues**
   ```bash
   cd android && ./gradlew clean
   ```

3. **iOS build issues**
   ```bash
   cd ios && pod install
   ```

4. **Dependency conflicts**
   ```bash
   rm -rf node_modules && npm install
   ```

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the Expo documentation
- Review React Native documentation

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Expo team for the amazing development platform
- React Native Paper for the beautiful UI components
- The open-source community for various libraries and tools

---

**Note**: This mobile app is designed to work seamlessly with the existing web-based ERP system. Make sure the backend server is running and accessible before testing the mobile app features.
