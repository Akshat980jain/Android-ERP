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
  // Use explicit type if available
  if (user.adminType) return user.adminType as any;
  // Fallback logic for legacy users
  if (Array.isArray(user.adminPrograms) && user.adminPrograms.length > 0) {
    // If they have a branch, they might be a branch admin, but let's default to program for safety unless explicit
    // Actually, in the old system, "Program Admin" was the only type other than Head.
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
        // Backend now handles all filtering based on admin type
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

  if (loading) return <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">Loading requests...</div>;
  if (requests.length === 0) return null;

  return (
    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
      <div className="font-semibold text-green-800 mb-2 flex items-center justify-between">
        <div className="flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          Pending Verification Requests ({requests.length})
        </div>
        <div className="text-sm text-green-700 font-medium px-2 py-1 bg-green-100 rounded">
          {typeLabel}
        </div>
      </div>
      {success && <div className="text-green-700 text-sm mb-2">{success}</div>}
      {error && <div className="text-red-700 text-sm mb-2">{error}</div>}
      {/* Scrollable container for many requests */}
      <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
        {requests
          .filter(req => req.name && req.email && (req.user || req.password))
          .map(req => {
            // Permission check for UI button state
            let canApprove = false;
            if (adminType === 'head') {
              // Head approves Program Admin, Library, Placement
              // Also unassigned requests
              canApprove = true;
            } else if (adminType === 'program') {
              // Program Admin approves Branch Admin and Faculty
              if (req.requestedRole === 'admin' && (req as any).adminType === 'branch') canApprove = true;
              if (req.requestedRole === 'faculty') canApprove = true;
            } else if (adminType === 'branch') {
              // Branch Admin approves Students
              if (req.requestedRole === 'student') canApprove = true;
            }

            return (
              <div key={req._id} className="flex flex-col md:flex-row md:items-center justify-between bg-white p-3 rounded border shadow-sm">
                <div className="mb-2 md:mb-0">
                  <div className="font-medium flex items-center">
                    {req.user?.name || req.name}
                    <span className="text-gray-500 font-normal text-sm ml-2">({req.user?.email || req.email})</span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1 flex flex-wrap gap-2">
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded">Role: <span className="font-semibold">{req.requestedRole}</span></span>
                    {(req as any).adminType && (
                      <span className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">Type: {(req as any).adminType}</span>
                    )}
                    {req.program && <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">Prog: {req.program}</span>}
                    {req.user?.branch && <span className="bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded">Branch: {req.user.branch}</span>}
                  </div>
                  <input
                    type="text"
                    placeholder="Remarks (optional)"
                    className="mt-2 px-2 py-1 border rounded text-sm w-full md:w-64"
                    value={remarksMap[req._id] || ''}
                    onChange={e => setRemarksMap(prev => ({ ...prev, [req._id]: e.target.value }))}
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                    onClick={() => handleDecision(req._id, 'approved')}
                    disabled={!canApprove}
                    title={!canApprove ? "You do not have permission to approve this role" : "Approve request"}
                  >
                    <CheckCircle className="w-4 h-4 mr-1.5" />Approve
                  </button>
                  <button
                    className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
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
    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="font-semibold text-blue-800 mb-2 flex items-center">
        <Shield className="w-5 h-5 mr-2" />Program-specific Admins
      </div>
      <select
        className="border border-gray-300 rounded px-2 py-1 mb-2"
        value={selectedProgram}
        onChange={e => setSelectedProgram(e.target.value)}
      >
        <option value="">Select a program</option>
        {programOptions.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {loading && <div>Loading admins...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {admins.length > 0 && (
        <ul className="mt-2 space-y-1">
          {admins.map(admin => (
            <li key={admin._id || admin.id} className="bg-white rounded px-3 py-2 border flex flex-col">
              <span className="font-medium">{admin.name} ({admin.email})</span>
              <span className="text-xs text-gray-600">Programs: {admin.adminPrograms?.join(', ')}</span>
            </li>
          ))}
        </ul>
      )}
      {selectedProgram && !loading && admins.length === 0 && !error && (
        <div className="text-gray-600 mt-2">No admins found for this program.</div>
      )}
    </div>
  );
}

export function AdminDashboard() {
  const { token } = useAuth();
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
    { title: 'Total Students', value: stats.totalStudents, icon: Users, color: 'text-blue-600' },
    { title: 'Faculty Members', value: stats.totalFaculty, icon: GraduationCap, color: 'text-green-600' },
    { title: 'Active Courses', value: stats.totalCourses, icon: BookOpen, color: 'text-purple-600' },
    { title: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-orange-600' },
  ] : [];

  return (
    <div className="space-y-6">
      <AdminVerificationPanel />
      <ProgramAdminsPanel />
      <Card>
        <CardHeader>
          <CardTitle>Permissions Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-4">Module</th>
                  <th className="py-2 pr-4">Student</th>
                  <th className="py-2 pr-4">Faculty</th>
                  <th className="py-2 pr-4">Admin</th>
                  <th className="py-2 pr-4">Library</th>
                  <th className="py-2 pr-4">Placement</th>
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
                  <tr key={row.m} className="border-t">
                    <td className="py-2 pr-4 font-medium">{row.m}</td>
                    <td className="py-2 pr-4">{row.s}</td>
                    <td className="py-2 pr-4">{row.f}</td>
                    <td className="py-2 pr-4">{row.a}</td>
                    <td className="py-2 pr-4">{row.l}</td>
                    <td className="py-2 pr-4">{row.p}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scheduled Reminders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Generate reminders for fees due, upcoming assignments, and low attendance.</div>
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
          {genMsg && <div className="mt-2 text-sm text-gray-700">{genMsg}</div>}
        </CardContent>
      </Card>
      {loading ? (
        <div className="p-6 text-center text-gray-500">Loading stats...</div>
      ) : error ? (
        <div className="p-6 text-center text-red-600">{error}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index}>
                  <CardContent className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                    <Icon className={`w-8 h-8 ${stat.color}`} />
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Department-wise Enrollment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={departmentData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="department" angle={-45} textAnchor="end" height={60} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="students" fill="#3B82F6" />
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
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                      <Line type="monotone" dataKey="amount" stroke="#10B981" strokeWidth={2} />
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