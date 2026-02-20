// src/components/modules/AttendanceModule.tsx
import { useState, useEffect, useCallback } from 'react';
import {
  Users, Calendar, CheckCircle, Clock, AlertTriangle, Layers,
  ChevronDown, ChevronRight, Search, CheckSquare, Square, RefreshCw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || '';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Student {
  _id: string;
  name: string;
  email: string;
  studentId?: string;
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
}

interface Course {
  _id: string;
  name: string;
  code: string;
  schedule: Array<{ day: string; time: string; endTime?: string; room: string }>;
}

interface ScheduleSlot {
  day: string;
  time: string;
  endTime?: string;
  room: string;
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function AttendanceModule() {
  const { token, user } = useAuth();

  // Step tracking
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Section
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [sectionsLoading, setSectionsLoading] = useState(true);

  // Step 2: Course + Date
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Step 3: Students + attendance
  const [students, setStudents] = useState<Student[]>([]);
  const [checkedStudents, setCheckedStudents] = useState<Set<string>>(new Set());
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Clock
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // ─── Step 1: Fetch Sections ──────────────────────────────────────────────
  const fetchSections = useCallback(async () => {
    setSectionsLoading(true);
    try {
      const res: any = await apiClient.getFacultySections();
      if (res.success) {
        setSections(res.sections || []);
      } else {
        setError(res.message || 'Failed to load sections');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load sections');
    } finally {
      setSectionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token && user?.role !== 'student') fetchSections();
  }, [token, fetchSections]);

  // ─── Step 2: Fetch Courses when section selected ─────────────────────────
  const fetchCourses = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/courses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCourses(data.courses || []);
      }
    } catch {
      setError('Failed to fetch courses');
    }
  }, [token]);

  useEffect(() => {
    if (selectedSection) fetchCourses();
  }, [selectedSection, fetchCourses]);

  // ─── Step 3: Load students from section + schedule slots ─────────────────
  const loadStudentsAndSlots = useCallback(async () => {
    if (!selectedSection || !selectedCourse || !selectedDate) return;

    setLoading(true);
    setError('');

    try {
      // Get schedule slots for this course + date
      const data: any = await apiClient.getScheduleAttendance(selectedCourse, selectedDate);
      if (data.success) {
        // Use section students instead of course enrolled students
        const sectionStudents = selectedSection.students;
        setStudents(sectionStudents);

        // Get existing schedule slots
        if (data.attendanceMatrix && data.attendanceMatrix.length > 0) {
          setScheduleSlots(data.attendanceMatrix.map((sm: any) => sm.slot));
          setSelectedSlotIndex(0);

          // Pre-check students that were already marked present
          const firstSlotAttendance = data.attendanceMatrix[0]?.attendance || [];
          const preChecked = new Set<string>();
          firstSlotAttendance.forEach((record: any) => {
            if (record.status === 'present' || record.status === 'late') {
              preChecked.add(record.student._id);
            }
          });
          setCheckedStudents(preChecked);
        } else {
          // No schedule slots for this date — still allow marking
          setScheduleSlots([]);
          setCheckedStudents(new Set());
        }
      } else {
        setError(data.message || 'Failed to load schedule');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  }, [selectedSection, selectedCourse, selectedDate]);

  // ─── Handlers ────────────────────────────────────────────────────────────
  const handleSectionSelect = (section: Section) => {
    setSelectedSection(section);
    setSelectedCourse('');
    setStudents([]);
    setCheckedStudents(new Set());
    setStep(2);
    setError('');
    setSuccess('');
  };

  const handleCourseAndDateReady = () => {
    if (!selectedCourse) {
      setError('Please select a course');
      return;
    }
    setStep(3);
    loadStudentsAndSlots();
  };

  const toggleStudent = (studentId: string) => {
    setCheckedStudents(prev => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    const filtered = getFilteredStudents();
    const allChecked = filtered.every(s => checkedStudents.has(s._id));
    if (allChecked) {
      // Deselect all filtered
      setCheckedStudents(prev => {
        const next = new Set(prev);
        filtered.forEach(s => next.delete(s._id));
        return next;
      });
    } else {
      // Select all filtered
      setCheckedStudents(prev => {
        const next = new Set(prev);
        filtered.forEach(s => next.add(s._id));
        return next;
      });
    }
  };

  const getFilteredStudents = () => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.profile?.studentId || '').toLowerCase().includes(q)
    );
  };

  // ─── Submit: checked = present, unchecked = absent ───────────────────────
  const submitAttendance = async () => {
    if (students.length === 0) {
      setError('No students to mark');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Build attendance data: checked = present, unchecked = absent
      const attendanceData = students.map(student => ({
        studentId: student._id,
        status: checkedStudents.has(student._id) ? 'present' : 'absent',
        remarks: ''
      }));

      const slot = scheduleSlots[selectedSlotIndex];
      const payload: any = {
        courseId: selectedCourse,
        date: selectedDate,
        attendanceData
      };

      // Include schedule slot if available
      if (slot) {
        payload.scheduleSlot = {
          startTime: slot.time,
          endTime: slot.endTime || slot.time
        };
      }

      const data: any = await apiClient.markScheduleAttendance(payload);

      if (data.success) {
        setSuccess(`Attendance submitted! ${checkedStudents.size} present, ${students.length - checkedStudents.size} absent.`);
      } else {
        setError(data.message || 'Failed to submit attendance');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to submit attendance');
    } finally {
      setLoading(false);
    }
  };

  // ─── Student role: show their own attendance ─────────────────────────────
  if (user?.role === 'student') {
    return <StudentAttendanceView />;
  }

  // ─── Faculty/Admin: Section-first checkbox flow ──────────────────────────
  const filteredStudents = getFilteredStudents();
  const allFilteredChecked = filteredStudents.length > 0 && filteredStudents.every(s => checkedStudents.has(s._id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Attendance</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Mark attendance by section</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Step breadcrumbs */}
          <div className="hidden sm:flex items-center gap-1 text-sm">
            <span
              onClick={() => { setStep(1); setSelectedSection(null); setSelectedCourse(''); setStudents([]); }}
              className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer transition ${step >= 1 ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'text-gray-400'}`}
            >
              1. Section
            </span>
            <ChevronRight className="w-4 h-4 text-gray-300" />
            <span
              onClick={() => { if (selectedSection) setStep(2); }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${step >= 2 ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 cursor-pointer' : 'text-gray-400'}`}
            >
              2. Course
            </span>
            <ChevronRight className="w-4 h-4 text-gray-300" />
            <span className={`px-3 py-1.5 rounded-lg font-semibold ${step === 3 ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'text-gray-400'}`}>
              3. Mark
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Clock className="w-4 h-4" />
            <span>{currentTime.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Alerts */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl flex items-center gap-2 border border-red-200 dark:border-red-800">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="text-sm">{error}</span>
          </motion.div>
        )}
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-xl flex items-center gap-2 border border-green-200 dark:border-green-800">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span className="text-sm">{success}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ STEP 1: Section Picker ═══ */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Select a Section</h3>
                <p className="text-emerald-100 text-sm">Choose a section to mark attendance for its students</p>
              </div>
            </div>
          </div>

          {sectionsLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
            </div>
          ) : sections.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Layers className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No sections found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sections.map((section, i) => (
                <motion.button
                  key={section._id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  onClick={() => handleSectionSelect(section)}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md transition-all text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
                      {section.name}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 dark:text-white text-sm">
                        Section {section.name} • {section.program} {section.branch ? `- ${section.branch}` : ''}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Sem {section.semester} • {section.academicYear}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 text-sm font-bold text-indigo-600 dark:text-indigo-400">
                        <Users className="w-4 h-4" />
                        {section.students.length}
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition ml-auto mt-1" />
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ═══ STEP 2: Course + Date ═══ */}
      {step === 2 && selectedSection && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center font-bold text-lg">
                  {selectedSection.name}
                </div>
                <div>
                  <p className="text-indigo-200 text-xs font-medium">Selected Section</p>
                  <h3 className="font-bold text-lg">
                    Section {selectedSection.name} • {selectedSection.program} {selectedSection.branch ? `- ${selectedSection.branch}` : ''}
                  </h3>
                  <p className="text-indigo-200 text-sm">{selectedSection.students.length} students • Sem {selectedSection.semester}</p>
                </div>
              </div>
              <button
                onClick={() => { setStep(1); setSelectedSection(null); setSelectedCourse(''); }}
                className="px-3 py-1.5 bg-white/20 rounded-lg text-sm font-semibold hover:bg-white/30 transition"
              >
                Change
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Select Course</label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">Choose a course</option>
                  {courses.map(course => (
                    <option key={course._id} value={course._id}>
                      {course.name} ({course.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
            <button
              onClick={handleCourseAndDateReady}
              disabled={!selectedCourse}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4" />
              Load Students
            </button>
          </div>
        </motion.div>
      )}

      {/* ═══ STEP 3: Student Checkbox List ═══ */}
      {step === 3 && selectedSection && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Summary bar */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-indigo-200 text-xs font-medium">Marking Attendance</p>
                <h3 className="font-bold text-lg">
                  Section {selectedSection.name} • {courses.find(c => c._id === selectedCourse)?.name || 'Course'}
                </h3>
                <p className="text-indigo-200 text-sm">{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <p className="text-2xl font-bold">{checkedStudents.size}</p>
                  <p className="text-xs text-emerald-200">Present</p>
                </div>
                <div className="w-px h-8 bg-white/30" />
                <div className="text-center">
                  <p className="text-2xl font-bold">{students.length - checkedStudents.size}</p>
                  <p className="text-xs text-red-200">Absent</p>
                </div>
                <div className="w-px h-8 bg-white/30" />
                <div className="text-center">
                  <p className="text-2xl font-bold">{students.length}</p>
                  <p className="text-xs text-indigo-200">Total</p>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule slot picker (if available) */}
          {scheduleSlots.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {scheduleSlots.map((slot, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedSlotIndex(idx)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${selectedSlotIndex === idx
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                >
                  {slot.time}{slot.endTime ? ` - ${slot.endTime}` : ''} • {slot.room}
                </button>
              ))}
            </div>
          )}

          {/* Controls bar */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search students..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              {/* Select All toggle */}
              <button
                onClick={toggleAll}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition border ${allFilteredChecked
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400'
                    : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
              >
                {allFilteredChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                {allFilteredChecked ? 'Deselect All' : 'Select All'}
              </button>
              {/* Back button */}
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                ← Back
              </button>
            </div>
          </div>

          {/* Student list */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium">{searchQuery ? 'No matching students' : 'No students in this section'}</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="divide-y divide-gray-50 dark:divide-gray-700/50 max-h-[500px] overflow-y-auto">
                {filteredStudents.map((student, i) => {
                  const isChecked = checkedStudents.has(student._id);
                  return (
                    <motion.button
                      key={student._id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: 0.015 * i }}
                      onClick={() => toggleStudent(student._id)}
                      className={`w-full flex items-center gap-4 px-5 py-3.5 text-left transition ${isChecked
                          ? 'bg-emerald-50/60 dark:bg-emerald-900/10 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                        }`}
                    >
                      {/* Checkbox */}
                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${isChecked
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-gray-300 dark:border-gray-500'
                        }`}>
                        {isChecked && <CheckCircle className="w-4 h-4" />}
                      </div>

                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {student.name.charAt(0).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{student.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {student.profile?.studentId || student.email}
                        </p>
                      </div>

                      {/* Status badge */}
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg shrink-0 ${isChecked
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}>
                        {isChecked ? 'Present' : 'Absent'}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Submit button */}
          {students.length > 0 && (
            <motion.button
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              onClick={submitAttendance}
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-2xl font-bold text-lg hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center gap-3"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCircle className="w-5 h-5" />
              )}
              Submit Attendance — {checkedStudents.size} Present, {students.length - checkedStudents.size} Absent
            </motion.button>
          )}
        </motion.div>
      )}
    </div>
  );
}

// ─── Student Attendance View (unchanged from original) ───────────────────────
function StudentAttendanceView() {
  const { token } = useAuth();
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/attendance/summary`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setStats(data.stats || []);
      } catch { /* ignore */ }
      setLoading(false);
    };
    if (token) fetchStats();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">My Attendance</h2>
      {stats.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No attendance records yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {stats.map((stat: any, i: number) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white">{stat.course?.name || 'Course'}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{stat.course?.code || ''}</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1 h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${stat.percentage >= 75 ? 'bg-emerald-500' : stat.percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${stat.percentage || 0}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{Math.round(stat.percentage || 0)}%</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {stat.present || 0} present / {stat.total || 0} total
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}