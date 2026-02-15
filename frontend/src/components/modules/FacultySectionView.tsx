import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Layers, Users, ChevronDown, Search, RefreshCw, AlertCircle, GraduationCap
} from 'lucide-react';
import apiClient from '../../utils/api';

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

interface Student {
    _id: string;
    name: string;
    email: string;
    profile?: { studentId?: string; semester?: string; section?: string };
}

interface Section {
    _id: string;
    name: string;
    semester: number;
    program: string;
    branch: string;
    academicYear: string;
    students: Student[];
    maxStudents: number;
    status: string;
    createdBy?: { name: string; email: string };
}

export default function FacultySectionView() {
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchSections = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params: any = {};
            if (selectedSemester) params.semester = selectedSemester;
            const res: any = await apiClient.getFacultySections(params);
            if (res.success) {
                setSections(res.sections || []);
            } else {
                setError(res.message || 'Failed to load sections');
            }
        } catch (e: any) {
            setError(e.message || 'Failed to load sections');
        } finally {
            setLoading(false);
        }
    }, [selectedSemester]);

    useEffect(() => { fetchSections(); }, [fetchSections]);

    const filtered = sections.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.program.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.branch.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalStudents = sections.reduce((acc, s) => acc + (s.students?.length || 0), 0);
    const semesterSet = new Set(sections.map(s => s.semester));

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">Loading sections...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
                <AlertCircle className="w-12 h-12 text-red-400" />
                <p className="text-red-500 font-medium">{error}</p>
                <button onClick={fetchSections} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-2">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white shadow-xl"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-emerald-200 text-sm font-medium">Section Overview</p>
                        <h1 className="text-2xl font-extrabold tracking-tight mt-1">Sections & Students</h1>
                        <p className="text-emerald-100 mt-1 text-sm">View sections and enrolled students for your program</p>
                    </div>
                    <div className="hidden sm:flex w-14 h-14 bg-white/20 rounded-2xl items-center justify-center">
                        <Layers className="w-7 h-7" />
                    </div>
                </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: 'Total Sections', value: sections.length, icon: Layers, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
                    { label: 'Total Students', value: totalStudents, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                    { label: 'Semesters', value: semesterSet.size, icon: GraduationCap, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * i }}
                        className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold tracking-wide">{stat.label}</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search sections..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                {/* Semester pills */}
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => setSelectedSemester(null)}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${!selectedSemester ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                    >All</button>
                    {SEMESTERS.map(sem => (
                        <button key={sem}
                            onClick={() => setSelectedSemester(selectedSemester === sem ? null : sem)}
                            className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${selectedSemester === sem ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                        >Sem {sem}</button>
                    ))}
                </div>
            </div>

            {/* Section cards */}
            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Layers className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No sections found</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence>
                        {filtered.map((section, i) => {
                            const isExpanded = expandedId === section._id;
                            const fill = Math.round((section.students.length / section.maxStudents) * 100);
                            return (
                                <motion.div
                                    key={section._id}
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.03 * i }}
                                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
                                >
                                    {/* Card header */}
                                    <button
                                        onClick={() => setExpandedId(isExpanded ? null : section._id)}
                                        className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 dark:hover:bg-gray-700/30 transition"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
                                            {section.name}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                    {section.program} {section.branch ? `- ${section.branch}` : ''}
                                                </span>
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-semibold">
                                                    Sem {section.semester}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{section.academicYear}</p>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <div className="text-right">
                                                <div className="flex items-center gap-1 text-sm font-bold text-indigo-600 dark:text-indigo-400">
                                                    <Users className="w-4 h-4" />
                                                    {section.students.length}/{section.maxStudents}
                                                </div>
                                                {/* Mini capacity bar */}
                                                <div className="w-16 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
                                                    <div className={`h-full rounded-full ${fill > 90 ? 'bg-red-500' : fill > 70 ? 'bg-amber-500' : 'bg-indigo-500'}`} style={{ width: `${fill}%` }} />
                                                </div>
                                            </div>
                                            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                        </div>
                                    </button>

                                    {/* Expanded students */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="border-t border-gray-100 dark:border-gray-700 px-5 py-4">
                                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                                                        Students ({section.students.length})
                                                    </p>
                                                    {section.students.length === 0 ? (
                                                        <p className="text-sm text-gray-400 italic text-center py-4">No students enrolled yet</p>
                                                    ) : (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                                                            {section.students.map(student => (
                                                                <div key={student._id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                                        {student.name.charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{student.name}</p>
                                                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                                            {student.profile?.studentId || student.email}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
        </motion.div>
    );
}
