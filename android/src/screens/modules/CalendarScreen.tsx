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

interface ScheduleItem {
    _id?: string;
    courseId?: any;
    course?: string;
    day: string;
    dayOfWeek?: string;
    startTime: string;
    endTime: string;
    room?: string;
    type?: string;
}

interface EventItem {
    _id: string;
    title: string;
    description?: string;
    date: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    type?: string;
    category?: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function CalendarScreen() {
    const { user } = useAuth();
    const { theme } = useTheme();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
    const [events, setEvents] = useState<EventItem[]>([]);
    const [activeTab, setActiveTab] = useState<'schedule' | 'events'>('schedule');
    const [selectedDay, setSelectedDay] = useState(() => DAYS[Math.min(new Date().getDay() - 1, 4)]);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [schedRes, evtRes]: any[] = await Promise.all([
                apiService.getStudentSchedule(),
                apiService.getEvents(),
            ]);

            if (schedRes && schedRes.success !== false) {
                const list = Array.isArray(schedRes.schedule) ? schedRes.schedule :
                    Array.isArray(schedRes.data) ? schedRes.data :
                        Array.isArray(schedRes) ? schedRes : [];
                setSchedule(list);
            }

            if (evtRes && evtRes.success !== false) {
                const list = Array.isArray(evtRes.events) ? evtRes.events :
                    Array.isArray(evtRes.data) ? evtRes.data :
                        Array.isArray(evtRes) ? evtRes : [];
                setEvents(list);
            }
        } catch (error) {
            console.error('Error loading calendar:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    const daySchedule = schedule.filter(s => {
        const day = s.dayOfWeek || s.day;
        return day?.toLowerCase() === selectedDay.toLowerCase();
    }).sort((a, b) => a.startTime.localeCompare(b.startTime));

    const getTypeIcon = (type?: string): keyof typeof Ionicons.glyphMap => {
        switch (type?.toLowerCase()) {
            case 'lab': return 'flask-outline';
            case 'tutorial': return 'people-outline';
            case 'seminar': return 'megaphone-outline';
            default: return 'book-outline';
        }
    };

    const getTypeColor = (type?: string) => {
        switch (type?.toLowerCase()) {
            case 'lab': return '#8B5CF6';
            case 'tutorial': return '#F59E0B';
            case 'seminar': return '#EF4444';
            default: return theme.colors.primary;
        }
    };

    const getCourseName = (item: ScheduleItem) => {
        if (item.courseId && typeof item.courseId === 'object' && item.courseId.name) return item.courseId.name;
        return item.course || 'Unknown Course';
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.topBar, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
                <View style={{ width: 28 }} />
                <Text style={[styles.topBarTitle, { color: theme.colors.text }]}>Calendar</Text>
                <View style={{ width: 28 }} />
            </View>

            <View style={[styles.tabBar, { borderBottomColor: theme.colors.border }]}>
                {(['schedule', 'events'] as const).map(tab => (
                    <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)}
                        style={[styles.tab, activeTab === tab && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }]}>
                        <Text style={[styles.tabText, { color: activeTab === tab ? theme.colors.primary : theme.colors.textSecondary }]}>
                            {tab === 'schedule' ? 'Schedule' : 'Events'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {activeTab === 'schedule' && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayBar} contentContainerStyle={{ paddingHorizontal: 12 }}>
                    {DAYS.map(d => (
                        <TouchableOpacity key={d} onPress={() => setSelectedDay(d)}
                            style={[styles.dayChip, { backgroundColor: selectedDay === d ? theme.colors.primary : theme.colors.surface }]}>
                            <Text style={[styles.dayText, { color: selectedDay === d ? '#FFF' : theme.colors.text }]}>{d.slice(0, 3)}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}

            <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}>
                {loading ? (
                    <View style={styles.centerBox}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading...</Text>
                    </View>
                ) : activeTab === 'schedule' ? (
                    daySchedule.length === 0 ? (
                        <View style={styles.centerBox}>
                            <Ionicons name="calendar-outline" size={64} color={theme.colors.textSecondary} />
                            <Text style={[styles.emptyText, { color: theme.colors.text }]}>No classes on {selectedDay}</Text>
                        </View>
                    ) : (
                        daySchedule.map((item, idx) => (
                            <Card key={item._id || idx} style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                                <Card.Content style={styles.scheduleCard}>
                                    <View style={[styles.timeStrip, { backgroundColor: getTypeColor(item.type) }]}>
                                        <Text style={styles.timeText}>{item.startTime}</Text>
                                        <Text style={styles.timeDash}>—</Text>
                                        <Text style={styles.timeText}>{item.endTime}</Text>
                                    </View>
                                    <View style={styles.scheduleInfo}>
                                        <Title style={[styles.scheduleTitle, { color: theme.colors.text }]}>{getCourseName(item)}</Title>
                                        <View style={styles.scheduleDetail}>
                                            <Ionicons name={getTypeIcon(item.type)} size={14} color={theme.colors.textSecondary} />
                                            <Text style={[styles.scheduleDetailText, { color: theme.colors.textSecondary }]}>{item.type || 'Lecture'}</Text>
                                        </View>
                                        {item.room && (
                                            <View style={styles.scheduleDetail}>
                                                <Ionicons name="location-outline" size={14} color={theme.colors.textSecondary} />
                                                <Text style={[styles.scheduleDetailText, { color: theme.colors.textSecondary }]}>{item.room}</Text>
                                            </View>
                                        )}
                                    </View>
                                </Card.Content>
                            </Card>
                        ))
                    )
                ) : (
                    events.length === 0 ? (
                        <View style={styles.centerBox}>
                            <Ionicons name="megaphone-outline" size={64} color={theme.colors.textSecondary} />
                            <Text style={[styles.emptyText, { color: theme.colors.text }]}>No events</Text>
                        </View>
                    ) : (
                        events.map(evt => (
                            <Card key={evt._id} style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                                <Card.Content>
                                    <View style={styles.cardHeader}>
                                        <View style={{ flex: 1 }}>
                                            <Title style={[styles.cardTitle, { color: theme.colors.text }]}>{evt.title}</Title>
                                            {evt.description && (
                                                <Text style={[{ color: theme.colors.textSecondary, fontSize: 13, marginTop: 4 }]} numberOfLines={2}>{evt.description}</Text>
                                            )}
                                        </View>
                                        {evt.category && (
                                            <Chip style={{ backgroundColor: theme.colors.primary + '20' }}
                                                textStyle={{ color: theme.colors.primary, fontSize: 10, fontWeight: '600' }}>{evt.category}</Chip>
                                        )}
                                    </View>
                                    <View style={[styles.eventMeta, { borderTopColor: theme.colors.border }]}>
                                        <View style={styles.metaRow}>
                                            <Ionicons name="calendar-outline" size={14} color={theme.colors.textSecondary} />
                                            <Text style={[styles.metaText, { color: theme.colors.text }]}>{formatDate(evt.date)}</Text>
                                        </View>
                                        {evt.location && (
                                            <View style={styles.metaRow}>
                                                <Ionicons name="location-outline" size={14} color={theme.colors.textSecondary} />
                                                <Text style={[styles.metaText, { color: theme.colors.text }]}>{evt.location}</Text>
                                            </View>
                                        )}
                                    </View>
                                </Card.Content>
                            </Card>
                        ))
                    )
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
    dayBar: { maxHeight: 56 },
    dayChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginHorizontal: 4, marginVertical: 8 },
    dayText: { fontSize: 13, fontWeight: '600' },
    content: { flex: 1, padding: 16 },
    card: { marginBottom: 12, borderRadius: 12, borderWidth: 1, elevation: 2 },
    scheduleCard: { flexDirection: 'row', alignItems: 'center' },
    timeStrip: { width: 56, paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginRight: 14 },
    timeText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
    timeDash: { color: '#FFFFFFAA', fontSize: 10 },
    scheduleInfo: { flex: 1 },
    scheduleTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
    scheduleDetail: { flexDirection: 'row', alignItems: 'center', marginBottom: 2, gap: 6 },
    scheduleDetailText: { fontSize: 12 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    cardTitle: { fontSize: 15, fontWeight: '600' },
    eventMeta: { borderTopWidth: 1, paddingTop: 10, marginTop: 4 },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 6 },
    metaText: { fontSize: 12 },
    centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
    loadingText: { marginTop: 16, fontSize: 14 },
    emptyText: { marginTop: 16, fontSize: 18, fontWeight: '600', textAlign: 'center' },
});
