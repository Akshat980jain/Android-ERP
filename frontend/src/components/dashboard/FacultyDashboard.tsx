import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, BookOpen, Clock, BarChart3 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, StatCard } from '../ui/Card';
import { TiltCard } from '../ui/SpecialEffects';
import { Reveal } from '../ui/Reveal';
import { DynamicBackground } from '../ui/DynamicBackground';
import { FloatingParticles } from '../ui/SpecialEffects';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../utils/api';
import {
  pageVariants, pageTransition, staggerContainer, staggerItem, fadeInUpVariants
} from '../../utils/animations';

interface CourseResponse {
  success: boolean;
  message?: string;
  courses: Array<{
    _id: string;
    name: string;
    code: string;
    status?: string;
  }>;
}

function FacultyApprovalPanel() {
  const { user } = useAuth();

  type Request = {
    _id: string;
    studentName?: string;
    courseName?: string;
    requestType?: string;
    status?: string;
    user?: {
      name?: string;
      email?: string;
    };
    name?: string;
    email?: string;
    requestedRole?: string;
  };

  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      try {
        const response = await apiClient.getFacultyRequests();
        if (response && typeof response === 'object' && 'success' in response && response.success) {
          const requestsData = (response as any).requests || [];
          setRequests(requestsData);
        }
      } catch (error) {
        console.error('Failed to fetch requests:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'admin') {
      fetchRequests();
    }
  }, [user]);

  const handleApproval = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      const response = await apiClient.updateFacultyRequest(requestId, { status });
      if (response && typeof response === 'object' && 'success' in response && response.success) {
        setRequests(prev => prev.map(req =>
          req._id === requestId ? { ...req, status } : req
        ));
      }
    } catch (error) {
      console.error('Failed to update request:', error);
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <Reveal>
      <Card variant="elevated">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-500/20 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <CardTitle>Faculty Approval Requests</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-6">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">Loading...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400 text-center py-6 text-sm">No pending requests</div>
          ) : (
            <div className="space-y-3">
              {requests.map((request, index) => (
                <motion.div
                  key={request._id}
                  className="border border-gray-100 dark:border-gray-700/60 rounded-xl p-4 bg-gray-50/50 dark:bg-gray-800/40 hover:shadow-md transition-all duration-300 backdrop-blur-sm"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {request.studentName || request.user?.name || request.name || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {request.courseName || request.user?.email || request.email || 'No details'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {request.requestType || `Requested Role: ${request.requestedRole}` || 'Verification Request'}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <motion.button
                        onClick={() => handleApproval(request._id, 'approved')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 dark:hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        Approve
                      </motion.button>
                      <motion.button
                        onClick={() => handleApproval(request._id, 'rejected')}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 dark:hover:bg-red-500 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        Reject
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Reveal>
  );
}

export function FacultyDashboard() {
  const { user, theme } = useAuth();
  const isDark = theme === 'dark';

  const [attendanceData, setAttendanceData] = useState([
    { name: 'Present', value: 0, color: '#10B981' },
    { name: 'Absent', value: 0, color: '#EF4444' },
  ]);

  const marksData = [
    { subject: 'No Data', marks: 0 },
  ];

  const [facultyCourses, setFacultyCourses] = useState<Array<{
    _id: string;
    name: string;
    code: string;
    status?: string;
  }>>([]);

  const quickStats = [
    { title: 'Total Students', value: '0', icon: Users, colorKey: 'green', trendLabel: 'Enrolled' },
    { title: 'Courses Teaching', value: facultyCourses.length.toString(), icon: BookOpen, colorKey: 'blue', trendLabel: 'Active' },
    { title: 'Pending Requests', value: '0', icon: Clock, colorKey: 'orange', trendLabel: 'Awaiting' },
    { title: 'Active Courses', value: facultyCourses.filter(c => c.status !== 'inactive').length.toString(), icon: BarChart3, colorKey: 'purple', trendLabel: 'Running' },
  ];

  useEffect(() => {
    const loadFacultyData = async () => {
      if (!user || user.role !== 'faculty') return;
      try {
        const data = await apiClient.getFacultyCourses();
        if (data && typeof data === 'object' && 'success' in data && data.success) {
          const courseResponse = data as CourseResponse;
          setFacultyCourses(courseResponse.courses || []);
        }

        const attendanceRes = await apiClient.getAttendance();
        if (attendanceRes && typeof attendanceRes === 'object' && 'stats' in attendanceRes) {
          const stats = (attendanceRes as any).stats || [];
          let totalPresent = 0;
          let totalAbsent = 0;
          stats.forEach((s: any) => {
            totalPresent += s.present || 0;
            totalAbsent += (s.total || 0) - (s.present || 0);
          });
          const totalAll = totalPresent + totalAbsent;
          if (totalAll > 0) {
            setAttendanceData([
              { name: 'Present', value: Math.round((totalPresent / totalAll) * 100), color: '#10B981' },
              { name: 'Absent', value: Math.round((totalAbsent / totalAll) * 100), color: '#EF4444' },
            ]);
          }
        }
      } catch (err: unknown) {
        console.error('Failed to load faculty data:', err);
      }
    };

    loadFacultyData();
  }, [user]);

  // SVG ring calculations
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const presentPercent = attendanceData[0].value;
  const presentDash = (presentPercent / 100) * circumference;

  return (
    <motion.div
      className="space-y-8 relative min-h-screen"
      variants={pageVariants}
      initial="initial"
      animate="in"
      exit="out"
      transition={pageTransition}
    >
      {/* Ambient background */}
      <DynamicBackground variant="floating-orbs" intensity="subtle" colorScheme="ocean" theme={isDark ? 'dark' : 'light'}
        className="!fixed top-0 left-0 w-full h-72 pointer-events-none" />
      <FloatingParticles count={10} />

      {/* Welcome Header */}
      <Reveal>
        <motion.div
          className="bg-gradient-to-r from-teal-500 via-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden"
          variants={fadeInUpVariants}
          initial="initial"
          animate="animate"
        >
          {/* Animated radial pattern */}
          <div className="absolute inset-0 opacity-15 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.3),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(56,189,248,0.3),transparent_50%)]" />
          </div>
          {/* Floating circles */}
          <motion.div
            className="absolute top-2 right-16 w-20 h-20 bg-white/10 rounded-full blur-xl"
            animate={{ y: [0, -12, 0], scale: [1, 1.15, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-1 left-28 w-14 h-14 bg-teal-300/10 rounded-full blur-lg"
            animate={{ y: [0, 8, 0], scale: [1, 0.9, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          />

          <div className="flex items-center justify-between relative z-10">
            <div>
              <motion.h1
                className="text-2xl font-bold mb-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Welcome, {user?.name || 'Faculty'}! 📚
              </motion.h1>
              <motion.p
                className="text-teal-100"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                Teaching {facultyCourses.length} course(s) this semester
              </motion.p>
            </div>
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
            >
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-8 h-8" />
              </div>
            </motion.div>
          </div>
        </motion.div>
      </Reveal>

      {/* Approval Panel */}
      <FacultyApprovalPanel />

      {/* Quick Stats */}
      <Reveal delay={0.1}>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {quickStats.map((stat, index) => (
            <motion.div key={index} variants={staggerItem} custom={index}>
              <TiltCard>
                <StatCard
                  title={stat.title}
                  value={stat.value}
                  icon={stat.icon}
                  color={stat.colorKey}
                  trend="neutral"
                  trendValue={stat.trendLabel}
                />
              </TiltCard>
            </motion.div>
          ))}
        </motion.div>
      </Reveal>

      {/* Attendance & Marks */}
      <Reveal delay={0.2}>
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {/* Attendance Overview — SVG Circular Progress Ring */}
          <motion.div variants={staggerItem}>
            <Card variant="elevated">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <CardTitle>Attendance Overview</CardTitle>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Student attendance distribution</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center h-64">
                  {attendanceData[0].value === 0 ? (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Clock className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">No attendance data available</p>
                    </div>
                  ) : (
                    <>
                      <div className="relative w-48 h-48">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                          {/* Background ring */}
                          <circle cx="60" cy="60" r={radius} fill="none"
                            stroke="currentColor" strokeWidth="10"
                            className="text-gray-100 dark:text-gray-800" />
                          {/* Absent ring (red) */}
                          <circle cx="60" cy="60" r={radius} fill="none"
                            stroke="#EF4444" strokeWidth="10" strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={0}
                            opacity={0.15}
                          />
                          {/* Present ring (green) — animated */}
                          <motion.circle cx="60" cy="60" r={radius} fill="none"
                            stroke="url(#ringGradient)" strokeWidth="10" strokeLinecap="round"
                            strokeDasharray={circumference}
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset: circumference - presentDash }}
                            transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                          />
                          <defs>
                            <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#10B981" />
                              <stop offset="100%" stopColor="#34D399" />
                            </linearGradient>
                          </defs>
                        </svg>
                        {/* Center text */}
                        <motion.div
                          className="absolute inset-0 flex flex-col items-center justify-center"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.8 }}
                        >
                          <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                            {presentPercent}%
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Present</span>
                        </motion.div>
                      </div>
                      {/* Legend */}
                      <div className="flex justify-center gap-6 mt-4">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/30" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Present {attendanceData[0].value}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-500/30" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Absent {attendanceData[1].value}%</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Marks — Animated Gradient Bars */}
          <motion.div variants={staggerItem}>
            <Card variant="elevated">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle>Recent Marks</CardTitle>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Subject-wise performance</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex flex-col justify-center">
                  {marksData[0].marks === 0 ? (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <BarChart3 className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">No marks data available</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {marksData.map((entry, index) => (
                        <motion.div
                          key={index}
                          className="flex items-center gap-4"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + index * 0.12 }}
                        >
                          <span className="w-24 text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                            {entry.subject}
                          </span>
                          <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-700/60 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                              initial={{ width: 0 }}
                              animate={{ width: `${entry.marks}%` }}
                              transition={{ duration: 1, delay: 0.4 + index * 0.15, ease: "easeOut" }}
                            />
                          </div>
                          <span className="w-10 text-right text-sm font-bold text-blue-600 dark:text-blue-400">
                            {entry.marks}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </Reveal>
    </motion.div>
  );
}