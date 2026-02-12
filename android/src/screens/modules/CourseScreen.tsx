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
    Chip,
    ActivityIndicator,
    Searchbar,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import apiService from '../../services/api';

interface CourseItem {
    _id: string;
    name: string;
    code: string;
    credits: number;
    department?: string;
    semester?: number;
    faculty?: { name: string } | string;
    schedule?: { day: string; startTime: string; endTime: string; room: string }[];
    enrolledStudents?: number;
    description?: string;
}

export default function CourseScreen() {
    const { user } = useAuth();
    const { theme } = useTheme();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [courses, setCourses] = useState<CourseItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSemester, setSelectedSemester] = useState<string>('all');

    useEffect(() => {
        loadCourses();
    }, []);

    const loadCourses = async () => {
        setLoading(true);
        try {
            const response: any = await apiService.getStudentCourses();
            if (response && response.success !== false) {
                const list = Array.isArray(response.courses) ? response.courses :
                    Array.isArray(response.data) ? response.data :
                        Array.isArray(response) ? response : [];
                setCourses(list);
            }
        } catch (error) {
            console.error('Error loading courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadCourses();
        setRefreshing(false);
    };

    const filteredCourses = courses.filter(c => {
        const matchesSearch = !searchQuery ||
            c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.code?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSemester = selectedSemester === 'all' || String(c.semester) === selectedSemester;
        return matchesSearch && matchesSemester;
    });

    const semesters = [...new Set(courses.map(c => c.semester).filter(Boolean))].sort((a, b) => (a || 0) - (b || 0));

    const getFacultyName = (faculty: any) => {
        if (!faculty) return 'TBA';
        if (typeof faculty === 'string') return faculty;
        return faculty.name || 'TBA';
    };

    const renderCourseCard = (course: CourseItem) => (
        <Card
            key={course._id}
            style={[styles.courseCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
        >
            <Card.Content>
                <View style={styles.courseHeader}>
                    <View style={{ flex: 1 }}>
                        <Title style={[styles.courseName, { color: theme.colors.text }]}>{course.name}</Title>
                        <Chip style={[styles.codeChip, { backgroundColor: theme.colors.primary + '20' }]}
                            textStyle={{ color: theme.colors.primary, fontSize: 11, fontWeight: '600' }}>
                            {course.code}
                        </Chip>
                    </View>
                    <View style={[styles.creditsBadge, { backgroundColor: theme.colors.primary }]}>
                        <Text style={styles.creditsText}>{course.credits}</Text>
                        <Text style={styles.creditsLabel}>Credits</Text>
                    </View>
                </View>

                <View style={[styles.courseDetails, { borderTopColor: theme.colors.border }]}>
                    <View style={styles.detailRow}>
                        <Ionicons name="person-outline" size={16} color={theme.colors.textSecondary} />
                        <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Faculty:</Text>
                        <Text style={[styles.detailValue, { color: theme.colors.text }]}>{getFacultyName(course.faculty)}</Text>
                    </View>

                    {course.semester && (
                        <View style={styles.detailRow}>
                            <Ionicons name="school-outline" size={16} color={theme.colors.textSecondary} />
                            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Semester:</Text>
                            <Text style={[styles.detailValue, { color: theme.colors.text }]}>{course.semester}</Text>
                        </View>
                    )}

                    {course.department && (
                        <View style={styles.detailRow}>
                            <Ionicons name="business-outline" size={16} color={theme.colors.textSecondary} />
                            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Dept:</Text>
                            <Text style={[styles.detailValue, { color: theme.colors.text }]}>{course.department}</Text>
                        </View>
                    )}

                    {course.schedule && course.schedule.length > 0 && (
                        <View style={styles.scheduleSection}>
                            <Text style={[styles.scheduleSectionTitle, { color: theme.colors.textSecondary }]}>Schedule</Text>
                            {course.schedule.map((s, i) => (
                                <View key={i} style={styles.scheduleRow}>
                                    <Ionicons name="time-outline" size={14} color={theme.colors.textSecondary} />
                                    <Text style={[styles.scheduleText, { color: theme.colors.text }]}>
                                        {s.day} · {s.startTime} - {s.endTime} · {s.room}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </Card.Content>
        </Card>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.topBar, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
                <View style={{ width: 28 }} />
                <Text style={[styles.topBarTitle, { color: theme.colors.text }]}>Courses</Text>
                <View style={{ width: 28 }} />
            </View>

            <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
                <Searchbar
                    placeholder="Search courses..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}
                    inputStyle={{ color: theme.colors.text }}
                    iconColor={theme.colors.textSecondary}
                    placeholderTextColor={theme.colors.textSecondary}
                />
            </View>

            {semesters.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer} contentContainerStyle={{ paddingHorizontal: 16 }}>
                    <TouchableOpacity onPress={() => setSelectedSemester('all')}>
                        <Chip selected={selectedSemester === 'all'}
                            style={[styles.filterChip, { backgroundColor: selectedSemester === 'all' ? theme.colors.primary : theme.colors.surface }]}
                            textStyle={{ color: selectedSemester === 'all' ? '#FFF' : theme.colors.text }}>
                            All
                        </Chip>
                    </TouchableOpacity>
                    {semesters.map(sem => (
                        <TouchableOpacity key={sem} onPress={() => setSelectedSemester(String(sem))}>
                            <Chip selected={selectedSemester === String(sem)}
                                style={[styles.filterChip, { backgroundColor: selectedSemester === String(sem) ? theme.colors.primary : theme.colors.surface }]}
                                textStyle={{ color: selectedSemester === String(sem) ? '#FFF' : theme.colors.text }}>
                                Sem {sem}
                            </Chip>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
            >
                {loading ? (
                    <View style={styles.centerBox}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading courses...</Text>
                    </View>
                ) : filteredCourses.length === 0 ? (
                    <View style={styles.centerBox}>
                        <Ionicons name="book-outline" size={64} color={theme.colors.textSecondary} />
                        <Text style={[styles.emptyText, { color: theme.colors.text }]}>No courses found</Text>
                        <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
                            {searchQuery ? 'Try a different search' : 'You are not enrolled in any courses yet'}
                        </Text>
                    </View>
                ) : (
                    <View style={{ paddingBottom: 20 }}>
                        <Text style={[styles.resultCount, { color: theme.colors.textSecondary }]}>
                            {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''}
                        </Text>
                        {filteredCourses.map(c => renderCourseCard(c))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16, borderBottomWidth: 1 },
    topBarTitle: { fontSize: 20, fontWeight: '600' },
    searchBar: { borderRadius: 12, elevation: 1, marginBottom: 8 },
    filterContainer: { maxHeight: 52, marginBottom: 4 },
    filterChip: { marginRight: 8, marginVertical: 8 },
    content: { flex: 1, padding: 16 },
    courseCard: { marginBottom: 16, borderRadius: 12, borderWidth: 1, elevation: 2 },
    courseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    courseName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
    codeChip: { alignSelf: 'flex-start', marginTop: 4 },
    creditsBadge: { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    creditsText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
    creditsLabel: { color: '#FFFFFFCC', fontSize: 9, fontWeight: '600' },
    courseDetails: { borderTopWidth: 1, paddingTop: 12 },
    detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    detailLabel: { fontSize: 13, marginLeft: 8, marginRight: 4 },
    detailValue: { fontSize: 13, fontWeight: '500', flex: 1 },
    scheduleSection: { marginTop: 8 },
    scheduleSectionTitle: { fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
    scheduleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    scheduleText: { fontSize: 12, marginLeft: 6 },
    centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
    loadingText: { marginTop: 16, fontSize: 14 },
    emptyText: { marginTop: 16, fontSize: 18, fontWeight: '600', textAlign: 'center' },
    emptySubtext: { marginTop: 8, fontSize: 14, textAlign: 'center' },
    resultCount: { fontSize: 13, marginBottom: 8, fontWeight: '500' },
});
