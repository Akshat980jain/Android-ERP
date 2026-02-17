import { useState, useEffect } from 'react';
import { Users, BookOpen, Clock, BarChart3 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../utils/api';

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

  // Define the request type
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
    <Card>
      <CardHeader>
        <CardTitle>Faculty Approval Requests</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400 text-center py-4">No pending requests</div>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => (
              <div key={request._id} className="border border-gray-100 dark:border-gray-700/60 rounded-xl p-4 bg-gray-50/50 dark:bg-gray-800/40">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {request.studentName || request.user?.name || request.name || 'Unknown'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {request.courseName || request.user?.email || request.email || 'No details'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {request.requestType || `Requested Role: ${request.requestedRole}` || 'Verification Request'}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleApproval(request._id, 'approved')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 dark:hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleApproval(request._id, 'rejected')}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 dark:hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function FacultyDashboard() {
  // Attendance data fetched from API
  const [attendanceData, setAttendanceData] = useState([
    { name: 'Present', value: 0, color: '#10B981' },
    { name: 'Absent', value: 0, color: '#EF4444' },
  ]);

  const marksData = [
    { subject: 'No Data', marks: 0 },
  ];

  const { user } = useAuth();
  const [facultyCourses, setFacultyCourses] = useState<Array<{
    _id: string;
    name: string;
    code: string;
    status?: string;
  }>>([]);

  // Calculate quick stats based on actual data
  const quickStats = [
    {
      title: 'Total Students',
      value: '0',
      icon: Users,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-500/15',
    },
    {
      title: 'Courses Teaching',
      value: facultyCourses.length.toString(),
      icon: BookOpen,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-500/15',
    },
    {
      title: 'Pending Requests',
      value: '0',
      icon: Clock,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-500/15',
    },
    {
      title: 'Active Courses',
      value: facultyCourses.filter(c => c.status !== 'inactive').length.toString(),
      icon: BarChart3,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-500/15',
    },
  ];

  useEffect(() => {
    const loadFacultyData = async () => {
      if (!user || user.role !== 'faculty') return;
      try {
        // Load courses
        const data = await apiClient.getFacultyCourses();
        if (data && typeof data === 'object' && 'success' in data && data.success) {
          const courseResponse = data as CourseResponse;
          setFacultyCourses(courseResponse.courses || []);
        }

        // Load attendance stats for the faculty's courses
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

  return (
    <div className="space-y-6">
      <FacultyApprovalPanel />

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

      {/* Attendance & Marks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {attendanceData[0].value === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  No attendance data available
                </div>
              ) : (
                <div className="space-y-4 pt-4">
                  {attendanceData.map((entry) => (
                    <div key={entry.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{entry.name}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{entry.value}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 dark:bg-gray-700/60 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${entry.value}%`, backgroundColor: entry.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Marks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {marksData[0].marks === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  No marks data available
                </div>
              ) : (
                <ul className="space-y-3 pt-4">
                  {marksData.map((entry, index) => (
                    <li key={index} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50/80 dark:bg-gray-800/40">
                      <span className="text-gray-700 dark:text-gray-300">{entry.subject}</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">{entry.marks}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}