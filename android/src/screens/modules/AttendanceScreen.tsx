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

type FacultyStep = 'section' | 'course' | 'mark' | 'success';

interface SectionItem {
  _id: string;
  name: string;
  semester: number;
  program: string;
  branch: string;
  academicYear: string;
  students: Student[];
  maxStudents: number;
  status: string;
}

function FacultyFlow({ theme: t }: { theme: typeof themes.dark }) {
  const [step, setStep] = useState<FacultyStep>('section');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Step 1: Sections
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [selectedSection, setSelectedSection] = useState<SectionItem | null>(null);
  const [sectionsLoading, setSectionsLoading] = useState(true);

  // Step 2: Course + Date
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDropdown, setShowDropdown] = useState(false);

  // Step 3: Students + checkboxes
  const [students, setStudents] = useState<Student[]>([]);
  const [checkedStudents, setCheckedStudents] = useState<Set<string>>(new Set());
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);

  // UI state
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState({ present: 0, absent: 0 });
  const [searchQuery, setSearchQuery] = useState('');

  // Transition helper
  const animateTransition = (nextStep: FacultyStep) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setStep(nextStep);
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    });
  };

  // ── Fetch sections on mount ──
  useEffect(() => {
    const fetchSections = async () => {
      setSectionsLoading(true);
      try {
        const res = await apiService.getFacultySections() as any;
        if (res?.success !== false) {
          setSections(res?.sections || []);
        }
      } catch (e) {
        console.error('Error fetching sections:', e);
      } finally {
        setSectionsLoading(false);
      }
    };
    fetchSections();
  }, []);

  // ── Fetch courses when section selected ──
  useEffect(() => {
    if (!selectedSection) return;
    const fetchCourses = async () => {
      try {
        const res = await apiService.getFacultyCourses() as any;
        if (res?.success !== false) {
          setCourses(res?.courses || []);
        }
      } catch (e) {
        console.error('Error fetching courses:', e);
      }
    };
    fetchCourses();
  }, [selectedSection]);

  const selectedCourse = courses.find(c => c._id === selectedCourseId);
  const dateStr = selectedDate.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });

  // ── Load students from section + schedule slots ──
  const loadStudentsAndSlots = async () => {
    if (!selectedSection || !selectedCourseId) return;
    setLoading(true);
    try {
      const dateString = selectedDate.toISOString().split('T')[0];
      const data = await apiService.getScheduleAttendance(selectedCourseId, dateString) as any;
      if (data?.success !== false) {
        setStudents(selectedSection.students);

        if (data.attendanceMatrix && data.attendanceMatrix.length > 0) {
          setScheduleSlots(data.attendanceMatrix.map((sm: any) => sm.slot));
          setSelectedSlotIndex(0);
          // Pre-check already present students
          const firstSlot = data.attendanceMatrix[0]?.attendance || [];
          const preChecked = new Set<string>();
          firstSlot.forEach((r: any) => {
            if (r.status === 'present' || r.status === 'late') {
              preChecked.add(r.student._id);
            }
          });
          setCheckedStudents(preChecked);
        } else {
          setScheduleSlots([]);
          setCheckedStudents(new Set());
        }
        animateTransition('mark');
      } else {
        Alert.alert('Error', data?.message || 'Failed to load schedule');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // ── Toggle helpers ──
  const toggleStudent = (id: string) => {
    setCheckedStudents(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const filtered = getFilteredStudents();
    const allChecked = filtered.every(s => checkedStudents.has(s._id));
    setCheckedStudents(prev => {
      const next = new Set(prev);
      filtered.forEach(s => allChecked ? next.delete(s._id) : next.add(s._id));
      return next;
    });
  };

  const getFilteredStudents = () => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.profile?.studentId || '').toLowerCase().includes(q)
    );
  };

  // ── Submit attendance ──
  const submitAttendance = async () => {
    if (students.length === 0) return;
    setSubmitting(true);
    try {
      const attendanceData = students.map(s => ({
        studentId: s._id,
        status: checkedStudents.has(s._id) ? 'present' as const : 'absent' as const,
        remarks: '',
      }));

      const slot = scheduleSlots[selectedSlotIndex];
      const payload: any = {
        courseId: selectedCourseId,
        date: selectedDate.toISOString().split('T')[0],
        attendanceData,
      };
      if (slot) {
        payload.scheduleSlot = { startTime: slot.time, endTime: slot.endTime || slot.time };
      }

      const res = await apiService.markScheduleAttendance(payload) as any;
      if (res?.success !== false) {
        setSuccessInfo({ present: checkedStudents.size, absent: students.length - checkedStudents.size });
        animateTransition('success');
      } else {
        Alert.alert('Error', res?.message || 'Failed to submit');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to submit attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStudents = getFilteredStudents();
  const allFilteredChecked = filteredStudents.length > 0 && filteredStudents.every(s => checkedStudents.has(s._id));

  // ═══ STEP 1: Section Picker ═══
  if (step === 'section') {
    return (
      <Animated.View style={[styles.flex1, { opacity: fadeAnim }]}>
        <LinearGradient colors={['#059669', '#0D9488']} style={styles.header}>
          <Text style={[styles.headerLabel, { color: '#D1FAE5' }]}>Faculty Attendance</Text>
          <Text style={[styles.stepTitle, { color: '#fff', marginBottom: 0, fontSize: 20 }]}>Select a Section</Text>
        </LinearGradient>

        <ScrollView
          style={styles.flex1}
          contentContainerStyle={[styles.stepContent, { backgroundColor: t.bg }]}
          showsVerticalScrollIndicator={false}
        >
          {sectionsLoading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={t.accent} />
              <Text style={[styles.loadingText, { color: t.textSecondary }]}>Loading sections...</Text>
            </View>
          ) : sections.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: t.card }]}>
              <Ionicons name="layers-outline" size={48} color={t.textMuted} />
              <Text style={[styles.emptyTitle, { color: t.text }]}>No Sections Found</Text>
              <Text style={[styles.emptySubtitle, { color: t.textSecondary }]}>
                No sections available for your program
              </Text>
            </View>
          ) : (
            sections.map((section) => (
              <TouchableOpacity
                key={section._id}
                style={[styles.slotCard, { backgroundColor: t.card, borderColor: t.border, marginBottom: 12 }]}
                onPress={() => {
                  setSelectedSection(section);
                  setSelectedCourseId('');
                  setStudents([]);
                  setCheckedStudents(new Set());
                  animateTransition('course');
                }}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <LinearGradient
                    colors={['#6366F1', '#8B5CF6']}
                    style={{
                      width: 48, height: 48, borderRadius: 14,
                      alignItems: 'center', justifyContent: 'center', marginRight: 14,
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18 }}>{section.name}</Text>
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.studentName, { color: t.text, fontSize: 15 }]}>
                      Section {section.name} • {section.program} {section.branch ? `- ${section.branch}` : ''}
                    </Text>
                    <Text style={{ color: t.textSecondary, fontSize: 12, marginTop: 2 }}>
                      Sem {section.semester} • {section.academicYear}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ color: t.accent, fontWeight: '700', fontSize: 16 }}>
                      {section.students.length}
                    </Text>
                    <Text style={{ color: t.textMuted, fontSize: 10 }}>students</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={t.textMuted} style={{ marginLeft: 8 }} />
                </View>
              </TouchableOpacity>
            ))
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>
    );
  }

  // ═══ STEP 2: Course + Date ═══
  if (step === 'course') {
    return (
      <Animated.View style={[styles.flex1, { opacity: fadeAnim }]}>
        <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.header}>
          <TouchableOpacity onPress={() => { setSelectedSection(null); animateTransition('section'); }} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={[styles.headerLabel, { color: '#C7D2FE' }]}>
            Section {selectedSection?.name} • {selectedSection?.students.length} students
          </Text>
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
              style={[styles.dropdownText, { color: selectedCourse ? t.text : t.textMuted }]}
              numberOfLines={1}
            >
              {selectedCourse ? `${selectedCourse.code} - ${selectedCourse.name}` : 'Choose a course'}
            </Text>
            <Ionicons name={showDropdown ? 'chevron-up' : 'chevron-down'} size={20} color={t.textMuted} />
          </TouchableOpacity>

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
                    onPress={() => { setSelectedCourseId(course._id); setShowDropdown(false); }}
                  >
                    <Text
                      style={[styles.dropdownItemText, { color: selectedCourseId === course._id ? t.accent : t.text }]}
                      numberOfLines={1}
                    >
                      {course.code} - {course.name}
                    </Text>
                    {selectedCourseId === course._id && <Ionicons name="checkmark" size={18} color={t.accent} />}
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {/* Date Picker */}
          <Text style={[styles.fieldLabel, { color: t.textSecondary, marginTop: 24 }]}>Date</Text>
          <View style={[styles.dateNav, { backgroundColor: t.inputBg, borderColor: t.inputBorder }]}>
            <TouchableOpacity
              onPress={() => setSelectedDate(d => { const n = new Date(d); n.setDate(n.getDate() - 1); return n; })}
              style={[styles.dateNavBtn, { backgroundColor: t.surface }]}
            >
              <Ionicons name="chevron-back" size={20} color={t.accent} />
            </TouchableOpacity>
            <View style={styles.dateCenter}>
              <Ionicons name="calendar" size={16} color={t.accent} style={{ marginRight: 8 }} />
              <Text style={[styles.dateText, { color: t.text }]}>{dateStr}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setSelectedDate(d => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; })}
              style={[styles.dateNavBtn, { backgroundColor: t.surface }]}
            >
              <Ionicons name="chevron-forward" size={20} color={t.accent} />
            </TouchableOpacity>
          </View>

          {/* Load Students Button */}
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: t.accent, opacity: loading || !selectedCourseId ? 0.6 : 1 }]}
            onPress={loadStudentsAndSlots}
            disabled={loading || !selectedCourseId}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="people" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.primaryBtnText}>Load Students</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    );
  }

  // ═══ STEP 3: Student Checkbox List ═══
  if (step === 'mark') {
    return (
      <Animated.View style={[styles.flex1, { opacity: fadeAnim }]}>
        {/* Header with counters */}
        <LinearGradient colors={['#6366F1', '#8B5CF6']} style={[styles.header, { paddingBottom: 20 }]}>
          <TouchableOpacity onPress={() => animateTransition('course')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: '#C7D2FE', fontSize: 12, fontWeight: '600' }}>
            Section {selectedSection?.name} • {selectedCourse?.code || 'Course'}
          </Text>
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '500', marginTop: 2 }}>
            {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </Text>

          {/* Counters */}
          <View style={{ flexDirection: 'row', marginTop: 12, gap: 16 }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>{checkedStudents.size}</Text>
              <Text style={{ color: '#A7F3D0', fontSize: 10, fontWeight: '600' }}>Present</Text>
            </View>
            <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.3)', height: 30 }} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>{students.length - checkedStudents.size}</Text>
              <Text style={{ color: '#FCA5A5', fontSize: 10, fontWeight: '600' }}>Absent</Text>
            </View>
            <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.3)', height: 30 }} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>{students.length}</Text>
              <Text style={{ color: '#C7D2FE', fontSize: 10, fontWeight: '600' }}>Total</Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.flex1}
          contentContainerStyle={[styles.stepContent, { backgroundColor: t.bg, paddingTop: 8 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Schedule slot picker */}
          {scheduleSlots.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {scheduleSlots.map((slot, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setSelectedSlotIndex(idx)}
                  style={{
                    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginRight: 8,
                    backgroundColor: selectedSlotIndex === idx ? t.accent : t.card,
                    borderWidth: 1, borderColor: selectedSlotIndex === idx ? t.accent : t.border,
                  }}
                >
                  <Text style={{ color: selectedSlotIndex === idx ? '#fff' : t.text, fontSize: 13, fontWeight: '600' }}>
                    {slot.time}{slot.endTime ? ` - ${slot.endTime}` : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Select All button */}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 12, gap: 8 }}>
            <TouchableOpacity
              onPress={toggleAll}
              style={{
                flexDirection: 'row', alignItems: 'center',
                paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
                backgroundColor: allFilteredChecked ? t.accentSoft : t.card,
                borderWidth: 1, borderColor: allFilteredChecked ? t.accent : t.border,
              }}
            >
              <Ionicons
                name={allFilteredChecked ? 'checkbox' : 'square-outline'}
                size={18}
                color={allFilteredChecked ? t.accent : t.textSecondary}
              />
              <Text style={{ color: allFilteredChecked ? t.accent : t.textSecondary, fontSize: 13, fontWeight: '600', marginLeft: 6 }}>
                {allFilteredChecked ? 'Deselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Student list */}
          {filteredStudents.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: t.card }]}>
              <Ionicons name="people-outline" size={48} color={t.textMuted} />
              <Text style={[styles.emptyTitle, { color: t.text }]}>No Students</Text>
              <Text style={[styles.emptySubtitle, { color: t.textSecondary }]}>
                No students found in this section
              </Text>
            </View>
          ) : (
            <View style={[styles.slotCard, { backgroundColor: t.card, borderColor: t.border, padding: 0 }]}>
              {filteredStudents.map((student, idx) => {
                const isChecked = checkedStudents.has(student._id);
                const initial = student.name.charAt(0).toUpperCase();
                return (
                  <TouchableOpacity
                    key={student._id}
                    onPress={() => toggleStudent(student._id)}
                    style={[
                      styles.studentRow,
                      {
                        borderBottomColor: t.border,
                        paddingHorizontal: 16,
                        backgroundColor: isChecked ? (t === themes.dark ? 'rgba(16,185,129,0.08)' : '#F0FDF4') : 'transparent',
                        borderBottomWidth: idx === filteredStudents.length - 1 ? 0 : 1,
                      },
                    ]}
                    activeOpacity={0.6}
                  >
                    {/* Checkbox */}
                    <View style={{
                      width: 26, height: 26, borderRadius: 8,
                      borderWidth: 2, marginRight: 12,
                      borderColor: isChecked ? t.accent : t.textMuted,
                      backgroundColor: isChecked ? t.accent : 'transparent',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      {isChecked && <Ionicons name="checkmark" size={16} color="#fff" />}
                    </View>

                    {/* Avatar */}
                    <LinearGradient
                      colors={['#6366F1', '#8B5CF6']}
                      style={[styles.avatar, { marginRight: 10 }]}
                    >
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>{initial}</Text>
                    </LinearGradient>

                    {/* Info */}
                    <View style={styles.studentInfo}>
                      <Text style={[styles.studentName, { color: t.text }]} numberOfLines={1}>
                        {student.name}
                      </Text>
                      <Text style={{ color: t.textSecondary, fontSize: 11 }} numberOfLines={1}>
                        {student.profile?.studentId || student.email}
                      </Text>
                    </View>

                    {/* Status badge */}
                    <View style={{
                      paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
                      backgroundColor: isChecked ? t.presentBg : t.absentBg,
                    }}>
                      <Text style={{
                        fontSize: 11, fontWeight: '700',
                        color: isChecked ? t.present : t.absent,
                      }}>
                        {isChecked ? 'Present' : 'Absent'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Submit Button */}
          {students.length > 0 && (
            <TouchableOpacity
              style={[styles.primaryBtn, {
                backgroundColor: t.accent, marginTop: 16,
                opacity: submitting ? 0.7 : 1,
              }]}
              onPress={submitAttendance}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryBtnText}>
                    Submit — {checkedStudents.size} Present, {students.length - checkedStudents.size} Absent
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>
    );
  }

  // ═══ STEP 4: Success ═══
  return (
    <Animated.View style={[styles.flex1, { opacity: fadeAnim }]}>
      <LinearGradient colors={t.successGrad} style={styles.successContainer}>
        <View style={[styles.successIconOuter, { borderColor: t.accent }]}>
          <View style={[styles.successIconInner, { backgroundColor: t.accentSoft }]}>
            <Ionicons name="checkmark" size={48} color={t.accent} />
          </View>
        </View>

        <Text style={[styles.successTitle, { color: t.text }]}>Success!</Text>
        <Text style={[styles.successSubtitle, { color: t.textSecondary }]}>
          Attendance submitted{'\n'}{successInfo.present} present, {successInfo.absent} absent
        </Text>
        <Text style={[styles.successMeta, { color: t.textMuted }]}>
          Section {selectedSection?.name} • {selectedCourse?.code}, {dateStr}
        </Text>

        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: t.accent, marginTop: 40 }]}
          onPress={() => animateTransition('mark')}
        >
          <Ionicons name="list" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.primaryBtnText}>View Attendance</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryBtn, { borderColor: t.border }]}
          onPress={() => {
            setSelectedSection(null);
            setSelectedCourseId('');
            setStudents([]);
            setCheckedStudents(new Set());
            animateTransition('section');
          }}
        >
          <Text style={[styles.secondaryBtnText, { color: t.textSecondary }]}>Back to Sections</Text>
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
