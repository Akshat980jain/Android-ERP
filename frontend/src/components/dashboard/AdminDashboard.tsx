import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, GraduationCap, BookOpen, DollarSign, Shield, CheckCircle, XCircle, Bell, Zap, BarChart3 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, StatCard } from '../ui/Card';
import { Button } from '../ui/Button';
import { TiltCard } from '../ui/SpecialEffects';
import { Reveal } from '../ui/Reveal';
import { DynamicBackground } from '../ui/DynamicBackground';
import { FloatingParticles } from '../ui/SpecialEffects';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { User as AppUser } from '../../types';
import apiClient from '../../utils/api';
import { clsx } from 'clsx';
import {
  pageVariants, pageTransition, staggerContainer, staggerItem, fadeInUpVariants
} from '../../utils/animations';

// Types
interface RequestUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  branch?: string;
  program?: string;
}
interface VerificationRequest {
  _id: string;
  user?: RequestUser | null;
  requestedRole: string;
  status?: string;
  remarks?: string;
  name?: string;
  email?: string;
  password?: string;
  reason?: string;
  program?: string;
  branch?: string;
  adminType?: 'head' | 'program' | 'branch';
}

// Helper to get admin type with fallback
function getAdminType(user: AppUser | null): 'head' | 'program' | 'branch' | null {
  if (!user || user.role !== 'admin') return null;
  if (user.adminType) return user.adminType as any;
  if (Array.isArray(user.adminPrograms) && user.adminPrograms.length > 0) {
    return 'program';
  }
  return 'head';
}

// Permission badge component
function PermBadge({ perm }: { perm: string }) {
  if (perm === '-') return <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>;
  const fullAccess = ['manage all', 'manage', 'create', 'mark', 'create/grade'].some(k => perm.includes(k));
  const partialAccess = ['view', 'submit', 'attempt', 'apply', 'pay/view', 'view/hold', 'refer'].some(k => perm.includes(k));
  return (
    <span className={clsx(
      'inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors',
      fullAccess
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
        : partialAccess
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400'
          : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'
    )}>
      {perm}
    </span>
  );
}

// AdminVerificationPanel: visible only to admins
function AdminVerificationPanel() {
  const { user, token } = useAuth();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [remarksMap, setRemarksMap] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchRequests();
    }
    // eslint-disable-next-line
  }, [user]);

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiClient.getVerificationRequests(token || undefined) as { success: boolean; requests: VerificationRequest[]; message?: string };
      if (data.success) {
        setRequests(data.requests);
      } else {
        setError(data.message || 'Failed to fetch requests');
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
      setError('Failed to fetch requests');
    }
    setLoading(false);
  };

  const handleDecision = async (id: string, status: 'approved' | 'rejected') => {
    setError('');
    setSuccess('');
    const remarks = remarksMap[id] || '';
    try {
      const data = await apiClient.processVerificationRequest(id, status, remarks, token || undefined) as { success: boolean; message?: string };
      if (data.success) {
        setSuccess('Request processed!');
        setRequests(requests.filter(r => r._id !== id));
        setRemarksMap(prev => { const copy = { ...prev }; delete copy[id]; return copy; });
      } else {
        console.error('Decision error:', data);
        setError(data.message || 'Failed to process request');
      }
    } catch (error) {
      console.error('Failed to process request:', error);
      setError('Failed to process request');
    }
  };

  if (!user || user.role !== 'admin') return null;

  const adminType = getAdminType(user);
  const typeLabel = adminType === 'head' ? 'Head Admin' :
    adminType === 'program' ? 'Program Admin' :
      adminType === 'branch' ? 'Branch Admin' : 'Admin';

  if (loading) return (
    <div className="mb-6 p-5 bg-gray-50/80 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-600 dark:text-gray-300">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        Loading requests...
      </div>
    </div>
  );
  if (requests.length === 0) return null;

  return (
    <Reveal>
      <div className="mb-2 p-5 bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-emerald-500/10 dark:to-teal-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl backdrop-blur-sm">
        <div className="font-semibold text-emerald-800 dark:text-emerald-300 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <span className="text-base">Pending Verification Requests</span>
              <span className="ml-2 px-2 py-0.5 bg-emerald-200 dark:bg-emerald-500/25 text-emerald-800 dark:text-emerald-300 text-xs rounded-full font-bold">{requests.length}</span>
            </div>
          </div>
          <div className="text-sm font-medium px-3 py-1.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-xl">
            {typeLabel}
          </div>
        </div>
        {success && <div className="text-emerald-700 dark:text-emerald-400 text-sm mb-3 flex items-center gap-2"><CheckCircle className="w-4 h-4" />{success}</div>}
        {error && <div className="text-red-700 dark:text-red-400 text-sm mb-3">{error}</div>}
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
          {requests
            .filter(req => req.name && req.email && (req.user || req.password))
            .map((req, index) => {
              let canApprove = false;
              if (adminType === 'head') {
                canApprove = true;
              } else if (adminType === 'program') {
                if (req.requestedRole === 'admin' && (req as any).adminType === 'branch') canApprove = true;
              } else if (adminType === 'branch') {
                if (req.requestedRole === 'student' || req.requestedRole === 'faculty') canApprove = true;
              }

              return (
                <motion.div
                  key={req._id}
                  className="flex flex-col md:flex-row md:items-center justify-between bg-white/80 dark:bg-gray-800/80 p-4 rounded-xl border border-gray-100 dark:border-gray-700/60 shadow-sm dark:shadow-gray-950/20 backdrop-blur-sm hover:shadow-md transition-all duration-300"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                >
                  <div className="mb-2 md:mb-0">
                    <div className="font-medium text-gray-900 dark:text-gray-100 flex items-center">
                      {req.user?.name || req.name}
                      <span className="text-gray-500 dark:text-gray-400 font-normal text-sm ml-2">({req.user?.email || req.email})</span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 flex flex-wrap gap-2">
                      <span className="bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-lg">Role: <span className="font-semibold">{req.requestedRole}</span></span>
                      {(req as any).adminType && (
                        <span className="bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded-lg">Type: {(req as any).adminType}</span>
                      )}
                      {req.program && <span className="bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-lg">Prog: {req.program}</span>}
                      {req.user?.branch && <span className="bg-orange-50 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-lg">Branch: {req.user.branch}</span>}
                    </div>
                    <input
                      type="text"
                      placeholder="Remarks (optional)"
                      className="mt-2 px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm w-full md:w-64 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-shadow"
                      value={remarksMap[req._id] || ''}
                      onChange={e => setRemarksMap(prev => ({ ...prev, [req._id]: e.target.value }))}
                    />
                  </div>
                  <div className="flex space-x-2 mt-2 md:mt-0">
                    <motion.button
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-xl flex items-center disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors shadow-sm"
                      onClick={() => handleDecision(req._id, 'approved')}
                      disabled={!canApprove}
                      title={!canApprove ? "You do not have permission to approve this role" : "Approve request"}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <CheckCircle className="w-4 h-4 mr-1.5" />Approve
                    </motion.button>
                    <motion.button
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500 text-white rounded-xl flex items-center disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors shadow-sm"
                      onClick={() => handleDecision(req._id, 'rejected')}
                      disabled={!canApprove}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <XCircle className="w-4 h-4 mr-1.5" />Reject
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
        </div>
      </div>
    </Reveal>
  );
}

const programOptions = [
  { value: 'B.Tech', label: 'B.Tech' },
  { value: 'M.Tech', label: 'M.Tech' },
  { value: 'B.Pharma', label: 'B.Pharma' },
  { value: 'MCA', label: 'MCA' },
  { value: 'MBA', label: 'MBA' }
];

// Only show ProgramAdminsPanel for super-admins (not program admins)
function ProgramAdminsPanel() {
  const { user, token } = useAuth();
  const [selectedProgram, setSelectedProgram] = useState('');
  const [admins, setAdmins] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedProgram) fetchAdmins(selectedProgram);
    else setAdmins([]);
    // eslint-disable-next-line
  }, [selectedProgram]);

  if (!user || user.role !== 'admin' || getAdminType(user) !== 'head') return null;

  async function fetchAdmins(program: string) {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.getAdminsByProgram(program, token || undefined) as { success: boolean; admins: AppUser[]; message?: string };
      if (res.success) setAdmins(res.admins);
      else setError(res.message || 'Failed to fetch admins');
    } catch {
      setError('Failed to fetch admins');
    }
    setLoading(false);
  }

  return (
    <Reveal delay={0.1}>
      <div className="mb-2 p-5 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-500/10 dark:to-indigo-500/10 border border-blue-200 dark:border-blue-500/30 rounded-2xl backdrop-blur-sm">
        <div className="font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          Program-specific Admins
        </div>
        <select
          className="border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 mb-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm transition-shadow"
          value={selectedProgram}
          onChange={e => setSelectedProgram(e.target.value)}
        >
          <option value="">Select a program</option>
          {programOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {loading && <div className="text-gray-600 dark:text-gray-400 flex items-center gap-2"><div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />Loading admins...</div>}
        {error && <div className="text-red-600 dark:text-red-400">{error}</div>}
        {admins.length > 0 && (
          <ul className="mt-2 space-y-2">
            {admins.map((admin, index) => (
              <motion.li
                key={admin._id || admin.id}
                className="bg-white/80 dark:bg-gray-800/80 rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-700/60 flex flex-col backdrop-blur-sm hover:shadow-md transition-all duration-300"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 }}
              >
                <span className="font-medium text-gray-900 dark:text-gray-100">{admin.name} ({admin.email})</span>
                <span className="text-xs text-gray-600 dark:text-gray-400">Programs: {admin.adminPrograms?.join(', ')}</span>
              </motion.li>
            ))}
          </ul>
        )}
        {selectedProgram && !loading && admins.length === 0 && !error && (
          <div className="text-gray-600 dark:text-gray-400 mt-2">No admins found for this program.</div>
        )}
      </div>
    </Reveal>
  );
}

// Permissions matrix data
const permissionsData = [
  { m: 'Courses', s: 'view', f: 'manage own', a: 'manage all', l: '-', p: '-' },
  { m: 'Assignments', s: 'submit', f: 'create/grade', a: 'manage', l: '-', p: '-' },
  { m: 'Exams', s: 'attempt', f: 'create/grade', a: 'manage', l: '-', p: '-' },
  { m: 'Attendance', s: 'view', f: 'mark', a: 'manage', l: '-', p: '-' },
  { m: 'Finance', s: 'pay/view', f: '-', a: 'manage', l: '-', p: '-' },
  { m: 'Library', s: 'view/hold', f: 'view', a: 'manage', l: 'manage', p: '-' },
  { m: 'Placement', s: 'apply', f: 'refer', a: 'manage', l: '-', p: 'manage' },
  { m: 'Notifications', s: 'view', f: 'create', a: 'create', l: 'create', p: 'create' },
];

export function AdminDashboard() {
  const { user, token, theme } = useAuth();
  const isDark = theme === 'dark';
  const [stats, setStats] = useState<{ totalStudents: number; totalFaculty: number; totalCourses: number; totalRevenue: number } | null>(null);
  const [departmentData, setDepartmentData] = useState<{ department: string; students: number }[]>([]);
  const [revenueData, setRevenueData] = useState<{ month: string; amount: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [genMsg, setGenMsg] = useState('');

  const adminType = getAdminType(user);
  const typeLabel = adminType === 'head' ? 'Head Admin' :
    adminType === 'program' ? 'Program Admin' :
      adminType === 'branch' ? 'Branch Admin' : 'Admin';

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        const [statsRes, deptRes, revRes] = await Promise.all([
          apiClient.getAdminStats(token || undefined) as Promise<{ success: boolean; stats: any; message?: string }>,
          apiClient.getDepartmentEnrollment(token || undefined) as Promise<{ success: boolean; departments: any[]; message?: string }>,
          apiClient.getMonthlyRevenue(token || undefined) as Promise<{ success: boolean; revenue: any[]; message?: string }>
        ]);
        if (statsRes.success) setStats(statsRes.stats);
        else setError(statsRes.message || 'Failed to fetch stats');
        if (deptRes.success) setDepartmentData(deptRes.departments);
        else setError(deptRes.message || 'Failed to fetch department data');
        if (revRes.success) setRevenueData(revRes.revenue);
        else setError(revRes.message || 'Failed to fetch revenue data');
      } catch {
        setError('Failed to fetch dashboard data');
      }
      setLoading(false);
    };
    fetchStats();
  }, [token]);

  // Chart theme colors
  const chartColors = {
    grid: isDark ? '#374151' : '#f0f0f0',
    text: isDark ? '#9ca3af' : '#6b7280',
    tooltip: {
      bg: isDark ? '#1f2937' : '#ffffff',
      border: isDark ? '#374151' : '#e5e7eb',
      text: isDark ? '#f3f4f6' : '#111827',
    },
  };

  const quickStats = stats ? [
    { title: 'Total Students', value: stats.totalStudents.toLocaleString(), icon: Users, colorKey: 'blue', trendLabel: 'Enrolled' },
    { title: 'Faculty Members', value: stats.totalFaculty.toLocaleString(), icon: GraduationCap, colorKey: 'green', trendLabel: 'Active' },
    { title: 'Active Courses', value: stats.totalCourses.toLocaleString(), icon: BookOpen, colorKey: 'purple', trendLabel: 'Running' },
    { title: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, colorKey: 'orange', trendLabel: 'This Year' },
  ] : [];

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
      <DynamicBackground variant="gradient-mesh" intensity="subtle" colorScheme="blue" theme={isDark ? 'dark' : 'light'}
        className="!fixed top-0 left-0 w-full h-72 pointer-events-none" />
      <FloatingParticles count={12} />

      {/* Welcome Header */}
      <Reveal>
        <motion.div
          className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden"
          variants={fadeInUpVariants}
          initial="initial"
          animate="animate"
        >
          {/* Animated radial pattern */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(255,255,255,0.3),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(120,119,198,0.3),transparent_50%)]" />
          </div>
          {/* Animated floating circles */}
          <motion.div
            className="absolute top-4 right-20 w-24 h-24 bg-white/10 rounded-full blur-xl"
            animate={{ y: [0, -15, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-2 left-32 w-16 h-16 bg-purple-300/10 rounded-full blur-lg"
            animate={{ y: [0, 10, 0], scale: [1, 0.9, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />

          <div className="flex items-center justify-between relative z-10">
            <div>
              <motion.h1
                className="text-2xl font-bold mb-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Welcome back, {user?.name || 'Admin'}! 🛡️
              </motion.h1>
              <motion.p
                className="text-blue-100"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                {typeLabel} • {stats?.totalStudents || 0} students, {stats?.totalFaculty || 0} faculty members
              </motion.p>
            </div>
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
            >
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                <Shield className="w-8 h-8" />
              </div>
            </motion.div>
          </div>
        </motion.div>
      </Reveal>

      {/* Verification & Program Panels */}
      <AdminVerificationPanel />
      <ProgramAdminsPanel />

      {/* Permissions Matrix */}
      <Reveal delay={0.15}>
        <Card variant="elevated">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <CardTitle>Permissions Matrix</CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Role-based access control overview</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-100 dark:border-gray-700/60">
                    <th className="py-3 pr-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Module</th>
                    <th className="py-3 pr-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Student</th>
                    <th className="py-3 pr-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Faculty</th>
                    <th className="py-3 pr-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Admin</th>
                    <th className="py-3 pr-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Library</th>
                    <th className="py-3 pr-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Placement</th>
                  </tr>
                </thead>
                <tbody>
                  {permissionsData.map((row, index) => (
                    <motion.tr
                      key={row.m}
                      className="border-b border-gray-50 dark:border-gray-800/60 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * index }}
                    >
                      <td className="py-3 pr-4 font-medium text-gray-900 dark:text-gray-100">{row.m}</td>
                      <td className="py-3 pr-4"><PermBadge perm={row.s} /></td>
                      <td className="py-3 pr-4"><PermBadge perm={row.f} /></td>
                      <td className="py-3 pr-4"><PermBadge perm={row.a} /></td>
                      <td className="py-3 pr-4"><PermBadge perm={row.l} /></td>
                      <td className="py-3 pr-4"><PermBadge perm={row.p} /></td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </Reveal>

      {/* Scheduled Reminders */}
      <Reveal delay={0.2}>
        <Card variant="gradient">
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  className="w-12 h-12 bg-amber-100 dark:bg-amber-500/20 rounded-2xl flex items-center justify-center"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Bell className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </motion.div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Scheduled Reminders</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Generate reminders for fees due, upcoming assignments, and low attendance
                  </p>
                </div>
              </div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={async () => {
                    setGenMsg('');
                    try {
                      const res = await apiClient.generateReminders();
                      const created = (res as any)?.created ?? 0;
                      setGenMsg(`Generated ${created} reminder(s).`);
                    } catch {
                      setGenMsg('Failed to generate reminders');
                    }
                  }}
                  size="sm"
                  className="shadow-lg shadow-blue-500/25"
                >
                  <Zap className="w-4 h-4 mr-1.5" /> Run Now
                </Button>
              </motion.div>
            </div>
            {genMsg && (
              <motion.div
                className="mt-3 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/60 px-3 py-2 rounded-xl"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {genMsg}
              </motion.div>
            )}
          </CardContent>
        </Card>
      </Reveal>

      {/* Stats & Charts */}
      {loading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Loading dashboard data...</p>
        </div>
      ) : error ? (
        <div className="p-6 text-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-2xl border border-red-200 dark:border-red-500/30">{error}</div>
      ) : (
        <>
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

          {/* Charts */}
          <Reveal delay={0.2}>
            <motion.div
              className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {/* Department Enrollment Chart */}
              <motion.div variants={staggerItem}>
                <Card variant="elevated">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <CardTitle>Department-wise Enrollment</CardTitle>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Student distribution across departments</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={departmentData}>
                          <defs>
                            <linearGradient id="barGradientBlue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                              <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.8} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                          <XAxis dataKey="department" angle={-45} textAnchor="end" height={60} tick={{ fill: chartColors.text, fontSize: 12 }} />
                          <YAxis tick={{ fill: chartColors.text, fontSize: 12 }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: chartColors.tooltip.bg,
                              border: `1px solid ${chartColors.tooltip.border}`,
                              borderRadius: '12px',
                              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                              color: chartColors.tooltip.text
                            }}
                            labelStyle={{ color: chartColors.tooltip.text }}
                          />
                          <Bar dataKey="students" fill="url(#barGradientBlue)" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Revenue Trend Chart — AreaChart for premium fill */}
              <motion.div variants={staggerItem}>
                <Card variant="elevated">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <CardTitle>Monthly Revenue Trend</CardTitle>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Revenue collection over time</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueData}>
                          <defs>
                            <linearGradient id="areaGradientGreen" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                              <stop offset="100%" stopColor="#10B981" stopOpacity={0.02} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                          <XAxis dataKey="month" tick={{ fill: chartColors.text, fontSize: 12 }} />
                          <YAxis tick={{ fill: chartColors.text, fontSize: 12 }} />
                          <Tooltip
                            formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Revenue']}
                            contentStyle={{
                              backgroundColor: chartColors.tooltip.bg,
                              border: `1px solid ${chartColors.tooltip.border}`,
                              borderRadius: '12px',
                              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                              color: chartColors.tooltip.text
                            }}
                            labelStyle={{ color: chartColors.tooltip.text }}
                          />
                          <Area type="monotone" dataKey="amount" stroke="#10B981" strokeWidth={2.5} fill="url(#areaGradientGreen)" dot={{ fill: '#10B981', r: 4, strokeWidth: 2, stroke: '#ffffff' }} activeDot={{ r: 6 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </Reveal>
        </>
      )}
    </motion.div>
  );
}