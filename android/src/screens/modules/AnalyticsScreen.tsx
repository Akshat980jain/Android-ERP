import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions,
} from 'react-native';
import { Card, Title, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface StatItem {
    label: string;
    value: string;
    icon: string;
    color: string;
    trend?: string;
}

export default function AnalyticsScreen() {
    const { theme } = useTheme();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(false);

    const stats: StatItem[] = [
        { label: 'Total Students', value: '2,456', icon: 'people', color: '#3B82F6', trend: '+12%' },
        { label: 'Total Faculty', value: '128', icon: 'school', color: '#10B981', trend: '+3%' },
        { label: 'Avg Attendance', value: '87%', icon: 'checkmark-circle', color: '#F59E0B', trend: '+2%' },
        { label: 'Pass Rate', value: '92%', icon: 'trophy', color: '#8B5CF6', trend: '+5%' },
        { label: 'Fee Collection', value: '₹2.4Cr', icon: 'card', color: '#EF4444', trend: '+18%' },
        { label: 'Active Courses', value: '64', icon: 'book', color: '#06B6D4', trend: '0%' },
    ];

    const departmentData = [
        { dept: 'Computer Science', students: 520, attendance: 91, pass: 95 },
        { dept: 'Electronics', students: 380, attendance: 85, pass: 90 },
        { dept: 'Mechanical', students: 340, attendance: 83, pass: 88 },
        { dept: 'Civil', students: 280, attendance: 87, pass: 91 },
        { dept: 'Electrical', students: 256, attendance: 84, pass: 89 },
    ];

    const onRefresh = async () => {
        setRefreshing(true);
        // TODO: Fetch analytics data from API
        setRefreshing(false);
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.topBar, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
                <Text style={[styles.topBarTitle, { color: theme.colors.text }]}>Analytics</Text>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
            >
                {/* Key Metrics */}
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Key Metrics</Text>
                <View style={styles.statsGrid}>
                    {stats.map(s => (
                        <View key={s.label} style={[styles.statCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                            <View style={[styles.statIcon, { backgroundColor: s.color + '20' }]}>
                                <Ionicons name={s.icon as any} size={20} color={s.color} />
                            </View>
                            <Text style={[styles.statValue, { color: theme.colors.text }]}>{s.value}</Text>
                            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{s.label}</Text>
                            {s.trend && (
                                <Text style={[styles.trend, { color: s.trend.startsWith('+') ? '#10B981' : '#EF4444' }]}>
                                    {s.trend.startsWith('+') ? '↑' : '↓'} {s.trend}
                                </Text>
                            )}
                        </View>
                    ))}
                </View>

                {/* Department Breakdown */}
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Department Breakdown</Text>
                {departmentData.map(dept => (
                    <Card key={dept.dept} style={[styles.deptCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                        <Card.Content>
                            <View style={styles.deptHeader}>
                                <Title style={[styles.deptName, { color: theme.colors.text }]}>{dept.dept}</Title>
                                <Text style={[styles.deptStudents, { color: theme.colors.textSecondary }]}>
                                    {dept.students} students
                                </Text>
                            </View>
                            <View style={styles.deptStats}>
                                <View style={styles.deptStat}>
                                    <Text style={[styles.deptStatValue, { color: '#F59E0B' }]}>{dept.attendance}%</Text>
                                    <Text style={[styles.deptStatLabel, { color: theme.colors.textSecondary }]}>Attendance</Text>
                                </View>
                                <View style={styles.deptStat}>
                                    <Text style={[styles.deptStatValue, { color: '#10B981' }]}>{dept.pass}%</Text>
                                    <Text style={[styles.deptStatLabel, { color: theme.colors.textSecondary }]}>Pass Rate</Text>
                                </View>
                                {/* Simple bar */}
                                <View style={styles.barContainer}>
                                    <View style={[styles.bar, { width: `${dept.attendance}%`, backgroundColor: '#3B82F6' }]} />
                                </View>
                            </View>
                        </Card.Content>
                    </Card>
                ))}

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
    sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
    statCard: { width: '47%', borderRadius: 12, borderWidth: 1, padding: 14, alignItems: 'center' },
    statIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    statValue: { fontSize: 22, fontWeight: '700' },
    statLabel: { fontSize: 11, marginTop: 4 },
    trend: { fontSize: 11, fontWeight: '600', marginTop: 4 },
    deptCard: { marginBottom: 12, borderRadius: 12, borderWidth: 1 },
    deptHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    deptName: { fontSize: 15, fontWeight: '600' },
    deptStudents: { fontSize: 12 },
    deptStats: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 16 },
    deptStat: { alignItems: 'center' },
    deptStatValue: { fontSize: 16, fontWeight: '700' },
    deptStatLabel: { fontSize: 10, marginTop: 2 },
    barContainer: { flex: 1, height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
    bar: { height: '100%', borderRadius: 4 },
});
