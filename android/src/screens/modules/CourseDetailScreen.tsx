import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import apiService from '../../services/api';

interface ScheduleSlot {
    day: string;
    startTime: string;
    endTime: string;
    room: string;
}

interface CourseDetail {
    _id: string;
    name: string;
    code: string;
    credits: number;
    semester?: number;
    department?: string;
    description?: string;
    enrolledStudents?: number;
    faculty?: { name: string } | string;
    schedule?: ScheduleSlot[];
}

function getFacultyName(faculty: any): string {
    if (!faculty) return 'TBA';
    if (typeof faculty === 'string') return faculty;
    return faculty.name || 'TBA';
}

export default function CourseDetailScreen({ route, navigation }: any) {
    const { theme } = useTheme();

    const {
        courseId,
        courseName,
        attendance,
        grade,
    } = route.params as {
        courseId: string;
        courseName: string;
        attendance?: number;
        grade?: string;
    };

    const [course, setCourse] = useState<CourseDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const loadCourse = useCallback(async () => {
        try {
            setError(null);
            const response: any = await apiService.getStudentCourses();

            const list: any[] = Array.isArray(response)
                ? response
                : Array.isArray(response?.courses)
                    ? response.courses
                    : Array.isArray(response?.data)
                        ? response.data
                        : [];

            const found = list.find(
                (c: any) => c._id === courseId || c.id === courseId,
            );

            if (found) {
                setCourse(found as CourseDetail);
            } else {
                setError('Course details could not be found.');
            }
        } catch (e: any) {
            setError('Failed to load course details. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [courseId]);

    useEffect(() => {
        loadCourse();
    }, [loadCourse]);

    const onRefresh = () => {
        setRefreshing(true);
        loadCourse();
    };

    const s = styles(theme);

    // ─── Loading state ───────────────────────────────────────────────────────────
    if (loading) {
        return (
            <View style={[s.container, s.center]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[s.loadingText, { color: theme.colors.textSecondary }]}>
                    Loading course details…
                </Text>
            </View>
        );
    }

    // ─── Error state ─────────────────────────────────────────────────────────────
    if (error || !course) {
        return (
            <View style={[s.container, { backgroundColor: theme.colors.background }]}>
                <View style={[s.topBar, { borderBottomColor: theme.colors.border }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                    <Text style={[s.topBarTitle, { color: theme.colors.text }]} numberOfLines={1}>
                        {courseName}
                    </Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={s.center}>
                    <Ionicons name="warning-outline" size={56} color={theme.colors.textSecondary} />
                    <Text style={[s.emptyTitle, { color: theme.colors.text }]}>Not Found</Text>
                    <Text style={[s.emptySubtitle, { color: theme.colors.textSecondary }]}>{error}</Text>
                    <TouchableOpacity
                        style={[s.retryButton, { backgroundColor: theme.colors.primary }]}
                        onPress={() => { setLoading(true); loadCourse(); }}
                    >
                        <Text style={s.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const hasStats = (typeof attendance === 'number') || (grade && grade !== '—');
    const hasSchedule = Array.isArray(course.schedule) && course.schedule.length > 0;

    // ─── Detail view ─────────────────────────────────────────────────────────────
    return (
        <View style={[s.container, { backgroundColor: theme.colors.background }]}>
            {/* Top Bar */}
            <View style={[s.topBar, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={[s.topBarTitle, { color: theme.colors.text }]} numberOfLines={1}>
                    Course Details
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={s.scroll}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
                }
            >
                {/* ── Header Card ─────────────────────────────────────────────── */}
                <View style={[s.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                    <View style={s.headerRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={[s.courseName, { color: theme.colors.text }]}>{course.name}</Text>
                            <View style={[s.codeBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                                <Text style={[s.codeText, { color: theme.colors.primary }]}>{course.code}</Text>
                            </View>
                        </View>
                        <View style={[s.creditsBadge, { backgroundColor: theme.colors.primary }]}>
                            <Text style={s.creditsNumber}>{course.credits}</Text>
                            <Text style={s.creditsLabel}>Credits</Text>
                        </View>
                    </View>
                </View>

                {/* ── Info Section ─────────────────────────────────────────────── */}
                <View style={[s.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                    <Text style={[s.sectionTitle, { color: theme.colors.textSecondary }]}>COURSE INFO</Text>

                    <View style={s.infoRow}>
                        <Ionicons name="person-outline" size={18} color={theme.colors.primary} />
                        <Text style={[s.infoLabel, { color: theme.colors.textSecondary }]}>Faculty</Text>
                        <Text style={[s.infoValue, { color: theme.colors.text }]}>{getFacultyName(course.faculty)}</Text>
                    </View>

                    {course.semester != null && (
                        <View style={s.infoRow}>
                            <Ionicons name="school-outline" size={18} color={theme.colors.primary} />
                            <Text style={[s.infoLabel, { color: theme.colors.textSecondary }]}>Semester</Text>
                            <Text style={[s.infoValue, { color: theme.colors.text }]}>{course.semester}</Text>
                        </View>
                    )}

                    {course.department ? (
                        <View style={s.infoRow}>
                            <Ionicons name="business-outline" size={18} color={theme.colors.primary} />
                            <Text style={[s.infoLabel, { color: theme.colors.textSecondary }]}>Department</Text>
                            <Text style={[s.infoValue, { color: theme.colors.text }]}>{course.department}</Text>
                        </View>
                    ) : null}

                    {typeof course.enrolledStudents === 'number' && (
                        <View style={s.infoRow}>
                            <Ionicons name="people-outline" size={18} color={theme.colors.primary} />
                            <Text style={[s.infoLabel, { color: theme.colors.textSecondary }]}>Enrolled</Text>
                            <Text style={[s.infoValue, { color: theme.colors.text }]}>{course.enrolledStudents} students</Text>
                        </View>
                    )}
                </View>

                {/* ── Academic Stats ───────────────────────────────────────────── */}
                {hasStats && (
                    <View style={[s.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                        <Text style={[s.sectionTitle, { color: theme.colors.textSecondary }]}>YOUR PERFORMANCE</Text>
                        <View style={s.statsRow}>
                            {typeof attendance === 'number' && (
                                <View style={[s.statBox, { backgroundColor: theme.colors.surface }]}>
                                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                                    <Text style={[s.statNumber, { color: theme.colors.text }]}>{attendance}%</Text>
                                    <Text style={[s.statLabel, { color: theme.colors.textSecondary }]}>Attendance</Text>
                                </View>
                            )}
                            {grade && grade !== '—' && (
                                <View style={[s.statBox, { backgroundColor: theme.colors.surface }]}>
                                    <Ionicons name="trophy" size={24} color="#F59E0B" />
                                    <Text style={[s.statNumber, { color: theme.colors.text }]}>{grade}</Text>
                                    <Text style={[s.statLabel, { color: theme.colors.textSecondary }]}>Grade</Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* ── Description ──────────────────────────────────────────────── */}
                {course.description ? (
                    <View style={[s.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                        <Text style={[s.sectionTitle, { color: theme.colors.textSecondary }]}>DESCRIPTION</Text>
                        <Text style={[s.description, { color: theme.colors.text }]}>{course.description}</Text>
                    </View>
                ) : null}

                {/* ── Schedule ─────────────────────────────────────────────────── */}
                {hasSchedule && (
                    <View style={[s.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                        <Text style={[s.sectionTitle, { color: theme.colors.textSecondary }]}>SCHEDULE</Text>
                        {course.schedule!.map((slot, idx) => (
                            <View
                                key={idx}
                                style={[
                                    s.scheduleRow,
                                    idx < course.schedule!.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
                                ]}
                            >
                                <View style={[s.dayBadge, { backgroundColor: theme.colors.primary + '15' }]}>
                                    <Text style={[s.dayText, { color: theme.colors.primary }]}>{slot.day?.slice(0, 3).toUpperCase()}</Text>
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={[s.slotTime, { color: theme.colors.text }]}>
                                        {slot.startTime} – {slot.endTime}
                                    </Text>
                                    <Text style={[s.slotRoom, { color: theme.colors.textSecondary }]}>
                                        <Ionicons name="location-outline" size={12} color={theme.colors.textSecondary} /> {slot.room}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                <View style={{ height: 32 }} />
            </ScrollView>
        </View>
    );
}

const styles = (theme: any) =>
    StyleSheet.create({
        container: { flex: 1 },
        center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
        topBar: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingTop: 50,
            paddingBottom: 14,
            borderBottomWidth: 1,
        },
        backBtn: { width: 40, alignItems: 'flex-start' },
        topBarTitle: { fontSize: 18, fontWeight: '600', flex: 1, textAlign: 'center' },
        scroll: { padding: 16 },
        card: {
            borderRadius: 14,
            borderWidth: 1,
            padding: 16,
            marginBottom: 14,
            elevation: 2,
        },
        /* Header */
        headerRow: { flexDirection: 'row', alignItems: 'flex-start' },
        courseName: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
        codeBadge: { alignSelf: 'flex-start', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
        codeText: { fontSize: 12, fontWeight: '700' },
        creditsBadge: { width: 60, height: 60, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
        creditsNumber: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
        creditsLabel: { color: '#FFFFFF99', fontSize: 9, fontWeight: '600', marginTop: 1 },
        /* Section */
        sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 12 },
        /* Info rows */
        infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
        infoLabel: { fontSize: 13, marginLeft: 10, marginRight: 6, width: 90 },
        infoValue: { fontSize: 13, fontWeight: '600', flex: 1 },
        /* Stats */
        statsRow: { flexDirection: 'row', gap: 12 },
        statBox: { flex: 1, alignItems: 'center', borderRadius: 12, paddingVertical: 14 },
        statNumber: { fontSize: 22, fontWeight: '700', marginTop: 6 },
        statLabel: { fontSize: 12, marginTop: 2 },
        /* Description */
        description: { fontSize: 14, lineHeight: 22 },
        /* Schedule */
        scheduleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
        dayBadge: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
        dayText: { fontSize: 11, fontWeight: '800' },
        slotTime: { fontSize: 14, fontWeight: '600' },
        slotRoom: { fontSize: 12, marginTop: 2 },
        /* Loading / Error */
        loadingText: { marginTop: 14, fontSize: 14 },
        emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 14 },
        emptySubtitle: { fontSize: 14, textAlign: 'center', marginTop: 6, marginBottom: 20 },
        retryButton: { paddingHorizontal: 28, paddingVertical: 10, borderRadius: 20 },
        retryText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
    });
