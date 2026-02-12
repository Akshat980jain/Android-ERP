import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    TextInput,
    Modal,
    Platform,
} from 'react-native';
import {
    Card,
    Title,
    Chip,
    ActivityIndicator,
    Button,
    FAB,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import apiService from '../../services/api';

interface LeaveItem {
    _id: string;
    type: string;
    reason: string;
    startDate: string;
    endDate: string;
    status: string;
    student?: { name?: string; profile?: { studentId?: string } };
    createdAt: string;
}

const LEAVE_TYPES = [
    { id: 'casual', label: 'Casual Leave', icon: 'sunny-outline', color: '#F59E0B' },
    { id: 'medical', label: 'Medical Leave', icon: 'medkit-outline', color: '#EF4444' },
    { id: 'duty', label: 'Duty Leave', icon: 'briefcase-outline', color: '#3B82F6' },
] as const;

export default function LeavesScreen() {
    const { user } = useAuth();
    const { theme } = useTheme();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [leaves, setLeaves] = useState<LeaveItem[]>([]);
    const [showApply, setShowApply] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState('all');

    // Apply form state
    const [leaveType, setLeaveType] = useState('casual');
    const [reason, setReason] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');

    const isStudent = (user as any)?.role === 'student';

    useEffect(() => { loadLeaves(); }, []);

    const loadLeaves = async () => {
        setLoading(true);
        try {
            const res: any = await apiService.getLeaves();
            if (res && res.success !== false) {
                const list = Array.isArray(res.leaves) ? res.leaves :
                    Array.isArray(res.data) ? res.data :
                        Array.isArray(res) ? res : [];
                setLeaves(list);
            }
        } catch (error) {
            console.error('Error loading leaves:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => { setRefreshing(true); await loadLeaves(); setRefreshing(false); };

    const handleApply = async () => {
        setFormError('');
        if (!startDate || !endDate) { setFormError('Start and end dates are required (YYYY-MM-DD)'); return; }
        if (!reason.trim()) { setFormError('Reason is required'); return; }

        // Basic date validation
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) { setFormError('Invalid date format. Use YYYY-MM-DD'); return; }
        if (end < start) { setFormError('End date must be after start date'); return; }

        setSubmitting(true);
        try {
            const res: any = await apiService.applyLeave({
                type: leaveType,
                reason: reason.trim(),
                startDate,
                endDate,
            });
            if (res && res.success !== false) {
                setShowApply(false);
                setReason('');
                setStartDate('');
                setEndDate('');
                setFormError('');
                await loadLeaves();
            } else {
                setFormError(res?.message || res?.error || 'Failed to apply');
            }
        } catch (error) {
            setFormError('Network error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDecision = async (leaveId: string, status: 'approved' | 'rejected') => {
        try {
            await apiService.processLeave(leaveId, status);
            await loadLeaves();
        } catch (error) {
            console.error('Error processing leave:', error);
        }
    };

    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return '#10B981';
            case 'rejected': return '#EF4444';
            default: return '#F59E0B';
        }
    };

    const getTypeInfo = (type: string) => LEAVE_TYPES.find(t => t.id === type) || LEAVE_TYPES[0];

    const filterOptions = [
        { id: 'all', label: 'All' },
        { id: 'pending', label: 'Pending' },
        { id: 'approved', label: 'Approved' },
        { id: 'rejected', label: 'Rejected' },
    ];

    const filteredLeaves = selectedFilter === 'all'
        ? leaves
        : leaves.filter(l => l.status === selectedFilter);

    const getDuration = (start: string, end: string) => {
        const days = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1;
        return `${days} day${days !== 1 ? 's' : ''}`;
    };

    const renderLeaveCard = (leave: LeaveItem) => {
        const typeInfo = getTypeInfo(leave.type);
        const statusColor = getStatusColor(leave.status);

        return (
            <Card key={leave._id} style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <Card.Content>
                    <View style={styles.cardHeader}>
                        <View style={[styles.typeIcon, { backgroundColor: typeInfo.color + '20' }]}>
                            <Ionicons name={typeInfo.icon as any} size={20} color={typeInfo.color} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Title style={[styles.leaveTitle, { color: theme.colors.text }]}>{typeInfo.label}</Title>
                            {!isStudent && leave.student && (
                                <Text style={[styles.studentName, { color: theme.colors.textSecondary }]}>
                                    {leave.student.name || leave.student.profile?.studentId || 'Student'}
                                </Text>
                            )}
                        </View>
                        <Chip style={{ backgroundColor: statusColor + '20' }}
                            textStyle={{ color: statusColor, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>
                            {leave.status}
                        </Chip>
                    </View>

                    {leave.reason ? (
                        <Text style={[styles.reason, { color: theme.colors.text }]} numberOfLines={2}>{leave.reason}</Text>
                    ) : null}

                    <View style={[styles.dateRow, { borderTopColor: theme.colors.border }]}>
                        <View style={styles.dateItem}>
                            <Ionicons name="calendar-outline" size={14} color={theme.colors.textSecondary} />
                            <Text style={[styles.dateText, { color: theme.colors.text }]}>
                                {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
                            </Text>
                        </View>
                        <Chip style={{ backgroundColor: theme.colors.surface }}
                            textStyle={{ color: theme.colors.primary, fontSize: 11, fontWeight: '600' }}>
                            {getDuration(leave.startDate, leave.endDate)}
                        </Chip>
                    </View>

                    {/* Approve/Reject buttons for faculty/admin */}
                    {!isStudent && leave.status === 'pending' && (
                        <View style={styles.actionRow}>
                            <Button mode="contained" onPress={() => handleDecision(leave._id, 'approved')}
                                style={[styles.actionBtn, { backgroundColor: '#10B981' }]} labelStyle={{ fontSize: 13 }}>
                                Approve
                            </Button>
                            <Button mode="contained" onPress={() => handleDecision(leave._id, 'rejected')}
                                style={[styles.actionBtn, { backgroundColor: '#EF4444' }]} labelStyle={{ fontSize: 13 }}>
                                Reject
                            </Button>
                        </View>
                    )}
                </Card.Content>
            </Card>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.topBar, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
                <View style={{ width: 28 }} />
                <Text style={[styles.topBarTitle, { color: theme.colors.text }]}>Leaves</Text>
                <View style={{ width: 28 }} />
            </View>

            {/* Filters */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ paddingHorizontal: 16 }}>
                {filterOptions.map(f => (
                    <TouchableOpacity key={f.id} onPress={() => setSelectedFilter(f.id)}>
                        <Chip selected={selectedFilter === f.id}
                            style={[styles.filterChip, { backgroundColor: selectedFilter === f.id ? theme.colors.primary : theme.colors.surface }]}
                            textStyle={{ color: selectedFilter === f.id ? '#FFF' : theme.colors.text, fontWeight: selectedFilter === f.id ? '600' : '400' }}>
                            {f.label}
                        </Chip>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}>
                {loading ? (
                    <View style={styles.centerBox}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={[styles.loadText, { color: theme.colors.textSecondary }]}>Loading leaves...</Text>
                    </View>
                ) : filteredLeaves.length === 0 ? (
                    <View style={styles.centerBox}>
                        <Ionicons name="document-text-outline" size={64} color={theme.colors.textSecondary} />
                        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No leave records</Text>
                        <Text style={[styles.emptySub, { color: theme.colors.textSecondary }]}>
                            {selectedFilter === 'all' ? 'Apply for a leave to get started' : `No ${selectedFilter} leaves`}
                        </Text>
                    </View>
                ) : (
                    <View style={{ paddingBottom: 80 }}>
                        {filteredLeaves.map(l => renderLeaveCard(l))}
                    </View>
                )}
            </ScrollView>

            {/* FAB for students to apply */}
            {isStudent && (
                <FAB icon="plus" style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                    color="#FFF" onPress={() => setShowApply(true)} />
            )}

            {/* Apply leave modal */}
            <Modal visible={showApply} transparent animationType="slide" onRequestClose={() => setShowApply(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
                        <View style={styles.modalHeader}>
                            <Title style={[{ color: theme.colors.text }]}>Apply for Leave</Title>
                            <TouchableOpacity onPress={() => setShowApply(false)}>
                                <Ionicons name="close" size={24} color={theme.colors.text} />
                            </TouchableOpacity>
                        </View>

                        {/* Leave type selector */}
                        <Text style={[styles.formLabel, { color: theme.colors.textSecondary }]}>Leave Type</Text>
                        <View style={styles.typeSelector}>
                            {LEAVE_TYPES.map(t => (
                                <TouchableOpacity key={t.id} onPress={() => setLeaveType(t.id)}
                                    style={[styles.typeOption, { backgroundColor: leaveType === t.id ? t.color + '20' : theme.colors.surface, borderColor: leaveType === t.id ? t.color : 'transparent', borderWidth: 1 }]}>
                                    <Ionicons name={t.icon as any} size={18} color={leaveType === t.id ? t.color : theme.colors.textSecondary} />
                                    <Text style={[styles.typeOptionText, { color: leaveType === t.id ? t.color : theme.colors.text }]}>{t.label.replace(' Leave', '')}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={[styles.formLabel, { color: theme.colors.textSecondary }]}>Start Date (YYYY-MM-DD)</Text>
                        <TextInput
                            style={[styles.input, { color: theme.colors.text, backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                            value={startDate} onChangeText={setStartDate} placeholder="2024-03-15" placeholderTextColor={theme.colors.textSecondary}
                        />

                        <Text style={[styles.formLabel, { color: theme.colors.textSecondary }]}>End Date (YYYY-MM-DD)</Text>
                        <TextInput
                            style={[styles.input, { color: theme.colors.text, backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                            value={endDate} onChangeText={setEndDate} placeholder="2024-03-17" placeholderTextColor={theme.colors.textSecondary}
                        />

                        <Text style={[styles.formLabel, { color: theme.colors.textSecondary }]}>Reason</Text>
                        <TextInput
                            style={[styles.input, styles.textArea, { color: theme.colors.text, backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                            value={reason} onChangeText={setReason} placeholder="Reason for leave..." placeholderTextColor={theme.colors.textSecondary}
                            multiline numberOfLines={3}
                        />

                        {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

                        <Button mode="contained" onPress={handleApply} loading={submitting} disabled={submitting}
                            style={[styles.submitBtn, { backgroundColor: theme.colors.primary }]}>
                            Submit Application
                        </Button>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16, borderBottomWidth: 1 },
    topBarTitle: { fontSize: 20, fontWeight: '600' },
    filterRow: { maxHeight: 52 },
    filterChip: { marginRight: 8, marginVertical: 8 },
    content: { flex: 1, padding: 16 },
    card: { marginBottom: 14, borderRadius: 12, borderWidth: 1, elevation: 2 },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    typeIcon: { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    leaveTitle: { fontSize: 15, fontWeight: '600' },
    studentName: { fontSize: 12, marginTop: 2 },
    reason: { fontSize: 13, marginTop: 10, lineHeight: 20 },
    dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, paddingTop: 10, marginTop: 10 },
    dateItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dateText: { fontSize: 12 },
    actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
    actionBtn: { flex: 1 },
    fab: { position: 'absolute', bottom: 24, right: 24, borderRadius: 28 },
    centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
    loadText: { marginTop: 16, fontSize: 14 },
    emptyTitle: { marginTop: 16, fontSize: 18, fontWeight: '600' },
    emptySub: { marginTop: 8, fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
    // Modal styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '85%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    formLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
    typeSelector: { flexDirection: 'row', gap: 8 },
    typeOption: { flex: 1, padding: 10, borderRadius: 10, alignItems: 'center', gap: 4 },
    typeOptionText: { fontSize: 12, fontWeight: '600' },
    input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14 },
    textArea: { minHeight: 80, textAlignVertical: 'top' },
    errorText: { color: '#EF4444', fontSize: 13, marginTop: 8 },
    submitBtn: { marginTop: 20 },
});
