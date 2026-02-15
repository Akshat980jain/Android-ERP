import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Layers, Users, BookOpen, GraduationCap, RefreshCw, AlertCircle
} from 'lucide-react';
import apiClient from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';

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

export default function StudentSectionView() {
    const { user } = useAuth();
    const [section, setSection] = useState<Section | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSection = async () => {
        setLoading(true);
        setError(null);
        try {
            const res: any = await apiClient.getMySection();
            if (res.success) {
                setSection(res.section || null);
            } else {
                setError(res.message || 'Failed to load section');
            }
        } catch (e: any) {
            setError(e.message || 'Failed to load section');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSection(); }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">Loading your section...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
                <AlertCircle className="w-12 h-12 text-red-400" />
                <p className="text-red-500 font-medium">{error}</p>
                <button onClick={fetchSection} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition">
                    Retry
                </button>
            </div>
        );
    }

    if (!section) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center h-64 gap-4"
            >
                <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Layers className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No Section Assigned</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
                    You haven't been assigned to a section yet. Contact your admin for section allocation.
                </p>
            </motion.div>
        );
    }

    const fill = Math.round((section.students.length / section.maxStudents) * 100);

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="space-y-6 p-2"
        >
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-indigo-200 text-sm font-medium">Your Section</p>
                        <h1 className="text-3xl font-extrabold tracking-tight mt-1">Section {section.name}</h1>
                        <p className="text-indigo-100 mt-2 text-sm">
                            {section.program} {section.branch ? `• ${section.branch}` : ''} • Semester {section.semester} • {section.academicYear}
                        </p>
                    </div>
                    <div className="hidden sm:flex w-16 h-16 bg-white/20 rounded-2xl items-center justify-center">
                        <Layers className="w-8 h-8" />
                    </div>
                </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: 'Classmates', value: section.students.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                    { label: 'Capacity', value: `${section.students.length}/${section.maxStudents}`, icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                    { label: 'Semester', value: section.semester, icon: GraduationCap, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
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

            {/* Capacity bar */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Section Capacity</span>
                    <span className="text-sm font-bold text-indigo-600">{fill}%</span>
                </div>
                <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }} animate={{ width: `${fill}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={`h-full rounded-full ${fill > 90 ? 'bg-red-500' : fill > 70 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                    />
                </div>
            </div>

            {/* Classmates */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-500" />
                        Classmates ({section.students.length})
                    </h3>
                </div>
                <div className="divide-y divide-gray-50 dark:divide-gray-700/50 max-h-96 overflow-y-auto">
                    {section.students.map((student, i) => (
                        <motion.div
                            key={student._id}
                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.02 * i }}
                            className={`flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition ${student._id === (user as any)?._id ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
                        >
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                                {student.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                    {student.name} {student._id === (user as any)?._id && <span className="text-indigo-500 text-xs ml-1">(You)</span>}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{student.email}</p>
                            </div>
                            {student.profile?.studentId && (
                                <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-lg shrink-0">
                                    {student.profile.studentId}
                                </span>
                            )}
                        </motion.div>
                    ))}
                    {section.students.length === 0 && (
                        <div className="text-center py-8 text-gray-400 text-sm">No classmates in this section yet</div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
