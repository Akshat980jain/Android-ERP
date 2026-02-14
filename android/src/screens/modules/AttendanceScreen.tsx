import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Card,
  Chip,
  DataTable,
  Surface,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';
import CircularAttendanceChart from '../../components/CircularAttendanceChart';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Course {
  _id: string;
  name: string;
  code: string;
}

interface Student {
  _id: string;
  name: string;
  email: string;
  profile?: { studentId?: string };
}

interface AttendanceRecord {
  student: Student;
  status: 'present' | 'absent' | 'late' | null;
  markedAt: string | null;
  isWithinSchedule: boolean;
  remarks: string;
  lectureCount?: number;
}

interface ScheduleSlot {
  day: string;
  time: string;
  endTime?: string;
  room?: string;
}

interface SlotData {
  slot: ScheduleSlot;
  attendance: AttendanceRecord[];
}

interface CourseStat {
  course: { _id: string; name: string; code: string };
  total: number;
  present: number;
  percentage: number;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AttendanceScreen({ navigation }: any) {
  const { user } = useAuth();
  const isFaculty = user?.role === 'faculty' || user?.role === 'admin';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1F2937" />
      <LinearGradient colors={['#1F2937', '#111827']} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>ATTENDANCE</Text>
          <Ionicons name="information-circle-outline" size={24} color="#9CA3AF" />
        </View>
      </LinearGradient>

      {isFaculty ? <FacultyView /> : <StudentView />}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FACULTY VIEW — Course selector + Schedule-based attendance marking
// ═══════════════════════════════════════════════════════════════════════════════

function FacultyView() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [scheduleData, setScheduleData] = useState<SlotData[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [courseName, setCourseCode] = useState('');

  // Fetch faculty courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await apiService.getFacultyCourses();
        if (res.success !== false) {
          const c = (res as any).courses || (res as any).data?.courses || [];
          setCourses(c);
        }
      } catch (e) {
        console.error('Error fetching courses:', e);
      }
    };
    fetchCourses();
  }, []);

  // Fetch schedule attendance when course or date changes
  const fetchSchedule = useCallback(async () => {
    if (!selectedCourse) {
      setScheduleData([]);
      return;
    }
    setLoading(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const res = await apiService.getScheduleAttendance(selectedCourse, dateStr);
      if (res.success !== false) {
        const data = res as any;
        setScheduleData(data.attendanceMatrix || []);
        setCourseCode(data.course ? `${data.course.name} (${data.course.code})` : '');
      } else {
        setScheduleData([]);
      }
    } catch (e) {
      console.error('Error fetching schedule attendance:', e);
      setScheduleData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCourse, selectedDate]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSchedule();
    setRefreshing(false);
  };

  // Mark individual student
  const toggleStatus = (slotIdx: number, studentIdx: number, status: 'present' | 'absent' | 'late') => {
    setScheduleData(prev => {
      const updated = [...prev];
      const slot = { ...updated[slotIdx] };
      const attendance = [...slot.attendance];
      attendance[studentIdx] = {
        ...attendance[studentIdx],
        status: attendance[studentIdx].status === status ? null : status,
        markedAt: new Date().toISOString(),
      };
      slot.attendance = attendance;
      updated[slotIdx] = slot;
      return updated;
    });
  };

  // Mark all students in a slot
  const markAllInSlot = (slotIdx: number, status: 'present' | 'absent' | 'late') => {
    setScheduleData(prev => {
      const updated = [...prev];
      const slot = { ...updated[slotIdx] };
      slot.attendance = slot.attendance.map(record => ({
        ...record,
        status,
        markedAt: new Date().toISOString(),
      }));
      updated[slotIdx] = slot;
      return updated;
    });
  };

  // Submit attendance for a slot
  const submitSlot = async (slotIdx: number) => {
    const slot = scheduleData[slotIdx];
    const attendanceData = slot.attendance
      .filter(r => r.status !== null && r.student._id)
      .map(r => ({
        studentId: r.student._id,
        status: r.status!,
        remarks: r.remarks || '',
      }));

    if (attendanceData.length === 0) {
      Alert.alert('No Data', 'Please mark at least one student before submitting.');
      return;
    }

    setSubmitting(slotIdx);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const res = await apiService.markScheduleAttendance({
        courseId: selectedCourse,
        date: dateStr,
        scheduleSlot: {
          startTime: slot.slot.time,
          endTime: slot.slot.endTime || slot.slot.time,
        },
        attendanceData,
      });

      if (res.success !== false) {
        Alert.alert('Success', `Attendance submitted for ${slot.slot.time} slot!`);
        await fetchSchedule(); // Refresh
      } else {
        Alert.alert('Error', (res as any).message || 'Failed to submit attendance');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to submit attendance');
    } finally {
      setSubmitting(null);
    }
  };

  const dateStr = selectedDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <ScrollView
      style={styles.content}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366F1']} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Course Selector */}
      <Surface style={styles.selectorCard} elevation={2}>
        <Text style={styles.selectorLabel}>Select Course</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.courseChips}>
          {courses.length === 0 ? (
            <Text style={styles.emptyText}>No courses assigned</Text>
          ) : (
            courses.map(course => (
              <TouchableOpacity
                key={course._id}
                onPress={() => setSelectedCourse(course._id)}
                style={[
                  styles.courseChip,
                  selectedCourse === course._id && styles.courseChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.courseChipText,
                    selectedCourse === course._id && styles.courseChipTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {course.code || course.name}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {/* Date Navigation */}
        <View style={styles.dateRow}>
          <TouchableOpacity
            onPress={() => setSelectedDate(d => { const n = new Date(d); n.setDate(n.getDate() - 1); return n; })}
            style={styles.dateNavBtn}
          >
            <Ionicons name="chevron-back" size={20} color="#6366F1" />
          </TouchableOpacity>
          <View style={styles.dateButton}>
            <Ionicons name="calendar-outline" size={16} color="#6366F1" />
            <Text style={styles.dateText}>{dateStr}</Text>
          </View>
          <TouchableOpacity
            onPress={() => setSelectedDate(d => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; })}
            style={styles.dateNavBtn}
          >
            <Ionicons name="chevron-forward" size={20} color="#6366F1" />
          </TouchableOpacity>
        </View>
      </Surface>

      {/* Loading State */}
      {loading && (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading schedule...</Text>
        </View>
      )}

      {/* No Course Selected */}
      {!selectedCourse && !loading && (
        <Surface style={styles.emptyCard} elevation={1}>
          <Ionicons name="school-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Select a Course</Text>
          <Text style={styles.emptySubtitle}>Choose a course above to view schedule and mark attendance</Text>
        </Surface>
      )}

      {/* No Slots */}
      {selectedCourse && !loading && scheduleData.length === 0 && (
        <Surface style={styles.emptyCard} elevation={1}>
          <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No Classes Scheduled</Text>
          <Text style={styles.emptySubtitle}>No scheduled classes for {courseName} on this date</Text>
        </Surface>
      )}

      {/* Course Info */}
      {selectedCourse && !loading && scheduleData.length > 0 && courseName && (
        <Surface style={styles.courseInfoCard} elevation={2}>
          <Ionicons name="book-outline" size={20} color="#6366F1" />
          <Text style={styles.courseInfoText}>{courseName}</Text>
        </Surface>
      )}

      {/* Schedule Slots */}
      {scheduleData.map((slotData, slotIdx) => {
        const markedCount = slotData.attendance.filter(r => r.status !== null).length;
        const totalStudents = slotData.attendance.length;
        const isSubmitting = submitting === slotIdx;

        return (
          <Surface key={slotIdx} style={styles.slotCard} elevation={3}>
            {/* Slot Header */}
            <View style={styles.slotHeader}>
              <View style={styles.slotTimeRow}>
                <Ionicons name="time-outline" size={20} color="#6366F1" />
                <Text style={styles.slotTime}>
                  {slotData.slot.time}
                  {slotData.slot.endTime ? ` - ${slotData.slot.endTime}` : ''}
                </Text>
                {slotData.slot.room && (
                  <Chip mode="outlined" style={styles.roomChip} textStyle={styles.roomChipText}>
                    {slotData.slot.room}
                  </Chip>
                )}
              </View>
              <Text style={styles.markedCount}>
                {markedCount}/{totalStudents} marked
              </Text>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={[styles.quickBtn, { backgroundColor: '#D1FAE5' }]}
                onPress={() => markAllInSlot(slotIdx, 'present')}
              >
                <Ionicons name="checkmark-circle" size={16} color="#059669" />
                <Text style={[styles.quickBtnText, { color: '#059669' }]}>All Present</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickBtn, { backgroundColor: '#FEE2E2' }]}
                onPress={() => markAllInSlot(slotIdx, 'absent')}
              >
                <Ionicons name="close-circle" size={16} color="#DC2626" />
                <Text style={[styles.quickBtnText, { color: '#DC2626' }]}>All Absent</Text>
              </TouchableOpacity>
            </View>

            {/* Student List */}
            {slotData.attendance.map((record, studentIdx) => (
              <View key={record.student._id} style={styles.studentRow}>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName} numberOfLines={1}>
                    {record.student.name}
                  </Text>
                  <Text style={styles.studentId} numberOfLines={1}>
                    {record.student.profile?.studentId || record.student.email}
                  </Text>
                </View>
                <View style={styles.statusButtons}>
                  <TouchableOpacity
                    onPress={() => toggleStatus(slotIdx, studentIdx, 'present')}
                    style={[
                      styles.statusBtn,
                      record.status === 'present' && styles.statusBtnPresent,
                    ]}
                  >
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color={record.status === 'present' ? '#fff' : '#059669'}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => toggleStatus(slotIdx, studentIdx, 'absent')}
                    style={[
                      styles.statusBtn,
                      record.status === 'absent' && styles.statusBtnAbsent,
                    ]}
                  >
                    <Ionicons
                      name="close"
                      size={16}
                      color={record.status === 'absent' ? '#fff' : '#DC2626'}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => toggleStatus(slotIdx, studentIdx, 'late')}
                    style={[
                      styles.statusBtn,
                      record.status === 'late' && styles.statusBtnLate,
                    ]}
                  >
                    <Ionicons
                      name="time"
                      size={16}
                      color={record.status === 'late' ? '#fff' : '#D97706'}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
              onPress={() => submitSlot(slotIdx)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
                  <Text style={styles.submitBtnText}>Submit Attendance</Text>
                </>
              )}
            </TouchableOpacity>
          </Surface>
        );
      })}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STUDENT VIEW — Real attendance stats (no hardcoded data)
// ═══════════════════════════════════════════════════════════════════════════════

function StudentView() {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [courseStats, setCourseStats] = useState<CourseStat[]>([]);
  const [averageAttendance, setAverageAttendance] = useState(0);
  const [recentRecords, setRecentRecords] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState({
    physical: 0,
    placement: 0,
    absent: 0,
    total: 0,
  });

  const fetchAttendance = useCallback(async () => {
    try {
      const res = await apiService.getAttendanceStats();
      if (res.success !== false) {
        const data = res as any;
        const stats: CourseStat[] = data.stats || [];
        const records = data.attendance || [];
        const avg = data.averageAttendance || 0;

        setCourseStats(stats);
        setAverageAttendance(avg);
        setRecentRecords(records.slice(0, 10));

        // Calculate totals for the chart
        let totalPresent = 0;
        let totalAbsent = 0;
        let totalAll = 0;
        stats.forEach((s: CourseStat) => {
          totalPresent += s.present || 0;
          totalAbsent += (s.total || 0) - (s.present || 0);
          totalAll += s.total || 0;
        });

        setAttendanceData({
          physical: Math.round(totalPresent),
          placement: 0,
          absent: Math.round(totalAbsent),
          total: totalAll,
        });
      }
    } catch (e) {
      console.error('Error fetching attendance:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAttendance();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.content}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366F1']} />}
      showsVerticalScrollIndicator={false}
    >
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading attendance...</Text>
        </View>
      ) : (
        <>
          {/* Overall Chart */}
          {attendanceData.total > 0 ? (
            <Surface style={styles.chartCard} elevation={4}>
              <CircularAttendanceChart data={attendanceData} />
            </Surface>
          ) : (
            <Surface style={styles.emptyCard} elevation={1}>
              <Ionicons name="bar-chart-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No Attendance Data</Text>
              <Text style={styles.emptySubtitle}>Attendance records will appear here once marked</Text>
            </Surface>
          )}

          {/* Course-wise Breakdown */}
          {courseStats.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Course-wise Attendance</Text>
              {courseStats.map((stat, idx) => {
                const pct = Math.round(stat.percentage || 0);
                const isLow = pct < 75;
                return (
                  <Surface key={idx} style={styles.courseStatCard} elevation={2}>
                    <View style={styles.courseStatHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.courseStatName} numberOfLines={1}>
                          {stat.course?.name || 'Unknown'}
                        </Text>
                        <Text style={styles.courseStatCode}>{stat.course?.code || ''}</Text>
                      </View>
                      <View style={[styles.percentBadge, isLow ? styles.percentBadgeLow : styles.percentBadgeOk]}>
                        <Text style={[styles.percentText, isLow ? styles.percentTextLow : styles.percentTextOk]}>
                          {pct}%
                        </Text>
                      </View>
                    </View>
                    {/* Progress bar */}
                    <View style={styles.progressBg}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${Math.min(pct, 100)}%` },
                          isLow ? { backgroundColor: '#EF4444' } : { backgroundColor: '#10B981' },
                        ]}
                      />
                    </View>
                    <Text style={styles.courseStatDetail}>
                      {Math.round(stat.present)}/{stat.total} classes attended
                    </Text>
                  </Surface>
                );
              })}
            </View>
          )}

          {/* Recent Records */}
          {recentRecords.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Records</Text>
              <Surface style={styles.tableCard} elevation={2}>
                <DataTable>
                  <DataTable.Header style={styles.tableHeader}>
                    <DataTable.Title textStyle={styles.tableHeaderText}>Course</DataTable.Title>
                    <DataTable.Title textStyle={styles.tableHeaderText}>Date</DataTable.Title>
                    <DataTable.Title textStyle={styles.tableHeaderText}>Status</DataTable.Title>
                  </DataTable.Header>

                  {recentRecords.map((record: any, idx: number) => (
                    <DataTable.Row key={record._id || idx} style={styles.tableRow}>
                      <DataTable.Cell textStyle={styles.tableCellText}>
                        {record.course?.code || record.course?.name || 'N/A'}
                      </DataTable.Cell>
                      <DataTable.Cell textStyle={styles.tableCellText}>
                        {new Date(record.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </DataTable.Cell>
                      <DataTable.Cell>
                        <Chip
                          mode="flat"
                          style={[
                            styles.statusChip,
                            {
                              backgroundColor:
                                record.status === 'present'
                                  ? '#D1FAE5'
                                  : record.status === 'absent'
                                    ? '#FEE2E2'
                                    : '#FEF3C7',
                            },
                          ]}
                          textStyle={[
                            styles.statusChipText,
                            {
                              color:
                                record.status === 'present'
                                  ? '#059669'
                                  : record.status === 'absent'
                                    ? '#DC2626'
                                    : '#D97706',
                            },
                          ]}
                        >
                          {record.status === 'present' ? 'Present' : record.status === 'late' ? 'Late' : 'Absent'}
                        </Chip>
                      </DataTable.Cell>
                    </DataTable.Row>
                  ))}
                </DataTable>
              </Surface>
            </View>
          )}

          {/* Info Note */}
          <Surface style={styles.infoCard} elevation={1}>
            <Ionicons name="information-circle" size={20} color="#6366F1" />
            <Text style={styles.infoText}>
              Minimum 75% attendance is required for semester eligibility
            </Text>
          </Surface>
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#FFFFFF', letterSpacing: 1.5 },
  content: { flex: 1 },
  contentContainer: { padding: 16 },

  // Selector card
  selectorCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16 },
  selectorLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 10 },
  courseChips: { flexDirection: 'row', marginBottom: 12 },
  courseChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB', marginRight: 8,
  },
  courseChipActive: { borderColor: '#6366F1', backgroundColor: '#EEF2FF' },
  courseChipText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  courseChipTextActive: { color: '#6366F1' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateNavBtn: { padding: 6, borderRadius: 8, backgroundColor: '#EEF2FF' },
  dateButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#F3F4F6', borderRadius: 8 },
  dateText: { fontSize: 14, fontWeight: '500', color: '#374151' },

  // Empty states
  emptyCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 32,
    alignItems: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginTop: 12 },
  emptySubtitle: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginTop: 4 },
  emptyText: { fontSize: 13, color: '#9CA3AF', paddingVertical: 8 },

  // Loading
  centerBox: { alignItems: 'center', paddingVertical: 40 },
  loadingText: { fontSize: 14, color: '#6B7280', marginTop: 12 },

  // Course info
  courseInfoCard: {
    backgroundColor: '#EEF2FF', borderRadius: 12, padding: 12,
    marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  courseInfoText: { fontSize: 14, fontWeight: '600', color: '#4338CA', flex: 1 },

  // Slot card
  slotCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16 },
  slotHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  slotTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  slotTime: { fontSize: 16, fontWeight: '700', color: '#111827' },
  roomChip: { height: 28, marginLeft: 4 },
  roomChipText: { fontSize: 11 },
  markedCount: { fontSize: 12, fontWeight: '600', color: '#6B7280' },

  // Quick actions
  quickActions: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  quickBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
  },
  quickBtnText: { fontSize: 12, fontWeight: '600' },

  // Student row
  studentRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  studentInfo: { flex: 1, marginRight: 8 },
  studentName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  studentId: { fontSize: 12, color: '#9CA3AF' },

  // Status buttons
  statusButtons: { flexDirection: 'row', gap: 6 },
  statusBtn: {
    width: 34, height: 34, borderRadius: 17,
    borderWidth: 1.5, borderColor: '#E5E7EB',
    alignItems: 'center', justifyContent: 'center',
  },
  statusBtnPresent: { backgroundColor: '#059669', borderColor: '#059669' },
  statusBtnAbsent: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
  statusBtnLate: { backgroundColor: '#D97706', borderColor: '#D97706' },

  // Submit
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#6366F1', borderRadius: 12, paddingVertical: 14, marginTop: 16,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  // Student view chart
  chartCard: { backgroundColor: '#1F2937', borderRadius: 20, padding: 24, marginBottom: 24 },

  // Course stat cards
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },
  courseStatCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  courseStatHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  courseStatName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  courseStatCode: { fontSize: 12, color: '#9CA3AF' },
  percentBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  percentBadgeOk: { backgroundColor: '#D1FAE5' },
  percentBadgeLow: { backgroundColor: '#FEE2E2' },
  percentText: { fontSize: 14, fontWeight: '700' },
  percentTextOk: { color: '#059669' },
  percentTextLow: { color: '#DC2626' },
  progressBg: { height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  courseStatDetail: { fontSize: 12, color: '#6B7280', marginTop: 6 },

  // Recent records table
  tableCard: { backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden' },
  tableHeader: { backgroundColor: '#F3F4F6' },
  tableHeaderText: { fontSize: 13, fontWeight: '700', color: '#374151' },
  tableRow: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  tableCellText: { fontSize: 14, fontWeight: '500', color: '#111827' },
  statusChip: { height: 28 },
  statusChipText: { fontSize: 12, fontWeight: '600' },

  // Info card
  infoCard: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    backgroundColor: '#EEF2FF', borderRadius: 12, gap: 12,
  },
  infoText: { flex: 1, fontSize: 13, fontWeight: '500', color: '#4338CA', lineHeight: 18 },
});
