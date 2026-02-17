import React, { useEffect, useState } from 'react';
import { Users, GraduationCap, BookOpen, DollarSign, Shield, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { User as AppUser } from '../../types';
import apiClient from '../../utils/api';

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

  if (loading) return <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300">Loading requests...</div>;
  if (requests.length === 0) return null;

  return (
    <div className="mb-6 p-5 bg-emerald-50/80 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl">
      <div className="font-semibold text-emerald-800 dark:text-emerald-300 mb-3 flex items-center justify-between">
        <div className="flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          Pending Verification Requests ({requests.length})
        </div>
        <div className="text-sm font-medium px-3 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-lg">
          {typeLabel}
        </div>
      </div>
      {success && <div className="text-emerald-700 dark:text-emerald-400 text-sm mb-2">{success}</div>}
      {error && <div className="text-red-700 dark:text-red-400 text-sm mb-2">{error}</div>}
      <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
        {requests
          .filter(req => req.name && req.email && (req.user || req.password))
          .map(req => {
            let canApprove = false;
            if (adminType === 'head') {
              canApprove = true;
            } else if (adminType === 'program') {
              if (req.requestedRole === 'admin' && (req as any).adminType === 'branch') canApprove = true;
            } else if (adminType === 'branch') {
              if (req.requestedRole === 'student' || req.requestedRole === 'faculty') canApprove = true;
            }

            return (
              <div key={req._id} className="flex flex-col md:flex-row md:items-center justify-between bg-white dark:bg-gray-800/80 p-4 rounded-xl border border-gray-100 dark:border-gray-700/60 shadow-sm dark:shadow-gray-950/20">
                <div className="mb-2 md:mb-0">
                  <div className="font-medium text-gray-900 dark:text-gray-100 flex items-center">
                    {req.user?.name || req.name}
                    <span className="text-gray-500 dark:text-gray-400 font-normal text-sm ml-2">({req.user?.email || req.email})</span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 flex flex-wrap gap-2">
                    <span className="bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-md">Role: <span className="font-semibold">{req.requestedRole}</span></span>
                    {(req as any).adminType && (
                      <span className="bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded-md">Type: {(req as any).adminType}</span>
                    )}
                    {req.program && <span className="bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md">Prog: {req.program}</span>}
                    {req.user?.branch && <span className="bg-orange-50 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-md">Branch: {req.user.branch}</span>}
                  </div>
                  <input
                    type="text"
                    placeholder="Remarks (optional)"
                    className="mt-2 px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm w-full md:w-64 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={remarksMap[req._id] || ''}
                    onChange={e => setRemarksMap(prev => ({ ...prev, [req._id]: e.target.value }))}
                  />
                </div>
                <div className="flex space-x-2 mt-2 md:mt-0">
                  <button
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors shadow-sm"
                    onClick={() => handleDecision(req._id, 'approved')}
                    disabled={!canApprove}
                    title={!canApprove ? "You do not have permission to approve this role" : "Approve request"}
                  >
                    <CheckCircle className="w-4 h-4 mr-1.5" />Approve
                  </button>
                  <button
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500 text-white rounded-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors shadow-sm"
                    onClick={() => handleDecision(req._id, 'rejected')}
                    disabled={!canApprove}
                  >
                    <XCircle className="w-4 h-4 mr-1.5" />Reject
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </div>
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
    <div className="mb-6 p-5 bg-blue-50/80 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl">
      <div className="font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center">
        <Shield className="w-5 h-5 mr-2" />Program-specific Admins
      </div>
      <select
        className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 mb-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        value={selectedProgram}
        onChange={e => setSelectedProgram(e.target.value)}
      >
        <option value="">Select a program</option>
        {programOptions.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {loading && <div className="text-gray-600 dark:text-gray-400">Loading admins...</div>}
      {error && <div className="text-red-600 dark:text-red-400">{error}</div>}
      {admins.length > 0 && (
        <ul className="mt-2 space-y-1">
          {admins.map(admin => (
            <li key={admin._id || admin.id} className="bg-white dark:bg-gray-800/80 rounded-lg px-4 py-3 border border-gray-100 dark:border-gray-700/60 flex flex-col">
              <span className="font-medium text-gray-900 dark:text-gray-100">{admin.name} ({admin.email})</span>
              <span className="text-xs text-gray-600 dark:text-gray-400">Programs: {admin.adminPrograms?.join(', ')}</span>
            </li>
          ))}
        </ul>
      )}
      {selectedProgram && !loading && admins.length === 0 && !error && (
        <div className="text-gray-600 dark:text-gray-400 mt-2">No admins found for this program.</div>
      )}
    </div>
  );
}

export function AdminDashboard() {
  const { token, theme } = useAuth();
  const isDark = theme === 'dark';
  const [stats, setStats] = useState<{ totalStudents: number; totalFaculty: number; totalCourses: number; totalRevenue: number } | null>(null);
  const [departmentData, setDepartmentData] = useState<{ department: string; students: number }[]>([]);
  const [revenueData, setRevenueData] = useState<{ month: string; amount: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [genMsg, setGenMsg] = useState('');

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

  const quickStats = stats ? [
    { title: 'Total Students', value: stats.totalStudents, icon: Users, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-500/15' },
    { title: 'Faculty Members', value: stats.totalFaculty, icon: GraduationCap, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-50 dark:bg-green-500/15' },
    { title: 'Active Courses', value: stats.totalCourses, icon: BookOpen, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-500/15' },
    { title: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-50 dark:bg-orange-500/15' },
  ] : [];

  // Chart theme colors
  const chartColors = {
    grid: isDark ? '#374151' : '#e5e7eb',
    text: isDark ? '#9ca3af' : '#6b7280',
    tooltip: {
      bg: isDark ? '#1f2937' : '#ffffff',
      border: isDark ? '#374151' : '#e5e7eb',
      text: isDark ? '#f3f4f6' : '#111827',
    },
  };

  return (
    <div className="space-y-6">
      <AdminVerificationPanel />
      <ProgramAdminsPanel />

      {/* Permissions Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Permissions Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400">
                  <th className="py-2.5 pr-4 font-semibold">Module</th>
                  <th className="py-2.5 pr-4 font-semibold">Student</th>
                  <th className="py-2.5 pr-4 font-semibold">Faculty</th>
                  <th className="py-2.5 pr-4 font-semibold">Admin</th>
                  <th className="py-2.5 pr-4 font-semibold">Library</th>
                  <th className="py-2.5 pr-4 font-semibold">Placement</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { m: 'Courses', s: 'view', f: 'manage own', a: 'manage all', l: '-', p: '-' },
                  { m: 'Assignments', s: 'submit', f: 'create/grade', a: 'manage', l: '-', p: '-' },
                  { m: 'Exams', s: 'attempt', f: 'create/grade', a: 'manage', l: '-', p: '-' },
                  { m: 'Attendance', s: 'view', f: 'mark', a: 'manage', l: '-', p: '-' },
                  { m: 'Finance', s: 'pay/view', f: '-', a: 'manage', l: '-', p: '-' },
                  { m: 'Library', s: 'view/hold', f: 'view', a: 'manage', l: 'manage', p: '-' },
                  { m: 'Placement', s: 'apply', f: 'refer', a: 'manage', l: '-', p: 'manage' },
                  { m: 'Notifications', s: 'view', f: 'create', a: 'create', l: 'create', p: 'create' },
                ].map(row => (
                  <tr key={row.m} className="border-t border-gray-100 dark:border-gray-700/50">
                    <td className="py-2.5 pr-4 font-medium text-gray-900 dark:text-gray-100">{row.m}</td>
                    <td className="py-2.5 pr-4 text-gray-600 dark:text-gray-400">{row.s}</td>
                    <td className="py-2.5 pr-4 text-gray-600 dark:text-gray-400">{row.f}</td>
                    <td className="py-2.5 pr-4 text-gray-600 dark:text-gray-400">{row.a}</td>
                    <td className="py-2.5 pr-4 text-gray-600 dark:text-gray-400">{row.l}</td>
                    <td className="py-2.5 pr-4 text-gray-600 dark:text-gray-400">{row.p}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Reminders */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Reminders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">Generate reminders for fees due, upcoming assignments, and low attendance.</div>
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
            >
              Run Now
            </Button>
          </div>
          {genMsg && <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">{genMsg}</div>}
        </CardContent>
      </Card>

      {/* Stats & Charts */}
      {loading ? (
        <div className="p-6 text-center text-gray-500 dark:text-gray-400">Loading stats...</div>
      ) : error ? (
        <div className="p-6 text-center text-red-600 dark:text-red-400">{error}</div>
      ) : (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index}>
                  <CardContent className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                      <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bgColor}`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Department-wise Enrollment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={departmentData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                      <XAxis dataKey="department" angle={-45} textAnchor="end" height={60} tick={{ fill: chartColors.text, fontSize: 12 }} />
                      <YAxis tick={{ fill: chartColors.text, fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: chartColors.tooltip.bg, border: `1px solid ${chartColors.tooltip.border}`, borderRadius: '8px', color: chartColors.tooltip.text }}
                        labelStyle={{ color: chartColors.tooltip.text }}
                      />
                      <Bar dataKey="students" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                      <XAxis dataKey="month" tick={{ fill: chartColors.text, fontSize: 12 }} />
                      <YAxis tick={{ fill: chartColors.text, fontSize: 12 }} />
                      <Tooltip
                        formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                        contentStyle={{ backgroundColor: chartColors.tooltip.bg, border: `1px solid ${chartColors.tooltip.border}`, borderRadius: '8px', color: chartColors.tooltip.text }}
                        labelStyle={{ color: chartColors.tooltip.text }}
                      />
                      <Line type="monotone" dataKey="amount" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}