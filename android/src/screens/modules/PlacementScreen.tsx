import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    Linking,
} from 'react-native';
import {
    Card,
    Title,
    Chip,
    ActivityIndicator,
    Button,
    Searchbar,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import apiService from '../../services/api';

interface JobItem {
    _id: string;
    title: string;
    company: string;
    location?: string;
    salary?: string;
    ctc?: string;
    type?: string;
    category?: string;
    deadline?: string;
    postedDate?: string;
    description?: string;
    requirements?: string[];
    status?: string;
    applied?: boolean;
    eligibility?: { minCGPA?: number; branches?: string[] };
}

export default function PlacementScreen() {
    const { user } = useAuth();
    const { theme } = useTheme();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [jobs, setJobs] = useState<JobItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const filters = [
        { id: 'all', label: 'All' },
        { id: 'full-time', label: 'Full-Time' },
        { id: 'internship', label: 'Internship' },
        { id: 'part-time', label: 'Part-Time' },
    ];

    useEffect(() => { loadJobs(); }, []);

    const loadJobs = async () => {
        setLoading(true);
        try {
            const res: any = await apiService.getJobs();
            if (res && res.success !== false) {
                const list = Array.isArray(res.jobs) ? res.jobs :
                    Array.isArray(res.data) ? res.data :
                        Array.isArray(res) ? res : [];
                setJobs(list);
            }
        } catch (error) {
            console.error('Error loading jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => { setRefreshing(true); await loadJobs(); setRefreshing(false); };

    const handleApply = async (jobId: string) => {
        try {
            const res: any = await apiService.applyToJob(jobId);
            if (res && res.success !== false) {
                // Mark as applied locally
                setJobs(prev => prev.map(j => j._id === jobId ? { ...j, applied: true } : j));
            }
        } catch (error) {
            console.error('Error applying:', error);
        }
    };

    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const filteredJobs = jobs.filter(j => {
        const matchesSearch = !searchQuery ||
            j.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            j.company?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = selectedFilter === 'all' || j.type?.toLowerCase() === selectedFilter || j.category?.toLowerCase() === selectedFilter;
        return matchesSearch && matchesFilter;
    });

    const getTypeColor = (type?: string) => {
        switch (type?.toLowerCase()) {
            case 'full-time': return '#10B981';
            case 'internship': return '#3B82F6';
            case 'part-time': return '#F59E0B';
            default: return theme.colors.primary;
        }
    };

    const renderJobCard = (job: JobItem) => {
        const expanded = expandedId === job._id;
        return (
            <Card key={job._id} style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <TouchableOpacity onPress={() => setExpandedId(expanded ? null : job._id)} activeOpacity={0.8}>
                    <Card.Content>
                        <View style={styles.cardHeader}>
                            <View style={{ flex: 1 }}>
                                <Title style={[styles.jobTitle, { color: theme.colors.text }]}>{job.title}</Title>
                                <View style={styles.companyRow}>
                                    <Ionicons name="business-outline" size={14} color={theme.colors.textSecondary} />
                                    <Text style={[styles.company, { color: theme.colors.textSecondary }]}>{job.company}</Text>
                                </View>
                            </View>
                            {job.type && (
                                <Chip style={[styles.typeChip, { backgroundColor: getTypeColor(job.type) + '20' }]}
                                    textStyle={{ color: getTypeColor(job.type), fontSize: 10, fontWeight: '600' }}>
                                    {job.type}
                                </Chip>
                            )}
                        </View>

                        <View style={styles.metaRow}>
                            {job.location && (
                                <View style={styles.metaItem}>
                                    <Ionicons name="location-outline" size={14} color={theme.colors.textSecondary} />
                                    <Text style={[styles.metaText, { color: theme.colors.text }]}>{job.location}</Text>
                                </View>
                            )}
                            {(job.salary || job.ctc) && (
                                <View style={styles.metaItem}>
                                    <Ionicons name="cash-outline" size={14} color={theme.colors.textSecondary} />
                                    <Text style={[styles.metaText, { color: theme.colors.text }]}>{job.salary || job.ctc}</Text>
                                </View>
                            )}
                            {job.deadline && (
                                <View style={styles.metaItem}>
                                    <Ionicons name="time-outline" size={14} color={theme.colors.textSecondary} />
                                    <Text style={[styles.metaText, { color: theme.colors.text }]}>Due: {formatDate(job.deadline)}</Text>
                                </View>
                            )}
                        </View>

                        {expanded && (
                            <View style={[styles.expandedSection, { borderTopColor: theme.colors.border }]}>
                                {job.description && (
                                    <Text style={[styles.description, { color: theme.colors.text }]}>{job.description}</Text>
                                )}
                                {job.requirements && job.requirements.length > 0 && (
                                    <View style={styles.reqSection}>
                                        <Text style={[styles.reqTitle, { color: theme.colors.textSecondary }]}>Requirements</Text>
                                        {job.requirements.map((r, i) => (
                                            <View key={i} style={styles.reqItem}>
                                                <Text style={[styles.reqBullet, { color: theme.colors.primary }]}>•</Text>
                                                <Text style={[styles.reqText, { color: theme.colors.text }]}>{r}</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}
                                {job.eligibility && (
                                    <View style={styles.eligSection}>
                                        {job.eligibility.minCGPA && (
                                            <Text style={[styles.eligText, { color: theme.colors.textSecondary }]}>
                                                Min CGPA: {job.eligibility.minCGPA}
                                            </Text>
                                        )}
                                        {job.eligibility.branches && job.eligibility.branches.length > 0 && (
                                            <Text style={[styles.eligText, { color: theme.colors.textSecondary }]}>
                                                Branches: {job.eligibility.branches.join(', ')}
                                            </Text>
                                        )}
                                    </View>
                                )}

                                <Button
                                    mode="contained"
                                    disabled={job.applied}
                                    onPress={() => handleApply(job._id)}
                                    style={[styles.applyBtn, { backgroundColor: job.applied ? '#9CA3AF' : theme.colors.primary }]}
                                >
                                    {job.applied ? 'Applied ✓' : 'Apply Now'}
                                </Button>
                            </View>
                        )}

                        <Ionicons
                            name={expanded ? 'chevron-up-outline' : 'chevron-down-outline'}
                            size={18}
                            color={theme.colors.textSecondary}
                            style={{ alignSelf: 'center', marginTop: 4 }}
                        />
                    </Card.Content>
                </TouchableOpacity>
            </Card>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.topBar, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
                <View style={{ width: 28 }} />
                <Text style={[styles.topBarTitle, { color: theme.colors.text }]}>Placements</Text>
                <View style={{ width: 28 }} />
            </View>

            <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
                <Searchbar
                    placeholder="Search jobs..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}
                    inputStyle={{ color: theme.colors.text }}
                    iconColor={theme.colors.textSecondary}
                    placeholderTextColor={theme.colors.textSecondary}
                />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ paddingHorizontal: 16 }}>
                {filters.map(f => (
                    <TouchableOpacity key={f.id} onPress={() => setSelectedFilter(f.id)}>
                        <Chip
                            selected={selectedFilter === f.id}
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
                        <Text style={[styles.loadText, { color: theme.colors.textSecondary }]}>Loading opportunities...</Text>
                    </View>
                ) : filteredJobs.length === 0 ? (
                    <View style={styles.centerBox}>
                        <Ionicons name="briefcase-outline" size={64} color={theme.colors.textSecondary} />
                        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No jobs found</Text>
                        <Text style={[styles.emptySub, { color: theme.colors.textSecondary }]}>
                            {searchQuery ? 'Try a different search' : 'No placement opportunities available at the moment'}
                        </Text>
                    </View>
                ) : (
                    <View style={{ paddingBottom: 20 }}>
                        <Text style={[styles.resultCount, { color: theme.colors.textSecondary }]}>
                            {filteredJobs.length} opportunit{filteredJobs.length !== 1 ? 'ies' : 'y'}
                        </Text>
                        {filteredJobs.map(j => renderJobCard(j))}
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
    searchBar: { borderRadius: 12, elevation: 1, marginBottom: 4 },
    filterRow: { maxHeight: 52 },
    filterChip: { marginRight: 8, marginVertical: 8 },
    content: { flex: 1, padding: 16 },
    card: { marginBottom: 16, borderRadius: 12, borderWidth: 1, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    jobTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
    companyRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    company: { fontSize: 13 },
    typeChip: { alignSelf: 'flex-start' },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 4 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 12 },
    expandedSection: { borderTopWidth: 1, paddingTop: 12, marginTop: 8 },
    description: { fontSize: 13, lineHeight: 20, marginBottom: 12 },
    reqSection: { marginBottom: 12 },
    reqTitle: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
    reqItem: { flexDirection: 'row', marginBottom: 4, paddingLeft: 4 },
    reqBullet: { fontSize: 14, marginRight: 8 },
    reqText: { fontSize: 13, flex: 1 },
    eligSection: { marginBottom: 12 },
    eligText: { fontSize: 12, marginBottom: 2 },
    applyBtn: { marginTop: 4 },
    centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
    loadText: { marginTop: 16, fontSize: 14 },
    emptyTitle: { marginTop: 16, fontSize: 18, fontWeight: '600' },
    emptySub: { marginTop: 8, fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
    resultCount: { fontSize: 13, marginBottom: 8, fontWeight: '500' },
});
