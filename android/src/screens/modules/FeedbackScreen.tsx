import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity,
} from 'react-native';
import { Card, Title, Chip, ActivityIndicator, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import apiService from '../../services/api';

interface FeedbackItem {
    _id: string;
    courseId: string;
    courseName: string;
    facultyName: string;
    rating: number;
    comment: string;
    submittedAt: string;
}

const RATING_LABELS = ['', 'Poor', 'Below Avg', 'Average', 'Good', 'Excellent'];

export default function FeedbackScreen() {
    const { user } = useAuth();
    const { theme } = useTheme();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [selectedRating, setSelectedRating] = useState(0);
    const [comment, setComment] = useState('');

    const isStudent = (user as any)?.role === 'student';
    const isFaculty = (user as any)?.role === 'faculty';

    const onRefresh = async () => {
        setRefreshing(true);
        // TODO: Fetch feedbacks from API
        setRefreshing(false);
    };

    const renderStars = (rating: number, interactive = false) => (
        <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity
                    key={star}
                    disabled={!interactive}
                    onPress={() => interactive && setSelectedRating(star)}
                >
                    <Ionicons
                        name={star <= rating ? 'star' : 'star-outline'}
                        size={interactive ? 32 : 16}
                        color={star <= rating ? '#F59E0B' : theme.colors.textSecondary}
                        style={{ marginRight: 4 }}
                    />
                </TouchableOpacity>
            ))}
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.topBar, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
                <Text style={[styles.topBarTitle, { color: theme.colors.text }]}>
                    {isStudent ? 'Course Feedback' : 'Feedback Summary'}
                </Text>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
            >
                {/* Student: Submit Feedback */}
                {isStudent && (
                    <Card style={[styles.formCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                        <Card.Content>
                            <Title style={[styles.cardTitle, { color: theme.colors.text }]}>Rate Your Experience</Title>
                            <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
                                Share your feedback on courses and faculty
                            </Text>

                            <View style={styles.ratingSection}>
                                <Text style={[styles.ratingLabel, { color: theme.colors.text }]}>Overall Rating</Text>
                                {renderStars(selectedRating, true)}
                                {selectedRating > 0 && (
                                    <Text style={[styles.ratingText, { color: '#F59E0B' }]}>
                                        {RATING_LABELS[selectedRating]}
                                    </Text>
                                )}
                            </View>

                            <Button
                                mode="contained"
                                disabled={selectedRating === 0}
                                style={[styles.submitBtn, { backgroundColor: theme.colors.primary }]}
                                onPress={() => {
                                    setSelectedRating(0);
                                    setComment('');
                                }}
                            >
                                Submit Feedback
                            </Button>
                        </Card.Content>
                    </Card>
                )}

                {/* Faculty: Feedback Summary */}
                {isFaculty && (
                    <View>
                        <View style={styles.summaryGrid}>
                            {[
                                { label: 'Avg Rating', value: '4.2', icon: 'star', color: '#F59E0B' },
                                { label: 'Responses', value: '156', icon: 'people', color: '#3B82F6' },
                                { label: 'Courses', value: '5', icon: 'book', color: '#10B981' },
                            ].map(s => (
                                <View key={s.label} style={[styles.summaryCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                                    <Ionicons name={s.icon as any} size={24} color={s.color} />
                                    <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{s.value}</Text>
                                    <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>{s.label}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Empty state */}
                {feedbacks.length === 0 && (
                    <View style={styles.emptyBox}>
                        <Ionicons name="chatbubble-ellipses-outline" size={64} color={theme.colors.textSecondary} />
                        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                            {isStudent ? 'No feedback submitted yet' : 'No feedback data available'}
                        </Text>
                        <Text style={[styles.emptySub, { color: theme.colors.textSecondary }]}>
                            {isStudent ? 'Rate your courses to help improve teaching quality' : 'Feedback data will appear here once students submit reviews'}
                        </Text>
                    </View>
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
    formCard: { borderRadius: 12, borderWidth: 1, marginBottom: 16 },
    cardTitle: { fontSize: 18, fontWeight: '700' },
    cardSubtitle: { fontSize: 13, marginTop: 4, marginBottom: 16 },
    ratingSection: { alignItems: 'center', paddingVertical: 20 },
    ratingLabel: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
    starsRow: { flexDirection: 'row', alignItems: 'center' },
    ratingText: { fontSize: 14, fontWeight: '600', marginTop: 8 },
    submitBtn: { marginTop: 16 },
    summaryGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    summaryCard: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 16, alignItems: 'center' },
    summaryValue: { fontSize: 24, fontWeight: '700', marginTop: 8 },
    summaryLabel: { fontSize: 11, marginTop: 4 },
    emptyBox: { alignItems: 'center', paddingVertical: 40 },
    emptyTitle: { marginTop: 16, fontSize: 18, fontWeight: '600' },
    emptySub: { marginTop: 8, fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
});
