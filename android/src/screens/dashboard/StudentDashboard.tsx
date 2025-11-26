import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import {
  Card,
  Surface,
  IconButton,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import apiService from '../../services/api';
import CircularAttendanceChart from '../../components/CircularAttendanceChart';

const { width } = Dimensions.get('window');

export default function StudentDashboard({ navigation }: any) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attendanceExpanded, setAttendanceExpanded] = useState(false);
  const [todayAttendanceExpanded, setTodayAttendanceExpanded] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    attendance: 0,
    assignments: 0,
    upcomingExams: 0,
    fees: 0,
    notifications: 0,
  });
  const [attendanceData, setAttendanceData] = useState({
    physical: 104,
    placement: 38,
    absent: 13,
    total: 155,
  });
  const [hasAttendance, setHasAttendance] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const userId = user?._id as string | undefined;
      const [meRes, attendanceProbe, assignmentsRes, notificationsRes, eventsRes, feesRes] = await Promise.all([
        apiService.getCurrentUser().then((u) => ({ success: true, user: u } as any)).catch(() => ({ success: false } as any)),
        apiService.getAttendanceSummary(userId),
        apiService.getStudentAssignments(),
        apiService.getNotifications(),
        apiService.getEvents(),
        apiService.getStudentFees(),
      ]);

      const profile = (meRes as any)?.user || {};
      const probedPct = (attendanceProbe as any)?.percentage;
      const profileAttendance = (profile as any)?.attendance?.average || (profile as any)?.attendancePercentage;
      const attendancePct = typeof probedPct === 'number'
        ? probedPct
        : typeof profileAttendance === 'number'
          ? Math.round(profileAttendance)
          : 0;
      setHasAttendance(typeof probedPct === 'number' || typeof profileAttendance === 'number');

      const assignmentsCount = Array.isArray((assignmentsRes as any)?.data)
        ? (assignmentsRes as any).data.length
        : Array.isArray((assignmentsRes as any)?.assignments)
          ? (assignmentsRes as any).assignments.length
          : (assignmentsRes as any)?.data?.pendingAssignments ?? 0;

      const notificationsCount = Array.isArray((notificationsRes as any)?.data)
        ? (notificationsRes as any).data.filter?.((n: any) => !n.isRead)?.length ?? (notificationsRes as any).data.length
        : Array.isArray((notificationsRes as any)?.notifications)
          ? (notificationsRes as any).notifications.filter?.((n: any) => !n.read)?.length ?? (notificationsRes as any).notifications.length
          : (notificationsRes as any)?.data?.unreadCount ?? 0;

      const upcomingExamsCount = Array.isArray((eventsRes as any)?.data)
        ? (eventsRes as any).data.filter?.((e: any) => new Date(e.date) >= new Date())?.length ?? (eventsRes as any).data.length
        : Array.isArray((eventsRes as any)?.events)
          ? (eventsRes as any).events.filter?.((e: any) => new Date(e.date) >= new Date())?.length ?? (eventsRes as any).events.length
          : 0;

      const feesCount = Array.isArray((feesRes as any)?.data)
        ? (feesRes as any).data.filter?.((f: any) => f.status === 'pending')?.length ?? 0
        : Array.isArray((feesRes as any)?.fees)
          ? (feesRes as any).fees.filter?.((f: any) => f.status === 'pending')?.length ?? 0
          : (feesRes as any)?.data?.pendingCount ?? 0;

      setDashboardData({
        attendance: attendancePct,
        assignments: assignmentsCount,
        upcomingExams: upcomingExamsCount,
        fees: feesCount,
        notifications: notificationsCount,
      });
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

  const getDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.name || user?.email || 'Student';
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.colors.statusBarStyle} backgroundColor={theme.colors.background} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="menu" size={28} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Dashboard</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="expand-outline" size={28} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: theme.colors.text }]}>{getDisplayName().toUpperCase()}</Text>
          <TouchableOpacity 
            style={[styles.darkModeToggle, { backgroundColor: theme.colors.surface }]}
            onPress={toggleTheme}
            activeOpacity={0.7}
          >
            <View style={styles.toggleContainer}>
              <Ionicons 
                name={isDark ? "moon" : "sunny"} 
                size={20} 
                color={isDark ? "#FFA500" : "#F59E0B"} 
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366F1']} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Attendance Chart Card */}
        <Surface 
          style={[
            styles.chartCard, 
            { 
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              borderWidth: theme.isDark ? 0 : 1,
            }
          ]} 
          elevation={theme.isDark ? 4 : 2}
        >
          <TouchableOpacity style={[styles.infoButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: theme.isDark ? 0 : 1 }]}>
            <Ionicons name="information-circle-outline" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          <CircularAttendanceChart data={attendanceData} />
        </Surface>

        {/* Expandable Sections */}
        <TouchableOpacity 
          style={[
            styles.expandableCard, 
            { 
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              borderWidth: 1,
            }
          ]}
          onPress={() => setAttendanceExpanded(!attendanceExpanded)}
          activeOpacity={0.7}
        >
          <Text style={[styles.expandableTitle, { color: theme.colors.text }]}>Attendance Details</Text>
          <Ionicons 
            name={attendanceExpanded ? "remove" : "add"} 
            size={24} 
            color={theme.colors.text} 
          />
        </TouchableOpacity>

        {attendanceExpanded && (
          <Surface 
            style={[
              styles.expandedContent, 
              { 
                backgroundColor: theme.colors.card, 
                borderColor: theme.colors.border,
                borderWidth: 1,
              }
            ]} 
            elevation={theme.isDark ? 2 : 0}
          >
            {/* Attendance Details Table */}
            <View style={styles.attendanceTable}>
              <View style={[styles.tableHeader, { borderBottomColor: theme.colors.border }]}>
                <Text style={[styles.tableHeaderText, { color: theme.colors.textSecondary }]}>ATTENDANCE TYPE</Text>
                <Text style={[styles.tableHeaderText, { color: theme.colors.textSecondary }]}>PERCENTAGE</Text>
                <Text style={[styles.tableHeaderText, { color: theme.colors.textSecondary }]}>P/T</Text>
              </View>

              <View style={[styles.tableRow, { borderBottomColor: theme.colors.border }]}>
                <View style={styles.typeCell}>
                  <View style={[styles.colorIndicator, { backgroundColor: '#10B981' }]} />
                  <Text style={[styles.typeText, { color: '#10B981' }]}>PHYSICAL ATTENDANCE</Text>
                </View>
                <Text style={[styles.percentageText, { color: theme.colors.text }]}>67.1%</Text>
                <Text style={[styles.countText, { color: theme.colors.text }]}>104/117</Text>
              </View>

              <View style={[styles.tableRow, { borderBottomColor: theme.colors.border }]}>
                <View style={styles.typeCell}>
                  <View style={[styles.colorIndicator, { backgroundColor: '#3B82F6' }]} />
                  <Text style={[styles.typeText, { color: '#3B82F6' }]}>PLACEMENT</Text>
                </View>
                <Text style={[styles.percentageText, { color: theme.colors.text }]}>24.52%</Text>
                <Text style={[styles.countText, { color: theme.colors.text }]}>38/38</Text>
              </View>

              <View style={[styles.tableRow, { borderBottomColor: theme.colors.border }]}>
                <View style={styles.typeCell}>
                  <View style={[styles.colorIndicator, { backgroundColor: '#EF4444' }]} />
                  <Text style={[styles.typeText, { color: '#EF4444' }]}>ABSENT</Text>
                </View>
                <Text style={[styles.percentageText, { color: theme.colors.text }]}>8.39%</Text>
                <Text style={[styles.countText, { color: theme.colors.text }]}>13/155</Text>
              </View>

              <View style={[styles.tableRow, styles.totalRowTable, { borderTopColor: theme.colors.border }]}>
                <Text style={[styles.totalTypeText, { color: theme.colors.text }]}>OVERALL</Text>
                <Text style={[styles.totalPercentageText, { color: theme.colors.text }]}>92%</Text>
                <Text style={[styles.totalCountText, { color: theme.colors.text }]}>142/155</Text>
              </View>
            </View>
          </Surface>
        )}

        <TouchableOpacity 
          style={[styles.expandableCard, { backgroundColor: theme.colors.card }]}
          onPress={() => setTodayAttendanceExpanded(!todayAttendanceExpanded)}
          activeOpacity={0.7}
        >
          <Text style={[styles.expandableTitle, { color: theme.colors.text }]}>Today Attendance</Text>
          <Ionicons 
            name={todayAttendanceExpanded ? "remove" : "add"} 
            size={24} 
            color={theme.colors.text} 
          />
        </TouchableOpacity>

        {todayAttendanceExpanded && (
          <Surface style={[styles.expandedContent, { backgroundColor: theme.colors.card }]} elevation={2}>
            <Text style={[styles.expandedText, { color: theme.colors.textSecondary }]}>
              Today's attendance records will be displayed here.
            </Text>
          </Surface>
        )}

        {/* Action Cards */}
        <View style={styles.actionCardsContainer}>
          <TouchableOpacity 
            style={[
              styles.actionCard, 
              { 
                backgroundColor: theme.colors.card, 
                borderColor: theme.colors.border,
                borderWidth: 1,
              }
            ]}
            activeOpacity={0.7}
          >
            <Ionicons name="calendar-outline" size={32} color={theme.colors.primary} />
            <Text style={[styles.actionCardText, { color: theme.colors.text }]}>Day Wise Attendance</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.actionCard, 
              { 
                backgroundColor: theme.colors.card, 
                borderColor: theme.colors.border,
                borderWidth: 1,
              }
            ]}
            activeOpacity={0.7}
          >
            <Ionicons name="gift-outline" size={32} color={theme.colors.primary} />
            <Text style={[styles.actionCardText, { color: theme.colors.text }]}>Today's Birthdays</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#000000',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  menuButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  settingsButton: {
    padding: 4,
  },
  userInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  darkModeToggle: {
    backgroundColor: '#1F2937',
    borderRadius: 50,
    padding: 12,
  },
  toggleContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 10,
  },
  chartCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    position: 'relative',
  },
  infoButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: '#2A2A2A',
    borderRadius: 50,
    padding: 8,
  },
  expandableCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  expandableTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  expandedContent: {
    borderRadius: 12,
    padding: 0,
    marginTop: -12,
    marginBottom: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  expandedText: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
  },
  attendanceTable: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    flex: 1,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  typeCell: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  typeText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  countText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  totalRowTable: {
    borderBottomWidth: 0,
    paddingTop: 20,
    marginTop: 4,
    borderTopWidth: 2,
  },
  totalTypeText: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    letterSpacing: 1,
  },
  totalPercentageText: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  totalCountText: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  actionCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  actionCardText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
