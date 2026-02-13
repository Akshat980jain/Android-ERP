import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity,
} from 'react-native';
import { Card, Title, Chip, ActivityIndicator, Searchbar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import apiService from '../../services/api';

interface StudentItem {
    _id: string;
    name: string;
    email: string;
    program?: string;
    branch?: string;
    profile?: {
        studentId?: string;
        semester?: string;
        section?: string;
        phone?: string;
    };
    isVerified: boolean;
}

export default function StudentManagementScreen() {
    const { theme } = useTheme();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState<StudentItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => { loadStudents(); }, []);

    const loadStudents = async () => {
        setLoading(true);
        try {
            const res: any = await apiService.getAllUsers();
            const list = Array.isArray(res?.users) ? res.users :
                Array.isArray(res?.data) ? res.data :
                    Array.isArray(res) ? res : [];
            setStudents(list.filter((u: any) => u.role === 'student'));
        } catch (error) {
            console.error('Error loading students:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => { setRefreshing(true); await loadStudents(); setRefreshing(false); };

    const filteredStudents = students.filter(s =>
        !searchQuery ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.profile?.studentId?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.topBar, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
                <Text style={[styles.topBarTitle, { color: theme.colors.text }]}>Student Management</Text>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
                {[
                    { label: 'Total Students', value: students.length, color: '#3B82F6' },
                    { label: 'Verified', value: students.filter(s => s.isVerified).length, color: '#10B981' },
                    { label: 'Pending', value: students.filter(s => !s.isVerified).length, color: '#F59E0B' },
                ].map(s => (
                    <View key={s.label} style={[styles.statCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                        <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                        <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{s.label}</Text>
                    </View>
                ))}
            </View>

            {/* Search */}
            <View style={styles.searchRow}>
                <Searchbar
                    placeholder="Search by name, email, or ID..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    style={[styles.searchbar, { backgroundColor: theme.colors.card }]}
                    inputStyle={{ color: theme.colors.text }}
                    iconColor={theme.colors.textSecondary}
                    placeholderTextColor={theme.colors.textSecondary}
                />
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
            >
                {loading ? (
                    <View style={styles.centerBox}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading students...</Text>
                    </View>
                ) : filteredStudents.length === 0 ? (
                    <View style={styles.centerBox}>
                        <Ionicons name="school-outline" size={64} color={theme.colors.textSecondary} />
                        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No students found</Text>
                    </View>
                ) : (
                    <View style={{ paddingBottom: 40 }}>
                        {filteredStudents.map(student => (
                            <TouchableOpacity
                                key={student._id}
                                onPress={() => setExpandedId(expandedId === student._id ? null : student._id)}
                            >
                                <Card style={[styles.studentCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                                    <Card.Content>
                                        <View style={styles.studentHeader}>
                                            <View style={[styles.avatar, { backgroundColor: '#3B82F6' + '20' }]}>
                                                <Ionicons name="person" size={20} color="#3B82F6" />
                                            </View>
                                            <View style={{ flex: 1, marginLeft: 12 }}>
                                                <View style={styles.nameRow}>
                                                    <Text style={[styles.studentName, { color: theme.colors.text }]}>{student.name}</Text>
                                                    {student.isVerified && (
                                                        <Ionicons name="checkmark-circle" size={14} color="#10B981" style={{ marginLeft: 6 }} />
                                                    )}
                                                </View>
                                                <Text style={[styles.studentEmail, { color: theme.colors.textSecondary }]}>{student.email}</Text>
                                                {student.profile?.studentId && (
                                                    <Text style={[styles.studentId, { color: theme.colors.primary }]}>
                                                        ID: {student.profile.studentId}
                                                    </Text>
                                                )}
                                            </View>
                                            <Ionicons
                                                name={expandedId === student._id ? 'chevron-up' : 'chevron-down'}
                                                size={20}
                                                color={theme.colors.textSecondary}
                                            />
                                        </View>

                                        {/* Expanded Details */}
                                        {expandedId === student._id && (
                                            <View style={[styles.details, { borderTopColor: theme.colors.border }]}>
                                                {[
                                                    { label: 'Program', value: student.program || 'N/A' },
                                                    { label: 'Branch', value: student.branch || 'N/A' },
                                                    { label: 'Semester', value: student.profile?.semester || 'N/A' },
                                                    { label: 'Section', value: student.profile?.section || 'N/A' },
                                                    { label: 'Phone', value: student.profile?.phone || 'N/A' },
                                                ].map(d => (
                                                    <View key={d.label} style={styles.detailRow}>
                                                        <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>{d.label}</Text>
                                                        <Text style={[styles.detailValue, { color: theme.colors.text }]}>{d.value}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        )}
                                    </Card.Content>
                                </Card>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16, borderBottomWidth: 1 },
    topBarTitle: { fontSize: 20, fontWeight: '600' },
    statsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, gap: 10 },
    statCard: { flex: 1, borderRadius: 10, borderWidth: 1, padding: 12, alignItems: 'center' },
    statValue: { fontSize: 22, fontWeight: '700' },
    statLabel: { fontSize: 10, marginTop: 4 },
    searchRow: { paddingHorizontal: 16, paddingTop: 12 },
    searchbar: { borderRadius: 12, elevation: 1 },
    content: { flex: 1, padding: 16 },
    centerBox: { alignItems: 'center', paddingVertical: 60 },
    loadingText: { marginTop: 16, fontSize: 14 },
    emptyTitle: { marginTop: 16, fontSize: 18, fontWeight: '600' },
    studentCard: { marginBottom: 10, borderRadius: 12, borderWidth: 1 },
    studentHeader: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    nameRow: { flexDirection: 'row', alignItems: 'center' },
    studentName: { fontSize: 15, fontWeight: '600' },
    studentEmail: { fontSize: 12, marginTop: 2 },
    studentId: { fontSize: 11, marginTop: 4, fontWeight: '600' },
    details: { marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
    detailLabel: { fontSize: 12 },
    detailValue: { fontSize: 12, fontWeight: '600' },
});
