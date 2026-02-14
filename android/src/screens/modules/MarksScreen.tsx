import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import apiService from '../../services/api';

// ── Helpers ──

const getGradeColor = (grade: string): string => {
  switch (grade) {
    case 'A+': return '#10B981';
    case 'A': return '#3B82F6';
    case 'B+': return '#F59E0B';
    case 'B': return '#EF4444';
    case 'C+': return '#8B5CF6';
    case 'C': return '#6B7280';
    default: return '#6B7280';
  }
};

const calculateGradeFromPercentage = (pct: number): string => {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C+';
  if (pct >= 40) return 'C';
  return 'D';
};

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

const gradeValues: Record<string, number> = {
  'A+': 4.0, 'A': 3.7, 'B+': 3.3, 'B': 3.0, 'C+': 2.7, 'C': 2.3, 'D': 1.0, 'F': 0,
};

const calculateAverageGrade = (items: any[]): string => {
  if (items.length === 0) return '--';
  const total = items.reduce((sum: number, m: any) => {
    const g = m.grade || calculateGradeFromPercentage(
      m.maxMarks > 0 ? (m.marks / m.maxMarks) * 100 : 0
    );
    return sum + (gradeValues[g] || 0);
  }, 0);
  const avg = total / items.length;
  if (avg >= 3.7) return 'A+';
  if (avg >= 3.3) return 'A';
  if (avg >= 3.0) return 'B+';
  if (avg >= 2.7) return 'B';
  if (avg >= 2.3) return 'C+';
  return 'C';
};

const PROGRESS_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];

// ────────────────────────────────────────────
// MAIN COMPONENT
// ────────────────────────────────────────────

export default function MarksScreen({ navigation }: any) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isFaculty = user?.role === 'faculty' || user?.role === 'admin';

  if (isFaculty) {
    return <FacultyMarksView navigation={navigation} theme={theme} user={user} />;
  }
  return <StudentMarksView navigation={navigation} theme={theme} user={user} />;
}

// ════════════════════════════════════════════
// FACULTY VIEW — Marks Management Dashboard
// ════════════════════════════════════════════

function FacultyMarksView({ navigation, theme, user }: any) {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState({
    pending: 0,
    graded: 0,
    totalStudents: 0,
    classAverage: 0,
  });
  const [recentGrading, setRecentGrading] = useState<any[]>([]);
  const [coursePerformance, setCoursePerformance] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const [coursesRes, assignmentsRes, studentsRes] = await Promise.all([
        apiService.getFacultyCourses(),
        apiService.getStudentAssignments(),
        apiService.getFacultyStudents(),
      ]);

      const courses: any[] = (coursesRes as any)?.data ?? (coursesRes as any)?.courses ?? [];
      const assignments: any[] = (assignmentsRes as any)?.data ?? (assignmentsRes as any)?.assignments ?? [];
      const students: any[] = (studentsRes as any)?.data ?? (studentsRes as any)?.students ?? [];

      // ── Stats ──
      let pendingCount = 0;
      let gradedCount = 0;
      let allMarks: number[] = [];
      let allMaxMarks: number[] = [];
      const gradingActivity: any[] = [];

      if (Array.isArray(assignments)) {
        assignments.forEach((a: any) => {
          const courseName = a.course?.name || a.courseName || 'Course';
          const courseCode = a.course?.code || a.courseCode || '';
          const submissions = a.submissions || [];
          const totalStudentsForAssignment = Array.isArray(courses)
            ? courses.find((c: any) => (c._id === a.course?._id) || (c._id === a.courseId))?.students?.length ?? 0
            : 0;

          let assignmentGradedCount = 0;

          submissions.forEach((sub: any) => {
            if (sub.marks !== undefined && sub.marks !== null) {
              gradedCount++;
              assignmentGradedCount++;
              allMarks.push(sub.marks);
              allMaxMarks.push(a.maxMarks || 100);
            } else {
              pendingCount++;
            }
          });

          // Count students who haven't submitted as pending
          const unsubmitted = Math.max(0, totalStudentsForAssignment - submissions.length);
          pendingCount += unsubmitted;

          // Build grading activity entry
          if (assignmentGradedCount > 0) {
            gradingActivity.push({
              key: a._id,
              title: a.title || 'Assignment',
              courseName,
              courseCode,
              studentsGraded: assignmentGradedCount,
              totalStudents: submissions.length,
              date: a.updatedAt || a.dueDate || a.createdAt || new Date().toISOString(),
              type: 'graded',
            });
          }

          // If there are pending submissions, show that too
          if (submissions.length > assignmentGradedCount || unsubmitted > 0) {
            const pendingForThis = (submissions.length - assignmentGradedCount) + unsubmitted;
            gradingActivity.push({
              key: `${a._id}-pending`,
              title: a.title || 'Assignment',
              courseName,
              courseCode,
              studentsGraded: 0,
              totalStudents: pendingForThis,
              date: a.dueDate || a.createdAt || new Date().toISOString(),
              type: 'pending',
            });
          }
        });
      }

      // If no assignments, use courses for base data
      if (assignments.length === 0 && Array.isArray(courses)) {
        courses.forEach((c: any) => {
          const studentCount = c.students?.length ?? 0;
          pendingCount += studentCount; // all "need grading"
        });
      }

      const totalStudentsCount = Array.isArray(students) ? students.length : 0;
      const totalMarksSum = allMarks.reduce((s, m) => s + m, 0);
      const totalMaxSum = allMaxMarks.reduce((s, m) => s + m, 0);
      const classAvg = totalMaxSum > 0 ? Math.round((totalMarksSum / totalMaxSum) * 100) : 0;

      setStats({
        pending: pendingCount,
        graded: gradedCount,
        totalStudents: totalStudentsCount,
        classAverage: classAvg,
      });

      // ── Recent Grading Activity (most recent first) ──
      gradingActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentGrading(gradingActivity.slice(0, 8));

      // ── Course-wise Class Performance ──
      const courseMap = new Map<string, { name: string; code: string; marks: number; maxMarks: number; count: number }>();
      if (Array.isArray(assignments)) {
        assignments.forEach((a: any) => {
          const courseId = a.course?._id || a.courseId || '';
          const courseName = a.course?.name || a.courseName || 'Course';
          const courseCode = a.course?.code || a.courseCode || '';
          const submissions = a.submissions || [];

          submissions.forEach((sub: any) => {
            if (sub.marks !== undefined && sub.marks !== null) {
              if (!courseMap.has(courseId)) {
                courseMap.set(courseId, { name: courseName, code: courseCode, marks: 0, maxMarks: 0, count: 0 });
              }
              const entry = courseMap.get(courseId)!;
              entry.marks += sub.marks;
              entry.maxMarks += (a.maxMarks || 100);
              entry.count++;
            }
          });
        });
      }

      // If no graded submissions, show courses with 0%
      if (courseMap.size === 0 && Array.isArray(courses)) {
        courses.forEach((c: any) => {
          courseMap.set(c._id, {
            name: c.name || c.courseName || 'Course',
            code: c.code || c.courseCode || '',
            marks: 0,
            maxMarks: 100,
            count: 0,
          });
        });
      }

      const perfArr = Array.from(courseMap.values()).map(c => {
        const pct = c.maxMarks > 0 ? Math.round((c.marks / c.maxMarks) * 100) : 0;
        return {
          courseName: c.name,
          courseCode: c.code,
          percentage: pct,
          studentsGraded: c.count,
          grade: calculateGradeFromPercentage(pct),
        };
      });
      perfArr.sort((a, b) => b.percentage - a.percentage);
      setCoursePerformance(perfArr);
    } catch (err) {
      console.error('Error fetching marks data:', err);
      setError('Failed to load marks data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Marks Management</Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            Grade and track student performance
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
            colors={[theme.colors.primary]} tintColor={theme.colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Marks Management</Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            Grade and track student performance
          </Text>
        </View>

        {error ? (
          <View style={[styles.errorBanner, { backgroundColor: theme.colors.error + '20' }]}>
            <Ionicons name="warning" size={18} color={theme.colors.error} />
            <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
            <TouchableOpacity onPress={onRefresh}>
              <Text style={[styles.retryText, { color: theme.colors.primary }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* ── Stat Cards 2×2 ── */}
        <View style={styles.statsGrid}>
          <LinearGradient colors={['#F59E0B', '#D97706'] as [string, string]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statCard}>
            <Ionicons name="time" size={24} color="#fff" />
            <Text style={styles.statNumber}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </LinearGradient>

          <LinearGradient colors={['#10B981', '#059669'] as [string, string]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statCard}>
            <Ionicons name="checkmark-done" size={24} color="#fff" />
            <Text style={styles.statNumber}>{stats.graded}</Text>
            <Text style={styles.statLabel}>Graded</Text>
          </LinearGradient>

          <LinearGradient colors={['#3B82F6', '#2563EB'] as [string, string]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statCard}>
            <Ionicons name="people" size={24} color="#fff" />
            <Text style={styles.statNumber}>{stats.totalStudents}</Text>
            <Text style={styles.statLabel}>Students</Text>
          </LinearGradient>

          <LinearGradient colors={['#8B5CF6', '#7C3AED'] as [string, string]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statCard}>
            <Ionicons name="stats-chart" size={24} color="#fff" />
            <Text style={styles.statNumber}>{stats.classAverage}%</Text>
            <Text style={styles.statLabel}>Class Avg</Text>
          </LinearGradient>
        </View>

        {/* ── Recent Grading Activity ── */}
        <View style={[styles.sectionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.sectionCardTitle, { color: theme.colors.text }]}>
            Recent Grading Activity
          </Text>

          {recentGrading.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="create-outline" size={36} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
                No grading activity yet
              </Text>
            </View>
          ) : (
            recentGrading.map((item, index) => (
              <View key={item.key || index} style={styles.activityItem}>
                <View style={[styles.activityIconContainer,
                { backgroundColor: item.type === 'graded' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)' }
                ]}>
                  <Ionicons
                    name={item.type === 'graded' ? 'checkmark-circle' : 'time'}
                    size={22}
                    color={item.type === 'graded' ? '#10B981' : '#F59E0B'}
                  />
                </View>
                <View style={styles.activityContent}>
                  <Text style={[styles.activityTitle, { color: theme.colors.text }]}>
                    {item.type === 'graded'
                      ? `Graded ${item.title} for ${item.courseCode || item.courseName}`
                      : `${item.totalStudents} pending for ${item.title}`}
                  </Text>
                  <Text style={[styles.activitySubtitle, { color: theme.colors.textSecondary }]}>
                    {item.type === 'graded'
                      ? `${item.studentsGraded} student${item.studentsGraded !== 1 ? 's' : ''} graded`
                      : `${item.courseCode || item.courseName}`}
                    {' · '}
                    {getRelativeTime(item.date)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* ── Course-wise Class Performance ── */}
        <View style={[styles.sectionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, marginBottom: 32 }]}>
          <View style={styles.sectionCardHeader}>
            <Text style={[styles.sectionCardTitle, { color: theme.colors.text }]}>
              Course-wise Class Performance
            </Text>
            <View style={[styles.chartIconContainer, { backgroundColor: theme.colors.primary + '18' }]}>
              <Ionicons name="bar-chart" size={22} color={theme.colors.primary} />
            </View>
          </View>

          {coursePerformance.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="analytics-outline" size={36} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
                No course data available
              </Text>
            </View>
          ) : (
            coursePerformance.map((course, index) => (
              <View key={`${course.courseCode}-${index}`} style={styles.courseItem}>
                <View style={styles.courseItemHeader}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={[styles.courseItemName, { color: theme.colors.text }]} numberOfLines={1}>
                      {course.courseCode ? `${course.courseCode} - ${course.courseName}` : course.courseName}
                    </Text>
                    <Text style={[styles.courseStudentsText, { color: theme.colors.textSecondary }]}>
                      {course.studentsGraded} student{course.studentsGraded !== 1 ? 's' : ''} graded
                    </Text>
                  </View>
                  <View style={[styles.gradeBadge, { borderColor: getGradeColor(course.grade) }]}>
                    <Text style={[styles.gradeBadgeText, { color: getGradeColor(course.grade) }]}>
                      {course.grade}
                    </Text>
                  </View>
                </View>
                <View style={styles.progressRow}>
                  <View style={[styles.progressTrack, { backgroundColor: theme.colors.border }]}>
                    <LinearGradient
                      colors={[PROGRESS_COLORS[index % PROGRESS_COLORS.length],
                      PROGRESS_COLORS[index % PROGRESS_COLORS.length] + 'CC'] as [string, string]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={[styles.progressFill, { width: `${Math.min(course.percentage, 100)}%` }]}
                    />
                  </View>
                  <Text style={[styles.progressPercentage,
                  { color: PROGRESS_COLORS[index % PROGRESS_COLORS.length] }]}>
                    {course.percentage}%
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* ── FAB — Grade Assignments ── */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('Assignments') || navigation.navigate('Courses')}
      >
        <Ionicons name="create" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

// ════════════════════════════════════════════
// STUDENT VIEW — Track Your Marks & Grades
// ════════════════════════════════════════════

function StudentMarksView({ navigation, theme, user }: any) {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [marksList, setMarksList] = useState<any[]>([]);
  const [coursePerformance, setCoursePerformance] = useState<any[]>([]);
  const [stats, setStats] = useState({
    averagePercentage: 0,
    averageGrade: '--',
    totalAssignments: 0,
    totalMarks: 0,
  });

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const response = await apiService.getStudentMarks();
      const data: any[] = (response as any)?.data ?? (response as any)?.marks ?? [];
      const items = Array.isArray(data)
        ? data.map((m: any, idx: number) => {
          const pct = m.maxMarks > 0 ? (m.marks / m.maxMarks) * 100 : 0;
          return {
            id: m._id || `mark-${idx}`,
            assignment: m.assignment || m.examType || m.title || 'Assessment',
            course: m.course?.name || m.courseName || 'Course',
            courseCode: m.course?.code || m.courseCode || '',
            marks: m.marks || 0,
            maxMarks: m.maxMarks || 100,
            grade: m.grade || calculateGradeFromPercentage(pct),
            date: m.date || m.createdAt || new Date().toISOString(),
          };
        })
        : [];

      const gradedItems = items.filter(m => m.marks > 0);
      const totalM = gradedItems.reduce((s, m) => s + m.marks, 0);
      const totalMax = gradedItems.reduce((s, m) => s + m.maxMarks, 0);
      const avgPct = totalMax > 0 ? Math.round((totalM / totalMax) * 100) : 0;

      setStats({
        averagePercentage: avgPct,
        averageGrade: calculateAverageGrade(gradedItems),
        totalAssignments: items.length,
        totalMarks: totalM,
      });

      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setMarksList(items);

      // Course-wise
      const courseMap = new Map<string, { name: string; code: string; marks: number; maxMarks: number }>();
      gradedItems.forEach(m => {
        const key = m.courseCode || m.course;
        if (!courseMap.has(key)) courseMap.set(key, { name: m.course, code: m.courseCode || '', marks: 0, maxMarks: 0 });
        const e = courseMap.get(key)!;
        e.marks += m.marks;
        e.maxMarks += m.maxMarks;
      });
      const perfArr = Array.from(courseMap.values()).map(c => {
        const p = c.maxMarks > 0 ? Math.round((c.marks / c.maxMarks) * 100) : 0;
        return {
          courseName: c.name, courseCode: c.code, percentage: p, grade: calculateGradeFromPercentage(p),
          totalMarks: c.marks, totalMaxMarks: c.maxMarks
        };
      });
      perfArr.sort((a, b) => b.percentage - a.percentage);
      setCoursePerformance(perfArr);
    } catch (err) {
      console.error('Error fetching marks:', err);
      setError('Failed to load marks data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Marks & Grades</Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            Track your academic performance
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
            colors={[theme.colors.primary]} tintColor={theme.colors.primary} />
        }>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Marks & Grades</Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            Track your academic performance
          </Text>
        </View>

        {error ? (
          <View style={[styles.errorBanner, { backgroundColor: theme.colors.error + '20' }]}>
            <Ionicons name="warning" size={18} color={theme.colors.error} />
            <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
            <TouchableOpacity onPress={onRefresh}>
              <Text style={[styles.retryText, { color: theme.colors.primary }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Stats */}
        <View style={styles.statsGrid}>
          <LinearGradient colors={['#3B82F6', '#2563EB'] as [string, string]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statCard}>
            <Ionicons name="trophy" size={24} color="#fff" />
            <Text style={styles.statNumber}>{stats.averagePercentage}%</Text>
            <Text style={styles.statLabel}>Average</Text>
          </LinearGradient>
          <LinearGradient colors={['#10B981', '#059669'] as [string, string]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statCard}>
            <Ionicons name="star" size={24} color="#fff" />
            <Text style={styles.statNumber}>{stats.averageGrade}</Text>
            <Text style={styles.statLabel}>Grade</Text>
          </LinearGradient>
          <LinearGradient colors={['#F59E0B', '#D97706'] as [string, string]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statCard}>
            <Ionicons name="document-text" size={24} color="#fff" />
            <Text style={styles.statNumber}>{stats.totalAssignments}</Text>
            <Text style={styles.statLabel}>Assignments</Text>
          </LinearGradient>
          <LinearGradient colors={['#8B5CF6', '#7C3AED'] as [string, string]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statCard}>
            <Ionicons name="calculator" size={24} color="#fff" />
            <Text style={styles.statNumber}>{stats.totalMarks}</Text>
            <Text style={styles.statLabel}>Total Marks</Text>
          </LinearGradient>
        </View>

        {/* Recent Marks Table */}
        <View style={[styles.sectionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.sectionCardTitle, { color: theme.colors.text }]}>Recent Marks</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { color: theme.colors.textSecondary, flex: 2 }]}>Assignment</Text>
            <Text style={[styles.tableHeaderText, { color: theme.colors.textSecondary, flex: 1, textAlign: 'center' }]}>Marks</Text>
            <Text style={[styles.tableHeaderText, { color: theme.colors.textSecondary, flex: 0.7, textAlign: 'center' }]}>Grade</Text>
          </View>
          <View style={[styles.tableDivider, { backgroundColor: theme.colors.border }]} />
          {marksList.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={36} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>No marks yet</Text>
            </View>
          ) : (
            marksList.slice(0, 6).map((mark, index) => (
              <View key={mark.id || index}>
                <View style={styles.tableRow}>
                  <View style={{ flex: 2 }}>
                    <Text style={[styles.assignmentName, { color: theme.colors.text }]} numberOfLines={1}>{mark.assignment}</Text>
                    <Text style={[styles.courseName, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                      {mark.courseCode ? `${mark.courseCode} - ${mark.course}` : mark.course}
                    </Text>
                  </View>
                  <Text style={[styles.marksValue, { color: theme.colors.text, flex: 1, textAlign: 'center' }]}>
                    {mark.marks}/{mark.maxMarks}
                  </Text>
                  <View style={{ flex: 0.7, alignItems: 'center' }}>
                    <View style={[styles.gradeBadge, { borderColor: getGradeColor(mark.grade) }]}>
                      <Text style={[styles.gradeBadgeText, { color: getGradeColor(mark.grade) }]}>{mark.grade}</Text>
                    </View>
                  </View>
                </View>
                {index < Math.min(marksList.length, 6) - 1 && (
                  <View style={[styles.rowDivider, { backgroundColor: theme.colors.border }]} />
                )}
              </View>
            ))
          )}
        </View>

        {/* Course Performance */}
        <View style={[styles.sectionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, marginBottom: 32 }]}>
          <View style={styles.sectionCardHeader}>
            <Text style={[styles.sectionCardTitle, { color: theme.colors.text }]}>Course-wise Performance</Text>
            <View style={[styles.chartIconContainer, { backgroundColor: theme.colors.primary + '18' }]}>
              <Ionicons name="bar-chart" size={22} color={theme.colors.primary} />
            </View>
          </View>
          {coursePerformance.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="analytics-outline" size={36} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>No data yet</Text>
            </View>
          ) : (
            coursePerformance.map((course, index) => (
              <View key={`${course.courseCode}-${index}`} style={styles.courseItem}>
                <View style={styles.courseItemHeader}>
                  <Text style={[styles.courseItemName, { color: theme.colors.text }]} numberOfLines={1}>
                    {course.courseCode ? `${course.courseCode} - ${course.courseName}` : course.courseName}
                  </Text>
                  <View style={[styles.gradeBadge, { borderColor: getGradeColor(course.grade) }]}>
                    <Text style={[styles.gradeBadgeText, { color: getGradeColor(course.grade) }]}>{course.grade}</Text>
                  </View>
                </View>
                <View style={styles.progressRow}>
                  <View style={[styles.progressTrack, { backgroundColor: theme.colors.border }]}>
                    <LinearGradient
                      colors={[PROGRESS_COLORS[index % PROGRESS_COLORS.length],
                      PROGRESS_COLORS[index % PROGRESS_COLORS.length] + 'CC'] as [string, string]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={[styles.progressFill, { width: `${Math.min(course.percentage, 100)}%` }]}
                    />
                  </View>
                  <Text style={[styles.progressPercentage,
                  { color: PROGRESS_COLORS[index % PROGRESS_COLORS.length] }]}>{course.percentage}%</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ════════════════════════════════════
// SHARED STYLES
// ════════════════════════════════════

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: { paddingTop: 52, paddingBottom: 8, paddingHorizontal: 0 },
  headerTitle: { fontSize: 28, fontWeight: '700', fontStyle: 'italic' },
  headerSubtitle: { fontSize: 15, marginTop: 4 },

  scrollContent: { flex: 1 },
  scrollContainer: { padding: 16 },

  // Stats grid
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between',
    marginTop: 16, marginBottom: 20,
  },
  statCard: {
    width: '48%', borderRadius: 16, padding: 18, alignItems: 'center', marginBottom: 12,
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 6,
  },
  statNumber: { color: '#fff', fontSize: 28, fontWeight: '800', marginTop: 8 },
  statLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '500', marginTop: 4 },

  // Section card
  sectionCard: {
    borderRadius: 16, padding: 18, marginBottom: 16, borderWidth: 1,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 3,
  },
  sectionCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionCardTitle: { fontSize: 18, fontWeight: '700', marginBottom: 14 },
  chartIconContainer: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },

  // Table
  tableHeader: { flexDirection: 'row', paddingVertical: 8 },
  tableHeaderText: { fontSize: 13, fontWeight: '600' },
  tableDivider: { height: 1, marginBottom: 4 },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  rowDivider: { height: StyleSheet.hairlineWidth },
  assignmentName: { fontSize: 13, fontWeight: '600' },
  courseName: { fontSize: 11, marginTop: 2 },
  marksValue: { fontSize: 13, fontWeight: '600' },

  // Grade badge
  gradeBadge: {
    borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
    minWidth: 40, alignItems: 'center',
  },
  gradeBadgeText: { fontSize: 13, fontWeight: '700' },

  // Activity item (faculty)
  activityItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  activityIconContainer: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center', marginRight: 12, marginTop: 2,
  },
  activityContent: { flex: 1 },
  activityTitle: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  activitySubtitle: { fontSize: 11, marginTop: 3 },

  // Course performance
  courseItem: { marginBottom: 18 },
  courseItemHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
  },
  courseItemName: { fontSize: 14, fontWeight: '600', flex: 1, marginRight: 10 },
  courseStudentsText: { fontSize: 11, marginTop: 2 },
  progressRow: { flexDirection: 'row', alignItems: 'center' },
  progressTrack: { flex: 1, height: 8, borderRadius: 4, marginRight: 10, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressPercentage: { fontSize: 13, fontWeight: '700', minWidth: 36, textAlign: 'right' },

  // States
  emptyState: { alignItems: 'center', paddingVertical: 24 },
  emptyStateText: { marginTop: 8, fontSize: 13 },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, marginBottom: 14,
  },
  errorText: { flex: 1, marginLeft: 8, fontSize: 13, fontWeight: '500' },
  retryText: { fontSize: 13, fontWeight: '600', marginLeft: 8 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14 },

  // FAB
  fab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
    elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6,
  },
});
