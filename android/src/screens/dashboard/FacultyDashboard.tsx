import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import apiService from '../../services/api';

const { width } = Dimensions.get('window');

// Helper: get today's day name (e.g. "Monday")
const getTodayDayName = (): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
};

// Helper: relative time string
const getRelativeTime = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
};

// Schedule time badge colors rotation
const SCHEDULE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];

interface ScheduleItem {
  _id: string;
  course: { _id: string; name: string; code: string };
  dayOfWeek: string;
  startTime: string;
  endTime?: string;
  room: string;
  type?: string;
  faculty?: { _id: string; name: string };
}

interface AttendanceRecord {
  _id: string;
  course: { _id: string; name: string; code: string };
  student: { _id: string; name: string };
  date: string;
  status: string;
}

export default function FacultyDashboard({ navigation }: any) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Live data state
  const [todaySchedule, setTodaySchedule] = useState<ScheduleItem[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState({
    totalStudents: 0,
    courses: 0,
    notifications: 0,
  });

  const fetchDashboardData = useCallback(async () => {
    setError(null);
    try {
      const [coursesRes, studentsRes, notificationsRes, scheduleRes, attendanceRes] =
        await Promise.all([
          apiService.getFacultyCourses(),
          apiService.getFacultyStudents(),
          apiService.getNotifications(),
          apiService.getSchedule(),
          apiService.getAttendanceStats(),
        ]);

      // ── Courses / students / notifications counts ──
      const coursesData = (coursesRes as any)?.data ?? (coursesRes as any)?.courses ?? [];
      const coursesCount = Array.isArray(coursesData) ? coursesData.length : 0;

      const studentsData = (studentsRes as any)?.data ?? (studentsRes as any)?.students ?? [];
      const studentsCount = Array.isArray(studentsData) ? studentsData.length : 0;

      const notifData = (notificationsRes as any)?.data ?? [];
      const unread = Array.isArray(notifData)
        ? notifData.filter?.((n: any) => !n.isRead)?.length ?? 0
        : (notificationsRes as any)?.data?.unreadCount ?? 0;

      setDashboardData({
        courses: coursesCount,
        totalStudents: studentsCount,
        notifications: unread,
      });

      // ── Today's schedule ──
      const scheduleItems: ScheduleItem[] =
        (scheduleRes as any)?.schedule ?? (scheduleRes as any)?.data ?? [];
      const today = getTodayDayName();
      const todayItems = Array.isArray(scheduleItems)
        ? scheduleItems
          .filter((s) => s.dayOfWeek?.toLowerCase() === today.toLowerCase())
          .sort((a, b) => {
            const ta = a.startTime?.replace(':', '') || '0';
            const tb = b.startTime?.replace(':', '') || '0';
            return parseInt(ta, 10) - parseInt(tb, 10);
          })
        : [];
      setTodaySchedule(todayItems);

      // ── Recent activity (from attendance records) ──
      const attendanceRecords: AttendanceRecord[] =
        (attendanceRes as any)?.attendance ?? (attendanceRes as any)?.data ?? [];

      if (Array.isArray(attendanceRecords) && attendanceRecords.length > 0) {
        // Group by course+date to build meaningful activity entries
        const activityMap = new Map<string, any>();
        attendanceRecords.forEach((rec) => {
          const courseName = rec.course?.name || rec.course?.code || 'Unknown';
          const courseCode = rec.course?.code || '';
          const dateKey = new Date(rec.date).toDateString();
          const key = `${rec.course?._id}-${dateKey}`;
          if (!activityMap.has(key)) {
            activityMap.set(key, {
              key,
              courseName,
              courseCode,
              date: rec.date,
              studentCount: 0,
              type: 'attendance',
            });
          }
          activityMap.get(key)!.studentCount += 1;
        });

        const activities = Array.from(activityMap.values())
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5);
        setRecentActivity(activities);
      } else {
        // Build fallback activity from courses data
        const fallback: any[] = [];
        if (Array.isArray(coursesData)) {
          coursesData.slice(0, 3).forEach((c: any, i: number) => {
            const name = c.name || c.courseName || 'Course';
            const code = c.code || c.courseCode || '';
            fallback.push({
              key: `fallback-${i}`,
              courseName: name,
              courseCode: code,
              date: new Date(Date.now() - i * 3600000).toISOString(),
              studentCount: c.students?.length ?? 0,
              type: i === 0 ? 'attendance' : i === 1 ? 'marks' : 'material',
            });
          });
        }
        setRecentActivity(fallback);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const quickActions = [
    {
      title: 'Mark Attendance',
      icon: 'checkmark-circle' as const,
      colors: ['#3B82F6', '#2563EB'] as [string, string],
      onPress: () => navigation.navigate('Attendance'),
    },
    {
      title: 'Add Marks',
      icon: 'create' as const,
      colors: ['#10B981', '#059669'] as [string, string],
      onPress: () => navigation.navigate('Marks'),
    },
    {
      title: 'My Courses',
      icon: 'book' as const,
      colors: ['#F59E0B', '#D97706'] as [string, string],
      onPress: () => navigation.navigate('Courses'),
    },
    {
      title: 'Schedule',
      icon: 'calendar' as const,
      colors: ['#8B5CF6', '#7C3AED'] as [string, string],
      onPress: () => navigation.navigate('Schedule'),
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'attendance':
        return 'checkmark-circle';
      case 'marks':
        return 'checkmark-circle';
      case 'material':
        return 'checkmark-circle';
      default:
        return 'checkmark-circle';
    }
  };

  const getActivityText = (activity: any) => {
    switch (activity.type) {
      case 'attendance':
        return `Marked attendance for ${activity.courseCode || activity.courseName}, ${activity.studentCount} Student${activity.studentCount !== 1 ? 's' : ''}`;
      case 'marks':
        return `Added Mid-Term Marks for ${activity.courseCode || activity.courseName}, ${activity.studentCount} Student${activity.studentCount !== 1 ? 's' : ''}`;
      case 'material':
        return `Uploaded Course Material for ${activity.courseCode || activity.courseName}`;
      default:
        return `Activity for ${activity.courseName}`;
    }
  };

  const userName = user?.name
    ? `Prof. ${user.name}`
    : `Prof. ${(user as any)?.firstName || ''} ${(user as any)?.lastName || ''}`.trim() || 'Professor';

  const userInitials = `${(user as any)?.firstName?.[0] || user?.name?.[0] || ''}${(user as any)?.lastName?.[0] || ''}`.toUpperCase() || 'F';

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <LinearGradient
          colors={['#0F172A', '#1E293B'] as [string, string]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.avatarPlaceholder} />
            <View style={styles.userInfo}>
              <View style={[styles.textPlaceholder, { width: 100, height: 14 }]} />
              <View style={[styles.textPlaceholder, { width: 180, height: 20, marginTop: 6 }]} />
            </View>
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading dashboard...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* ── Header ── */}
      <LinearGradient colors={['#0F172A', '#1E293B'] as [string, string]} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userInitials}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{userName}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>Faculty</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {error ? (
          <View style={[styles.errorBanner, { backgroundColor: theme.colors.error + '20' }]}>
            <Ionicons name="warning" size={18} color={theme.colors.error} />
            <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
            <TouchableOpacity onPress={onRefresh}>
              <Text style={[styles.retryText, { color: theme.colors.primary }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* ── Quick Actions ── */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickActionWrapper}
              onPress={action.onPress}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={action.colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.quickActionButton}
              >
                <Ionicons name={action.icon} size={20} color="#fff" />
                <Text style={styles.quickActionText}>{action.title}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Today's Schedule ── */}
        <View style={[styles.sectionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.sectionCardTitle, { color: theme.colors.text }]}>
            Today's Schedule
          </Text>
          {todaySchedule.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="calendar-outline"
                size={36}
                color={theme.colors.textSecondary}
              />
              <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
                No classes scheduled for today
              </Text>
            </View>
          ) : (
            todaySchedule.map((item, index) => (
              <View key={item._id || index} style={styles.scheduleItem}>
                <View
                  style={[
                    styles.scheduleTimeBadge,
                    { backgroundColor: SCHEDULE_COLORS[index % SCHEDULE_COLORS.length] },
                  ]}
                >
                  <Text style={styles.scheduleTimeText}>
                    {item.startTime || '--:--'}
                  </Text>
                </View>
                <View style={styles.scheduleInfo}>
                  <Text style={[styles.scheduleCourse, { color: theme.colors.text }]}>
                    {item.course?.code
                      ? `${item.course.code}: ${item.course.name}`
                      : item.course?.name || 'Unknown Course'}
                  </Text>
                  {item.room ? (
                    <Text style={[styles.scheduleRoom, { color: theme.colors.textSecondary }]}>
                      {item.room.toLowerCase().includes('room') || item.room.toLowerCase().includes('lab')
                        ? item.room
                        : `Room ${item.room}`}
                      {item.type && item.type !== 'lecture' ? ` • ${item.type.charAt(0).toUpperCase() + item.type.slice(1)}` : ''}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </View>

        {/* ── Recent Activity ── */}
        <View style={[styles.sectionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, marginBottom: 32 }]}>
          <Text style={[styles.sectionCardTitle, { color: theme.colors.text }]}>
            Recent Activity
          </Text>
          {recentActivity.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="time-outline"
                size={36}
                color={theme.colors.textSecondary}
              />
              <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
                No recent activity
              </Text>
            </View>
          ) : (
            recentActivity.map((activity, index) => (
              <View key={activity.key || index} style={styles.activityItem}>
                <View style={styles.activityIconContainer}>
                  <Ionicons
                    name={getActivityIcon(activity.type) as any}
                    size={22}
                    color="#10B981"
                  />
                </View>
                <View style={styles.activityContent}>
                  <Text style={[styles.activityTitle, { color: theme.colors.text }]}>
                    {getActivityText(activity)}
                  </Text>
                  <Text style={[styles.activityTime, { color: theme.colors.textSecondary }]}>
                    {getRelativeTime(activity.date)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ── Header ──
  header: {
    paddingTop: 52,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(99, 102, 241, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(99, 102, 241, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#C7D2FE',
    fontSize: 20,
    fontWeight: '700',
  },
  userInfo: {
    marginLeft: 14,
    flex: 1,
  },
  welcomeText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '400',
  },
  userName: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 2,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    marginTop: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  roleBadgeText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '600',
  },

  // ── Content ──
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },

  // ── Section Title ──
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontStyle: 'italic',
    marginBottom: 12,
  },

  // ── Quick Actions ──
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quickActionWrapper: {
    width: '48%',
    marginBottom: 10,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  quickActionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },

  // ── Section Card ──
  sectionCard: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },

  // ── Schedule Items ──
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  scheduleTimeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 60,
    alignItems: 'center',
    marginRight: 14,
  },
  scheduleTimeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleCourse: {
    fontSize: 14,
    fontWeight: '600',
  },
  scheduleRoom: {
    fontSize: 12,
    marginTop: 2,
  },

  // ── Activity Items ──
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  activityIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  activityTime: {
    fontSize: 11,
    marginTop: 3,
  },

  // ── Empty / Error States ──
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyStateText: {
    marginTop: 8,
    fontSize: 13,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  errorText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '500',
  },
  retryText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },

  // ── Loading ──
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  textPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 6,
  },
});
