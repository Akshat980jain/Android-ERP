import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Animated,
  useColorScheme,
  Dimensions,
} from 'react-native';
import {
  Chip,
  DataTable,
  Surface,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';
import CircularAttendanceChart from '../../components/CircularAttendanceChart';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Types ───────────────────────────────────────────────────────────────────

interface Course {
  _id: string;
  name: string;
  code: string;
  schedule?: Array<{ day: string; time: string; endTime?: string; room?: string }>;
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

// ─── Theme System ────────────────────────────────────────────────────────────

const themes = {
  dark: {
    bg: '#0F1117',
    card: '#1A1D27',
    cardElevated: '#222639',
    surface: '#2A2E3D',
    text: '#FFFFFF',
    textSecondary: '#9CA3AF',
    textMuted: '#6B7280',
    accent: '#10B981',     // Green
    accentLight: '#065F46',
    accentSoft: 'rgba(16, 185, 129, 0.15)',
    danger: '#EF4444',
    dangerSoft: 'rgba(239, 68, 68, 0.15)',
    warning: '#F59E0B',
    warningSoft: 'rgba(245, 158, 11, 0.15)',
    info: '#6366F1',
    infoSoft: 'rgba(99, 102, 241, 0.15)',
    border: '#2D3148',
    headerGrad: ['#0F1117', '#161927'] as [string, string],
    statusBar: 'light-content' as const,
    inputBg: '#1A1D27',
    inputBorder: '#2D3148',
    dropdownBg: '#222639',
    successGrad: ['#0F1117', '#0D2818'] as [string, string],
    present: '#10B981',
    absent: '#EF4444',
    late: '#F59E0B',
    presentBg: 'rgba(16, 185, 129, 0.2)',
    absentBg: 'rgba(239, 68, 68, 0.2)',
    lateBg: 'rgba(245, 158, 11, 0.2)',
  },
  light: {
    bg: '#F3F4F6',
    card: '#FFFFFF',
    cardElevated: '#FFFFFF',
    surface: '#F9FAFB',
    text: '#111827',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    accent: '#059669',
    accentLight: '#D1FAE5',
    accentSoft: 'rgba(5, 150, 105, 0.1)',
    danger: '#DC2626',
    dangerSoft: 'rgba(220, 38, 38, 0.1)',
    warning: '#D97706',
    warningSoft: 'rgba(217, 119, 6, 0.1)',
    info: '#4F46E5',
    infoSoft: 'rgba(79, 70, 229, 0.1)',
    border: '#E5E7EB',
    headerGrad: ['#1F2937', '#111827'] as [string, string],
    statusBar: 'light-content' as const,
    inputBg: '#F9FAFB',
    inputBorder: '#D1D5DB',
    dropdownBg: '#FFFFFF',
    successGrad: ['#F0FDF4', '#DCFCE7'] as [string, string],
    present: '#059669',
    absent: '#DC2626',
    late: '#D97706',
    presentBg: '#D1FAE5',
    absentBg: '#FEE2E2',
    lateBg: '#FEF3C7',
  },
};

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AttendanceScreen({ navigation }: any) {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const t = themes[colorScheme === 'light' ? 'light' : 'dark'];
  const isFaculty = user?.role === 'faculty' || user?.role === 'admin';

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <StatusBar barStyle={t.statusBar} backgroundColor={t.headerGrad[0]} />
      {isFaculty ? <FacultyFlow theme={t} /> : <StudentView theme={t} />}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FACULTY 3-STEP FLOW (matching reference image)
// ═══════════════════════════════════════════════════════════════════════════════

type FacultyStep = 'select' | 'slots' | 'success';

function FacultyFlow({ theme: t }: { theme: typeof themes.dark }) {
  const [step, setStep] = useState<FacultyStep>('select');
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [scheduleData, setScheduleData] = useState<SlotData[]>([]);
  const [courseInfo, setCourseInfo] = useState<{ name: string; code: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [successSlot, setSuccessSlot] = useState('');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Current time for status
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch courses on mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await apiService.getFacultyCourses();
        const data = res as any;
        if (data?.success !== false) {
          setCourses(data?.courses || []);
        }
      } catch (e) {
        console.error('Error fetching courses:', e);
      }
    };
    fetchCourses();
  }, []);

  const selectedCourse = courses.find(c => c._id === selectedCourseId);

  // Transition helper
  const animateTransition = (nextStep: FacultyStep) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setStep(nextStep);
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    });
  };

  // Find Slots
  const findSlots = async () => {
    if (!selectedCourseId) {
      Alert.alert('Select Course', 'Please select a course first.');
      return;
    }
    setLoading(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const res = await apiService.getScheduleAttendance(selectedCourseId, dateStr);
      const data = res as any;
      if (data?.success !== false) {
        setScheduleData(data.attendanceMatrix || []);
        setCourseInfo(data.course || null);
        animateTransition('slots');
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch schedule');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to fetch schedule');
    } finally {
      setLoading(false);
    }
  };

  // Time status helpers
  const getTimeStatus = (slotTime: string, slotEndTime?: string) => {
    const now = currentTime;
    const dateStr = selectedDate.toISOString().split('T')[0];
    const start = new Date(dateStr + 'T' + slotTime);
    const end = slotEndTime
      ? new Date(dateStr + 'T' + slotEndTime)
      : new Date(start.getTime() + 60 * 60 * 1000);

    if (now < start) return 'upcoming';
    if (now >= start && now <= end) return 'current';
    return 'past';
  };

  // Toggle student status
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

  // Mark all in slot
  const markAllInSlot = (slotIdx: number, status: 'present' | 'absent') => {
    setScheduleData(prev => {
      const updated = [...prev];
      const slot = { ...updated[slotIdx] };
      slot.attendance = slot.attendance.map(r => ({
        ...r,
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
      Alert.alert('No Data', 'Mark at least one student before submitting.');
      return;
    }

    setSubmitting(slotIdx);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const res = await apiService.markScheduleAttendance({
        courseId: selectedCourseId,
        date: dateStr,
        scheduleSlot: {
          startTime: slot.slot.time,
          endTime: slot.slot.endTime || slot.slot.time,
        },
        attendanceData,
      });

      if ((res as any).success !== false) {
        setSuccessSlot(slot.slot.time);
        animateTransition('success');
      } else {
        Alert.alert('Error', (res as any).message || 'Failed to submit');
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

  // ── STEP 1: Select Course & Date ──────────────────────────────────────────

  if (step === 'select') {
    return (
      <Animated.View style={[styles.flex1, { opacity: fadeAnim }]}>
        {/* Header */}
        <LinearGradient colors={t.headerGrad} style={styles.header}>
          <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={t.text} />
          </TouchableOpacity>
          <Text style={[styles.headerLabel, { color: t.textSecondary }]}>Faculty Attendance</Text>
        </LinearGradient>

        <ScrollView
          style={styles.flex1}
          contentContainerStyle={[styles.stepContent, { backgroundColor: t.bg }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.stepTitle, { color: t.text }]}>Select Course & Date</Text>

          {/* Course Dropdown */}
          <Text style={[styles.fieldLabel, { color: t.textSecondary }]}>Course</Text>
          <TouchableOpacity
            style={[styles.dropdown, { backgroundColor: t.inputBg, borderColor: t.inputBorder }]}
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <Text
              style={[
                styles.dropdownText,
                { color: selectedCourse ? t.text : t.textMuted },
              ]}
              numberOfLines={1}
            >
              {selectedCourse
                ? `${selectedCourse.code} - ${selectedCourse.name}`
                : 'Choose a course'}
            </Text>
            <Ionicons
              name={showDropdown ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={t.textMuted}
            />
          </TouchableOpacity>

          {/* Dropdown Options */}
          {showDropdown && (
            <View style={[styles.dropdownList, { backgroundColor: t.dropdownBg, borderColor: t.border }]}>
              {courses.length === 0 ? (
                <Text style={[styles.dropdownItem, { color: t.textMuted }]}>No courses found</Text>
              ) : (
                courses.map(course => (
                  <TouchableOpacity
                    key={course._id}
                    style={[
                      styles.dropdownItemRow,
                      selectedCourseId === course._id && { backgroundColor: t.accentSoft },
                      { borderBottomColor: t.border },
                    ]}
                    onPress={() => {
                      setSelectedCourseId(course._id);
                      setShowDropdown(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        { color: selectedCourseId === course._id ? t.accent : t.text },
                      ]}
                      numberOfLines={1}
                    >
                      {course.code} - {course.name}
                    </Text>
                    {selectedCourseId === course._id && (
                      <Ionicons name="checkmark" size={18} color={t.accent} />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {/* Date Picker */}
          <Text style={[styles.fieldLabel, { color: t.textSecondary, marginTop: 24 }]}>Date</Text>
          <View style={[styles.dateNav, { backgroundColor: t.inputBg, borderColor: t.inputBorder }]}>
            <TouchableOpacity
              onPress={() =>
                setSelectedDate(d => {
                  const n = new Date(d);
                  n.setDate(n.getDate() - 1);
                  return n;
                })
              }
              style={[styles.dateNavBtn, { backgroundColor: t.surface }]}
            >
              <Ionicons name="chevron-back" size={20} color={t.accent} />
            </TouchableOpacity>

            <View style={styles.dateCenter}>
              <Ionicons name="calendar" size={16} color={t.accent} style={{ marginRight: 8 }} />
              <Text style={[styles.dateText, { color: t.text }]}>{dateStr}</Text>
            </View>

            <TouchableOpacity
              onPress={() =>
                setSelectedDate(d => {
                  const n = new Date(d);
                  n.setDate(n.getDate() + 1);
                  return n;
                })
              }
              style={[styles.dateNavBtn, { backgroundColor: t.surface }]}
            >
              <Ionicons name="chevron-forward" size={20} color={t.accent} />
            </TouchableOpacity>
          </View>

          {/* Find Slots Button */}
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: t.accent, opacity: loading ? 0.7 : 1 }]}
            onPress={findSlots}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="search" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.primaryBtnText}>Find Slots</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    );
  }

  // ── STEP 2: Available Time Slots ──────────────────────────────────────────

  if (step === 'slots') {
    return (
      <Animated.View style={[styles.flex1, { opacity: fadeAnim }]}>
        {/* Header */}
        <LinearGradient colors={t.headerGrad} style={styles.header}>
          <TouchableOpacity onPress={() => animateTransition('select')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={t.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: t.text }]}>
            {courseInfo?.code || ''} - {dateStr.split(',').slice(0, 2).join(',')}
          </Text>
        </LinearGradient>

        <ScrollView
          style={styles.flex1}
          contentContainerStyle={[styles.stepContent, { backgroundColor: t.bg }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.stepTitle, { color: t.text }]}>Available Time Slots</Text>

          {scheduleData.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: t.card }]}>
              <Ionicons name="calendar-outline" size={48} color={t.textMuted} />
              <Text style={[styles.emptyTitle, { color: t.text }]}>No Classes Scheduled</Text>
              <Text style={[styles.emptySubtitle, { color: t.textSecondary }]}>
                No scheduled classes for this date
              </Text>
            </View>
          ) : (
            scheduleData.map((slotData, slotIdx) => {
              const timeStatus = getTimeStatus(slotData.slot.time, slotData.slot.endTime);
              const markedCount = slotData.attendance.filter(r => r.status !== null).length;
              const totalStudents = slotData.attendance.length;
              const isSubmitting = submitting === slotIdx;

              return (
                <View key={slotIdx} style={[styles.slotCard, { backgroundColor: t.card, borderColor: t.border }]}>
                  {/* Slot Header */}
                  <View style={styles.slotHeaderRow}>
                    <View style={styles.slotTimeInfo}>
                      <Text style={[styles.slotTime, { color: t.text }]}>
                        {slotData.slot.time}
                        {slotData.slot.endTime ? ` - ${slotData.slot.endTime}` : ''}
                      </Text>
                      <Text style={[styles.slotRoom, { color: t.textSecondary }]}>
                        {slotData.slot.room ? `| ${slotData.slot.room}` : ''}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            timeStatus === 'current'
                              ? t.accentSoft
                              : timeStatus === 'upcoming'
                                ? t.infoSoft
                                : t.surface,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor:
                              timeStatus === 'current'
                                ? t.accent
                                : timeStatus === 'upcoming'
                                  ? t.info
                                  : t.textMuted,
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color:
                              timeStatus === 'current'
                                ? t.accent
                                : timeStatus === 'upcoming'
                                  ? t.info
                                  : t.textMuted,
                          },
                        ]}
                      >
                        {timeStatus === 'current'
                          ? 'Currently in session'
                          : timeStatus === 'upcoming'
                            ? 'Upcoming'
                            : 'Completed'}
                      </Text>
                    </View>
                  </View>

                  {/* Students Section */}
                  <View style={styles.studentsSection}>
                    <View style={styles.studentsSectionHeader}>
                      <Text style={[styles.studentsSectionTitle, { color: t.text }]}>Students</Text>
                      <View style={styles.quickActions}>
                        <TouchableOpacity
                          style={[styles.quickBtn, { borderColor: t.present }]}
                          onPress={() => markAllInSlot(slotIdx, 'present')}
                        >
                          <Text style={[styles.quickBtnText, { color: t.present }]}>All Present</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.quickBtn, { borderColor: t.absent }]}
                          onPress={() => markAllInSlot(slotIdx, 'absent')}
                        >
                          <Text style={[styles.quickBtnText, { color: t.absent }]}>All Absent</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Student List */}
                    {slotData.attendance.map((record, studentIdx) => {
                      const initials = record.student.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase();

                      return (
                        <View
                          key={record.student._id}
                          style={[styles.studentRow, { borderBottomColor: t.border }]}
                        >
                          {/* Avatar */}
                          <View style={[styles.avatar, { backgroundColor: t.surface }]}>
                            <Text style={[styles.avatarText, { color: t.textSecondary }]}>
                              {initials}
                            </Text>
                          </View>

                          {/* Name */}
                          <View style={styles.studentInfo}>
                            <Text style={[styles.studentName, { color: t.text }]} numberOfLines={1}>
                              {record.student.name}
                            </Text>
                          </View>

                          {/* P / A / L Circle Buttons */}
                          <View style={styles.statusCircles}>
                            <TouchableOpacity
                              onPress={() => toggleStatus(slotIdx, studentIdx, 'present')}
                              style={[
                                styles.circle,
                                record.status === 'present'
                                  ? { backgroundColor: t.present }
                                  : { backgroundColor: t.presentBg },
                              ]}
                            >
                              <Ionicons
                                name="checkmark"
                                size={16}
                                color={record.status === 'present' ? '#fff' : t.present}
                              />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => toggleStatus(slotIdx, studentIdx, 'absent')}
                              style={[
                                styles.circle,
                                record.status === 'absent'
                                  ? { backgroundColor: t.absent }
                                  : { backgroundColor: t.absentBg },
                              ]}
                            >
                              <Ionicons
                                name="close"
                                size={16}
                                color={record.status === 'absent' ? '#fff' : t.absent}
                              />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => toggleStatus(slotIdx, studentIdx, 'late')}
                              style={[
                                styles.circle,
                                record.status === 'late'
                                  ? { backgroundColor: t.late }
                                  : { backgroundColor: t.lateBg },
                              ]}
                            >
                              <Ionicons
                                name="time"
                                size={14}
                                color={record.status === 'late' ? '#fff' : t.late}
                              />
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </View>

                  {/* Submit Button */}
                  <TouchableOpacity
                    style={[
                      styles.submitBtn,
                      { backgroundColor: t.accent, opacity: isSubmitting ? 0.7 : 1 },
                    ]}
                    onPress={() => submitSlot(slotIdx)}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.submitBtnText}>Submit Attendance</Text>
                    )}
                  </TouchableOpacity>

                  {/* Progress */}
                  <Text style={[styles.markedLabel, { color: t.textSecondary }]}>
                    {markedCount}/{totalStudents} students marked
                  </Text>
                </View>
              );
            })
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>
    );
  }

  // ── STEP 3: Success Screen ────────────────────────────────────────────────

  return (
    <Animated.View style={[styles.flex1, { opacity: fadeAnim }]}>
      <LinearGradient colors={t.successGrad} style={styles.successContainer}>
        {/* Success Icon */}
        <View style={[styles.successIconOuter, { borderColor: t.accent }]}>
          <View style={[styles.successIconInner, { backgroundColor: t.accentSoft }]}>
            <Ionicons name="checkmark" size={48} color={t.accent} />
          </View>
        </View>

        <Text style={[styles.successTitle, { color: t.text }]}>Success!</Text>
        <Text style={[styles.successSubtitle, { color: t.textSecondary }]}>
          Attendance marked successfully{'\n'}for {successSlot} slot!
        </Text>
        <Text style={[styles.successMeta, { color: t.textMuted }]}>
          {courseInfo?.code}, {dateStr}
        </Text>

        {/* Action Buttons */}
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: t.accent, marginTop: 40 }]}
          onPress={() => animateTransition('slots')}
        >
          <Ionicons name="list" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.primaryBtnText}>View Attendance</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryBtn, { borderColor: t.border }]}
          onPress={() => animateTransition('select')}
        >
          <Text style={[styles.secondaryBtnText, { color: t.textSecondary }]}>Go to Dashboard</Text>
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STUDENT VIEW — Real attendance stats
// ═══════════════════════════════════════════════════════════════════════════════

function StudentView({ theme: t }: { theme: typeof themes.dark }) {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [courseStats, setCourseStats] = useState<CourseStat[]>([]);
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
      const data = res as any;
      if (data?.success !== false) {
        const stats: CourseStat[] = data.stats || [];
        const records = data.attendance || [];
        setCourseStats(stats);
        setRecentRecords(records.slice(0, 10));

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
    <>
      <LinearGradient colors={t.headerGrad} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitleLarge, { color: t.text }]}>ATTENDANCE</Text>
          <Ionicons name="information-circle-outline" size={24} color={t.textMuted} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.flex1}
        contentContainerStyle={[styles.stepContent, { backgroundColor: t.bg }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[t.accent]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={t.accent} />
            <Text style={[styles.loadingText, { color: t.textSecondary }]}>Loading attendance...</Text>
          </View>
        ) : (
          <>
            {/* Overall Chart */}
            {attendanceData.total > 0 ? (
              <View style={[styles.chartCard, { backgroundColor: t.card }]}>
                <CircularAttendanceChart data={attendanceData} />
              </View>
            ) : (
              <View style={[styles.emptyState, { backgroundColor: t.card }]}>
                <Ionicons name="bar-chart-outline" size={48} color={t.textMuted} />
                <Text style={[styles.emptyTitle, { color: t.text }]}>No Attendance Data</Text>
                <Text style={[styles.emptySubtitle, { color: t.textSecondary }]}>
                  Records will appear here once marked
                </Text>
              </View>
            )}

            {/* Course-wise Breakdown */}
            {courseStats.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: t.text }]}>Course-wise Attendance</Text>
                {courseStats.map((stat, idx) => {
                  const pct = Math.round(stat.percentage || 0);
                  const isLow = pct < 75;
                  return (
                    <View key={idx} style={[styles.courseStatCard, { backgroundColor: t.card, borderColor: t.border }]}>
                      <View style={styles.courseStatHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.courseStatName, { color: t.text }]} numberOfLines={1}>
                            {stat.course?.name || 'Unknown'}
                          </Text>
                          <Text style={[styles.courseStatCode, { color: t.textSecondary }]}>
                            {stat.course?.code || ''}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.percentBadge,
                            { backgroundColor: isLow ? t.dangerSoft : t.accentSoft },
                          ]}
                        >
                          <Text
                            style={[
                              styles.percentText,
                              { color: isLow ? t.danger : t.accent },
                            ]}
                          >
                            {pct}%
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.progressBg, { backgroundColor: t.surface }]}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${Math.min(pct, 100)}%`,
                              backgroundColor: isLow ? t.danger : t.accent,
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.courseStatDetail, { color: t.textSecondary }]}>
                        {Math.round(stat.present)}/{stat.total} classes attended
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Recent Records */}
            {recentRecords.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: t.text }]}>Recent Records</Text>
                <View style={[styles.tableCard, { backgroundColor: t.card, borderColor: t.border }]}>
                  <DataTable>
                    <DataTable.Header style={[styles.tableHeader, { backgroundColor: t.surface }]}>
                      <DataTable.Title textStyle={[styles.tableHeaderText, { color: t.textSecondary }]}>
                        Course
                      </DataTable.Title>
                      <DataTable.Title textStyle={[styles.tableHeaderText, { color: t.textSecondary }]}>
                        Date
                      </DataTable.Title>
                      <DataTable.Title textStyle={[styles.tableHeaderText, { color: t.textSecondary }]}>
                        Status
                      </DataTable.Title>
                    </DataTable.Header>

                    {recentRecords.map((record: any, idx: number) => (
                      <DataTable.Row key={record._id || idx} style={[styles.tableRow, { borderBottomColor: t.border }]}>
                        <DataTable.Cell textStyle={[styles.tableCellText, { color: t.text }]}>
                          {record.course?.code || 'N/A'}
                        </DataTable.Cell>
                        <DataTable.Cell textStyle={[styles.tableCellText, { color: t.text }]}>
                          {new Date(record.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </DataTable.Cell>
                        <DataTable.Cell>
                          <Chip
                            mode="flat"
                            style={{
                              height: 26,
                              backgroundColor:
                                record.status === 'present'
                                  ? t.presentBg
                                  : record.status === 'absent'
                                    ? t.absentBg
                                    : t.lateBg,
                            }}
                            textStyle={{
                              fontSize: 11,
                              fontWeight: '600',
                              color:
                                record.status === 'present'
                                  ? t.present
                                  : record.status === 'absent'
                                    ? t.absent
                                    : t.late,
                            }}
                          >
                            {record.status === 'present'
                              ? 'Present'
                              : record.status === 'late'
                                ? 'Late'
                                : 'Absent'}
                          </Chip>
                        </DataTable.Cell>
                      </DataTable.Row>
                    ))}
                  </DataTable>
                </View>
              </View>
            )}

            {/* Info Note */}
            <View style={[styles.infoCard, { backgroundColor: t.infoSoft }]}>
              <Ionicons name="information-circle" size={20} color={t.info} />
              <Text style={[styles.infoText, { color: t.info }]}>
                Minimum 75% attendance is required for semester eligibility
              </Text>
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex1: { flex: 1 },

  // Header
  header: { paddingTop: 50, paddingBottom: 16, paddingHorizontal: 20 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLabel: { fontSize: 14, fontWeight: '500', marginTop: 4 },
  headerTitle: { fontSize: 16, fontWeight: '600' },
  headerTitleLarge: { fontSize: 24, fontWeight: '700', letterSpacing: 1.5 },
  backBtn: { marginBottom: 8, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  // Step content
  stepContent: { padding: 20 },
  stepTitle: { fontSize: 26, fontWeight: '800', marginBottom: 24 },

  // Field label
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Dropdown
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownText: { fontSize: 15, fontWeight: '500', flex: 1, marginRight: 8 },
  dropdownList: {
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownItem: { paddingHorizontal: 16, paddingVertical: 12, fontSize: 14 },
  dropdownItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  dropdownItemText: { fontSize: 14, fontWeight: '500', flex: 1 },

  // Date nav
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  dateNavBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: { fontSize: 15, fontWeight: '600' },

  // Primary button
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 32,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  // Secondary button
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 12,
    borderWidth: 1,
  },
  secondaryBtnText: { fontSize: 15, fontWeight: '600' },

  // Slot card
  slotCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  slotHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  slotTimeInfo: { flex: 1 },
  slotTime: { fontSize: 20, fontWeight: '800' },
  slotRoom: { fontSize: 13, fontWeight: '500', marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 11, fontWeight: '600' },

  // Students section
  studentsSection: { marginBottom: 12 },
  studentsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  studentsSectionTitle: { fontSize: 15, fontWeight: '700' },
  quickActions: { flexDirection: 'row', gap: 6 },
  quickBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  quickBtnText: { fontSize: 11, fontWeight: '700' },

  // Student row
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: { fontSize: 12, fontWeight: '700' },
  studentInfo: { flex: 1, marginRight: 8 },
  studentName: { fontSize: 14, fontWeight: '600' },

  // Circle buttons
  statusCircles: { flexDirection: 'row', gap: 8 },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Submit
  submitBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  markedLabel: { fontSize: 12, fontWeight: '500', textAlign: 'center', marginTop: 8 },

  // Success
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  successIconOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successIconInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: { fontSize: 28, fontWeight: '800', marginBottom: 8 },
  successSubtitle: { fontSize: 15, fontWeight: '500', textAlign: 'center', lineHeight: 22 },
  successMeta: { fontSize: 13, fontWeight: '500', marginTop: 8 },

  // Empty state
  emptyState: {
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 12 },
  emptySubtitle: { fontSize: 13, textAlign: 'center', marginTop: 4 },

  // Loading
  centerBox: { alignItems: 'center', paddingVertical: 40 },
  loadingText: { fontSize: 14, marginTop: 12 },

  // Student view
  chartCard: { borderRadius: 20, padding: 24, marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  courseStatCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 10 },
  courseStatHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  courseStatName: { fontSize: 14, fontWeight: '600' },
  courseStatCode: { fontSize: 12 },
  percentBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  percentText: { fontSize: 14, fontWeight: '700' },
  progressBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  courseStatDetail: { fontSize: 12, marginTop: 6 },

  // Table
  tableCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  tableHeader: {},
  tableHeaderText: { fontSize: 13, fontWeight: '700' },
  tableRow: { borderBottomWidth: 1 },
  tableCellText: { fontSize: 14, fontWeight: '500' },

  // Info
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: { flex: 1, fontSize: 13, fontWeight: '500', lineHeight: 18 },
});
