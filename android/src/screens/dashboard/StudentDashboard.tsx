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
    physical: 0,
    placement: 0,
    absent: 0,
    total: 0,
  });
  const [courseStats, setCourseStats] = useState<Array<{
    course: { name: string; code: string };
    present: number;
    late: number;
    absent: number;
    total: number;
    percentage: number;
  }>>([]);
  const [todayRecords, setTodayRecords] = useState<Array<{
    course: { name: string; code: string };
    status: string;
    date: string;
  }>>([]);
  const [hasAttendance, setHasAttendance] = useState(false);
  const [sectionData, setSectionData] = useState<any>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const [meRes, attendanceRes, assignmentsRes, notificationsRes, eventsRes, feesRes, sectionRes] = await Promise.all([
        apiService.getCurrentUser().then((u) => ({ success: true, user: u } as any)).catch(() => ({ success: false } as any)),
        apiService.getStudentAttendance(),
        apiService.getStudentAssignments(),
        apiService.getNotifications(),
        apiService.getEvents(),
        apiService.getStudentFees(),
        apiService.getMySection().catch(() => ({ success: false } as any)),
      ]);

      // --- Attendance breakdown ---
      const attRes = attendanceRes as any;
      const stats: any[] = attRes?.stats || [];
      const rawRecords: any[] = attRes?.attendance || [];
      const avgPct = typeof attRes?.averageAttendance === 'number' ? attRes.averageAttendance : 0;

      // Aggregate across all courses
      let totalPresent = 0, totalLate = 0, totalAbsent = 0, totalAll = 0;
      stats.forEach((s: any) => {
        totalPresent += s.present || 0;
        totalLate += s.late || 0;
        totalAbsent += s.absent || 0;
        totalAll += s.total || 0;
      });

      setAttendanceData({
        physical: totalPresent,
        placement: totalLate,
        absent: totalAbsent,
        total: totalAll || 1, // avoid division by zero
      });
      setCourseStats(stats);
      setHasAttendance(stats.length > 0);

      // Filter today's records
      const todayStr = new Date().toISOString().split('T')[0];
      const todayRecs = rawRecords.filter((r: any) => {
        const d = r.date ? new Date(r.date).toISOString().split('T')[0] : '';
        return d === todayStr;
      }).map((r: any) => ({
        course: r.course || { name: 'Unknown', code: '—' },
        status: r.status || 'unknown',
        date: r.date,
      }));
      setTodayRecords(todayRecs);

      // --- Other dashboard counts ---
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

      // Section data
      const secRes = sectionRes as any;
      if (secRes?.success && secRes.section) {
        setSectionData(secRes.section);
      }

      setDashboardData({
        attendance: avgPct,
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

        {/* Section Info Card */}
        {sectionData ? (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('MySection' as never)}
            style={[
              styles.sectionCard,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
                borderWidth: 1,
              }
            ]}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconWrap}>
                <Ionicons name="grid-outline" size={20} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionName, { color: theme.colors.text }]}>{sectionData.name}</Text>
                <Text style={[styles.sectionMeta, { color: theme.colors.textSecondary }]}>
                  {sectionData.program} — {sectionData.branch}
                </Text>
              </View>
              <View style={styles.semBadge}>
                <Text style={styles.semBadgeText}>Sem {sectionData.semester}</Text>
              </View>
            </View>
            <View style={styles.sectionStats}>
              <View style={styles.sectionStatItem}>
                <Text style={[styles.sectionStatValue, { color: theme.colors.text }]}>{sectionData.students?.length || 0}</Text>
                <Text style={[styles.sectionStatLabel, { color: theme.colors.textSecondary }]}>Classmates</Text>
              </View>
              <View style={[styles.sectionStatDivider, { backgroundColor: theme.colors.border }]} />
              <View style={styles.sectionStatItem}>
                <Text style={[styles.sectionStatValue, { color: theme.colors.text }]}>{sectionData.maxStudents}</Text>
                <Text style={[styles.sectionStatLabel, { color: theme.colors.textSecondary }]}>Capacity</Text>
              </View>
              <View style={[styles.sectionStatDivider, { backgroundColor: theme.colors.border }]} />
              <View style={styles.sectionStatItem}>
                <Text style={[styles.sectionStatValue, { color: theme.colors.text }]}>{sectionData.academicYear}</Text>
                <Text style={[styles.sectionStatLabel, { color: theme.colors.textSecondary }]}>Session</Text>
              </View>
            </View>
            {/* Capacity bar */}
            <View style={styles.capacityBarOuter}>
              <View style={[
                styles.capacityBarInner,
                {
                  width: `${Math.min(100, ((sectionData.students?.length || 0) / (sectionData.maxStudents || 1)) * 100)}%`,
                  backgroundColor: ((sectionData.students?.length || 0) / (sectionData.maxStudents || 1)) > 0.9 ? '#ef4444' :
                    ((sectionData.students?.length || 0) / (sectionData.maxStudents || 1)) > 0.7 ? '#f59e0b' : '#10b981',
                } as any
              ]} />
            </View>
            <View style={styles.sectionFooter}>
              <Text style={{ color: '#6366f1', fontWeight: '600', fontSize: 13 }}>View Section →</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={[
            styles.sectionCard,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border, borderWidth: 1, alignItems: 'center', flexDirection: 'row', gap: 10 }
          ]}>
            <Ionicons name="grid-outline" size={18} color={theme.colors.textSecondary} />
            <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>No section assigned yet</Text>
          </View>
        )}

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
                <Text style={[styles.tableHeaderText, { color: theme.colors.textSecondary }]}>COURSE / TYPE</Text>
                <Text style={[styles.tableHeaderText, { color: theme.colors.textSecondary }]}>PERCENTAGE</Text>
                <Text style={[styles.tableHeaderText, { color: theme.colors.textSecondary }]}>P/T</Text>
              </View>

              {courseStats.length > 0 ? (
                <>
                  {courseStats.map((cs, idx) => (
                    <View key={idx} style={[styles.tableRow, { borderBottomColor: theme.colors.border }]}>
                      <View style={styles.typeCell}>
                        <View style={[styles.colorIndicator, { backgroundColor: '#10B981' }]} />
                        <Text style={[styles.typeText, { color: '#10B981' }]} numberOfLines={1}>
                          {cs.course?.code || cs.course?.name || `Course ${idx + 1}`}
                        </Text>
                      </View>
                      <Text style={[styles.percentageText, { color: theme.colors.text }]}>
                        {cs.percentage}%
                      </Text>
                      <Text style={[styles.countText, { color: theme.colors.text }]}>
                        {cs.present + cs.late}/{cs.total}
                      </Text>
                    </View>
                  ))}

                  {/* Aggregate rows */}
                  <View style={[styles.tableRow, { borderBottomColor: theme.colors.border }]}>
                    <View style={styles.typeCell}>
                      <View style={[styles.colorIndicator, { backgroundColor: '#10B981' }]} />
                      <Text style={[styles.typeText, { color: '#10B981' }]}>PRESENT</Text>
                    </View>
                    <Text style={[styles.percentageText, { color: theme.colors.text }]}>
                      {attendanceData.total > 0 ? ((attendanceData.physical / attendanceData.total) * 100).toFixed(1) : 0}%
                    </Text>
                    <Text style={[styles.countText, { color: theme.colors.text }]}>
                      {attendanceData.physical}/{attendanceData.total}
                    </Text>
                  </View>

                  <View style={[styles.tableRow, { borderBottomColor: theme.colors.border }]}>
                    <View style={styles.typeCell}>
                      <View style={[styles.colorIndicator, { backgroundColor: '#3B82F6' }]} />
                      <Text style={[styles.typeText, { color: '#3B82F6' }]}>LATE</Text>
                    </View>
                    <Text style={[styles.percentageText, { color: theme.colors.text }]}>
                      {attendanceData.total > 0 ? ((attendanceData.placement / attendanceData.total) * 100).toFixed(1) : 0}%
                    </Text>
                    <Text style={[styles.countText, { color: theme.colors.text }]}>
                      {attendanceData.placement}/{attendanceData.total}
                    </Text>
                  </View>

                  <View style={[styles.tableRow, { borderBottomColor: theme.colors.border }]}>
                    <View style={styles.typeCell}>
                      <View style={[styles.colorIndicator, { backgroundColor: '#EF4444' }]} />
                      <Text style={[styles.typeText, { color: '#EF4444' }]}>ABSENT</Text>
                    </View>
                    <Text style={[styles.percentageText, { color: theme.colors.text }]}>
                      {attendanceData.total > 0 ? ((attendanceData.absent / attendanceData.total) * 100).toFixed(1) : 0}%
                    </Text>
                    <Text style={[styles.countText, { color: theme.colors.text }]}>
                      {attendanceData.absent}/{attendanceData.total}
                    </Text>
                  </View>

                  <View style={[styles.tableRow, styles.totalRowTable, { borderTopColor: theme.colors.border }]}>
                    <Text style={[styles.totalTypeText, { color: theme.colors.text }]}>OVERALL</Text>
                    <Text style={[styles.totalPercentageText, { color: theme.colors.text }]}>
                      {dashboardData.attendance}%
                    </Text>
                    <Text style={[styles.totalCountText, { color: theme.colors.text }]}>
                      {attendanceData.physical + attendanceData.placement}/{attendanceData.total}
                    </Text>
                  </View>
                </>
              ) : (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>
                    No attendance records yet.
                  </Text>
                </View>
              )}
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
            {todayRecords.length > 0 ? (
              <View style={styles.attendanceTable}>
                <View style={[styles.tableHeader, { borderBottomColor: theme.colors.border }]}>
                  <Text style={[styles.tableHeaderText, { color: theme.colors.textSecondary }]}>COURSE</Text>
                  <Text style={[styles.tableHeaderText, { color: theme.colors.textSecondary }]}>STATUS</Text>
                </View>
                {todayRecords.map((rec, idx) => {
                  const statusColor = rec.status === 'present' ? '#10B981' : rec.status === 'late' ? '#F59E0B' : '#EF4444';
                  return (
                    <View key={idx} style={[styles.tableRow, { borderBottomColor: theme.colors.border }]}>
                      <Text style={[styles.typeText, { color: theme.colors.text, flex: 1 }]}>
                        {rec.course?.code || rec.course?.name || 'Course'}
                      </Text>
                      <Text style={[styles.percentageText, { color: statusColor, textTransform: 'uppercase' }]}>
                        {rec.status}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>
                  No attendance marked for today yet.
                </Text>
              </View>
            )}
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
  sectionCard: {
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionName: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  semBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(99,102,241,0.15)',
  },
  semBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366f1',
  },
  sectionStats: {
    flexDirection: 'row',
    marginTop: 14,
    alignItems: 'center',
  },
  sectionStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  sectionStatValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionStatLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  sectionStatDivider: {
    width: 1,
    height: 28,
  },
  capacityBarOuter: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(128,128,128,0.2)',
    marginTop: 12,
    overflow: 'hidden',
  },
  capacityBarInner: {
    height: '100%',
    borderRadius: 3,
  },
  sectionFooter: {
    marginTop: 10,
    alignItems: 'center',
  },
});
