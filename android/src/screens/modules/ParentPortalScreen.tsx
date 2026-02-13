import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, RefreshControl,
} from 'react-native';
import { Card, Title, Chip, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface ChildInfo {
    id: string;
    name: string;
    role: string;
    program?: string;
    branch?: string;
    attendance?: number;
    cgpa?: number;
    feesPaid?: boolean;
}

export default function ParentPortalScreen() {
    const { user } = useAuth();
    const { theme } = useTheme();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [children] = useState<ChildInfo[]>([]);

    const onRefresh = async () => {
        setRefreshing(true);
        // TODO: Fetch linked children from API
        setRefreshing(false);
    };

    const statCards = [
        { label: 'Children Linked', value: children.length, icon: 'people-outline', color: '#3B82F6' },
        { label: 'Avg Attendance', value: children.length > 0 ? `${Math.round(children.reduce((a, c) => a + (c.attendance || 0), 0) / children.length)}%` : 'N/A', icon: 'checkmark-circle-outline', color: '#10B981' },
        { label: 'Fee Status', value: children.every(c => c.feesPaid) ? 'Paid' : 'Pending', icon: 'card-outline', color: '#F59E0B' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.topBar, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
                <Text style={[styles.topBarTitle, { color: theme.colors.text }]}>Parent Portal</Text>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
            >
                {/* Stats */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                    {statCards.map(s => (
                        <View key={s.label} style={[styles.statCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                            <Ionicons name={s.icon as any} size={24} color={s.color} />
                            <Text style={[styles.statValue, { color: theme.colors.text }]}>{s.value}</Text>
                            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{s.label}</Text>
                        </View>
                    ))}
                </ScrollView>

                {/* Children List */}
                {children.length === 0 ? (
                    <View style={styles.emptyBox}>
                        <Ionicons name="people-outline" size={64} color={theme.colors.textSecondary} />
                        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No Children Linked</Text>
                        <Text style={[styles.emptySub, { color: theme.colors.textSecondary }]}>
                            Contact the administration to link your children's accounts.
                        </Text>
                    </View>
                ) : (
                    children.map(child => (
                        <Card key={child.id} style={[styles.childCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                            <Card.Content>
                                <View style={styles.childHeader}>
                                    <View style={[styles.avatar, { backgroundColor: '#3B82F6' + '20' }]}>
                                        <Ionicons name="person" size={24} color="#3B82F6" />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Title style={[styles.childName, { color: theme.colors.text }]}>{child.name}</Title>
                                        <Text style={[styles.childProgram, { color: theme.colors.textSecondary }]}>
                                            {child.program || 'N/A'} {child.branch ? `- ${child.branch}` : ''}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.childStats}>
                                    <View style={styles.childStat}>
                                        <Text style={[styles.childStatValue, { color: theme.colors.text }]}>{child.attendance || 0}%</Text>
                                        <Text style={[styles.childStatLabel, { color: theme.colors.textSecondary }]}>Attendance</Text>
                                    </View>
                                    <View style={styles.childStat}>
                                        <Text style={[styles.childStatValue, { color: theme.colors.text }]}>{child.cgpa || 'N/A'}</Text>
                                        <Text style={[styles.childStatLabel, { color: theme.colors.textSecondary }]}>CGPA</Text>
                                    </View>
                                    <View style={styles.childStat}>
                                        <Chip style={{ backgroundColor: child.feesPaid ? '#10B981' + '20' : '#EF4444' + '20' }}
                                            textStyle={{ color: child.feesPaid ? '#10B981' : '#EF4444', fontSize: 10, fontWeight: '700' }}>
                                            {child.feesPaid ? 'Paid' : 'Pending'}
                                        </Chip>
                                    </View>
                                </View>
                            </Card.Content>
                        </Card>
                    ))
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16, borderBottomWidth: 1 },
    topBarTitle: { fontSize: 20, fontWeight: '600' },
    content: { flex: 1, padding: 16 },
    statCard: { width: 140, marginRight: 12, borderRadius: 12, borderWidth: 1, padding: 16, alignItems: 'center' },
    statValue: { fontSize: 24, fontWeight: '700', marginTop: 8 },
    statLabel: { fontSize: 11, marginTop: 4 },
    emptyBox: { alignItems: 'center', paddingVertical: 60 },
    emptyTitle: { marginTop: 16, fontSize: 18, fontWeight: '600' },
    emptySub: { marginTop: 8, fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
    childCard: { marginBottom: 14, borderRadius: 12, borderWidth: 1 },
    childHeader: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    childName: { fontSize: 16, fontWeight: '600' },
    childProgram: { fontSize: 12, marginTop: 2 },
    childStats: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
    childStat: { alignItems: 'center' },
    childStatValue: { fontSize: 18, fontWeight: '700' },
    childStatLabel: { fontSize: 11, marginTop: 2 },
});
