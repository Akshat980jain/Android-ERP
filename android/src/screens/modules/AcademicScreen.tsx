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
  Button,
  List,
  Chip,
  FAB,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import apiService from '../../services/api';

export default function AcademicScreen({ navigation }: any) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const response: any = await apiService.getStudentCourses();
      // Accept shapes: { success, courses: [...] } or an array directly
      const list = Array.isArray(response)
        ? response
        : Array.isArray(response?.courses)
          ? response.courses
          : Array.isArray(response?.data)
            ? response.data
            : [];
      setCourses(list);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    onRefresh();
  }, []);

  const toViewModel = (c: any) => ({
    id: c._id || c.id,
    courseCode: c.code || c.courseCode || '—',
    courseName: c.name || c.courseName || 'Course',
    credits: c.credits || 0,
    semester: c.semester || '',
    faculty: c.faculty?.name || c.faculty || '—',
    attendance: typeof c.attendance === 'number' ? c.attendance : undefined,
    grade: c.grade || '—',
  });

  const renderCourseCard = (course: any) => (
    <Card key={course.id} style={[styles.courseCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <Card.Content>
        <View style={styles.courseHeader}>
          <View style={styles.courseInfo}>
            <Title style={[styles.courseCode, { color: theme.colors.text }]}>{course.courseCode}</Title>
            <Paragraph style={[styles.courseName, { color: theme.colors.textSecondary }]}>{course.courseName}</Paragraph>
            <Text style={[styles.facultyName, { color: theme.colors.textSecondary }]}>Faculty: {course.faculty}</Text>
          </View>
          <View style={styles.courseStats}>
            <Chip mode="outlined" style={[styles.chip, { borderColor: theme.colors.border }]} textStyle={{ color: theme.colors.text }}>
              {course.credits} Credits
            </Chip>
            <Chip mode="outlined" style={[styles.chip, { borderColor: theme.colors.border }]} textStyle={{ color: theme.colors.text }}>
              Sem {course.semester}
            </Chip>
          </View>
        </View>
        
        <View style={[styles.courseMetrics, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.metric}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={[styles.metricText, { color: theme.colors.text }]}>{course.attendance}%</Text>
            <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>Attendance</Text>
          </View>
          <View style={styles.metric}>
            <Ionicons name="trophy" size={16} color="#F59E0B" />
            <Text style={[styles.metricText, { color: theme.colors.text }]}>{course.grade}</Text>
            <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>Grade</Text>
          </View>
        </View>

        <View style={styles.courseActions}>
          <Button
            mode="outlined"
            compact
            onPress={() => {/* Navigate to course details */}}
            style={styles.actionButton}
            textColor={theme.colors.primary}
          >
            View Details
          </Button>
          <Button
            mode="contained"
            compact
            onPress={() => {/* Navigate to assignments */}}
            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
          >
            Assignments
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Top Bar */}
      <View style={[styles.topBar, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
        <View style={{ width: 28 }} />
        <Text style={[styles.topBarTitle, { color: theme.colors.text }]}>Academic</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
        }
      >
        <View style={styles.header}>
          <Paragraph style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            Your courses and academic progress
          </Paragraph>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={{ color: theme.colors.text }}>Loading courses...</Text>
          </View>
        ) : courses.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Text style={{ color: theme.colors.textSecondary }}>No courses found</Text>
          </View>
        ) : (
          <View style={styles.coursesContainer}>
            {courses.map((c) => renderCourseCard(toViewModel(c)))}
          </View>
        )}

        <Card style={[styles.summaryCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Card.Content>
            <Title style={{ color: theme.colors.text }}>Academic Summary</Title>
            <View style={styles.summaryStats}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNumber, { color: theme.colors.primary }]}>{courses.length}</Text>
                <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Active Courses</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNumber, { color: theme.colors.primary }]}>
                  {courses.length > 0 ? 
                    Math.round(courses.reduce((acc, c) => acc + (toViewModel(c).attendance || 0), 0) / courses.length) : 0}%
                </Text>
                <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Avg Attendance</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNumber, { color: theme.colors.primary }]}>-</Text>
                <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Overall Grade</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {user?.role !== 'student' && (
        <FAB
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          icon="plus"
          color="#FFFFFF"
          onPress={() => {/* Add new course or action */}}
        />
      )}
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
  header: {
    marginBottom: 20,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  coursesContainer: {
    marginBottom: 20,
  },
  courseCard: {
    marginBottom: 16,
    elevation: 2,
    borderWidth: 1,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  courseInfo: {
    flex: 1,
  },
  courseCode: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  courseName: {
    fontSize: 16,
    marginBottom: 4,
  },
  facultyName: {
    fontSize: 14,
  },
  courseStats: {
    alignItems: 'flex-end',
  },
  chip: {
    marginBottom: 4,
  },
  courseMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  metric: {
    alignItems: 'center',
  },
  metricText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  metricLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  courseActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 0.48,
  },
  summaryCard: {
    marginBottom: 20,
    borderWidth: 1,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
