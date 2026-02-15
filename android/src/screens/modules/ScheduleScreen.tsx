import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  FlatList,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  FAB,
  Chip,
  Portal,
  Modal as PaperModal,
  Provider as PaperProvider,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import apiService from '../../services/api';
import { ScheduleItem } from '../../types';

const { width } = Dimensions.get('window');

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_LABELS = {
  'Monday': 'Monday',
  'Tuesday': 'Tuesday',
  'Wednesday': 'Wednesday',
  'Thursday': 'Thursday',
  'Friday': 'Friday',
  'Saturday': 'Saturday'
};
const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
];

interface Course {
  _id: string;
  name: string;
  code: string;
}

export default function ScheduleScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  const [newScheduleItem, setNewScheduleItem] = useState({
    course: '',
    dayOfWeek: 'Monday',
    startTime: '09:00',
    endTime: '10:00',
    room: '',
    type: 'lecture' as 'lecture' | 'lab' | 'tutorial' | 'seminar'
  });

  useEffect(() => {
    console.log('ScheduleScreen mounted, fetching data...');
    fetchSchedule();
    fetchCourses();
  }, []);

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const fetchSchedule = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiService.getSchedule();
      console.log('Schedule API Response:', response);
      if (response.success) {
        // Backend returns { success: true, schedule: [...] }
        const scheduleData = (response as any).schedule || [];
        console.log('Schedule data loaded:', scheduleData.length, 'items');
        setSchedule(scheduleData);
      } else {
        console.log('Schedule fetch failed:', response.error || response.message);
        setError(response.error || response.message || 'Failed to fetch schedule');
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
      setError('Failed to fetch schedule');
    }
    setLoading(false);
  };

  const fetchCourses = async () => {
    try {
      const response = await apiService.getStudentCourses();
      console.log('Courses API Response:', response);
      if (response.success) {
        // Backend returns { success: true, courses: [...] }
        const coursesData = (response as any).courses || [];
        console.log('Courses data loaded:', coursesData.length, 'courses');
        setCourses(coursesData);
      } else {
        console.log('Courses fetch failed:', response.error || response.message);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSchedule();
    setRefreshing(false);
  };

  const timeToMinutes = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const isValidTimeRange = (startTime: string, endTime: string) => {
    return timeToMinutes(endTime) > timeToMinutes(startTime);
  };

  const getDefaultEndTime = (startTime: string) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = hours + 1;
    const endMinutes = minutes;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };

  const getDuration = (startTime: string, endTime: string) => {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    const durationMinutes = endMinutes - startMinutes;

    if (durationMinutes <= 0) return '0 min';

    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;

    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  };

  const addScheduleItem = async () => {
    if (!isValidTimeRange(newScheduleItem.startTime, newScheduleItem.endTime)) {
      setError('End time must be after start time');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const scheduleData = {
        courseId: newScheduleItem.course,
        dayOfWeek: newScheduleItem.dayOfWeek,
        startTime: newScheduleItem.startTime,
        endTime: newScheduleItem.endTime,
        room: newScheduleItem.room,
        type: newScheduleItem.type
      };
      const response = await apiService.addScheduleItem(scheduleData);
      if (response.success) {
        await fetchSchedule();
        setNewScheduleItem({
          course: '',
          dayOfWeek: 'Monday',
          startTime: '09:00',
          endTime: '10:00',
          room: '',
          type: 'lecture'
        });
        setShowAddForm(false);
        setSuccess('Schedule item added successfully!');
      } else {
        setError(response.error || 'Failed to add schedule item');
      }
    } catch (error) {
      setError('Failed to add schedule item');
    }
    setLoading(false);
  };

  const updateScheduleItem = async () => {
    if (!editingItem) return;

    if (!isValidTimeRange(newScheduleItem.startTime, newScheduleItem.endTime)) {
      setError('End time must be after start time');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const scheduleData = {
        courseId: newScheduleItem.course,
        dayOfWeek: newScheduleItem.dayOfWeek,
        startTime: newScheduleItem.startTime,
        endTime: newScheduleItem.endTime,
        room: newScheduleItem.room,
        type: newScheduleItem.type,
        originalCourseId: editingItem.course._id,
        originalDayOfWeek: editingItem.dayOfWeek,
        originalStartTime: editingItem.startTime,
      };

      const response = await apiService.updateScheduleItem(editingItem.course._id, scheduleData);
      if (response.success) {
        await fetchSchedule();
        setEditingItem(null);
        setShowAddForm(false);
        setNewScheduleItem({
          course: '',
          dayOfWeek: 'Monday',
          startTime: '09:00',
          endTime: '10:00',
          room: '',
          type: 'lecture'
        });
        setSuccess('Schedule item updated successfully!');
      } else {
        setError(response.error || 'Failed to update schedule item');
      }
    } catch (error) {
      setError('Failed to update schedule item');
    }
    setLoading(false);
  };

  const deleteScheduleItem = async (item: ScheduleItem) => {
    Alert.alert(
      'Delete Schedule Item',
      'Are you sure you want to delete this schedule item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const scheduleData = {
                courseId: item.course._id,
                dayOfWeek: item.dayOfWeek,
                startTime: item.startTime
              };

              const response = await apiService.deleteScheduleItem(item.course._id, scheduleData);
              if (response.success) {
                await fetchSchedule();
                setSuccess('Schedule item deleted successfully!');
              } else {
                setError(response.error || 'Failed to delete schedule item');
              }
            } catch (error) {
              setError('Failed to delete schedule item');
            }
          }
        }
      ]
    );
  };

  const startEditing = (item: ScheduleItem) => {
    setEditingItem(item);
    setNewScheduleItem({
      course: item.course._id,
      dayOfWeek: item.dayOfWeek,
      startTime: item.startTime,
      endTime: item.endTime,
      room: item.room,
      type: item.type
    });
    setShowAddForm(true);
  };

  const getScheduleForDay = (day: string) => {
    return schedule
      .filter(item => item.dayOfWeek === day)
      .sort((a, b) => {
        const aMinutes = timeToMinutes(a.startTime);
        const bMinutes = timeToMinutes(b.startTime);
        return aMinutes - bMinutes;
      });
  };

  const getTotalDayDuration = (day: string) => {
    const daySchedule = getScheduleForDay(day);
    let totalMinutes = 0;

    daySchedule.forEach(item => {
      totalMinutes += timeToMinutes(item.endTime) - timeToMinutes(item.startTime);
    });

    if (totalMinutes <= 0) return '0 min';

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lecture': return '#3B82F6';
      case 'lab': return '#10B981';
      case 'tutorial': return '#F59E0B';
      case 'seminar': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const getTypeGradient = (type: string): [string, string] => {
    switch (type) {
      case 'lecture': return ['#3B82F6', '#2563EB'];
      case 'lab': return ['#10B981', '#059669'];
      case 'tutorial': return ['#F59E0B', '#D97706'];
      case 'seminar': return ['#8B5CF6', '#7C3AED'];
      default: return ['#6B7280', '#4B5563'];
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lecture': return '📚';
      case 'lab': return '🔬';
      case 'tutorial': return '✏️';
      case 'seminar': return '🎓';
      default: return '📖';
    }
  };

  const renderTimelineItem = ({ item, index, isLast }: { item: ScheduleItem; index: number; isLast: boolean }) => (
    <View style={styles.timelineItemContainer}>
      {/* Timeline Circle and Line */}
      <View style={styles.timelineLeftSection}>
        <View style={[styles.timelineCircle, { backgroundColor: getTypeColor(item.type) }]}>
          <Text style={styles.timelineNumber}>{index + 1}</Text>
        </View>
        {!isLast && <View style={styles.timelineLine} />}
      </View>

      {/* Content Section */}
      <View style={styles.timelineContent}>
        {/* Course Name and Code */}
        <Text style={styles.timelineCourseTitle}>
          {item.course.name.toUpperCase()}
          <Text style={styles.timelineCourseCode}>
            {' '}( {item.course.code} )
          </Text>
        </Text>

        {/* Time */}
        <View style={styles.timelineInfoRow}>
          <Text style={styles.timelineIcon}>🕐</Text>
          <Text style={styles.timelineInfoText}>
            {item.startTime} - {item.endTime}
          </Text>
        </View>

        {/* Faculty/Room */}
        <View style={styles.timelineInfoRow}>
          <Text style={styles.timelineIcon}>👤</Text>
          <Text style={styles.timelineInfoText}>
            {item.room}
          </Text>
        </View>

        {/* Action Buttons for Admin/Faculty */}
        {user?.role === 'admin' && (
          <View style={styles.timelineActions}>
            <TouchableOpacity
              onPress={() => startEditing(item)}
              style={styles.timelineActionButton}
            >
              <Text style={styles.timelineActionText}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => deleteScheduleItem(item)}
              style={styles.timelineActionButton}
            >
              <Text style={styles.timelineActionText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  const renderDayTabs = () => {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dayTabsContainer}
      >
        {DAYS_OF_WEEK.map((day) => (
          <TouchableOpacity
            key={day}
            onPress={() => setSelectedDay(day)}
            style={[
              styles.dayTab,
              selectedDay === day && styles.dayTabActive,
            ]}
          >
            <Text style={[
              styles.dayTabText,
              { color: selectedDay === day ? '#2196F3' : '#808080' }
            ]}>
              {day}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderScheduleContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading schedule...</Text>
        </View>
      );
    }

    const daySchedule = getScheduleForDay(selectedDay);

    if (daySchedule.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Classes Today</Text>
          <Text style={styles.emptySubtitle}>
            No schedule items found for {selectedDay}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.timelineContainer}>
        {daySchedule.map((item, index) => (
          <View key={`${item._id}-${index}`}>
            {renderTimelineItem({ item, index, isLast: index === daySchedule.length - 1 })}
          </View>
        ))}
      </View>
    );
  };

  return (
    <PaperProvider>
      <View style={styles.container}>
        <StatusBar
          barStyle={theme.colors.statusBarStyle}
          backgroundColor={theme.colors.surface}
          translucent={false}
        />
        <View style={[styles.header, {
          paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 16,
        }]}>
          <Title style={styles.title}>Time Table</Title>
          {user?.role === 'admin' && (
            <Button
              mode="contained"
              onPress={() => {
                setShowAddForm(true);
                setEditingItem(null);
                setNewScheduleItem({
                  course: '',
                  dayOfWeek: selectedDay,
                  startTime: '09:00',
                  endTime: '10:00',
                  room: '',
                  type: 'lecture'
                });
              }}
              style={styles.addButton}
            >
              Add
            </Button>
          )}
        </View>

        {/* Day Tabs */}
        {renderDayTabs()}

        {error ? (
          <Card style={styles.errorCard}>
            <Card.Content>
              <Text style={styles.errorText}>{error}</Text>
            </Card.Content>
          </Card>
        ) : null}

        {success ? (
          <Card style={styles.successCard}>
            <Card.Content>
              <Text style={styles.successText}>{success}</Text>
            </Card.Content>
          </Card>
        ) : null}

        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
          }
        >
          {renderScheduleContent()}
        </ScrollView>

        <Portal>
          <PaperModal
            visible={showAddForm}
            onDismiss={() => setShowAddForm(false)}
            contentContainerStyle={styles.modal}
          >
            <ScrollView>
              <Title style={styles.modalTitle}>
                {editingItem ? 'Edit Schedule Item' : 'Add New Schedule Item'}
              </Title>

              <TextInput
                style={styles.input}
                placeholder="Select Course"
                value={courses.find(c => c._id === newScheduleItem.course) ?
                  `${courses.find(c => c._id === newScheduleItem.course)?.code} - ${courses.find(c => c._id === newScheduleItem.course)?.name}` : ''}
                editable={false}
              />

              <View style={styles.courseList}>
                {courses.map((item) => (
                  <TouchableOpacity
                    key={item._id}
                    style={styles.courseOption}
                    onPress={() => setNewScheduleItem({ ...newScheduleItem, course: item._id })}
                  >
                    <Text style={styles.courseOptionText}>
                      <Text style={styles.courseCodeText}>{item.code}</Text> - {item.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.input}
                placeholder="Day of Week"
                value={newScheduleItem.dayOfWeek}
                editable={false}
              />

              <View style={styles.dayList}>
                {DAYS_OF_WEEK.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={styles.dayOption}
                    onPress={() => setNewScheduleItem({ ...newScheduleItem, dayOfWeek: item })}
                  >
                    <Text style={styles.dayOptionText}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.timeRow}>
                <View style={styles.timeInput}>
                  <Text style={styles.inputLabel}>Start Time</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="09:00"
                    value={newScheduleItem.startTime}
                    onChangeText={(text) => {
                      setNewScheduleItem({
                        ...newScheduleItem,
                        startTime: text,
                        endTime: text && newScheduleItem.endTime &&
                          !isValidTimeRange(text, newScheduleItem.endTime)
                          ? getDefaultEndTime(text)
                          : newScheduleItem.endTime
                      });
                    }}
                  />
                </View>
                <View style={styles.timeInput}>
                  <Text style={styles.inputLabel}>End Time</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="10:00"
                    value={newScheduleItem.endTime}
                    onChangeText={(text) => setNewScheduleItem({ ...newScheduleItem, endTime: text })}
                  />
                </View>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Room"
                value={newScheduleItem.room}
                onChangeText={(text) => setNewScheduleItem({ ...newScheduleItem, room: text })}
              />

              <TextInput
                style={styles.input}
                placeholder="Type"
                value={newScheduleItem.type}
                editable={false}
              />

              <View style={styles.typeList}>
                {['lecture', 'lab', 'tutorial', 'seminar'].map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={styles.typeOption}
                    onPress={() => setNewScheduleItem({ ...newScheduleItem, type: item as any })}
                  >
                    <Text style={styles.typeOptionText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalButtons}>
                <Button
                  mode="contained"
                  onPress={editingItem ? updateScheduleItem : addScheduleItem}
                  loading={loading}
                  disabled={loading}
                  style={styles.saveButton}
                >
                  {editingItem ? 'Update' : 'Add'}
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => setShowAddForm(false)}
                  style={styles.cancelButton}
                >
                  Cancel
                </Button>
              </View>
            </ScrollView>
          </PaperModal>
        </Portal>
      </View>
    </PaperProvider>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.surface,
    elevation: 0,
    borderBottomWidth: 0,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  addButton: {
    borderRadius: 8,
    paddingHorizontal: 8,
    backgroundColor: theme.colors.primary,
  },
  // Day Tabs
  dayTabsContainer: {
    flexGrow: 0,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  dayTab: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  dayTabActive: {
    borderBottomWidth: 3,
    borderBottomColor: theme.colors.primary,
  },
  dayTabText: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  // Timeline Styles
  timelineContainer: {
    padding: 16,
    backgroundColor: theme.colors.background,
  },
  timelineItemContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  timelineLeftSection: {
    width: 50,
    alignItems: 'center',
    marginRight: 12,
  },
  timelineCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  timelineNumber: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
    backgroundColor: theme.colors.border,
  },
  timelineContent: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: theme.colors.card,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  timelineCourseTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 8,
    color: theme.colors.text,
  },
  timelineCourseCode: {
    fontSize: 13,
    fontWeight: 'normal',
    color: theme.colors.textSecondary,
  },
  timelineInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  timelineIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  timelineInfoText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  timelineActions: {
    flexDirection: 'row',
    marginTop: 10,
    justifyContent: 'flex-end',
  },
  timelineActionButton: {
    padding: 6,
    marginLeft: 8,
    backgroundColor: theme.isDark ? '#2A2A2A' : '#E5E7EB',
    borderRadius: 6,
  },
  timelineActionText: {
    fontSize: 16,
  },
  errorCard: {
    margin: 12,
    borderRadius: 8,
    backgroundColor: theme.isDark ? '#2A1A1A' : '#FEE2E2',
  },
  errorText: {
    textAlign: 'center',
    fontSize: 13,
    color: theme.colors.error,
  },
  successCard: {
    margin: 12,
    borderRadius: 8,
    backgroundColor: theme.isDark ? '#1A2A1A' : '#D1FAE5',
  },
  successText: {
    textAlign: 'center',
    fontSize: 13,
    color: theme.colors.success,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 200,
    backgroundColor: theme.colors.background,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: theme.colors.text,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: theme.colors.textSecondary,
  },
  retryButton: {
    marginTop: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
  },
  modal: {
    margin: 20,
    borderRadius: 16,
    maxHeight: '80%',
    padding: 24,
    backgroundColor: theme.colors.card,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: theme.colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    fontSize: 14,
    backgroundColor: theme.isDark ? '#0A0A0A' : '#F9FAFB',
    color: theme.colors.text,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
    color: theme.colors.textSecondary,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  timeInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  courseList: {
    maxHeight: 120,
    marginBottom: 16,
    backgroundColor: theme.isDark ? '#0A0A0A' : '#F9FAFB',
    borderRadius: 8,
  },
  courseOption: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    borderRadius: 8,
  },
  courseOptionText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  courseCodeText: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  dayList: {
    maxHeight: 120,
    marginBottom: 16,
    backgroundColor: theme.isDark ? '#0A0A0A' : '#F9FAFB',
    borderRadius: 8,
  },
  dayOption: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    borderRadius: 8,
  },
  dayOptionText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  typeList: {
    maxHeight: 120,
    marginBottom: 16,
    backgroundColor: theme.isDark ? '#0A0A0A' : '#F9FAFB',
    borderRadius: 8,
  },
  typeOption: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    borderRadius: 8,
  },
  typeOptionText: {
    fontSize: 14,
    textTransform: 'capitalize',
    color: theme.colors.text,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  saveButton: {
    flex: 1,
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
  },
  cancelButton: {
    flex: 1,
    marginLeft: 8,
    borderRadius: 12,
    backgroundColor: theme.isDark ? '#2A2A2A' : '#E5E7EB',
  },
});
