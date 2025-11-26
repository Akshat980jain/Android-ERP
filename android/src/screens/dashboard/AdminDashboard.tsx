import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Avatar,
  Chip,
  FAB,
  IconButton,
  Switch,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import apiService from '../../services/api';

export default function AdminDashboard({ navigation }: any) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [systemDetailsExpanded, setSystemDetailsExpanded] = useState(false);
  const [activityDetailsExpanded, setActivityDetailsExpanded] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    activeStudents: 0,
    faculty: 0,
    pendingRequests: 0,
    systemAlerts: 0,
  });
  const [pendingRequestsData, setPendingRequestsData] = useState<any[]>([]);

  // Determine admin type
  const isHeadAdmin = !(user as any)?.adminPrograms || ((user as any)?.adminPrograms?.length || 0) === 0;
  const adminType = isHeadAdmin ? 'Head Admin' : 'Branch Admin';
  
  // Build admin type display with program and branch
  let adminTypeDisplay = 'Administrator';
  if (!isHeadAdmin) {
    const program = (user as any)?.adminPrograms?.[0] || '';
    const branch = (user as any)?.profile?.branch || (user as any)?.branch || '';
    
    // Show branch if available (more specific), otherwise show program
    if (branch) {
      // Show branch name as the admin type (e.g., "Computer Science Admin")
      adminTypeDisplay = `${branch} Admin`;
    } else if (program) {
      // Fallback to program if no branch (e.g., "B.Tech Admin")
      adminTypeDisplay = `${program} Admin`;
    }
  }

  const onRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      console.log('Fetching admin dashboard data...');
      
      // Fetch admin stats, notifications, and pending requests
      const [statsRes, notificationsRes, requestsRes] = await Promise.all([
        apiService.getAdminStats(),
        apiService.getNotifications(),
        apiService.getVerificationRequests(),
      ]);

      console.log('Stats response:', statsRes);
      console.log('Notifications response:', notificationsRes);

      // Extract stats from response
      let totalUsers = 0;
      let students = 0;
      let faculty = 0;
      let alerts = 0;

      // Handle different response formats
      if (statsRes && (statsRes as any).success !== false) {
        const stats = (statsRes as any).stats || (statsRes as any).data || statsRes;
        
        totalUsers = stats.totalUsers || (stats.totalStudents + stats.totalFaculty) || 0;
        students = stats.totalStudents || 0;
        faculty = stats.totalFaculty || 0;
        
        console.log('Parsed stats:', { totalUsers, students, faculty });
      } else {
        console.warn('Stats API returned error or empty response');
        // Fallback: try to get user list
        const usersRes = await apiService.getAllUsers();
        console.log('Fallback users response:', usersRes);
        
        if (usersRes && (usersRes as any).success !== false) {
          const users = Array.isArray((usersRes as any).data) ? (usersRes as any).data : 
                       Array.isArray((usersRes as any).users) ? (usersRes as any).users : [];
          
          totalUsers = users.length;
          students = users.filter((u: any) => u.role === 'student').length;
          faculty = users.filter((u: any) => u.role === 'faculty').length;
          
          console.log('Fallback stats:', { totalUsers, students, faculty, usersCount: users.length });
        }
      }

      // Handle notifications
      if (notificationsRes && (notificationsRes as any).success !== false) {
        const notifications = Array.isArray((notificationsRes as any).data) 
          ? (notificationsRes as any).data 
          : Array.isArray((notificationsRes as any).notifications) 
          ? (notificationsRes as any).notifications 
          : [];
        
        alerts = notifications.filter((n: any) => !n.read && !n.isRead).length || (notificationsRes as any).unreadCount || 0;
        console.log('Notifications count:', alerts);
      }

      // Handle pending verification requests
      let pendingRequests = 0;
      let requestsList: any[] = [];
      if (requestsRes && (requestsRes as any).success !== false) {
        requestsList = Array.isArray((requestsRes as any).data)
          ? (requestsRes as any).data
          : Array.isArray((requestsRes as any).requests)
          ? (requestsRes as any).requests
          : [];
        
        // Filter only pending requests
        requestsList = requestsList.filter((r: any) => r.status === 'pending');
        pendingRequests = requestsList.length;
        console.log('Pending verification requests:', pendingRequests);
      }

      setDashboardData({
        totalUsers,
        activeStudents: students,
        faculty,
        pendingRequests,
        systemAlerts: alerts,
      });
      setPendingRequestsData(requestsList);

      console.log('Dashboard data updated:', { totalUsers, students, faculty, alerts });
    } catch (err: any) {
      console.error('Error refreshing dashboard:', err);
      console.error('Error details:', err.message);
      setError('Failed to load dashboard data. Please check your connection.');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    onRefresh();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Top Bar */}
      <View style={[styles.topBar, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
        <View style={{ width: 28 }} />
        <Text style={[styles.topBarTitle, { color: theme.colors.text }]}>Dashboard</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
          <Ionicons name="notifications-outline" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
        }
      >
        {/* Error Message */}
        {error && (
          <View style={[styles.errorCard, { backgroundColor: '#FEE2E2', borderColor: '#F87171' }]}>
            <Ionicons name="alert-circle" size={20} color="#DC2626" />
            <Text style={[styles.errorText, { color: '#DC2626' }]}>{error}</Text>
          </View>
        )}

        {/* User Info Card */}
        <View style={[styles.userCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, borderWidth: theme.isDark ? 0 : 1 }]}>
          <View style={styles.userCardHeader}>
            <View style={styles.userCardLeft}>
              <Avatar.Text
                size={50}
                label={`${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`}
                style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
              />
              <View style={styles.userCardInfo}>
                <Text style={[styles.userName, { color: theme.colors.text }]}>
                  {(user as any)?.name || `${user?.firstName || ''} ${user?.lastName || ''}`}
                </Text>
                <Text style={[styles.userRole, { color: theme.colors.textSecondary }]}>
                  {adminTypeDisplay}
                </Text>
                {/* Show branch if available */}
                {!isHeadAdmin && ((user as any)?.profile?.branch || (user as any)?.branch) && (
                  <Text style={[styles.userBranch, { color: theme.colors.primary }]}>
                    📍 {(user as any)?.profile?.branch || (user as any)?.branch}
                  </Text>
                )}
              </View>
            </View>
            <TouchableOpacity
              onPress={toggleTheme}
              style={[styles.themeToggle, { borderColor: theme.colors.border, borderWidth: theme.isDark ? 0 : 1 }]}
            >
              <Ionicons
                name={theme.isDark ? 'moon' : 'sunny'}
                size={24}
                color={theme.isDark ? '#FDB022' : '#F59E0B'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Pending Requests Alert Card */}
        {dashboardData.pendingRequests > 0 && (
          <TouchableOpacity
            style={[styles.pendingRequestsCard, { 
              backgroundColor: theme.isDark ? '#1A2520' : '#D1FAE5',
              borderColor: theme.colors.success,
              borderWidth: 2,
            }]}
            onPress={() => navigation.navigate('RequestApproval')}
          >
            <View style={styles.pendingRequestsHeader}>
              <View style={styles.pendingRequestsLeft}>
                <View style={[styles.pendingRequestsIconWrapper, { backgroundColor: theme.colors.success }]}>
                  <Ionicons name="people" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.pendingRequestsInfo}>
                  <Text style={[styles.pendingRequestsTitle, { color: theme.colors.text }]}>
                    Pending Verification Requests
                  </Text>
                  <Text style={[styles.pendingRequestsSubtitle, { color: theme.colors.textSecondary }]}>
                    {dashboardData.pendingRequests} user{dashboardData.pendingRequests > 1 ? 's' : ''} waiting for approval
                  </Text>
                </View>
              </View>
              <View style={[styles.pendingRequestsBadge, { backgroundColor: theme.colors.success }]}>
                <Text style={styles.pendingRequestsBadgeText}>{dashboardData.pendingRequests}</Text>
              </View>
            </View>
            <View style={[styles.pendingRequestsFooter, { borderTopColor: theme.colors.border }]}>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
              <Text style={[styles.pendingRequestsAction, { color: theme.colors.primary }]}>
                Review Requests
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* System Stats Card */}
        <View style={[styles.statsCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, borderWidth: theme.isDark ? 0 : 1 }]}>
          <View style={styles.statsHeader}>
            <Text style={[styles.statsTitle, { color: theme.colors.text }]}>System Overview</Text>
            <TouchableOpacity>
              <Ionicons name="information-circle-outline" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{dashboardData.totalUsers}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Total Users</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{dashboardData.activeStudents}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Students</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{dashboardData.faculty}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Faculty</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: dashboardData.pendingRequests > 0 ? theme.colors.warning : theme.colors.text }]}>{dashboardData.pendingRequests}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Pending</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{dashboardData.systemAlerts}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Alerts</Text>
            </View>
          </View>
        </View>

        {/* Expandable System Details */}
        <TouchableOpacity
          style={[styles.expandableCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          onPress={() => setSystemDetailsExpanded(!systemDetailsExpanded)}
        >
          <View style={styles.expandableHeader}>
            <Text style={[styles.expandableTitle, { color: theme.colors.text }]}>System Details</Text>
            <Ionicons
              name={systemDetailsExpanded ? 'chevron-up' : 'chevron-down'}
              size={24}
              color={theme.colors.textSecondary}
            />
          </View>
          {systemDetailsExpanded && (
            <View style={[styles.expandedContent, { borderTopColor: theme.colors.border }]}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Server Status</Text>
                <Text style={[styles.detailValue, { color: '#10B981' }]}>Online</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Database</Text>
                <Text style={[styles.detailValue, { color: '#10B981' }]}>Connected</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Last Backup</Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>2 hours ago</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Security</Text>
                <Text style={[styles.detailValue, { color: '#10B981' }]}>Secure</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>

        {/* Expandable Recent Activity */}
        <TouchableOpacity
          style={[styles.expandableCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          onPress={() => setActivityDetailsExpanded(!activityDetailsExpanded)}
        >
          <View style={styles.expandableHeader}>
            <Text style={[styles.expandableTitle, { color: theme.colors.text }]}>Recent Activity</Text>
            <Ionicons
              name={activityDetailsExpanded ? 'chevron-up' : 'chevron-down'}
              size={24}
              color={theme.colors.textSecondary}
            />
          </View>
          {activityDetailsExpanded && (
            <View style={[styles.expandedContent, { borderTopColor: theme.colors.border }]}>
              <View style={styles.activityRow}>
                <View style={[styles.activityDot, { backgroundColor: '#10B981' }]} />
                <View style={styles.activityInfo}>
                  <Text style={[styles.activityText, { color: theme.colors.text }]}>New student registered</Text>
                  <Text style={[styles.activityTime, { color: theme.colors.textSecondary }]}>30 minutes ago</Text>
                </View>
              </View>
              <View style={styles.activityRow}>
                <View style={[styles.activityDot, { backgroundColor: '#3B82F6' }]} />
                <View style={styles.activityInfo}>
                  <Text style={[styles.activityText, { color: theme.colors.text }]}>Report generated</Text>
                  <Text style={[styles.activityTime, { color: theme.colors.textSecondary }]}>2 hours ago</Text>
                </View>
              </View>
              <View style={styles.activityRow}>
                <View style={[styles.activityDot, { backgroundColor: '#F59E0B' }]} />
                <View style={styles.activityInfo}>
                  <Text style={[styles.activityText, { color: theme.colors.text }]}>Settings updated</Text>
                  <Text style={[styles.activityTime, { color: theme.colors.textSecondary }]}>1 day ago</Text>
                </View>
              </View>
            </View>
          )}
        </TouchableOpacity>

        {/* Action Cards */}
        <View style={styles.actionCardsContainer}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={() => navigation.navigate('RequestApproval')}
          >
            <MaterialCommunityIcons name="check-circle" size={28} color={theme.colors.primary} />
            <Text style={[styles.actionCardText, { color: theme.colors.text }]}>Approve Requests</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={() => navigation.navigate('Notifications')}
          >
            <MaterialCommunityIcons name="bell" size={28} color={theme.colors.primary} />
            <Text style={[styles.actionCardText, { color: theme.colors.text }]}>Notifications</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  topBarTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  userCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  userCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    marginRight: 12,
  },
  userCardInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
  },
  userBranch: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  themeToggle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  statsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '31%',
    alignItems: 'center',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  expandableCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  expandableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expandableTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
  },
  actionCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionCard: {
    width: '48%',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    minHeight: 120,
  },
  actionCardText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  pendingRequestsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  pendingRequestsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pendingRequestsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pendingRequestsIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pendingRequestsInfo: {
    flex: 1,
  },
  pendingRequestsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  pendingRequestsSubtitle: {
    fontSize: 13,
  },
  pendingRequestsBadge: {
    minWidth: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  pendingRequestsBadgeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  pendingRequestsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 4,
  },
  pendingRequestsAction: {
    fontSize: 14,
    fontWeight: '600',
  },
});
