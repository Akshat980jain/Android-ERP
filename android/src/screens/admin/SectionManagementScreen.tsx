import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    RefreshControl, Alert, Modal, TextInput, FlatList,
    ActivityIndicator, Dimensions, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import apiService from '../../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Section {
    _id: string;
    name: string;
    semester: number;
    program: string;
    branch: string;
    academicYear: string;
    students: any[];
    maxStudents: number;
    status: string;
    createdBy?: any;
}

interface Student {
    _id: string;
    name: string;
    email: string;
    profile?: { studentId?: string; semester?: string; section?: string };
}

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
const PROGRAMS = ['B.Tech', 'M.Tech', 'B.Pharma', 'MCA', 'MBA'];
const CURRENT_YEAR = new Date().getFullYear();
const ACADEMIC_YEARS = [`${CURRENT_YEAR - 1}-${String(CURRENT_YEAR).slice(2)}`, `${CURRENT_YEAR}-${String(CURRENT_YEAR + 1).slice(2)}`];

const SectionManagementScreen: React.FC = () => {
    const { user } = useAuth();
    const { theme } = useTheme();
    const isDark = theme.dark;

    // State
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedSemester, setSelectedSemester] = useState<number | null>(null);

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showStudentModal, setShowStudentModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedSection, setSelectedSection] = useState<Section | null>(null);
    const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
    const [bulkMode, setBulkMode] = useState(false);

    // Create form
    const [formName, setFormName] = useState('');
    const [formSemester, setFormSemester] = useState<number>(1);
    const [formProgram, setFormProgram] = useState(user?.program || PROGRAMS[0]);
    const [formBranch, setFormBranch] = useState(user?.branch || '');
    const [formYear, setFormYear] = useState(ACADEMIC_YEARS[ACADEMIC_YEARS.length - 1]);
    const [formMaxStudents, setFormMaxStudents] = useState('60');
    const [formSubmitting, setFormSubmitting] = useState(false);

    // Student modal
    const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
    const [studentSearch, setStudentSearch] = useState('');
    const [loadingStudents, setLoadingStudents] = useState(false);

    // Bulk modal
    const [bulkNewSemester, setBulkNewSemester] = useState<number>(1);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, []);

    // Fetch sections
    const fetchSections = useCallback(async () => {
        try {
            setError(null);
            const params: any = {};
            if (selectedSemester) params.semester = selectedSemester;
            const res = await apiService.getSections(params);
            if (res.success) {
                setSections(res.sections || []);
            } else {
                setError(res.message || 'Failed to load sections');
            }
        } catch (e: any) {
            setError(e.message || 'Failed to load sections');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedSemester]);

    useEffect(() => {
        setLoading(true);
        fetchSections();
    }, [fetchSections]);

    const onRefresh = () => { setRefreshing(true); fetchSections(); };

    // Create section
    const handleCreate = async () => {
        if (!formName.trim()) { Alert.alert('Error', 'Section name is required'); return; }
        setFormSubmitting(true);
        try {
            const res = await apiService.createSection({
                name: formName.trim(),
                semester: formSemester,
                program: formProgram,
                branch: formBranch,
                academicYear: formYear,
                maxStudents: parseInt(formMaxStudents) || 60,
            });
            if (res.success) {
                setShowCreateModal(false);
                resetForm();
                fetchSections();
                Alert.alert('Success', 'Section created successfully');
            } else {
                Alert.alert('Error', res.message || 'Failed to create section');
            }
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to create section');
        } finally {
            setFormSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormName('');
        setFormSemester(selectedSemester || 1);
        setFormProgram(user?.program || PROGRAMS[0]);
        setFormBranch(user?.branch || '');
        setFormYear(ACADEMIC_YEARS[ACADEMIC_YEARS.length - 1]);
        setFormMaxStudents('60');
    };

    // Update section
    const handleUpdate = async () => {
        if (!selectedSection) return;
        setFormSubmitting(true);
        try {
            const data: any = {};
            if (formName.trim()) data.name = formName.trim();
            if (formSemester) data.semester = formSemester;
            if (formMaxStudents) data.maxStudents = parseInt(formMaxStudents);
            const res = await apiService.updateSection(selectedSection._id, data);
            if (res.success) {
                setShowEditModal(false);
                setSelectedSection(null);
                fetchSections();
                Alert.alert('Success', 'Section updated');
            } else {
                Alert.alert('Error', res.message || 'Failed to update');
            }
        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setFormSubmitting(false);
        }
    };

    // Bulk semester update
    const handleBulkUpdate = async () => {
        if (bulkSelected.size === 0) { Alert.alert('Error', 'Select sections first'); return; }
        setFormSubmitting(true);
        try {
            const res = await apiService.bulkUpdateSemester(Array.from(bulkSelected), bulkNewSemester);
            if (res.success) {
                setShowBulkModal(false);
                setBulkSelected(new Set());
                setBulkMode(false);
                fetchSections();
                Alert.alert('Success', res.message);
            } else {
                Alert.alert('Error', res.message);
            }
        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setFormSubmitting(false);
        }
    };

    // Archive section
    const handleArchive = (section: Section) => {
        Alert.alert('Archive Section', `Archive section "${section.name}"?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Archive', style: 'destructive', onPress: async () => {
                    try {
                        const res = await apiService.deleteSection(section._id);
                        if (res.success) { fetchSections(); Alert.alert('Success', res.message); }
                        else Alert.alert('Error', res.message);
                    } catch (e: any) { Alert.alert('Error', e.message); }
                }
            },
        ]);
    };

    // Student management
    const openStudentModal = async (section: Section) => {
        setSelectedSection(section);
        setShowStudentModal(true);
        setLoadingStudents(true);
        try {
            const res = await apiService.getStudents();
            if (res.success) {
                const existing = new Set(section.students.map((s: any) => s._id || s));
                setAvailableStudents((res.students || res.data || []).filter((s: Student) => !existing.has(s._id)));
            }
        } catch (e) { console.error(e); }
        finally { setLoadingStudents(false); }
    };

    const handleAddStudents = async () => {
        if (!selectedSection || selectedStudents.size === 0) return;
        setFormSubmitting(true);
        try {
            const res = await apiService.addStudentsToSection(selectedSection._id, Array.from(selectedStudents));
            if (res.success) {
                setShowStudentModal(false);
                setSelectedStudents(new Set());
                fetchSections();
                Alert.alert('Success', res.message);
            } else { Alert.alert('Error', res.message); }
        } catch (e: any) { Alert.alert('Error', e.message); }
        finally { setFormSubmitting(false); }
    };

    const handleRemoveStudent = async (section: Section, studentId: string) => {
        Alert.alert('Remove Student', 'Remove this student from the section?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove', style: 'destructive', onPress: async () => {
                    try {
                        const res = await apiService.removeStudentsFromSection(section._id, [studentId]);
                        if (res.success) { fetchSections(); }
                        else Alert.alert('Error', res.message);
                    } catch (e: any) { Alert.alert('Error', e.message); }
                }
            },
        ]);
    };

    // Toggle bulk selection
    const toggleBulkSelect = (id: string) => {
        const next = new Set(bulkSelected);
        next.has(id) ? next.delete(id) : next.add(id);
        setBulkSelected(next);
    };

    // Filtered students
    const filteredStudents = availableStudents.filter(s =>
        s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.email.toLowerCase().includes(studentSearch.toLowerCase()) ||
        (s.profile?.studentId || '').toLowerCase().includes(studentSearch.toLowerCase())
    );

    // ─── RENDER ─────────────────────────────────
    const statTotals = {
        total: sections.length,
        students: sections.reduce((acc, s) => acc + (s.students?.length || 0), 0),
        semesters: new Set(sections.map(s => s.semester)).size,
    };

    // Loading state
    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#F1F5F9' }]}>
                <LinearGradient colors={isDark ? ['#1E293B', '#0F172A'] : ['#6366F1', '#4F46E5']} style={styles.header}>
                    <Text style={styles.headerTitle}>Section Management</Text>
                </LinearGradient>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6366F1" />
                    <Text style={[styles.loadingText, { color: isDark ? '#94A3B8' : '#64748B' }]}>Loading sections...</Text>
                </View>
            </View>
        );
    }

    return (
        <Animated.View style={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#F1F5F9', opacity: fadeAnim }]}>
            {/* Header */}
            <LinearGradient colors={isDark ? ['#1E293B', '#0F172A'] : ['#6366F1', '#4F46E5']} style={styles.header}>
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.headerTitle}>Section Management</Text>
                        <Text style={styles.headerSubtitle}>Manage semesters, sections & students</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.bulkBtn}
                        onPress={() => { setBulkMode(!bulkMode); setBulkSelected(new Set()); }}
                    >
                        <Ionicons name={bulkMode ? 'close' : 'layers-outline'} size={22} color="#fff" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* Stats */}
            <View style={styles.statsRow}>
                {[
                    { label: 'Sections', value: statTotals.total, icon: 'grid-outline', colors: ['#6366F1', '#818CF8'] },
                    { label: 'Students', value: statTotals.students, icon: 'people-outline', colors: ['#10B981', '#34D399'] },
                    { label: 'Semesters', value: statTotals.semesters, icon: 'layers-outline', colors: ['#F59E0B', '#FBBF24'] },
                ].map((stat, i) => (
                    <LinearGradient key={i} colors={stat.colors as [string, string]} style={styles.statCard}>
                        <Ionicons name={stat.icon as any} size={20} color="#fff" />
                        <Text style={styles.statValue}>{stat.value}</Text>
                        <Text style={styles.statLabel}>{stat.label}</Text>
                    </LinearGradient>
                ))}
            </View>

            {/* Semester Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
                <TouchableOpacity
                    style={[styles.filterPill, !selectedSemester && styles.filterPillActive]}
                    onPress={() => setSelectedSemester(null)}
                >
                    <Text style={[styles.filterPillText, !selectedSemester && styles.filterPillTextActive]}>All</Text>
                </TouchableOpacity>
                {SEMESTERS.map(sem => (
                    <TouchableOpacity
                        key={sem}
                        style={[styles.filterPill, selectedSemester === sem && styles.filterPillActive]}
                        onPress={() => setSelectedSemester(selectedSemester === sem ? null : sem)}
                    >
                        <Text style={[styles.filterPillText, selectedSemester === sem && styles.filterPillTextActive]}>
                            Sem {sem}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Bulk Action Bar */}
            {bulkMode && bulkSelected.size > 0 && (
                <View style={[styles.bulkBar, { backgroundColor: isDark ? '#1E293B' : '#EEF2FF' }]}>
                    <Text style={[styles.bulkBarText, { color: isDark ? '#C7D2FE' : '#4338CA' }]}>
                        {bulkSelected.size} section(s) selected
                    </Text>
                    <TouchableOpacity
                        style={styles.bulkActionBtn}
                        onPress={() => setShowBulkModal(true)}
                    >
                        <Ionicons name="swap-vertical" size={18} color="#fff" />
                        <Text style={styles.bulkActionText}>Update Semester</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Section List */}
            <ScrollView
                style={styles.listContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />}
                showsVerticalScrollIndicator={false}
            >
                {error ? (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity style={styles.retryBtn} onPress={fetchSections}>
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : sections.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="folder-open-outline" size={64} color={isDark ? '#475569' : '#94A3B8'} />
                        <Text style={[styles.emptyTitle, { color: isDark ? '#CBD5E1' : '#334155' }]}>No Sections</Text>
                        <Text style={[styles.emptySubtitle, { color: isDark ? '#64748B' : '#94A3B8' }]}>
                            {selectedSemester ? `No sections for Semester ${selectedSemester}` : 'Create your first section to get started'}
                        </Text>
                    </View>
                ) : (
                    sections.map((section) => (
                        <TouchableOpacity
                            key={section._id}
                            activeOpacity={0.8}
                            onPress={() => {
                                if (bulkMode) { toggleBulkSelect(section._id); return; }
                                setSelectedSection(selectedSection?._id === section._id ? null : section);
                            }}
                        >
                            <View style={[
                                styles.sectionCard,
                                { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
                                bulkSelected.has(section._id) && styles.sectionCardSelected,
                            ]}>
                                {/* Card Header */}
                                <View style={styles.sectionCardHeader}>
                                    {bulkMode && (
                                        <View style={[styles.checkbox, bulkSelected.has(section._id) && styles.checkboxChecked]}>
                                            {bulkSelected.has(section._id) && <Ionicons name="checkmark" size={14} color="#fff" />}
                                        </View>
                                    )}
                                    <LinearGradient colors={['#6366F1', '#818CF8']} style={styles.sectionBadge}>
                                        <Text style={styles.sectionBadgeText}>{section.name}</Text>
                                    </LinearGradient>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={[styles.sectionTitle, { color: isDark ? '#E2E8F0' : '#1E293B' }]}>
                                            {section.program} {section.branch ? `- ${section.branch}` : ''}
                                        </Text>
                                        <Text style={[styles.sectionMeta, { color: isDark ? '#64748B' : '#94A3B8' }]}>
                                            Semester {section.semester} • {section.academicYear}
                                        </Text>
                                    </View>
                                    <View style={styles.studentCount}>
                                        <Ionicons name="people" size={14} color={isDark ? '#818CF8' : '#6366F1'} />
                                        <Text style={[styles.studentCountText, { color: isDark ? '#818CF8' : '#6366F1' }]}>
                                            {section.students?.length || 0}/{section.maxStudents}
                                        </Text>
                                    </View>
                                </View>

                                {/* Expanded: Student list & actions */}
                                {selectedSection?._id === section._id && !bulkMode && (
                                    <View style={styles.sectionExpanded}>
                                        {/* Action buttons */}
                                        <View style={styles.actionRow}>
                                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#10B981' + '20' }]}
                                                onPress={() => openStudentModal(section)}>
                                                <Ionicons name="person-add" size={16} color="#10B981" />
                                                <Text style={[styles.actionBtnText, { color: '#10B981' }]}>Add Students</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#6366F1' + '20' }]}
                                                onPress={() => {
                                                    setFormName(section.name);
                                                    setFormSemester(section.semester);
                                                    setFormMaxStudents(String(section.maxStudents));
                                                    setShowEditModal(true);
                                                }}>
                                                <Ionicons name="pencil" size={16} color="#6366F1" />
                                                <Text style={[styles.actionBtnText, { color: '#6366F1' }]}>Edit</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#EF4444' + '20' }]}
                                                onPress={() => handleArchive(section)}>
                                                <Ionicons name="archive" size={16} color="#EF4444" />
                                                <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Archive</Text>
                                            </TouchableOpacity>
                                        </View>

                                        {/* Student list */}
                                        {section.students && section.students.length > 0 ? (
                                            <View style={styles.studentList}>
                                                <Text style={[styles.studentListTitle, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                                                    Students ({section.students.length})
                                                </Text>
                                                {section.students.map((student: any) => (
                                                    <View key={student._id || student} style={[styles.studentRow, { borderBottomColor: isDark ? '#334155' : '#E2E8F0' }]}>
                                                        <View style={[styles.studentAvatar, { backgroundColor: isDark ? '#334155' : '#EEF2FF' }]}>
                                                            <Text style={{ color: '#6366F1', fontWeight: '700', fontSize: 12 }}>
                                                                {(student.name || 'S').charAt(0).toUpperCase()}
                                                            </Text>
                                                        </View>
                                                        <View style={{ flex: 1, marginLeft: 10 }}>
                                                            <Text style={[styles.studentName, { color: isDark ? '#E2E8F0' : '#1E293B' }]}>
                                                                {student.name || 'Unknown'}
                                                            </Text>
                                                            <Text style={[styles.studentEmail, { color: isDark ? '#64748B' : '#94A3B8' }]}>
                                                                {student.email || student.profile?.studentId || ''}
                                                            </Text>
                                                        </View>
                                                        <TouchableOpacity onPress={() => handleRemoveStudent(section, student._id || student)}>
                                                            <Ionicons name="close-circle" size={22} color="#EF4444" />
                                                        </TouchableOpacity>
                                                    </View>
                                                ))}
                                            </View>
                                        ) : (
                                            <Text style={[styles.noStudents, { color: isDark ? '#64748B' : '#94A3B8' }]}>
                                                No students in this section yet
                                            </Text>
                                        )}
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    ))
                )}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* FAB */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => { resetForm(); setFormSemester(selectedSemester || 1); setShowCreateModal(true); }}
            >
                <LinearGradient colors={['#6366F1', '#4F46E5']} style={styles.fabGradient}>
                    <Ionicons name="add" size={28} color="#fff" />
                </LinearGradient>
            </TouchableOpacity>

            {/* Create Modal */}
            <Modal visible={showCreateModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
                        <Text style={[styles.modalTitle, { color: isDark ? '#E2E8F0' : '#1E293B' }]}>Create Section</Text>

                        <Text style={[styles.inputLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>Section Name</Text>
                        <TextInput style={[styles.input, { backgroundColor: isDark ? '#0F172A' : '#F1F5F9', color: isDark ? '#E2E8F0' : '#1E293B' }]}
                            placeholder="e.g. A, B, C" placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
                            value={formName} onChangeText={setFormName} autoCapitalize="characters" />

                        <Text style={[styles.inputLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>Semester</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.semesterPicker}>
                            {SEMESTERS.map(sem => (
                                <TouchableOpacity key={sem} onPress={() => setFormSemester(sem)}
                                    style={[styles.semPill, formSemester === sem && styles.semPillActive]}>
                                    <Text style={[styles.semPillText, formSemester === sem && styles.semPillTextActive]}>{sem}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <Text style={[styles.inputLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>Program</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.semesterPicker}>
                            {PROGRAMS.map(p => (
                                <TouchableOpacity key={p} onPress={() => setFormProgram(p)}
                                    style={[styles.semPill, { marginRight: 8 }, formProgram === p && styles.semPillActive]}>
                                    <Text style={[styles.semPillText, formProgram === p && styles.semPillTextActive]}>{p}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <Text style={[styles.inputLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>Branch</Text>
                        <TextInput style={[styles.input, { backgroundColor: isDark ? '#0F172A' : '#F1F5F9', color: isDark ? '#E2E8F0' : '#1E293B' }]}
                            placeholder="e.g. CS, IT, ECE" placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
                            value={formBranch} onChangeText={setFormBranch} />

                        <Text style={[styles.inputLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>Academic Year</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.semesterPicker}>
                            {ACADEMIC_YEARS.map(y => (
                                <TouchableOpacity key={y} onPress={() => setFormYear(y)}
                                    style={[styles.semPill, formYear === y && styles.semPillActive]}>
                                    <Text style={[styles.semPillText, formYear === y && styles.semPillTextActive]}>{y}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <Text style={[styles.inputLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>Max Students</Text>
                        <TextInput style={[styles.input, { backgroundColor: isDark ? '#0F172A' : '#F1F5F9', color: isDark ? '#E2E8F0' : '#1E293B' }]}
                            placeholder="60" placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
                            value={formMaxStudents} onChangeText={setFormMaxStudents} keyboardType="numeric" />

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCreateModal(false)}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={formSubmitting}>
                                <LinearGradient colors={['#6366F1', '#4F46E5']} style={styles.submitBtnGradient}>
                                    {formSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Create</Text>}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Edit Modal */}
            <Modal visible={showEditModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
                        <Text style={[styles.modalTitle, { color: isDark ? '#E2E8F0' : '#1E293B' }]}>Edit Section</Text>

                        <Text style={[styles.inputLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>Section Name</Text>
                        <TextInput style={[styles.input, { backgroundColor: isDark ? '#0F172A' : '#F1F5F9', color: isDark ? '#E2E8F0' : '#1E293B' }]}
                            value={formName} onChangeText={setFormName} autoCapitalize="characters" />

                        <Text style={[styles.inputLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>Semester</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.semesterPicker}>
                            {SEMESTERS.map(sem => (
                                <TouchableOpacity key={sem} onPress={() => setFormSemester(sem)}
                                    style={[styles.semPill, formSemester === sem && styles.semPillActive]}>
                                    <Text style={[styles.semPillText, formSemester === sem && styles.semPillTextActive]}>{sem}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <Text style={[styles.inputLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>Max Students</Text>
                        <TextInput style={[styles.input, { backgroundColor: isDark ? '#0F172A' : '#F1F5F9', color: isDark ? '#E2E8F0' : '#1E293B' }]}
                            value={formMaxStudents} onChangeText={setFormMaxStudents} keyboardType="numeric" />

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowEditModal(false); setSelectedSection(null); }}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.submitBtn} onPress={handleUpdate} disabled={formSubmitting}>
                                <LinearGradient colors={['#6366F1', '#4F46E5']} style={styles.submitBtnGradient}>
                                    {formSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Save</Text>}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Bulk Semester Modal */}
            <Modal visible={showBulkModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
                        <Text style={[styles.modalTitle, { color: isDark ? '#E2E8F0' : '#1E293B' }]}>
                            Bulk Update Semester
                        </Text>
                        <Text style={[styles.modalSubtitle, { color: isDark ? '#64748B' : '#94A3B8' }]}>
                            Update {bulkSelected.size} section(s) to a new semester
                        </Text>

                        <Text style={[styles.inputLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>New Semester</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.semesterPicker}>
                            {SEMESTERS.map(sem => (
                                <TouchableOpacity key={sem} onPress={() => setBulkNewSemester(sem)}
                                    style={[styles.semPill, bulkNewSemester === sem && styles.semPillActive]}>
                                    <Text style={[styles.semPillText, bulkNewSemester === sem && styles.semPillTextActive]}>{sem}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowBulkModal(false)}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.submitBtn} onPress={handleBulkUpdate} disabled={formSubmitting}>
                                <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.submitBtnGradient}>
                                    {formSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Update All</Text>}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Add Students Modal */}
            <Modal visible={showStudentModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', maxHeight: '80%' }]}>
                        <Text style={[styles.modalTitle, { color: isDark ? '#E2E8F0' : '#1E293B' }]}>
                            Add Students to {selectedSection?.name}
                        </Text>

                        <TextInput style={[styles.input, { backgroundColor: isDark ? '#0F172A' : '#F1F5F9', color: isDark ? '#E2E8F0' : '#1E293B', marginBottom: 12 }]}
                            placeholder="Search students..." placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
                            value={studentSearch} onChangeText={setStudentSearch} />

                        {loadingStudents ? (
                            <ActivityIndicator size="large" color="#6366F1" style={{ marginVertical: 20 }} />
                        ) : (
                            <FlatList
                                data={filteredStudents}
                                keyExtractor={item => item._id}
                                style={{ maxHeight: 300 }}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[styles.studentSelectRow, selectedStudents.has(item._id) && { backgroundColor: isDark ? '#312E81' : '#EEF2FF' }]}
                                        onPress={() => {
                                            const next = new Set(selectedStudents);
                                            next.has(item._id) ? next.delete(item._id) : next.add(item._id);
                                            setSelectedStudents(next);
                                        }}>
                                        <View style={[styles.checkbox, selectedStudents.has(item._id) && styles.checkboxChecked]}>
                                            {selectedStudents.has(item._id) && <Ionicons name="checkmark" size={14} color="#fff" />}
                                        </View>
                                        <View style={{ flex: 1, marginLeft: 10 }}>
                                            <Text style={[styles.studentName, { color: isDark ? '#E2E8F0' : '#1E293B' }]}>{item.name}</Text>
                                            <Text style={[styles.studentEmail, { color: isDark ? '#64748B' : '#94A3B8' }]}>{item.email}</Text>
                                        </View>
                                    </TouchableOpacity>
                                )}
                                ListEmptyComponent={
                                    <Text style={[styles.noStudents, { color: isDark ? '#64748B' : '#94A3B8' }]}>No available students found</Text>
                                }
                            />
                        )}

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowStudentModal(false); setSelectedStudents(new Set()); }}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.submitBtn} onPress={handleAddStudents}
                                disabled={formSubmitting || selectedStudents.size === 0}>
                                <LinearGradient colors={['#10B981', '#059669']} style={styles.submitBtnGradient}>
                                    {formSubmitting ? <ActivityIndicator color="#fff" /> :
                                        <Text style={styles.submitBtnText}>Add {selectedStudents.size} Student(s)</Text>}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
    headerSubtitle: { fontSize: 14, color: '#C7D2FE', marginTop: 4 },
    bulkBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },

    statsRow: { flexDirection: 'row', paddingHorizontal: 16, marginTop: -10, gap: 10 },
    statCard: { flex: 1, borderRadius: 16, padding: 14, alignItems: 'center', gap: 4 },
    statValue: { fontSize: 22, fontWeight: '800', color: '#fff' },
    statLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },

    filterScroll: { marginTop: 16, maxHeight: 44 },
    filterContent: { paddingHorizontal: 16, gap: 8 },
    filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(99,102,241,0.1)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)' },
    filterPillActive: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
    filterPillText: { fontSize: 13, fontWeight: '600', color: '#6366F1' },
    filterPillTextActive: { color: '#fff' },

    bulkBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginTop: 12, padding: 12, borderRadius: 12 },
    bulkBarText: { fontSize: 13, fontWeight: '600' },
    bulkActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F59E0B', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
    bulkActionText: { color: '#fff', fontWeight: '700', fontSize: 13 },

    listContainer: { flex: 1, paddingHorizontal: 16, marginTop: 12 },

    sectionCard: { borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
    sectionCardSelected: { borderWidth: 2, borderColor: '#6366F1' },
    sectionCardHeader: { flexDirection: 'row', alignItems: 'center' },
    sectionBadge: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    sectionBadgeText: { fontSize: 16, fontWeight: '800', color: '#fff' },
    sectionTitle: { fontSize: 15, fontWeight: '700' },
    sectionMeta: { fontSize: 12, marginTop: 2 },
    studentCount: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(99,102,241,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    studentCountText: { fontSize: 12, fontWeight: '700' },

    sectionExpanded: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(99,102,241,0.15)' },
    actionRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
    actionBtnText: { fontSize: 12, fontWeight: '700' },

    studentList: { marginTop: 4 },
    studentListTitle: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
    studentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
    studentAvatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    studentName: { fontSize: 13, fontWeight: '600' },
    studentEmail: { fontSize: 11, marginTop: 1 },
    noStudents: { textAlign: 'center', paddingVertical: 16, fontSize: 13, fontStyle: 'italic' },

    fab: { position: 'absolute', right: 20, bottom: 24, borderRadius: 28, shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
    fabGradient: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },

    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, fontSize: 14 },
    errorContainer: { alignItems: 'center', paddingVertical: 40 },
    errorText: { color: '#EF4444', fontSize: 14, marginTop: 8, textAlign: 'center' },
    retryBtn: { marginTop: 12, paddingHorizontal: 20, paddingVertical: 8, backgroundColor: '#6366F1', borderRadius: 10 },
    retryText: { color: '#fff', fontWeight: '700' },
    emptyContainer: { alignItems: 'center', paddingVertical: 60 },
    emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 16 },
    emptySubtitle: { fontSize: 13, marginTop: 6, textAlign: 'center' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
    modalSubtitle: { fontSize: 13, marginBottom: 16 },
    inputLabel: { fontSize: 12, fontWeight: '600', marginTop: 12, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, fontSize: 15 },
    semesterPicker: { maxHeight: 40 },
    semPill: { width: 40, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(99,102,241,0.1)', marginRight: 8 },
    semPillActive: { backgroundColor: '#6366F1' },
    semPillText: { fontSize: 14, fontWeight: '700', color: '#6366F1' },
    semPillTextActive: { color: '#fff' },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 20 },
    cancelBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, backgroundColor: 'rgba(100,116,139,0.15)' },
    cancelBtnText: { color: '#64748B', fontWeight: '700' },
    submitBtn: { borderRadius: 12, overflow: 'hidden' },
    submitBtnGradient: { paddingHorizontal: 24, paddingVertical: 12 },
    submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

    checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#6366F1', justifyContent: 'center', alignItems: 'center' },
    checkboxChecked: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
    studentSelectRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, borderRadius: 10 },
});

export default SectionManagementScreen;
