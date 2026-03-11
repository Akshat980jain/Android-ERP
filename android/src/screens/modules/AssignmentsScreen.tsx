import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  StatusBar,
  Platform,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  FAB,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import apiService from '../../services/api';

export default function AssignmentsScreen({ navigation }: any) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const response: any = await apiService.getStudentAssignments();
      console.log('Assignments API response:', response);

      // Backend returns: { assignments: [...] }
      const list = Array.isArray(response?.assignments)
        ? response.assignments
        : Array.isArray(response?.data)
          ? response.data
          : [];

      console.log('Processed assignments list:', list);
      setAssignments(list);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    onRefresh();
  }, []);

  const toViewModel = (a: any) => ({
    id: a._id || a.id,
    title: a.title,
    course: a.course?.name ? `${a.course.name} (${a.course.code || ''})` : (a.course || ''),
    dueDate: a.dueDate ? new Date(a.dueDate).toLocaleDateString() : '',
    status: a.hasSubmitted ? (a.submissionStatus || 'submitted') : 'pending',
    maxMarks: a.maxMarks,
    submittedMarks: typeof a.marks === 'number' ? a.marks : undefined,
    description: a.description,
    attachments: a.attachments || [],
    feedback: a.feedback,
    startDate: a.startDate,
    allowLateSubmission: a.allowLateSubmission,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return '#10B981';
      case 'graded':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'overdue':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'check-circle';
      case 'graded':
        return 'star-circle';
      case 'pending':
        return 'clock-outline';
      case 'overdue':
        return 'alert-circle';
      default:
        return 'information';
    }
  };

  const styles = createStyles(theme);

  const renderAssignmentCard = (assignment: any) => (
    <Card key={assignment.id} style={styles.assignmentCard}>
      <Card.Content>
        <View style={styles.assignmentHeader}>
          <View style={styles.assignmentInfo}>
            <Title style={styles.assignmentTitle}>{assignment.title}</Title>
            <Paragraph style={styles.courseName}>{assignment.course}</Paragraph>
            <Text style={styles.description}>{assignment.description}</Text>
          </View>
          <Chip
            mode="outlined"
            style={[styles.statusChip, { borderColor: getStatusColor(assignment.status) }]}
            textStyle={{ color: getStatusColor(assignment.status) }}
            icon={getStatusIcon(assignment.status)}
          >
            {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
          </Chip>
        </View>

        <View style={styles.assignmentDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.detailText}>Due: {assignment.dueDate}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="trophy" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.detailText}>
              {assignment.submittedMarks ?
                `${assignment.submittedMarks}/${assignment.maxMarks}` :
                `Max: ${assignment.maxMarks}`
              }
            </Text>
          </View>
        </View>

        <View style={styles.assignmentActions}>
          {assignment.status === 'pending' && (
            <Button
              mode="contained"
              onPress={() => navigation.navigate('AssignmentDetail', { assignmentId: assignment.id, mode: 'submit' })}
              style={[styles.actionButton, { flex: 1, marginRight: 8 }]}
              textColor="#FFFFFF"
              labelStyle={{ fontSize: 12 }}
            >
              Submit Assignment
            </Button>
          )}
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('AssignmentDetail', { assignmentId: assignment.id, mode: 'view' })}
            style={[styles.actionButton, { flex: 1, backgroundColor: 'transparent' }]}
            textColor={theme.colors.primary}
            labelStyle={{ fontSize: 12 }}
          >
            View Details
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={theme.colors.statusBarStyle}
        backgroundColor={theme.colors.surface}
        translucent={false}
      />
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        <View style={styles.header}>
          <Title style={styles.headerTitle}>Assignments</Title>
          <Paragraph style={styles.headerSubtitle}>
            Your assignments and submissions
          </Paragraph>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading assignments...</Text>
          </View>
        ) : (
          <View style={styles.assignmentsContainer}>
            {assignments.map((a) => renderAssignmentCard(toViewModel(a)))}
          </View>
        )}

        <Card style={styles.summaryCard}>
          <Card.Content>
            <Title>Assignment Summary</Title>
            <View style={styles.summaryStats}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{assignments.length}</Text>
                <Text style={styles.summaryLabel}>Total</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>
                  {assignments.filter(a => a.hasSubmitted || a.submissionStatus === 'submitted').length}
                </Text>
                <Text style={styles.summaryLabel}>Submitted</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>
                  {assignments.filter(a => !a.hasSubmitted && a.submissionStatus !== 'submitted').length}
                </Text>
                <Text style={styles.summaryLabel}>Pending</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => {/* Add new assignment or action */ }}
      />
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
    backgroundColor: theme.colors.background,
  },
  header: {
    marginBottom: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
    color: theme.colors.text,
  },
  headerSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  assignmentsContainer: {
    marginBottom: 20,
  },
  assignmentCard: {
    marginBottom: 16,
    backgroundColor: theme.colors.card,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  assignmentInfo: {
    flex: 1,
    marginRight: 12,
  },
  assignmentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: theme.colors.text,
  },
  courseName: {
    fontSize: 14,
    color: theme.colors.primary,
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  statusChip: {
    alignSelf: 'flex-start',
    backgroundColor: theme.isDark ? '#0A0A0A' : '#F3F4F6',
  },
  assignmentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 10,
    backgroundColor: theme.isDark ? '#0A0A0A' : '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 4,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  assignmentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    borderRadius: 22,
  },
  summaryCard: {
    marginBottom: 20,
    backgroundColor: theme.colors.card,
    elevation: 3,
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
    color: theme.colors.primary,
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});
