import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, ActivityIndicator,
    TouchableOpacity, TextInput, RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import apiService from '../../services/api';

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

interface Student {
    _id: string;
    name: string;
    email: string;
    profile?: { studentId?: string };
}

interface Section {
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

export default function FacultySectionScreen() {
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchSections = useCallback(async () => {
        try {
            setError(null);
            const params: any = {};
            if (selectedSemester) params.semester = selectedSemester;
            const res: any = await apiService.getFacultySections(params);
            if (res.success) {
                setSections(res.sections || []);
            } else {
                setError(res.message || 'Failed to load sections');
            }
        } catch (e: any) {
            setError(e.message || 'Failed to load');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedSemester]);

    useEffect(() => { fetchSections(); }, [fetchSections]);

    const onRefresh = () => { setRefreshing(true); fetchSections(); };

    const filtered = sections.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.program.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.branch || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalStudents = sections.reduce((acc, s) => acc + (s.students?.length || 0), 0);
    const semesterSet = new Set(sections.map(s => s.semester));

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#10b981" />
                <Text style={styles.loadingText}>Loading sections...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.center}>
                <Ionicons name="alert-circle" size={48} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={fetchSections}>
                    <Text style={styles.retryBtnText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
        >
            {/* Header */}
            <LinearGradient colors={['#059669', '#0d9488']} style={styles.headerCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={styles.headerLabel}>Section Overview</Text>
                <Text style={styles.headerTitle}>Sections & Students</Text>
                <Text style={styles.headerSub}>View sections and enrolled students for your program</Text>
            </LinearGradient>

            {/* Stats */}
            <View style={styles.statsRow}>
                {[
                    { label: 'Sections', value: sections.length, icon: 'layers-outline', color: '#6366f1' },
                    { label: 'Students', value: totalStudents, icon: 'people', color: '#10b981' },
                    { label: 'Semesters', value: semesterSet.size, icon: 'school', color: '#f59e0b' },
                ].map((stat, i) => (
                    <View key={i} style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
                            <Ionicons name={stat.icon as any} size={20} color={stat.color} />
                        </View>
                        <Text style={styles.statLabel}>{stat.label}</Text>
                        <Text style={styles.statValue}>{stat.value}</Text>
                    </View>
                ))}
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={16} color="#6b7280" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search sections..."
                    placeholderTextColor="#6b7280"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Semester Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsContainer} contentContainerStyle={styles.pillsContent}>
                <TouchableOpacity
                    onPress={() => setSelectedSemester(null)}
                    style={[styles.pill, !selectedSemester && styles.pillActive]}
                >
                    <Text style={[styles.pillText, !selectedSemester && styles.pillTextActive]}>All</Text>
                </TouchableOpacity>
                {SEMESTERS.map(sem => (
                    <TouchableOpacity
                        key={sem}
                        onPress={() => setSelectedSemester(selectedSemester === sem ? null : sem)}
                        style={[styles.pill, selectedSemester === sem && styles.pillActive]}
                    >
                        <Text style={[styles.pillText, selectedSemester === sem && styles.pillTextActive]}>Sem {sem}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Section Cards */}
            {filtered.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <MaterialCommunityIcons name="layers-outline" size={48} color="#4b5563" />
                    <Text style={styles.emptyText}>No sections found</Text>
                </View>
            ) : (
                filtered.map((section) => {
                    const isExpanded = expandedId === section._id;
                    const fill = Math.round((section.students.length / section.maxStudents) * 100);
                    return (
                        <View key={section._id} style={styles.sectionCard}>
                            <TouchableOpacity
                                style={styles.sectionHeader}
                                onPress={() => setExpandedId(isExpanded ? null : section._id)}
                                activeOpacity={0.7}
                            >
                                <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.sectionAvatar}>
                                    <Text style={styles.sectionAvatarText}>{section.name}</Text>
                                </LinearGradient>
                                <View style={styles.sectionInfo}>
                                    <Text style={styles.sectionName}>
                                        {section.program} {section.branch ? `- ${section.branch}` : ''}
                                    </Text>
                                    <View style={styles.sectionBadges}>
                                        <View style={styles.semBadge}>
                                            <Text style={styles.semBadgeText}>Sem {section.semester}</Text>
                                        </View>
                                        <Text style={styles.sectionYear}>{section.academicYear}</Text>
                                    </View>
                                </View>
                                <View style={styles.sectionRight}>
                                    <View style={styles.countRow}>
                                        <Ionicons name="people" size={14} color="#6366f1" />
                                        <Text style={styles.countText}>{section.students.length}/{section.maxStudents}</Text>
                                    </View>
                                    <View style={styles.miniBar}>
                                        <View style={[styles.miniFill, { width: `${fill}%`, backgroundColor: fill > 90 ? '#ef4444' : fill > 70 ? '#f59e0b' : '#6366f1' }]} />
                                    </View>
                                    <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#6b7280" />
                                </View>
                            </TouchableOpacity>

                            {isExpanded && (
                                <View style={styles.expandedContent}>
                                    <Text style={styles.expandedTitle}>Students ({section.students.length})</Text>
                                    {section.students.length === 0 ? (
                                        <Text style={styles.emptyStudents}>No students enrolled yet</Text>
                                    ) : (
                                        section.students.map(student => (
                                            <View key={student._id} style={styles.studentRow}>
                                                <LinearGradient colors={['#10b981', '#0d9488']} style={styles.studentAvatar}>
                                                    <Text style={styles.studentAvatarText}>{student.name.charAt(0).toUpperCase()}</Text>
                                                </LinearGradient>
                                                <View style={styles.studentInfo}>
                                                    <Text style={styles.studentName}>{student.name}</Text>
                                                    <Text style={styles.studentEmail}>{student.profile?.studentId || student.email}</Text>
                                                </View>
                                            </View>
                                        ))
                                    )}
                                </View>
                            )}
                        </View>
                    );
                })
            )}

            <View style={{ height: 32 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f0f23' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0f23', padding: 24 },
    loadingText: { color: '#9ca3af', marginTop: 12, fontSize: 14 },
    errorText: { color: '#ef4444', marginTop: 12, fontSize: 15, fontWeight: '600', textAlign: 'center' },
    retryBtn: { marginTop: 16, backgroundColor: '#10b981', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
    retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

    headerCard: { margin: 16, borderRadius: 20, padding: 24 },
    headerLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' },
    headerTitle: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 4 },
    headerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 6 },

    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 16, gap: 8 },
    statCard: { flex: 1, backgroundColor: '#1a1a2e', borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    statIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
    statLabel: { color: '#9ca3af', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    statValue: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 2 },

    searchContainer: { flexDirection: 'row', alignItems: 'center', margin: 16, backgroundColor: '#1a1a2e', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    searchIcon: { paddingLeft: 14 },
    searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 10, color: '#fff', fontSize: 14 },

    pillsContainer: { marginBottom: 8 },
    pillsContent: { paddingHorizontal: 16, gap: 8 },
    pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    pillActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
    pillText: { color: '#9ca3af', fontSize: 12, fontWeight: '600' },
    pillTextActive: { color: '#fff' },

    emptyContainer: { alignItems: 'center', paddingVertical: 48 },
    emptyText: { color: '#6b7280', fontSize: 14, fontWeight: '600', marginTop: 12 },

    sectionCard: { backgroundColor: '#1a1a2e', borderRadius: 16, marginHorizontal: 16, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', padding: 14 },
    sectionAvatar: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    sectionAvatarText: { color: '#fff', fontSize: 16, fontWeight: '800' },
    sectionInfo: { flex: 1, marginLeft: 12 },
    sectionName: { color: '#e5e7eb', fontSize: 14, fontWeight: '700' },
    sectionBadges: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    semBadge: { backgroundColor: 'rgba(99,102,241,0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    semBadgeText: { color: '#818cf8', fontSize: 11, fontWeight: '700' },
    sectionYear: { color: '#6b7280', fontSize: 11 },
    sectionRight: { alignItems: 'flex-end', gap: 4 },
    countRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    countText: { color: '#818cf8', fontSize: 13, fontWeight: '700' },
    miniBar: { width: 48, height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' },
    miniFill: { height: '100%', borderRadius: 2 },

    expandedContent: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 14, paddingVertical: 12 },
    expandedTitle: { color: '#9ca3af', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
    emptyStudents: { color: '#6b7280', fontSize: 13, fontStyle: 'italic', textAlign: 'center', paddingVertical: 12 },
    studentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
    studentAvatar: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
    studentAvatarText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    studentInfo: { marginLeft: 10 },
    studentName: { color: '#e5e7eb', fontSize: 13, fontWeight: '600' },
    studentEmail: { color: '#6b7280', fontSize: 11, marginTop: 1 },
});
