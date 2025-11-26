import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import OtpVerificationScreen from '../screens/auth/OtpVerificationScreen';

// Dashboard Screens
import StudentDashboard from '../screens/dashboard/StudentDashboard';
import FacultyDashboard from '../screens/dashboard/FacultyDashboard';
import AdminDashboard from '../screens/dashboard/AdminDashboard';

// Module Screens
import AcademicScreen from '../screens/modules/AcademicScreen';
import AttendanceScreen from '../screens/modules/AttendanceScreen';
import AssignmentsScreen from '../screens/modules/AssignmentsScreen';
import MarksScreen from '../screens/modules/MarksScreen';
import ScheduleScreen from '../screens/modules/ScheduleScreen';
import NotificationsScreen from '../screens/modules/NotificationsScreen';
import LibraryScreen from '../screens/modules/LibraryScreen';
import FinanceScreen from '../screens/modules/FinanceScreen';
import ProfileScreen from '../screens/modules/ProfileScreen';
import SettingsScreen from '../screens/modules/SettingsScreen';
import EventsScreen from '../screens/modules/EventsScreen';
import ReportsScreen from '../screens/modules/ReportsScreen';

// Common Screens
import LoadingScreen from '../screens/common/LoadingScreen';

// Admin Screens
import RequestApprovalScreen from '../screens/admin/RequestApprovalScreen';
import AdminAcademicScreen from '../screens/admin/AdminAcademicScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

// Student Tab Navigator
function StudentTabNavigator() {
  const { theme } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Academic':
              iconName = focused ? 'school' : 'school-outline';
              break;
            case 'Assignments':
              iconName = focused ? 'document-text' : 'document-text-outline';
              break;
            case 'Schedule':
              iconName = focused ? 'calendar' : 'calendar-outline';
              break;
            case 'Library':
              iconName = focused ? 'book' : 'book-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-circle-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          elevation: 8,
          boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.1)',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={StudentDashboard} />
      <Tab.Screen name="Academic" component={AcademicScreen} />
      <Tab.Screen name="Assignments" component={AssignmentsScreen} />
      <Tab.Screen name="Schedule" component={ScheduleScreen} />
      <Tab.Screen name="Library" component={LibraryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Faculty Tab Navigator
function FacultyTabNavigator() {
  const { theme } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Courses':
              iconName = focused ? 'book' : 'book-outline';
              break;
            case 'Attendance':
              iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline';
              break;
            case 'Marks':
              iconName = focused ? 'trophy' : 'trophy-outline';
              break;
            case 'Schedule':
              iconName = focused ? 'calendar' : 'calendar-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-circle-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          elevation: 8,
          boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.1)',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={FacultyDashboard} />
      <Tab.Screen name="Courses" component={AcademicScreen} />
      <Tab.Screen name="Attendance" component={AttendanceScreen} />
      <Tab.Screen name="Marks" component={MarksScreen} />
      <Tab.Screen name="Schedule" component={ScheduleScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Admin Tab Navigator (Bottom Navigation)
function AdminTabNavigator() {
  const { theme } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          elevation: 8,
          boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.1)',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={AdminDashboard}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={28} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Academic"
        component={AdminAcademicScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="school" size={28} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="bar-chart" size={28} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Schedule"
        component={ScheduleScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="calendar" size={28} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Events"
        component={EventsScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="balloon" size={28} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Finance"
        component={FinanceScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="card" size={28} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" size={28} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Main App Navigator
function AppNavigator() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  const renderMain = () => {
    if (!isAuthenticated) {
      return (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
        </>
      );
    }

    // Fallback route in case user role is missing or unexpected
    const role = user?.role;
    if (role === 'student') {
      return <Stack.Screen name="StudentApp" component={StudentTabNavigator} />;
    }
    if (role === 'faculty') {
      return <Stack.Screen name="FacultyApp" component={FacultyTabNavigator} />;
    }
    if (role === 'admin') {
      return <Stack.Screen name="AdminApp" component={AdminTabNavigator} />;
    }
    // Unknown role -> show login to recover
    return <Stack.Screen name="Login" component={LoginScreen} />;
  };

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {renderMain()}
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="RequestApproval" component={RequestApprovalScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;
