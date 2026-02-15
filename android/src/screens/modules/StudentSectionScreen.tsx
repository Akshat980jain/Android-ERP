import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, ActivityIndicator,
    TouchableOpacity, RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';

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

export default function StudentSectionScreen() {
    const { user } = useAuth();
    const [section, setSection] = useState<Section | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSection = async () => {
        try {
            setError(null);
            const res: any = await apiService.getMySection();
            if (res.success) {
                setSection(res.section || null);
            } else {
                setError(res.message || 'Failed to load section');
            }
        } catch (e: any) {
            setError(e.message || 'Failed to load');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchSection(); }, []);

    const onRefresh = () => { setRefreshing(true); fetchSection(); };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#6366f1" />
                <Text style={styles.loadingText}>Loading your section...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.center}>
                <Ionicons name="alert-circle" size={48} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={fetchSection}>
                    <Text style={styles.retryBtnText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!section) {
        return (
            <View style={styles.center}>
                <MaterialCommunityIcons name="layers-outline" size={64} color="#6b7280" />
                <Text style={styles.emptyTitle}>No Section Assigned</Text>
                <Text style={styles.emptySubtitle}>Contact your admin for section allocation.</Text>
            </View>
        );
    }

    const fill = Math.round((section.students.length / section.maxStudents) * 100);

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
        >
            {/* Header Card */}
            <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.headerCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={styles.headerLabel}>Your Section</Text>
                <Text style={styles.headerTitle}>Section {section.name}</Text>
                <Text style={styles.headerSub}>
                    {section.program} {section.branch ? `• ${section.branch}` : ''} • Sem {section.semester} • {section.academicYear}
                </Text>
            </LinearGradient>

            {/* Stats Row */}
            <View style={styles.statsRow}>
                {[
                    { label: 'Classmates', value: section.students.length, icon: 'people', color: '#3b82f6' },
                    { label: 'Capacity', value: `${section.students.length}/${section.maxStudents}`, icon: 'book', color: '#10b981' },
                    { label: 'Semester', value: section.semester, icon: 'school', color: '#8b5cf6' },
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

            {/* Capacity Bar */}
            <View style={styles.card}>
                <View style={styles.capacityHeader}>
                    <Text style={styles.cardTitle}>Section Capacity</Text>
                    <Text style={[styles.capacityPercent, { color: fill > 90 ? '#ef4444' : fill > 70 ? '#f59e0b' : '#6366f1' }]}>{fill}%</Text>
                </View>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${fill}%`, backgroundColor: fill > 90 ? '#ef4444' : fill > 70 ? '#f59e0b' : '#6366f1' }]} />
                </View>
            </View>

            {/* Classmates */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Classmates ({section.students.length})</Text>
                {section.students.map((student) => (
                    <View key={student._id} style={[styles.studentRow, student._id === (user as any)?._id && styles.currentUser]}>
                        <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.avatar}>
                            <Text style={styles.avatarText}>{student.name.charAt(0).toUpperCase()}</Text>
                        </LinearGradient>
                        <View style={styles.studentInfo}>
                            <Text style={styles.studentName}>
                                {student.name} {student._id === (user as any)?._id ? '(You)' : ''}
                            </Text>
                            <Text style={styles.studentEmail}>{student.email}</Text>
                        </View>
                        {student.profile?.studentId && (
                            <View style={styles.idBadge}>
                                <Text style={styles.idBadgeText}>{student.profile.studentId}</Text>
                            </View>
                        )}
                    </View>
                ))}
                {section.students.length === 0 && (
                    <Text style={styles.emptySubtitle}>No classmates yet</Text>
                )}
            </View>

            <View style={{ height: 32 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f0f23' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0f23', padding: 24 },
    loadingText: { color: '#9ca3af', marginTop: 12, fontSize: 14 },
    errorText: { color: '#ef4444', marginTop: 12, fontSize: 15, fontWeight: '600', textAlign: 'center' },
    retryBtn: { marginTop: 16, backgroundColor: '#6366f1', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
    retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    emptyTitle: { color: '#d1d5db', fontSize: 18, fontWeight: '700', marginTop: 16 },
    emptySubtitle: { color: '#6b7280', fontSize: 13, marginTop: 6, textAlign: 'center' },

    headerCard: { margin: 16, borderRadius: 20, padding: 24 },
    headerLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' },
    headerTitle: { color: '#fff', fontSize: 28, fontWeight: '800', marginTop: 4 },
    headerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 8 },

    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 16, gap: 8 },
    statCard: { flex: 1, backgroundColor: '#1a1a2e', borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    statIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    statLabel: { color: '#9ca3af', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    statValue: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 2 },

    card: { backgroundColor: '#1a1a2e', borderRadius: 16, padding: 16, margin: 16, marginBottom: 0, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    cardTitle: { color: '#e5e7eb', fontSize: 15, fontWeight: '700', marginBottom: 12 },

    capacityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    capacityPercent: { fontSize: 14, fontWeight: '800' },
    progressBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 4 },

    studentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
    currentUser: { backgroundColor: 'rgba(99,102,241,0.08)', marginHorizontal: -12, paddingHorizontal: 12, borderRadius: 10 },
    avatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    studentInfo: { flex: 1, marginLeft: 12 },
    studentName: { color: '#e5e7eb', fontSize: 14, fontWeight: '600' },
    studentEmail: { color: '#6b7280', fontSize: 12, marginTop: 1 },
    idBadge: { backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    idBadgeText: { color: '#9ca3af', fontSize: 11, fontFamily: 'monospace', fontWeight: '600' },
});
