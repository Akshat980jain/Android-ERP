import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Chip,
  Badge,
  ActivityIndicator,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import apiService from '../../services/api';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'academic' | 'finance' | 'event' | 'system' | 'general';
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  isRead?: boolean;
  createdAt: string;
  relatedTo?: {
    model: string;
    id: string;
  };
}

export default function NotificationsScreen({ navigation }: any) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filterOptions = [
    { id: 'all', label: 'All', color: theme.colors.primary },
    { id: 'academic', label: 'Academic', color: '#3B82F6' },
    { id: 'finance', label: 'Finance', color: '#F59E0B' },
    { id: 'event', label: 'Events', color: '#8B5CF6' },
    { id: 'system', label: 'System', color: '#6B7280' },
  ];

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await apiService.getNotifications();
      console.log('Notifications response:', response);
      
      if (response && response.success !== false) {
        const res = response as any;
        const notifList = Array.isArray(res.notifications) ? res.notifications :
                          Array.isArray(res.data) ? res.data :
                          Array.isArray(response) ? response : [];
        
        console.log('📧 Loaded notifications:', notifList.length);
        notifList.forEach((n: any, i: number) => {
          console.log(`  ${i + 1}. Type: "${n.type || n.category}", Title: "${n.title}"`);
        });
        
        setNotifications(notifList);
        
        // Count unread
        const unread = notifList.filter((n: Notification) => !n.read && !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await apiService.markNotificationAsRead(notificationId);
      if (response && response.success !== false) {
        // Update local state
        setNotifications(prev => 
          prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await apiService.markAllNotificationsAsRead();
      if (response && response.success !== false) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      const response = await apiService.deleteNotification(notificationId);
      if (response && response.success !== false) {
        setNotifications(prev => prev.filter(n => n._id !== notificationId));
        // Update unread count if it was an unread notification
        const deletedNotif = notifications.find(n => n._id === notificationId);
        if (deletedNotif && !deletedNotif.read && !deletedNotif.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    const typeOrCategory = type || 'general';
    switch (typeOrCategory) {
      case 'academic': return 'book';
      case 'finance': return 'cash';
      case 'event': return 'calendar';
      case 'system': return 'settings';
      default: return 'information-circle';
    }
  };

  const getTypeColor = (type: string) => {
    const option = filterOptions.find(o => o.id === type);
    return option ? option.color : theme.colors.primary;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      case 'low': return '#6B7280';
      default: return theme.colors.textSecondary;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const filteredNotifications = React.useMemo(() => {
    if (selectedFilter === 'all') {
      return notifications;
    }
    
    const filtered = notifications.filter(n => {
      const notifType = (n.type || n.category || '').toLowerCase();
      const filterType = selectedFilter.toLowerCase();
      
      // Handle different type naming conventions from backend
      if (filterType === 'academic') {
        return notifType.includes('academic') || notifType.includes('course') || notifType.includes('assignment');
      }
      if (filterType === 'finance') {
        return notifType.includes('finance') || notifType.includes('fee') || notifType.includes('payment');
      }
      if (filterType === 'event') {
        return notifType.includes('event');
      }
      if (filterType === 'system') {
        return notifType.includes('system') || notifType.includes('general') || notifType.includes('info');
      }
      
      return notifType === filterType;
    });
    
    console.log(`🔍 Filter "${selectedFilter}" -> ${filtered.length} notifications`);
    return filtered;
  }, [notifications, selectedFilter]);

  const renderNotificationCard = (notification: Notification) => {
    const isUnread = !notification.read && !notification.isRead;
    const notifType = notification.type || notification.category || 'general';
    const isExpanded = expandedId === notification._id;
    
    const handleCardPress = () => {
      // Toggle expansion
      setExpandedId(isExpanded ? null : notification._id);
      // Mark as read if unread
      if (isUnread) {
        markAsRead(notification._id);
      }
    };
    
    return (
      <TouchableOpacity
        key={notification._id}
        onPress={handleCardPress}
        activeOpacity={0.7}
      >
        <Card 
          style={[
            styles.notificationCard, 
            { 
              backgroundColor: theme.colors.card,
              borderColor: isUnread ? getTypeColor(notifType) : theme.colors.border,
              borderLeftWidth: 4,
              borderWidth: 1,
              opacity: isUnread ? 1 : 0.7,
            }
          ]}
        >
          <Card.Content>
            <View style={styles.notificationHeader}>
              <View style={styles.notificationIconContainer}>
                <View style={[styles.iconCircle, { backgroundColor: getTypeColor(notifType) + '20' }]}>
                  <Ionicons 
                    name={getTypeIcon(notifType) as any} 
                    size={20} 
                    color={getTypeColor(notifType)} 
                  />
                </View>
                {isUnread && (
                  <View style={[styles.unreadDot, { backgroundColor: theme.colors.primary }]} />
                )}
              </View>

              <View style={styles.notificationContent}>
                <View style={styles.titleRow}>
                  <Text 
                    style={[
                      styles.notificationTitle, 
                      { 
                        color: theme.colors.text,
                        fontWeight: isUnread ? '700' : '500'
                      }
                    ]}
                    numberOfLines={isExpanded ? undefined : 1}
                  >
                    {notification.title}
                  </Text>
                  {notification.priority === 'urgent' && (
                    <Chip 
                      style={[styles.priorityChip, { backgroundColor: '#EF4444' + '20' }]}
                      textStyle={{ color: '#EF4444', fontSize: 10, fontWeight: '600' }}
                    >
                      URGENT
                    </Chip>
                  )}
                </View>

                <Text 
                  style={[styles.notificationMessage, { color: theme.colors.textSecondary }]}
                  numberOfLines={isExpanded ? undefined : 2}
                >
                  {notification.message}
                </Text>

                {/* Expanded Details */}
                {isExpanded && (
                  <View style={styles.expandedContent}>
                    <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                    
                    {/* Additional Details */}
                    <View style={styles.detailRow}>
                      <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
                      <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
                        {new Date(notification.createdAt).toLocaleString()}
                      </Text>
                    </View>

                    {notification.priority && (
                      <View style={styles.detailRow}>
                        <Ionicons name="flag-outline" size={16} color={theme.colors.textSecondary} />
                        <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
                          Priority: {notification.priority.toUpperCase()}
                        </Text>
                      </View>
                    )}

                    {notification.relatedTo && (
                      <View style={styles.detailRow}>
                        <Ionicons name="link-outline" size={16} color={theme.colors.textSecondary} />
                        <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
                          Related: {notification.relatedTo.model}
                        </Text>
                      </View>
                    )}

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                      {!notification.read && !notification.isRead && (
                        <TouchableOpacity
                          style={[styles.actionButton, { backgroundColor: theme.colors.primary + '15' }]}
                          onPress={() => markAsRead(notification._id)}
                        >
                          <Ionicons name="checkmark-circle-outline" size={18} color={theme.colors.primary} />
                          <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>
                            Mark as Read
                          </Text>
                        </TouchableOpacity>
                      )}
                      
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#EF4444' + '15' }]}
                        onPress={() => {
                          handleDelete(notification._id);
                          setExpandedId(null);
                        }}
                      >
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                        <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>
                          Delete
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <View style={styles.notificationFooter}>
                  <Text style={[styles.timeText, { color: theme.colors.textSecondary }]}>
                    {formatTime(notification.createdAt)}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Chip 
                      style={[styles.typeChip, { backgroundColor: getTypeColor(notifType) + '15' }]}
                      textStyle={{ color: getTypeColor(notifType), fontSize: 10 }}
                    >
                      {notifType}
                    </Chip>
                    <Ionicons 
                      name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                      size={20} 
                      color={theme.colors.textSecondary} 
                    />
                  </View>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Top Bar */}
      <View style={[styles.topBar, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.topBarCenter}>
          <Text style={[styles.topBarTitle, { color: theme.colors.text }]}>Notifications</Text>
          {unreadCount > 0 && (
            <Badge style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
              {unreadCount}
            </Badge>
          )}
        </View>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markReadButton}>
            <Text style={{ color: theme.colors.primary, fontSize: 14, fontWeight: '600' }}>
              Mark all read
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      {/* Filter Chips */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {filterOptions.map(option => (
          <TouchableOpacity
            key={option.id}
            onPress={() => setSelectedFilter(option.id)}
          >
            <Chip
              selected={selectedFilter === option.id}
              style={[
                styles.filterChip,
                { 
                  backgroundColor: selectedFilter === option.id ? option.color : theme.colors.surface,
                  borderColor: option.color,
                  borderWidth: 1,
                }
              ]}
              textStyle={{ 
                color: selectedFilter === option.id ? '#FFFFFF' : theme.colors.text,
                fontWeight: selectedFilter === option.id ? '600' : '400',
              }}
            >
              {option.label}
            </Chip>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Notifications List */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={
          loading || filteredNotifications.length === 0 
            ? styles.contentContainerCentered 
            : styles.contentContainer
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
              Loading notifications...
            </Text>
          </View>
        ) : filteredNotifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.colors.text }]}>
              No notifications
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
              {selectedFilter === 'all' 
                ? "You're all caught up!" 
                : `No ${selectedFilter} notifications`}
            </Text>
          </View>
        ) : (
          <View style={styles.notificationsContainer}>
            {filteredNotifications.map(notification => renderNotificationCard(notification))}
          </View>
        )}
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
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  topBarCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topBarTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  badge: {
    fontSize: 12,
  },
  markReadButton: {
    padding: 4,
  },
  filterContainer: {
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterChip: {
    marginRight: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  contentContainerCentered: {
    padding: 16,
    flexGrow: 1,
  },
  notificationsContainer: {
    paddingBottom: 20,
  },
  notificationCard: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIconContainer: {
    position: 'relative',
    marginRight: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: 'white',
  },
  notificationContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 15,
    flex: 1,
    marginRight: 8,
  },
  priorityChip: {
    height: 22,
  },
  notificationMessage: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
  },
  typeChip: {
    height: 24,
  },
  expandedContent: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  detailText: {
    fontSize: 12,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
});
