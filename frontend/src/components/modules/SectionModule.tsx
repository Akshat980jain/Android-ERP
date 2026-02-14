import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Layers, Users, ChevronDown, Search, Edit3,
    UserPlus, X, Check, AlertCircle, RefreshCw, Archive
} from 'lucide-react';
import apiClient from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';

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
const CURRENT_YEAR = new Date().getFullYear();
const ACADEMIC_YEARS = [`${CURRENT_YEAR - 1}-${String(CURRENT_YEAR).slice(2)}`, `${CURRENT_YEAR}-${String(CURRENT_YEAR + 1).slice(2)}`];

export function SectionModule() {
    const { user } = useAuth();
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedSemester, setSelectedSemester] = useState<number | null>(null);

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showStudentModal, setShowStudentModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [selectedSection, setSelectedSection] = useState<Section | null>(null);
    const [expandedSection, setExpandedSection] = useState<string | null>(null);

    // Bulk
    const [bulkMode, setBulkMode] = useState(false);
    const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
    const [bulkNewSemester, setBulkNewSemester] = useState(1);

    // Form
    const [formName, setFormName] = useState('');
    const [formSemester, setFormSemester] = useState(1);
    const [formYear, setFormYear] = useState(ACADEMIC_YEARS[ACADEMIC_YEARS.length - 1]);
    const [formMaxStudents, setFormMaxStudents] = useState('60');

    // Auto-derived from user profile
    const userProgram = (user as any)?.program || '';
    const userBranch = (user as any)?.branch || '';
    const [submitting, setSubmitting] = useState(false);

    // Student modal
    const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
    const [studentSearch, setStudentSearch] = useState('');
    const [loadingStudents, setLoadingStudents] = useState(false);

    // ─── Data fetching ──────────────────────────
    const fetchSections = useCallback(async () => {
        try {
            setError(null);
            const params: any = {};
            if (selectedSemester) params.semester = selectedSemester;
            const res: any = await apiClient.getSections(params);
            if (res.success) setSections(res.sections || []);
            else setError(res.message || 'Failed to load sections');
        } catch (e: any) {
            setError(e.message || 'Failed to load sections');
        } finally {
            setLoading(false);
        }
    }, [selectedSemester]);

    useEffect(() => { setLoading(true); fetchSections(); }, [fetchSections]);

    // ─── CRUD handlers ──────────────────────────
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formName.trim()) return;
        setSubmitting(true);
        try {
            const res: any = await apiClient.createSection({
                name: formName.trim().toUpperCase(),
                semester: formSemester,
                program: userProgram,
                branch: userBranch,
                academicYear: formYear,
                maxStudents: parseInt(formMaxStudents) || 60,
            });
            if (res.success) {
                setShowCreateModal(false);
                resetForm();
                fetchSections();
            } else {
                alert(res.message || 'Failed to create section');
            }
        } catch (e: any) {
            alert(e.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSection) return;
        setSubmitting(true);
        try {
            const data: any = {};
            if (formName.trim()) data.name = formName.trim().toUpperCase();
            if (formSemester) data.semester = formSemester;
            if (formMaxStudents) data.maxStudents = parseInt(formMaxStudents);
            const res: any = await apiClient.updateSection(selectedSection._id, data);
            if (res.success) {
                setShowEditModal(false);
                setSelectedSection(null);
                fetchSections();
            } else {
                alert(res.message);
            }
        } catch (e: any) {
            alert(e.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleArchive = async (section: Section) => {
        if (!confirm(`Archive section "${section.name}"?`)) return;
        try {
            const res: any = await apiClient.deleteSection(section._id);
            if (res.success) fetchSections();
            else alert(res.message);
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleBulkUpdate = async () => {
        if (bulkSelected.size === 0) return;
        setSubmitting(true);
        try {
            const res: any = await apiClient.bulkUpdateSemester(Array.from(bulkSelected), bulkNewSemester);
            if (res.success) {
                setShowBulkModal(false);
                setBulkSelected(new Set());
                setBulkMode(false);
                fetchSections();
            } else {
                alert(res.message);
            }
        } catch (e: any) {
            alert(e.message);
        } finally {
            setSubmitting(false);
        }
    };

    // Student management
    const openStudentModal = async (section: Section) => {
        setSelectedSection(section);
        setShowStudentModal(true);
        setLoadingStudents(true);
        try {
            const res: any = await apiClient.getStudents();
            if (res.success) {
                const existing = new Set((section.students || []).map((s: any) => s._id || s));
                setAvailableStudents((res.students || res.data || []).filter((s: Student) => !existing.has(s._id)));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingStudents(false);
        }
    };

    const handleAddStudents = async () => {
        if (!selectedSection || selectedStudents.size === 0) return;
        setSubmitting(true);
        try {
            const res: any = await apiClient.addStudentsToSection(selectedSection._id, Array.from(selectedStudents));
            if (res.success) {
                setShowStudentModal(false);
                setSelectedStudents(new Set());
                fetchSections();
            } else {
                alert(res.message);
            }
        } catch (e: any) {
            alert(e.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleRemoveStudent = async (section: Section, studentId: string) => {
        if (!confirm('Remove this student from the section?')) return;
        try {
            const res: any = await apiClient.removeStudentsFromSection(section._id, [studentId]);
            if (res.success) fetchSections();
            else alert(res.message);
        } catch (e: any) {
            alert(e.message);
        }
    };

    const resetForm = () => {
        setFormName('');
        setFormSemester(selectedSemester || 1);
        setFormYear(ACADEMIC_YEARS[ACADEMIC_YEARS.length - 1]);
        setFormMaxStudents('60');
    };

    const toggleBulkSelect = (id: string) => {
        const next = new Set(bulkSelected);
        next.has(id) ? next.delete(id) : next.add(id);
        setBulkSelected(next);
    };

    const filteredStudents = availableStudents.filter(s =>
        s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.email.toLowerCase().includes(studentSearch.toLowerCase())
    );

    const stats = {
        total: sections.length,
        students: sections.reduce((a, s) => a + (s.students?.length || 0), 0),
        semesters: new Set(sections.map(s => s.semester)).size,
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
                <span className="ml-3 text-gray-500">Loading sections...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Section Management</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage semesters, sections & student assignments</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { setBulkMode(!bulkMode); setBulkSelected(new Set()); }}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition ${bulkMode ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                    >
                        <Layers className="w-4 h-4" />
                        {bulkMode ? 'Cancel Bulk' : 'Bulk Select'}
                    </button>
                    <button
                        onClick={() => { resetForm(); setShowCreateModal(true); }}
                        className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition"
                    >
                        <Plus className="w-4 h-4" />
                        New Section
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Total Sections', value: stats.total, color: 'indigo', icon: Layers },
                    { label: 'Total Students', value: stats.students, color: 'emerald', icon: Users },
                    { label: 'Active Semesters', value: stats.semesters, color: 'amber', icon: Layers },
                ].map((stat, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                        className={`p-5 rounded-2xl bg-gradient-to-br from-${stat.color}-500 to-${stat.color}-600 text-white shadow-lg`}>
                        <stat.icon className="w-5 h-5 opacity-80" />
                        <div className="text-3xl font-bold mt-2">{stat.value}</div>
                        <div className="text-sm opacity-80">{stat.label}</div>
                    </motion.div>
                ))}
            </div>

            {/* Semester filter */}
            <div className="flex items-center gap-2 flex-wrap">
                <button
                    onClick={() => setSelectedSemester(null)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition ${!selectedSemester ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                >
                    All
                </button>
                {SEMESTERS.map(sem => (
                    <button
                        key={sem}
                        onClick={() => setSelectedSemester(selectedSemester === sem ? null : sem)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition ${selectedSemester === sem ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                    >
                        Sem {sem}
                    </button>
                ))}
            </div>

            {/* Bulk action bar */}
            {bulkMode && bulkSelected.size > 0 && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
                    <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">{bulkSelected.size} section(s) selected</span>
                    <button
                        onClick={() => setShowBulkModal(true)}
                        className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Update Semester
                    </button>
                </motion.div>
            )}

            {/* Error */}
            {error && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
                    <button onClick={fetchSections} className="ml-auto text-sm text-red-600 hover:underline">Retry</button>
                </div>
            )}

            {/* Section List */}
            {sections.length === 0 && !error ? (
                <div className="text-center py-16">
                    <Layers className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto" />
                    <h3 className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-300">No Sections</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {selectedSemester ? `No sections for Semester ${selectedSemester}` : 'Create your first section to get started'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence>
                        {sections.map((section, i) => (
                            <motion.div
                                key={section._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ delay: i * 0.05 }}
                                className={`rounded-2xl border transition-all ${bulkSelected.has(section._id)
                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10'
                                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:shadow-lg'
                                    } p-5`}
                            >
                                <div
                                    className="flex items-center gap-4 cursor-pointer"
                                    onClick={() => {
                                        if (bulkMode) { toggleBulkSelect(section._id); return; }
                                        setExpandedSection(expandedSection === section._id ? null : section._id);
                                    }}
                                >
                                    {bulkMode && (
                                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition ${bulkSelected.has(section._id) ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 dark:border-gray-600'}`}>
                                            {bulkSelected.has(section._id) && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                    )}

                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                                        <span className="text-white font-bold text-lg">{section.name}</span>
                                    </div>

                                    <div className="flex-1">
                                        <div className="font-semibold text-gray-900 dark:text-white">
                                            {section.program} {section.branch ? `- ${section.branch}` : ''}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                            Semester {section.semester} • {section.academicYear}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                                        <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                        <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                                            {section.students?.length || 0}/{section.maxStudents}
                                        </span>
                                    </div>

                                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expandedSection === section._id ? 'rotate-180' : ''}`} />
                                </div>

                                {/* Expanded content */}
                                <AnimatePresence>
                                    {expandedSection === section._id && !bulkMode && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                                {/* Actions */}
                                                <div className="flex gap-2 mb-4">
                                                    <button onClick={() => openStudentModal(section)}
                                                        className="px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition">
                                                        <UserPlus className="w-3.5 h-3.5" />Add Students
                                                    </button>
                                                    <button onClick={() => { setSelectedSection(section); setFormName(section.name); setFormSemester(section.semester); setFormMaxStudents(String(section.maxStudents)); setShowEditModal(true); }}
                                                        className="px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 text-xs font-semibold flex items-center gap-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition">
                                                        <Edit3 className="w-3.5 h-3.5" />Edit
                                                    </button>
                                                    <button onClick={() => handleArchive(section)}
                                                        className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs font-semibold flex items-center gap-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 transition">
                                                        <Archive className="w-3.5 h-3.5" />Archive
                                                    </button>
                                                </div>

                                                {/* Student list */}
                                                {section.students && section.students.length > 0 ? (
                                                    <div className="space-y-2">
                                                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                                            Students ({section.students.length})
                                                        </h4>
                                                        {section.students.map((student: any) => (
                                                            <div key={student._id || student}
                                                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition group">
                                                                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                                                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                                                        {(student.name || 'S').charAt(0).toUpperCase()}
                                                                    </span>
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{student.name || 'Unknown'}</div>
                                                                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{student.email || ''}</div>
                                                                </div>
                                                                <button onClick={() => handleRemoveStudent(section, student._id || student)}
                                                                    className="opacity-0 group-hover:opacity-100 transition p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30">
                                                                    <X className="w-4 h-4 text-red-500" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-gray-400 dark:text-gray-500 italic text-center py-4">No students in this section yet</p>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* ─── CREATE MODAL ────────────────── */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Section</h2>
                                <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Section Name</label>
                                    <input type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. A, B, C"
                                        className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Semester</label>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {SEMESTERS.map(s => (
                                            <button key={s} type="button" onClick={() => setFormSemester(s)}
                                                className={`w-10 h-10 rounded-lg text-sm font-bold transition ${formSemester === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {/* Program & Branch — auto-filled from your profile */}
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Program & Branch</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="px-4 py-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-semibold text-sm">
                                            {userProgram || 'Not set'}
                                        </span>
                                        {userBranch && (
                                            <span className="px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 font-semibold text-sm">
                                                {userBranch}
                                            </span>
                                        )}
                                        <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">from your profile</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Academic Year</label>
                                    <div className="flex gap-2 mt-1">
                                        {ACADEMIC_YEARS.map(y => (
                                            <button key={y} type="button" onClick={() => setFormYear(y)}
                                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${formYear === y ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                                                {y}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Max Students</label>
                                    <input type="number" value={formMaxStudents} onChange={e => setFormMaxStudents(e.target.value)} placeholder="60"
                                        className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setShowCreateModal(false)}
                                        className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={submitting}
                                        className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-500/25 transition disabled:opacity-50">
                                        {submitting ? 'Creating...' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── EDIT MODAL ────────────────── */}
            <AnimatePresence>
                {showEditModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Section</h2>
                                <button onClick={() => { setShowEditModal(false); setSelectedSection(null); }} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={handleUpdate} className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Section Name</label>
                                    <input type="text" value={formName} onChange={e => setFormName(e.target.value)}
                                        className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Semester</label>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {SEMESTERS.map(s => (
                                            <button key={s} type="button" onClick={() => setFormSemester(s)}
                                                className={`w-10 h-10 rounded-lg text-sm font-bold transition ${formSemester === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Max Students</label>
                                    <input type="number" value={formMaxStudents} onChange={e => setFormMaxStudents(e.target.value)}
                                        className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => { setShowEditModal(false); setSelectedSection(null); }}
                                        className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold transition">Cancel</button>
                                    <button type="submit" disabled={submitting}
                                        className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/25 transition disabled:opacity-50">{submitting ? 'Saving...' : 'Save'}</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── BULK SEMESTER MODAL ────────── */}
            <AnimatePresence>
                {showBulkModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Bulk Update Semester</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Update {bulkSelected.size} section(s) to a new semester</p>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">New Semester</label>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {SEMESTERS.map(s => (
                                        <button key={s} type="button" onClick={() => setBulkNewSemester(s)}
                                            className={`w-10 h-10 rounded-lg text-sm font-bold transition ${bulkNewSemester === s ? 'bg-amber-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setShowBulkModal(false)}
                                    className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold transition">Cancel</button>
                                <button onClick={handleBulkUpdate} disabled={submitting}
                                    className="flex-1 py-3 rounded-xl bg-amber-500 text-white font-semibold shadow-lg shadow-amber-500/25 transition disabled:opacity-50">{submitting ? 'Updating...' : 'Update All'}</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── ADD STUDENTS MODAL ────────── */}
            <AnimatePresence>
                {showStudentModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[80vh] flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Students to {selectedSection?.name}</h2>
                                <button onClick={() => { setShowStudentModal(false); setSelectedStudents(new Set()); }} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="relative mb-3">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input type="text" placeholder="Search students..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-1">
                                {loadingStudents ? (
                                    <div className="flex items-center justify-center py-8"><RefreshCw className="w-6 h-6 animate-spin text-indigo-500" /></div>
                                ) : filteredStudents.length === 0 ? (
                                    <p className="text-sm text-gray-400 text-center py-8">No available students found</p>
                                ) : (
                                    filteredStudents.map(student => (
                                        <div key={student._id}
                                            onClick={() => {
                                                const next = new Set(selectedStudents);
                                                next.has(student._id) ? next.delete(student._id) : next.add(student._id);
                                                setSelectedStudents(next);
                                            }}
                                            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition ${selectedStudents.has(student._id) ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                                        >
                                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition ${selectedStudents.has(student._id) ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 dark:border-gray-600'}`}>
                                                {selectedStudents.has(student._id) && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{student.name}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{student.email}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button onClick={() => { setShowStudentModal(false); setSelectedStudents(new Set()); }}
                                    className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold transition">Cancel</button>
                                <button onClick={handleAddStudents} disabled={submitting || selectedStudents.size === 0}
                                    className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-500/25 transition disabled:opacity-50">
                                    {submitting ? 'Adding...' : `Add ${selectedStudents.size} Student(s)`}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
