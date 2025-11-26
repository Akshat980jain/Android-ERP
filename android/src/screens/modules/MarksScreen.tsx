import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  FAB,
  DataTable,
  ProgressBar,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';

export default function MarksScreen({ navigation }: any) {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await apiService.getStudentMarks();
      if (response.success) {
        setMarks(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching marks:', error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    onRefresh();
  }, []);

  const mockMarks = [
    {
      id: '1',
      course: 'CS101 - Data Structures',
      assignment: 'Lab Assignment 1',
      marks: 85,
      maxMarks: 100,
      grade: 'A',
      date: '2024-01-10',
      faculty: 'Dr. John Smith',
    },
    {
      id: '2',
      course: 'CS102 - Algorithms',
      assignment: 'Midterm Exam',
      marks: 42,
      maxMarks: 50,
      grade: 'A+',
      date: '2024-01-08',
      faculty: 'Dr. Jane Doe',
    },
    {
      id: '3',
      course: 'CS103 - Database Systems',
      assignment: 'Project Report',
      marks: 35,
      maxMarks: 50,
      grade: 'B+',
      date: '2024-01-05',
      faculty: 'Dr. Mike Johnson',
    },
    {
      id: '4',
      course: 'CS101 - Data Structures',
      assignment: 'Quiz 2',
      marks: 18,
      maxMarks: 20,
      grade: 'A',
      date: '2024-01-03',
      faculty: 'Dr. John Smith',
    },
    {
      id: '5',
      course: 'CS102 - Algorithms',
      assignment: 'Lab Assignment 2',
      marks: 45,
      maxMarks: 50,
      grade: 'A+',
      date: '2024-01-01',
      faculty: 'Dr. Jane Doe',
    },
  ];

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
        return '#10B981';
      case 'A':
        return '#3B82F6';
      case 'B+':
        return '#F59E0B';
      case 'B':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const calculateStats = () => {
    const totalMarks = mockMarks.reduce((sum, mark) => sum + mark.marks, 0);
    const totalMaxMarks = mockMarks.reduce((sum, mark) => sum + mark.maxMarks, 0);
    const averagePercentage = totalMaxMarks > 0 ? Math.round((totalMarks / totalMaxMarks) * 100) : 0;
    const totalAssignments = mockMarks.length;
    const averageGrade = calculateAverageGrade();

    return { totalMarks, totalMaxMarks, averagePercentage, totalAssignments, averageGrade };
  };

  const calculateAverageGrade = () => {
    const gradeValues = { 'A+': 4.0, 'A': 3.7, 'B+': 3.3, 'B': 3.0, 'C+': 2.7, 'C': 2.3 };
    const totalGradePoints = mockMarks.reduce((sum, mark) => sum + (gradeValues[mark.grade] || 0), 0);
    const averageGPA = totalGradePoints / mockMarks.length;
    
    if (averageGPA >= 3.7) return 'A+';
    if (averageGPA >= 3.3) return 'A';
    if (averageGPA >= 3.0) return 'B+';
    if (averageGPA >= 2.7) return 'B';
    return 'C+';
  };

  const stats = calculateStats();

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Title style={styles.headerTitle}>Marks & Grades</Title>
          <Paragraph style={styles.headerSubtitle}>
            Track your academic performance
          </Paragraph>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <Card style={[styles.statCard, { backgroundColor: '#3B82F6' }]}>
            <Card.Content style={styles.statContent}>
              <Ionicons name="trophy" size={24} color="#fff" />
              <Text style={styles.statNumber}>{stats.averagePercentage}%</Text>
              <Text style={styles.statLabel}>Average</Text>
            </Card.Content>
          </Card>

          <Card style={[styles.statCard, { backgroundColor: '#10B981' }]}>
            <Card.Content style={styles.statContent}>
              <Ionicons name="star" size={24} color="#fff" />
              <Text style={styles.statNumber}>{stats.averageGrade}</Text>
              <Text style={styles.statLabel}>Grade</Text>
            </Card.Content>
          </Card>

          <Card style={[styles.statCard, { backgroundColor: '#F59E0B' }]}>
            <Card.Content style={styles.statContent}>
              <Ionicons name="document-text" size={24} color="#fff" />
              <Text style={styles.statNumber}>{stats.totalAssignments}</Text>
              <Text style={styles.statLabel}>Assignments</Text>
            </Card.Content>
          </Card>

          <Card style={[styles.statCard, { backgroundColor: '#8B5CF6' }]}>
            <Card.Content style={styles.statContent}>
              <Ionicons name="calculator" size={24} color="#fff" />
              <Text style={styles.statNumber}>{stats.totalMarks}</Text>
              <Text style={styles.statLabel}>Total Marks</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Recent Marks */}
        <Card style={styles.marksCard}>
          <Card.Content>
            <Title>Recent Marks</Title>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Assignment</DataTable.Title>
                <DataTable.Title>Marks</DataTable.Title>
                <DataTable.Title>Grade</DataTable.Title>
              </DataTable.Header>

              {mockMarks.slice(0, 5).map((mark) => (
                <DataTable.Row key={mark.id}>
                  <DataTable.Cell>
                    <Text style={styles.assignmentText}>{mark.assignment}</Text>
                    <Text style={styles.courseText}>{mark.course}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell>
                    <Text style={styles.marksText}>
                      {mark.marks}/{mark.maxMarks}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell>
                    <Chip
                      mode="outlined"
                      style={[styles.gradeChip, { borderColor: getGradeColor(mark.grade) }]}
                      textStyle={{ color: getGradeColor(mark.grade) }}
                    >
                      {mark.grade}
                    </Chip>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </Card.Content>
        </Card>

        {/* Course-wise Performance */}
        <Card style={styles.courseCard}>
          <Card.Content>
            <Title>Course-wise Performance</Title>
            <View style={styles.courseStats}>
              <View style={styles.courseItem}>
                <Text style={styles.courseName}>CS101 - Data Structures</Text>
                <View style={styles.progressContainer}>
                  <ProgressBar 
                    progress={0.85} 
                    color="#3B82F6" 
                    style={styles.progressBar}
                  />
                  <Text style={styles.progressText}>85%</Text>
                </View>
                <Text style={styles.gradeText}>Grade: A</Text>
              </View>
              <View style={styles.courseItem}>
                <Text style={styles.courseName}>CS102 - Algorithms</Text>
                <View style={styles.progressContainer}>
                  <ProgressBar 
                    progress={0.92} 
                    color="#10B981" 
                    style={styles.progressBar}
                  />
                  <Text style={styles.progressText}>92%</Text>
                </View>
                <Text style={styles.gradeText}>Grade: A+</Text>
              </View>
              <View style={styles.courseItem}>
                <Text style={styles.courseName}>CS103 - Database Systems</Text>
                <View style={styles.progressContainer}>
                  <ProgressBar 
                    progress={0.78} 
                    color="#F59E0B" 
                    style={styles.progressBar}
                  />
                  <Text style={styles.progressText}>78%</Text>
                </View>
                <Text style={styles.gradeText}>Grade: B+</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Performance Summary */}
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Title>Performance Summary</Title>
            <View style={styles.summaryStats}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{stats.totalMarks}</Text>
                <Text style={styles.summaryLabel}>Total Marks</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{stats.totalMaxMarks}</Text>
                <Text style={styles.summaryLabel}>Max Marks</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{stats.averagePercentage}%</Text>
                <Text style={styles.summaryLabel}>Average</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="chart-bar"
        onPress={() => {/* Navigate to detailed analytics */}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    marginBottom: 12,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statNumber: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  marksCard: {
    marginBottom: 16,
  },
  assignmentText: {
    fontSize: 12,
    fontWeight: '500',
  },
  courseText: {
    fontSize: 10,
    color: '#666',
  },
  marksText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  gradeChip: {
    alignSelf: 'flex-start',
  },
  courseCard: {
    marginBottom: 16,
  },
  courseStats: {
    marginTop: 16,
  },
  courseItem: {
    marginBottom: 16,
  },
  courseName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressBar: {
    flex: 1,
    height: 8,
    marginRight: 8,
  },
  progressText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  gradeText: {
    fontSize: 12,
    color: '#666',
  },
  summaryCard: {
    marginBottom: 16,
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
    color: '#3B82F6',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#3B82F6',
  },
});
