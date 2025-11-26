import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import apiService from '../../services/api';

export default function AdminAcademicScreen({ navigation }: any) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [academicData, setAcademicData] = useState<any>(null);
  const [expandedPrograms, setExpandedPrograms] = useState<{ [key: string]: boolean }>({});
  const [expandedBranches, setExpandedBranches] = useState<{ [key: string]: boolean }>({});

  // Determine admin type
  const isHeadAdmin = !(user as any)?.adminPrograms || ((user as any)?.adminPrograms?.length || 0) === 0;

  const fetchAcademicData = async () => {
    setLoading(true);
    try {
      const response = await apiService.getAllCourses();
      
      if (response && response.success !== false) {
        let courses = Array.isArray(response.data) ? response.data : 
                       Array.isArray((response as any).courses) ? (response as any).courses : [];
        
        // Filter courses for Branch Admin
        if (!isHeadAdmin) {
          const adminProgram = (user as any)?.adminPrograms?.[0] || '';
          const adminBranch = (user as any)?.profile?.branch || (user as any)?.branch || '';
          const adminDepartment = (user as any)?.profile?.department || (user as any)?.department || '';
          
          courses = courses.filter((course: any) => {
            const courseProgram = course.program || course.year || '';
            const courseBranch = course.department || course.branch || '';
            
            const matchesProgram = adminProgram && courseProgram.toString().includes(adminProgram);
            const matchesBranch = (adminBranch && courseBranch === adminBranch) || 
                                 (adminDepartment && courseBranch === adminDepartment);
            
            return matchesProgram || matchesBranch;
          });
        }
        
        // Organize courses hierarchically
        const organized: any = {};
        
        courses.forEach((course: any) => {
          const program = course.program || course.year || 'Undergraduate';
          const branch = course.department || course.branch || 'General';
          
          if (!organized[program]) {
            organized[program] = {};
          }
          
          if (!organized[program][branch]) {
            organized[program][branch] = [];
          }
          
          organized[program][branch].push(course);
        });
        
        setAcademicData(organized);
      }
    } catch (err) {
      console.error('Error fetching academic data:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAcademicData();
    setRefreshing(false);
  };

  const toggleProgram = (program: string) => {
    setExpandedPrograms(prev => ({ ...prev, [program]: !prev[program] }));
  };

  const toggleBranch = (key: string) => {
    setExpandedBranches(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    fetchAcademicData();
  }, []);

  const styles = createStyles(theme);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {isHeadAdmin ? 'Academic Management' : 'My Courses'}
        </Text>
        {!isHeadAdmin && (
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            {(user as any)?.profile?.branch || (user as any)?.branch || (user as any)?.adminPrograms?.[0]}
          </Text>
        )}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Ionicons name="hourglass-outline" size={48} color={theme.colors.textSecondary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading courses...</Text>
          </View>
        ) : !academicData || Object.keys(academicData).length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No courses available</Text>
          </View>
        ) : (
          <>
            {Object.entries(academicData).map(([program, branches]: [string, any]) => (
              <View key={program} style={styles.programContainer}>
                {/* Program Header */}
                <TouchableOpacity
                  style={[styles.programHeader, { 
                    backgroundColor: theme.isDark ? '#1F2937' : '#F3F4F6',
                    borderLeftColor: theme.colors.primary,
                  }]}
                  onPress={() => toggleProgram(program)}
                >
                  <View style={styles.programHeaderLeft}>
                    <Ionicons 
                      name={expandedPrograms[program] ? 'chevron-down' : 'chevron-forward'} 
                      size={24} 
                      color={theme.colors.primary} 
                    />
                    <Text style={[styles.programName, { color: theme.colors.text }]}>{program}</Text>
                  </View>
                  <Chip
                    mode="flat"
                    style={{ backgroundColor: theme.colors.primary }}
                    textStyle={{ color: '#FFFFFF', fontSize: 12 }}
                  >
                    {Object.keys(branches).length} {Object.keys(branches).length === 1 ? 'Branch' : 'Branches'}
                  </Chip>
                </TouchableOpacity>

                {/* Branches */}
                {expandedPrograms[program] && (
                  <View style={styles.branchesContainer}>
                    {Object.entries(branches).map(([branch, courses]: [string, any]) => {
                      const branchKey = `${program}-${branch}`;
                      return (
                        <View key={branchKey} style={styles.branchContainer}>
                          {/* Branch Header */}
                          <TouchableOpacity
                            style={[styles.branchHeader, {
                              backgroundColor: theme.isDark ? '#374151' : '#E5E7EB',
                            }]}
                            onPress={() => toggleBranch(branchKey)}
                          >
                            <View style={styles.branchHeaderLeft}>
                              <Ionicons 
                                name={expandedBranches[branchKey] ? 'remove' : 'add'} 
                                size={20} 
                                color={theme.colors.text} 
                              />
                              <Ionicons name="git-branch" size={18} color={theme.colors.primary} style={{ marginLeft: 8 }} />
                              <Text style={[styles.branchName, { color: theme.colors.text }]}>{branch}</Text>
                            </View>
                            <Chip
                              mode="outlined"
                              style={{ borderColor: theme.colors.primary }}
                              textStyle={{ color: theme.colors.primary, fontSize: 11 }}
                            >
                              {courses.length} {courses.length === 1 ? 'Course' : 'Courses'}
                            </Chip>
                          </TouchableOpacity>

                          {/* Courses */}
                          {expandedBranches[branchKey] && (
                            <View style={styles.coursesContainer}>
                              {courses.map((course: any, index: number) => (
                                <View
                                  key={course._id || index}
                                  style={[styles.courseCard, {
                                    backgroundColor: theme.isDark ? '#1F2937' : '#FFFFFF',
                                    borderColor: theme.colors.border,
                                  }]}
                                >
                                  <View style={styles.courseHeader}>
                                    <View style={styles.courseHeaderLeft}>
                                      <Ionicons name="book" size={20} color={theme.colors.primary} />
                                      <View style={{ marginLeft: 10, flex: 1 }}>
                                        <Text style={[styles.courseName, { color: theme.colors.text }]}>{course.name}</Text>
                                        <Text style={[styles.courseCode, { color: theme.colors.textSecondary }]}>{course.code}</Text>
                                      </View>
                                    </View>
                                    <Chip
                                      mode="flat"
                                      style={{ backgroundColor: course.status === 'active' ? '#10B981' : '#6B7280' }}
                                      textStyle={{ color: '#FFFFFF', fontSize: 10 }}
                                    >
                                      {course.status || 'Active'}
                                    </Chip>
                                  </View>

                                  <View style={[styles.courseDetails, { borderTopColor: theme.colors.border }]}>
                                    <View style={styles.courseDetailRow}>
                                      <Ionicons name="person" size={16} color={theme.colors.textSecondary} />
                                      <Text style={[styles.courseDetailLabel, { color: theme.colors.textSecondary }]}>Faculty:</Text>
                                      <Text style={[styles.courseDetailValue, { color: theme.colors.text }]}>
                                        {course.faculty?.name || 'Not assigned'}
                                      </Text>
                                    </View>
                                    <View style={styles.courseDetailRow}>
                                      <Ionicons name="people" size={16} color={theme.colors.textSecondary} />
                                      <Text style={[styles.courseDetailLabel, { color: theme.colors.textSecondary }]}>Students:</Text>
                                      <Text style={[styles.courseDetailValue, { color: theme.colors.text }]}>
                                        {course.students?.length || 0} / {course.maxStudents || 50}
                                      </Text>
                                    </View>
                                    <View style={styles.courseDetailRow}>
                                      <Ionicons name="trophy" size={16} color={theme.colors.textSecondary} />
                                      <Text style={[styles.courseDetailLabel, { color: theme.colors.textSecondary }]}>Credits:</Text>
                                      <Text style={[styles.courseDetailValue, { color: theme.colors.text }]}>
                                        {course.credits || 'N/A'}
                                      </Text>
                                    </View>
                                    <View style={styles.courseDetailRow}>
                                      <Ionicons name="calendar" size={16} color={theme.colors.textSecondary} />
                                      <Text style={[styles.courseDetailLabel, { color: theme.colors.textSecondary }]}>Semester:</Text>
                                      <Text style={[styles.courseDetailValue, { color: theme.colors.text }]}>
                                        {course.semester || 'N/A'}
                                      </Text>
                                    </View>
                                    {course.description && (
                                      <View style={[styles.courseDescription, { backgroundColor: theme.isDark ? '#374151' : '#F9FAFB' }]}>
                                        <Text style={[styles.courseDescriptionText, { color: theme.colors.textSecondary }]}>
                                          {course.description}
                                        </Text>
                                      </View>
                                    )}
                                  </View>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  },
  programContainer: {
    marginBottom: 20,
  },
  programHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  programHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  programName: {
    fontSize: 18,
    fontWeight: '700',
  },
  branchesContainer: {
    marginTop: 12,
    marginLeft: 16,
  },
  branchContainer: {
    marginBottom: 16,
  },
  branchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 10,
  },
  branchHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  branchName: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  coursesContainer: {
    marginTop: 12,
    marginLeft: 20,
    gap: 12,
  },
  courseCard: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  courseHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  courseCode: {
    fontSize: 13,
    fontWeight: '500',
  },
  courseDetails: {
    borderTopWidth: 1,
    paddingTop: 14,
    gap: 10,
  },
  courseDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  courseDetailLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  courseDetailValue: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  courseDescription: {
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
  },
  courseDescriptionText: {
    fontSize: 12,
    lineHeight: 18,
  },
});

