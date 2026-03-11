import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Alert,
    TextInput,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import apiService from '../../services/api';
import { API_CONFIG } from '../../config/api.config';

function getFileUrl(relativePath: string): string {
    // Always use HTTPS production URL for downloads (Android blocks HTTP cleartext)
    const base = API_CONFIG.PRODUCTION_URL.replace(/\/api\/?$/, '');
    return `${base}${relativePath}`;
}

function getFileIcon(filename: string): { icon: string; color: string } {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    switch (ext) {
        case 'pdf': return { icon: 'document-text', color: '#EF4444' };
        case 'doc': case 'docx': return { icon: 'document-text', color: '#3B82F6' };
        case 'jpg': case 'jpeg': case 'png': case 'gif': return { icon: 'image', color: '#10B981' };
        case 'ppt': case 'pptx': return { icon: 'easel', color: '#F59E0B' };
        case 'xls': case 'xlsx': return { icon: 'grid', color: '#10B981' };
        case 'zip': case 'rar': return { icon: 'archive', color: '#8B5CF6' };
        default: return { icon: 'attach', color: '#6B7280' };
    }
}

function formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AssignmentDetailScreen({ route, navigation }: any) {
    const { theme } = useTheme();
    const { assignmentId, mode } = route.params as {
        assignmentId: string;
        mode?: 'view' | 'submit';
    };

    const [assignment, setAssignment] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    // Submission state
    const [submissionContent, setSubmissionContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showSubmitForm, setShowSubmitForm] = useState(mode === 'submit');

    const loadAssignment = useCallback(async () => {
        try {
            setError(null);
            const response: any = await apiService.getAssignmentById(assignmentId);

            // Backend returns: { success: true, assignment: {...} }
            const data = response?.assignment || response?.data?.assignment || response?.data;
            if (data && (data._id || data.id)) {
                setAssignment(data);
            } else if (response?.success === false) {
                setError(response.error || response.message || 'Assignment not found.');
            } else {
                setError('Assignment details could not be loaded.');
            }
        } catch (e: any) {
            setError('Failed to load assignment. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [assignmentId]);

    useEffect(() => {
        loadAssignment();
    }, [loadAssignment]);

    const onRefresh = () => {
        setRefreshing(true);
        loadAssignment();
    };

    const downloadFile = async (filename: string, relativeUrl: string) => {
        try {
            // Encode URL (handles filenames with spaces/special chars)
            const rawUrl = getFileUrl(relativeUrl);
            const fullUrl = encodeURI(rawUrl);

            console.log('Downloading file from:', fullUrl);

            // Use the SDK 54 native downloader
            const cacheDir = new FileSystem.Directory(FileSystem.Paths.cache);
            const downloadedFile = await FileSystem.File.downloadFileAsync(fullUrl, cacheDir);

            console.log('File downloaded to:', downloadedFile.uri);

            const canShare = await Sharing.isAvailableAsync();
            if (canShare) {
                await Sharing.shareAsync(downloadedFile.uri, {
                    dialogTitle: filename,
                });
            } else {
                Alert.alert('Downloaded', 'File saved successfully.');
            }
        } catch (e: any) {
            console.error('Download error:', e);
            Alert.alert('Error', `Could not download the file: ${e.message || 'Unknown error'}`);
        }
    };

    const handleSubmit = async () => {
        if (!submissionContent.trim()) {
            Alert.alert('Error', 'Please enter your submission content.');
            return;
        }
        setSubmitting(true);
        try {
            const res: any = await apiService.submitAssignment(assignmentId, {
                content: submissionContent,
            });
            if (res?.success === false) {
                Alert.alert('Error', res.error || 'Submission failed.');
            } else {
                Alert.alert('Success', 'Assignment submitted successfully!', [
                    { text: 'OK', onPress: () => navigation.goBack() },
                ]);
            }
        } catch (e: any) {
            Alert.alert('Error', 'Failed to submit assignment.');
        } finally {
            setSubmitting(false);
        }
    };

    const s = createStyles(theme);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    // ─── Loading ────────────────────────────────────────────────────────
    if (loading) {
        return (
            <View style={[s.container, s.center]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[s.loadingText, { color: theme.colors.textSecondary }]}>
                    Loading assignment…
                </Text>
            </View>
        );
    }

    // ─── Error ──────────────────────────────────────────────────────────
    if (error || !assignment) {
        return (
            <View style={[s.container, { backgroundColor: theme.colors.background }]}>
                <View style={[s.topBar, { borderBottomColor: theme.colors.border }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                    <Text style={[s.topBarTitle, { color: theme.colors.text }]}>Assignment</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={s.center}>
                    <Ionicons name="warning-outline" size={56} color={theme.colors.textSecondary} />
                    <Text style={[s.emptyTitle, { color: theme.colors.text }]}>Not Found</Text>
                    <Text style={[s.emptySubtitle, { color: theme.colors.textSecondary }]}>{error}</Text>
                    <TouchableOpacity
                        style={[s.primaryBtn, { backgroundColor: theme.colors.primary }]}
                        onPress={() => { setLoading(true); loadAssignment(); }}
                    >
                        <Text style={s.primaryBtnText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const courseName = assignment.course?.name
        ? `${assignment.course.name} (${assignment.course.code || ''})`
        : '';
    const facultyName = assignment.faculty?.name ||
        (assignment.faculty?.firstName ? `${assignment.faculty.firstName} ${assignment.faculty.lastName || ''}`.trim() : '');
    const hasSubmitted = assignment.hasSubmitted || assignment.submissionStatus === 'submitted' || assignment.submissionStatus === 'graded';
    const statusLabel = hasSubmitted ? (assignment.submissionStatus || 'Submitted') : 'Pending';
    const statusColor = hasSubmitted ? '#10B981' : '#F59E0B';

    return (
        <View style={[s.container, { backgroundColor: theme.colors.background }]}>
            {/* Top Bar */}
            <View style={[s.topBar, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={[s.topBarTitle, { color: theme.colors.text }]} numberOfLines={1}>
                    Assignment Details
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={s.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
            >
                {/* ── Header ──────────────────────────────────────────── */}
                <View style={[s.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                    <View style={s.headerRow}>
                        <Text style={[s.title, { color: theme.colors.text }]}>{assignment.title}</Text>
                        <View style={[s.statusBadge, { backgroundColor: statusColor + '18', borderColor: statusColor }]}>
                            <Text style={[s.statusText, { color: statusColor }]}>
                                {statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1)}
                            </Text>
                        </View>
                    </View>
                    {courseName ? <Text style={[s.courseLabel, { color: theme.colors.primary }]}>{courseName}</Text> : null}
                </View>

                {/* ── Info ─────────────────────────────────────────────── */}
                <View style={[s.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                    <Text style={[s.sectionTitle, { color: theme.colors.textSecondary }]}>DETAILS</Text>

                    {assignment.description ? (
                        <Text style={[s.descriptionText, { color: theme.colors.text }]}>{assignment.description}</Text>
                    ) : null}

                    <View style={s.infoGrid}>
                        <View style={[s.infoBox, { backgroundColor: theme.colors.surface }]}>
                            <Ionicons name="calendar-outline" size={18} color={theme.colors.primary} />
                            <Text style={[s.infoBoxLabel, { color: theme.colors.textSecondary }]}>Due Date</Text>
                            <Text style={[s.infoBoxValue, { color: theme.colors.text }]}>{formatDate(assignment.dueDate)}</Text>
                        </View>
                        <View style={[s.infoBox, { backgroundColor: theme.colors.surface }]}>
                            <Ionicons name="trophy-outline" size={18} color={theme.colors.primary} />
                            <Text style={[s.infoBoxLabel, { color: theme.colors.textSecondary }]}>Max Marks</Text>
                            <Text style={[s.infoBoxValue, { color: theme.colors.text }]}>{assignment.maxMarks || '—'}</Text>
                        </View>
                    </View>

                    {assignment.startDate && (
                        <View style={s.infoRow}>
                            <Ionicons name="play-outline" size={16} color={theme.colors.primary} />
                            <Text style={[s.infoLabel, { color: theme.colors.textSecondary }]}>Start Date</Text>
                            <Text style={[s.infoValue, { color: theme.colors.text }]}>{formatDate(assignment.startDate)}</Text>
                        </View>
                    )}

                    {facultyName ? (
                        <View style={s.infoRow}>
                            <Ionicons name="person-outline" size={16} color={theme.colors.primary} />
                            <Text style={[s.infoLabel, { color: theme.colors.textSecondary }]}>Faculty</Text>
                            <Text style={[s.infoValue, { color: theme.colors.text }]}>{facultyName}</Text>
                        </View>
                    ) : null}

                    {assignment.instructions ? (
                        <View style={{ marginTop: 12 }}>
                            <Text style={[s.sectionTitle, { color: theme.colors.textSecondary }]}>INSTRUCTIONS</Text>
                            <Text style={[s.descriptionText, { color: theme.colors.text }]}>{assignment.instructions}</Text>
                        </View>
                    ) : null}
                </View>

                {/* ── Question Files ──────────────────────────────── */}
                {Array.isArray(assignment.attachments) && assignment.attachments.length > 0 && (
                    <View style={[s.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                        <Text style={[s.sectionTitle, { color: theme.colors.textSecondary }]}>QUESTION FILES</Text>
                        {assignment.attachments.map((file: any, idx: number) => {
                            const { icon, color } = getFileIcon(file.filename || '');
                            const size = formatFileSize(file.size || 0);
                            return (
                                <TouchableOpacity
                                    key={idx}
                                    style={[
                                        s.fileRow,
                                        { backgroundColor: theme.colors.surface },
                                        idx < assignment.attachments.length - 1 && { marginBottom: 8 },
                                    ]}
                                    onPress={() => downloadFile(file.filename, file.url)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name={icon as any} size={24} color={color} />
                                    <View style={s.fileInfo}>
                                        <Text style={[s.fileName, { color: theme.colors.text }]} numberOfLines={1}>
                                            {file.filename}
                                        </Text>
                                        {size ? <Text style={[s.fileSize, { color: theme.colors.textSecondary }]}>{size}</Text> : null}
                                    </View>
                                    <Ionicons name="open-outline" size={18} color={theme.colors.textSecondary} />
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                {/* ── Marks & Feedback (if graded) ─────────────────────── */}
                {hasSubmitted && (typeof assignment.marks === 'number' || assignment.feedback) && (
                    <View style={[s.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                        <Text style={[s.sectionTitle, { color: theme.colors.textSecondary }]}>RESULT</Text>
                        {typeof assignment.marks === 'number' && (
                            <View style={s.marksRow}>
                                <Ionicons name="ribbon-outline" size={22} color="#F59E0B" />
                                <Text style={[s.marksText, { color: theme.colors.text }]}>
                                    {assignment.marks} / {assignment.maxMarks}
                                </Text>
                            </View>
                        )}
                        {assignment.feedback ? (
                            <Text style={[s.feedbackText, { color: theme.colors.text }]}>{assignment.feedback}</Text>
                        ) : null}
                    </View>
                )}

                {/* ── Submit Section ───────────────────────────────────── */}
                {!hasSubmitted && (
                    <View style={[s.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                        {showSubmitForm ? (
                            <>
                                <Text style={[s.sectionTitle, { color: theme.colors.textSecondary }]}>YOUR SUBMISSION</Text>
                                <TextInput
                                    style={[s.textArea, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
                                    multiline
                                    numberOfLines={6}
                                    textAlignVertical="top"
                                    placeholder="Type your answer or paste content here…"
                                    placeholderTextColor={theme.colors.textSecondary}
                                    value={submissionContent}
                                    onChangeText={setSubmissionContent}
                                />
                                <View style={s.submitActions}>
                                    <TouchableOpacity
                                        style={[s.outlineBtn, { borderColor: theme.colors.border }]}
                                        onPress={() => setShowSubmitForm(false)}
                                    >
                                        <Text style={[s.outlineBtnText, { color: theme.colors.textSecondary }]}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[s.primaryBtn, { backgroundColor: theme.colors.primary, opacity: submitting ? 0.6 : 1 }]}
                                        onPress={handleSubmit}
                                        disabled={submitting}
                                    >
                                        <Text style={s.primaryBtnText}>{submitting ? 'Submitting…' : 'Submit'}</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        ) : (
                            <TouchableOpacity
                                style={[s.primaryBtn, { backgroundColor: theme.colors.primary, alignSelf: 'stretch' }]}
                                onPress={() => setShowSubmitForm(true)}
                            >
                                <Text style={[s.primaryBtnText, { textAlign: 'center' }]}>Submit Assignment</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                <View style={{ height: 32 }} />
            </ScrollView>
        </View>
    );
}

const createStyles = (theme: any) =>
    StyleSheet.create({
        container: { flex: 1 },
        center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
        topBar: {
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingHorizontal: 16, paddingTop: 50, paddingBottom: 14, borderBottomWidth: 1,
        },
        backBtn: { width: 40, alignItems: 'flex-start' },
        topBarTitle: { fontSize: 18, fontWeight: '600', flex: 1, textAlign: 'center' },
        scroll: { padding: 16 },
        card: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 14, elevation: 2 },
        /* Header */
        headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
        title: { fontSize: 20, fontWeight: '700', flex: 1, marginRight: 10 },
        statusBadge: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4 },
        statusText: { fontSize: 12, fontWeight: '700' },
        courseLabel: { fontSize: 14, marginTop: 6 },
        /* Section */
        sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 10 },
        descriptionText: { fontSize: 14, lineHeight: 22, marginBottom: 12 },
        /* Info grid */
        infoGrid: { flexDirection: 'row', gap: 10, marginBottom: 12 },
        infoBox: { flex: 1, alignItems: 'center', borderRadius: 12, paddingVertical: 14 },
        infoBoxLabel: { fontSize: 11, marginTop: 6 },
        infoBoxValue: { fontSize: 16, fontWeight: '700', marginTop: 2 },
        /* Info rows */
        infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
        infoLabel: { fontSize: 13, marginLeft: 10, marginRight: 6, width: 80 },
        infoValue: { fontSize: 13, fontWeight: '600', flex: 1 },
        /* Marks */
        marksRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
        marksText: { fontSize: 20, fontWeight: '700', marginLeft: 10 },
        feedbackText: { fontSize: 14, lineHeight: 22, fontStyle: 'italic' },
        /* Submit */
        textArea: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, minHeight: 120, marginBottom: 12 },
        submitActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
        primaryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
        primaryBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
        outlineBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, borderWidth: 1 },
        outlineBtnText: { fontWeight: '600', fontSize: 14 },
        /* File attachments */
        fileRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10 },
        fileInfo: { flex: 1, marginLeft: 12, marginRight: 8 },
        fileName: { fontSize: 14, fontWeight: '600' },
        fileSize: { fontSize: 11, marginTop: 2 },
        /* Loading / Error */
        loadingText: { marginTop: 14, fontSize: 14 },
        emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 14 },
        emptySubtitle: { fontSize: 14, textAlign: 'center', marginTop: 6, marginBottom: 20 },
    });
