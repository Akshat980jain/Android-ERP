import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
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

interface Room {
    number: string;
    capacity: number;
    occupants: string[];
}

interface HostelItem {
    _id: string;
    name: string;
    block: string;
    gender: string;
    rooms: Room[];
}

export default function HostelScreen() {
    const { user } = useAuth();
    const { theme } = useTheme();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [hostels, setHostels] = useState<HostelItem[]>([]);

    useEffect(() => { loadHostels(); }, []);

    const loadHostels = async () => {
        setLoading(true);
        try {
            const res: any = await apiService.getHostels();
            if (res && res.success !== false) {
                const list = Array.isArray(res.hostels) ? res.hostels :
                    Array.isArray(res.data) ? res.data :
                        Array.isArray(res) ? res : [];
                setHostels(list);
            }
        } catch (error) {
            console.error('Error loading hostels:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => { setRefreshing(true); await loadHostels(); setRefreshing(false); };

    const getGenderIcon = (gender: string): keyof typeof Ionicons.glyphMap => {
        switch (gender) {
            case 'male': return 'male-outline';
            case 'female': return 'female-outline';
            default: return 'people-outline';
        }
    };

    const getGenderColor = (gender: string) => {
        switch (gender) {
            case 'male': return '#3B82F6';
            case 'female': return '#EC4899';
            default: return '#8B5CF6';
        }
    };

    const getOccupancy = (rooms: Room[]) => {
        const total = rooms.reduce((sum, r) => sum + r.capacity, 0);
        const occupied = rooms.reduce((sum, r) => sum + r.occupants.length, 0);
        return { total, occupied, available: total - occupied };
    };

    const renderHostelCard = (hostel: HostelItem) => {
        const occ = getOccupancy(hostel.rooms);
        const occupancyPct = occ.total > 0 ? Math.round((occ.occupied / occ.total) * 100) : 0;
        const genderColor = getGenderColor(hostel.gender);

        return (
            <Card key={hostel._id} style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <Card.Content>
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconBox, { backgroundColor: genderColor + '20' }]}>
                            <Ionicons name={getGenderIcon(hostel.gender)} size={24} color={genderColor} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 14 }}>
                            <Title style={[styles.hostelName, { color: theme.colors.text }]}>{hostel.name}</Title>
                            <Text style={[styles.block, { color: theme.colors.textSecondary }]}>Block {hostel.block}</Text>
                        </View>
                        <Chip style={{ backgroundColor: genderColor + '20' }}
                            textStyle={{ color: genderColor, fontSize: 11, fontWeight: '600', textTransform: 'capitalize' }}>
                            {hostel.gender}
                        </Chip>
                    </View>

                    {/* Occupancy bar */}
                    <View style={styles.occupancySection}>
                        <View style={styles.occupancyHeader}>
                            <Text style={[styles.occupancyLabel, { color: theme.colors.textSecondary }]}>Occupancy</Text>
                            <Text style={[styles.occupancyPct, { color: occupancyPct > 90 ? '#EF4444' : occupancyPct > 70 ? '#F59E0B' : '#10B981' }]}>
                                {occupancyPct}%
                            </Text>
                        </View>
                        <View style={[styles.barBg, { backgroundColor: theme.colors.surface }]}>
                            <View style={[styles.barFill, {
                                width: `${occupancyPct}%`,
                                backgroundColor: occupancyPct > 90 ? '#EF4444' : occupancyPct > 70 ? '#F59E0B' : '#10B981'
                            }]} />
                        </View>
                    </View>

                    {/* Stats */}
                    <View style={styles.statsRow}>
                        <View style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
                            <Ionicons name="bed-outline" size={18} color={theme.colors.primary} />
                            <Text style={[styles.statValue, { color: theme.colors.text }]}>{hostel.rooms.length}</Text>
                            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Rooms</Text>
                        </View>
                        <View style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
                            <Ionicons name="people-outline" size={18} color="#3B82F6" />
                            <Text style={[styles.statValue, { color: theme.colors.text }]}>{occ.occupied}</Text>
                            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Occupied</Text>
                        </View>
                        <View style={[styles.statBox, { backgroundColor: '#10B981' + '10' }]}>
                            <Ionicons name="checkmark-circle-outline" size={18} color="#10B981" />
                            <Text style={[styles.statValue, { color: '#10B981' }]}>{occ.available}</Text>
                            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Available</Text>
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
                <Text style={[styles.topBarTitle, { color: theme.colors.text }]}>Hostel</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}>
                {loading ? (
                    <View style={styles.centerBox}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={[styles.loadText, { color: theme.colors.textSecondary }]}>Loading hostels...</Text>
                    </View>
                ) : hostels.length === 0 ? (
                    <View style={styles.centerBox}>
                        <Ionicons name="home-outline" size={64} color={theme.colors.textSecondary} />
                        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No hostels available</Text>
                        <Text style={[styles.emptySub, { color: theme.colors.textSecondary }]}>Hostel information will appear here</Text>
                    </View>
                ) : (
                    <View style={{ paddingBottom: 20 }}>
                        {hostels.map(h => renderHostelCard(h))}
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
    content: { flex: 1, padding: 16 },
    card: { marginBottom: 16, borderRadius: 12, borderWidth: 1, elevation: 2 },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    hostelName: { fontSize: 16, fontWeight: '600' },
    block: { fontSize: 13, marginTop: 2 },
    occupancySection: { marginTop: 16 },
    occupancyHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    occupancyLabel: { fontSize: 12 },
    occupancyPct: { fontSize: 14, fontWeight: '700' },
    barBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: 4 },
    statsRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
    statBox: { flex: 1, padding: 10, borderRadius: 10, alignItems: 'center' },
    statValue: { fontSize: 18, fontWeight: 'bold', marginTop: 4 },
    statLabel: { fontSize: 10, marginTop: 2 },
    centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
    loadText: { marginTop: 16, fontSize: 14 },
    emptyTitle: { marginTop: 16, fontSize: 18, fontWeight: '600' },
    emptySub: { marginTop: 8, fontSize: 14, textAlign: 'center' },
});
