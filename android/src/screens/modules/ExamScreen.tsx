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
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import apiService from '../../services/api';

interface ExamItem {
    _id: string;
    title: string;
    course?: { name: string; code: string } | string;
    date: string;
    startTime?: string;
    endTime?: string;
    duration?: number;
    maxMarks?: number;
    type?: string;
    venue?: string;
    status?: string;
}

interface ResultItem {
    _id: string;
    examTitle?: string;
    course?: { name: string; code: string } | string;
    marksObtained: number;
    maxMarks: number;
    grade?: string;
    status?: string;
}

export default function ExamScreen() {
    const { user } = useAuth();
    const { theme } = useTheme();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [exams, setExams] = useState<ExamItem[]>([]);
    const [results, setResults] = useState<ResultItem[]>([]);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'results'>('upcoming');

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [examsRes, resultsRes]: any[] = await Promise.all([
                apiService.getExams(),
                apiService.getExamResults(),
            ]);

            if (examsRes && examsRes.success !== false) {
                const list = Array.isArray(examsRes.exams) ? examsRes.exams :
                    Array.isArray(examsRes.data) ? examsRes.data :
                        Array.isArray(examsRes) ? examsRes : [];
                setExams(list);
            }

            if (resultsRes && resultsRes.success !== false) {
                const list = Array.isArray(resultsRes.results) ? resultsRes.results :
                    Array.isArray(resultsRes.data) ? resultsRes.data :
                        Array.isArray(resultsRes) ? resultsRes : [];
                setResults(list);
            }
        } catch (error) {
            console.error('Error loading exams:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const getCourseName = (c: any) => {
        if (!c) return 'N/A';
        if (typeof c === 'string') return c;
        return c.name || c.code || 'N/A';
    };

    const getTypeColor = (type?: string) => {
        switch (type?.toLowerCase()) {
            case 'midterm': return '#F59E0B';
            case 'final': return '#EF4444';
            case 'quiz': return '#3B82F6';
            case 'practical': return '#8B5CF6';
            default: return theme.colors.primary;
        }
    };

    const getGradeColor = (grade?: string) => {
        switch (grade?.toUpperCase()) {
            case 'A': case 'A+': case 'A-': return '#10B981';
            case 'B': case 'B+': case 'B-': return '#3B82F6';
            case 'C': case 'C+': case 'C-': return '#F59E0B';
            default: return '#EF4444';
        }
    };

    const renderExamCard = (exam: ExamItem) => (
        <Card key={exam._id} style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Card.Content>
                <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                        <Title style={[styles.cardTitle, { color: theme.colors.text }]}>{exam.title}</Title>
                        <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>{getCourseName(exam.course)}</Text>
                    </View>
                    {exam.type && (
                        <Chip style={[styles.typeChip, { backgroundColor: getTypeColor(exam.type) + '20' }]}
                            textStyle={{ color: getTypeColor(exam.type), fontSize: 11, fontWeight: '600' }}>
                            {exam.type.toUpperCase()}
                        </Chip>
                    )}
                </View>

                <View style={[styles.detailsSection, { borderTopColor: theme.colors.border }]}>
                    <View style={styles.detailRow}>
                        <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
                        <Text style={[styles.detailText, { color: theme.colors.text }]}>{formatDate(exam.date)}</Text>
                    </View>
                    {exam.startTime && (
                        <View style={styles.detailRow}>
                            <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
                            <Text style={[styles.detailText, { color: theme.colors.text }]}>
                                {exam.startTime}{exam.endTime ? ` - ${exam.endTime}` : ''}
                            </Text>
                        </View>
                    )}
                    {exam.venue && (
                        <View style={styles.detailRow}>
                            <Ionicons name="location-outline" size={16} color={theme.colors.textSecondary} />
                            <Text style={[styles.detailText, { color: theme.colors.text }]}>{exam.venue}</Text>
                        </View>
                    )}
                    {exam.maxMarks && (
                        <View style={styles.detailRow}>
                            <Ionicons name="document-text-outline" size={16} color={theme.colors.textSecondary} />
                            <Text style={[styles.detailText, { color: theme.colors.text }]}>Max Marks: {exam.maxMarks}</Text>
                        </View>
                    )}
                </View>
            </Card.Content>
        </Card>
    );

    const renderResultCard = (result: ResultItem) => {
        const percentage = result.maxMarks > 0 ? Math.round((result.marksObtained / result.maxMarks) * 100) : 0;
        return (
            <Card key={result._id} style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <Card.Content>
                    <View style={styles.cardHeader}>
                        <View style={{ flex: 1 }}>
                            <Title style={[styles.cardTitle, { color: theme.colors.text }]}>{result.examTitle || getCourseName(result.course)}</Title>
                            <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>{getCourseName(result.course)}</Text>
                        </View>
                        {result.grade && (
                            <View style={[styles.gradeBadge, { backgroundColor: getGradeColor(result.grade) }]}>
                                <Text style={styles.gradeText}>{result.grade}</Text>
                            </View>
                        )}
                    </View>

                    <View style={[styles.marksRow, { borderTopColor: theme.colors.border }]}>
                        <View style={styles.markBox}>
                            <Text style={[styles.markValue, { color: theme.colors.primary }]}>{result.marksObtained}</Text>
                            <Text style={[styles.markLabel, { color: theme.colors.textSecondary }]}>Obtained</Text>
                        </View>
                        <View style={styles.markDivider} />
                        <View style={styles.markBox}>
                            <Text style={[styles.markValue, { color: theme.colors.text }]}>{result.maxMarks}</Text>
                            <Text style={[styles.markLabel, { color: theme.colors.textSecondary }]}>Max</Text>
                        </View>
                        <View style={styles.markDivider} />
                        <View style={styles.markBox}>
                            <Text style={[styles.markValue, { color: percentage >= 60 ? '#10B981' : '#EF4444' }]}>{percentage}%</Text>
                            <Text style={[styles.markLabel, { color: theme.colors.textSecondary }]}>Percentage</Text>
                        </View>
                    </View>
                </Card.Content>
            </Card>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.topBar, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
                <View style={{ width: 28 }} />
                <Text style={[styles.topBarTitle, { color: theme.colors.text }]}>Exams</Text>
                <View style={{ width: 28 }} />
            </View>

            <View style={[styles.tabBar, { borderBottomColor: theme.colors.border }]}>
                {(['upcoming', 'results'] as const).map(tab => (
                    <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)}
                        style={[styles.tab, activeTab === tab && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }]}>
                        <Text style={[styles.tabText, { color: activeTab === tab ? theme.colors.primary : theme.colors.textSecondary }]}>
                            {tab === 'upcoming' ? 'Upcoming' : 'Results'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
            >
                {loading ? (
                    <View style={styles.centerBox}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading exams...</Text>
                    </View>
                ) : activeTab === 'upcoming' ? (
                    exams.length === 0 ? (
                        <View style={styles.centerBox}>
                            <Ionicons name="clipboard-outline" size={64} color={theme.colors.textSecondary} />
                            <Text style={[styles.emptyText, { color: theme.colors.text }]}>No upcoming exams</Text>
                        </View>
                    ) : exams.map(e => renderExamCard(e))
                ) : (
                    results.length === 0 ? (
                        <View style={styles.centerBox}>
                            <Ionicons name="stats-chart-outline" size={64} color={theme.colors.textSecondary} />
                            <Text style={[styles.emptyText, { color: theme.colors.text }]}>No results available</Text>
                        </View>
                    ) : results.map(r => renderResultCard(r))
                )}
                <View style={{ height: 20 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16, borderBottomWidth: 1 },
    topBarTitle: { fontSize: 20, fontWeight: '600' },
    tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
    tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
    tabText: { fontSize: 15, fontWeight: '600' },
    content: { flex: 1, padding: 16 },
    card: { marginBottom: 16, borderRadius: 12, borderWidth: 1, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
    cardSubtitle: { fontSize: 13 },
    typeChip: { alignSelf: 'flex-start' },
    detailsSection: { borderTopWidth: 1, paddingTop: 12 },
    detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
    detailText: { fontSize: 13 },
    gradeBadge: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    gradeText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    marksRow: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 12, marginTop: 4 },
    markBox: { flex: 1, alignItems: 'center' },
    markValue: { fontSize: 20, fontWeight: 'bold' },
    markLabel: { fontSize: 11, marginTop: 2 },
    markDivider: { width: 1, backgroundColor: '#E5E7EB', marginHorizontal: 8 },
    centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
    loadingText: { marginTop: 16, fontSize: 14 },
    emptyText: { marginTop: 16, fontSize: 18, fontWeight: '600', textAlign: 'center' },
});
