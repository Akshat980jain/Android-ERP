import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Avatar,
  Chip,
  FAB,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import apiService from '../../services/api';

export default function FacultyDashboard({ navigation }: any) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState({
    totalStudents: 0,
    courses: 0,
    pendingAttendance: 0,
    assignmentsToGrade: 0,
    notifications: 0,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const [coursesRes, studentsRes, notificationsRes] = await Promise.all([
        apiService.getFacultyCourses(),
        apiService.getFacultyStudents(),
        apiService.getNotifications(),
      ]);

      const coursesCount = Array.isArray((coursesRes as any)?.data) ? (coursesRes as any).data.length : 0;
      const studentsCount = Array.isArray((studentsRes as any)?.data) ? (studentsRes as any).data.length : 0;
      const unread = Array.isArray((notificationsRes as any)?.data)
        ? (notificationsRes as any).data.filter?.((n: any) => !n.isRead)?.length ?? 0
        : (notificationsRes as any)?.data?.unreadCount ?? 0;

      setDashboardData(prev => ({
        ...prev,
        courses: coursesCount,
        totalStudents: studentsCount,
        notifications: unread,
      }));
    } catch (err) {
      console.error('Error refreshing dashboard:', err);
      setError('Failed to load latest data');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    onRefresh();
  }, []);

  const quickActions = [
    {
      title: 'Mark Attendance',
      icon: 'check-circle-outline',
      color: '#3B82F6',
      onPress: () => navigation.navigate('Attendance'),
    },
    {
      title: 'Add Marks',
      icon: 'trophy-outline',
      color: '#10B981',
      onPress: () => navigation.navigate('Marks'),
    },
    {
      title: 'My Courses',
      icon: 'book-outline',
      color: '#F59E0B',
      onPress: () => navigation.navigate('Courses'),
    },
    {
      title: 'Schedule',
      icon: 'calendar-outline',
      color: '#8B5CF6',
      onPress: () => navigation.navigate('Schedule'),
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <View style={styles.headerContent}>
          <Avatar.Text
            size={60}
            label={`${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`}
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>
              {user?.name ? `Prof. ${user.name}` : `Prof. ${(user?.firstName || '')} ${(user?.lastName || '')}`}
            </Text>
            <Chip mode="outlined" textStyle={styles.chipText} style={{ borderColor: '#fff' }}>
              Faculty
            </Chip>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
        }
      >
        {error ? (<Text style={{ color: theme.colors.notification, marginBottom: 12 }}>{error}</Text>) : null}
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <Card style={[styles.statCard, { backgroundColor: '#3B82F6' }]}>
            <Card.Content style={styles.statContent}>
              <Ionicons name="people" size={24} color="#fff" />
              <Text style={styles.statNumber}>{dashboardData.totalStudents}</Text>
              <Text style={styles.statLabel}>Students</Text>
            </Card.Content>
          </Card>

          <Card style={[styles.statCard, { backgroundColor: '#10B981' }]}>
            <Card.Content style={styles.statContent}>
              <Ionicons name="book" size={24} color="#fff" />
              <Text style={styles.statNumber}>{dashboardData.courses}</Text>
              <Text style={styles.statLabel}>Courses</Text>
            </Card.Content>
          </Card>

          <Card style={[styles.statCard, { backgroundColor: '#F59E0B' }]}>
            <Card.Content style={styles.statContent}>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
              <Text style={styles.statNumber}>{dashboardData.pendingAttendance}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </Card.Content>
          </Card>

          <Card style={[styles.statCard, { backgroundColor: '#EF4444' }]}>
            <Card.Content style={styles.statContent}>
              <Ionicons name="document-text" size={24} color="#fff" />
              <Text style={styles.statNumber}>{dashboardData.assignmentsToGrade}</Text>
              <Text style={styles.statLabel}>To Grade</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Quick Actions */}
        <Card style={[styles.quickActionsCard, { backgroundColor: theme.colors.card }]}>
          <Card.Content>
            <Title style={{ color: theme.colors.text }}>Quick Actions</Title>
            <View style={styles.quickActionsGrid}>
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  mode="outlined"
                  onPress={action.onPress}
                  style={[styles.quickActionButton, { borderColor: action.color }]}
                  labelStyle={{ color: action.color }}
                  icon={action.icon}
                >
                  {action.title}
                </Button>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Today's Schedule */}
        <Card style={[styles.scheduleCard, { backgroundColor: theme.colors.card }]}>
          <Card.Content>
            <Title style={{ color: theme.colors.text }}>Today's Schedule</Title>
            <View style={styles.scheduleItem}>
              <View style={[styles.scheduleTime, { backgroundColor: '#3B82F6' }]}>
                <Text style={styles.scheduleTimeText}>09:00</Text>
              </View>
              <View style={styles.scheduleContent}>
                <Text style={[styles.scheduleTitle, { color: theme.colors.text }]}>Data Structures</Text>
                <Text style={[styles.scheduleLocation, { color: theme.colors.textSecondary }]}>Room 101</Text>
              </View>
            </View>
            <View style={styles.scheduleItem}>
              <View style={[styles.scheduleTime, { backgroundColor: '#10B981' }]}>
                <Text style={styles.scheduleTimeText}>11:00</Text>
              </View>
              <View style={styles.scheduleContent}>
                <Text style={[styles.scheduleTitle, { color: theme.colors.text }]}>Algorithms</Text>
                <Text style={[styles.scheduleLocation, { color: theme.colors.textSecondary }]}>Room 203</Text>
              </View>
            </View>
            <View style={styles.scheduleItem}>
              <View style={[styles.scheduleTime, { backgroundColor: '#F59E0B' }]}>
                <Text style={styles.scheduleTimeText}>14:00</Text>
              </View>
              <View style={styles.scheduleContent}>
                <Text style={[styles.scheduleTitle, { color: theme.colors.text }]}>Database Systems</Text>
                <Text style={[styles.scheduleLocation, { color: theme.colors.textSecondary }]}>Lab 1</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Recent Activity */}
        <Card style={[styles.activityCard, { backgroundColor: theme.colors.card }]}>
          <Card.Content>
            <Title style={{ color: theme.colors.text }}>Recent Activity</Title>
            <View style={styles.activityItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <View style={styles.activityContent}>
                <Text style={[styles.activityTitle, { color: theme.colors.text }]}>Attendance marked for DS class</Text>
                <Text style={[styles.activityTime, { color: theme.colors.textSecondary }]}>1 hour ago</Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <Ionicons name="trophy" size={20} color="#F59E0B" />
              <View style={styles.activityContent}>
                <Text style={[styles.activityTitle, { color: theme.colors.text }]}>Graded 15 assignments</Text>
                <Text style={[styles.activityTime, { color: theme.colors.textSecondary }]}>3 hours ago</Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <Ionicons name="document-text" size={20} color="#3B82F6" />
              <View style={styles.activityContent}>
                <Text style={[styles.activityTitle, { color: theme.colors.text }]}>New assignment posted</Text>
                <Text style={[styles.activityTime, { color: theme.colors.textSecondary }]}>1 day ago</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        color="#fff"
        onPress={() => navigation.navigate('Notifications')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  welcomeText: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.9,
  },
  userName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  chipText: {
    color: '#fff',
    fontSize: 12,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    marginBottom: 12,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statNumber: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  quickActionsCard: {
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  quickActionButton: {
    width: '48%',
    marginBottom: 8,
  },
  scheduleCard: {
    marginBottom: 16,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  scheduleTime: {
    width: 60,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  scheduleTimeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scheduleContent: {
    flex: 1,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  scheduleLocation: {
    fontSize: 14,
    marginTop: 2,
  },
  activityCard: {
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  activityContent: {
    marginLeft: 12,
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  activityTime: {
    fontSize: 12,
    marginTop: 2,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
