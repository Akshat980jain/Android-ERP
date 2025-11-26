import React, { useState, useEffect } from 'react';
import { CheckCircle, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../utils/api';

// Types for API responses
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  [key: string]: unknown;
}

interface CourseResponse extends ApiResponse<unknown> {
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
        // Fetch faculty approval requests
        const response = await apiClient.getFacultyRequests();
        if (response && typeof response === 'object' && 'success' in response && response.success) {
          // Handle the response structure from verification-requests endpoint
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
        // Update local state
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
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-4">Faculty Approval Requests</h3>
      {loading ? (
        <div className="text-center py-4">Loading...</div>
      ) : requests.length === 0 ? (
        <div className="text-gray-500 text-center py-4">No pending requests</div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <div key={request._id} className="border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {request.studentName || request.user?.name || request.name || 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {request.courseName || request.user?.email || request.email || 'No details'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {request.requestType || `Requested Role: ${request.requestedRole}` || 'Verification Request'}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleApproval(request._id, 'approved')}
                    className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleApproval(request._id, 'rejected')}
                    className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function FacultyDashboard() {
  // Initialize with empty data
  const attendanceData = [
    { name: 'Present', value: 0, color: '#10B981' },
    { name: 'Absent', value: 0, color: '#EF4444' },
  ];

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
      icon: CheckCircle, 
      color: 'text-green-600' 
    },
    { 
      title: 'Courses Teaching', 
      value: facultyCourses.length.toString(), 
      icon: Shield, 
      color: 'text-blue-600' 
    },
    { 
      title: 'Pending Requests', 
      value: '0', 
      icon: CheckCircle, 
      color: 'text-orange-600' 
    },
    { 
      title: 'Active Courses', 
      value: facultyCourses.filter(c => c.status !== 'inactive').length.toString(), 
      icon: Shield, 
      color: 'text-purple-600' 
    },
  ];

  useEffect(() => {
    const loadFacultyCourses = async () => {
      if (!user || user.role !== 'faculty') return;
      try {
        const data = await apiClient.getFacultyCourses();
        if (data && typeof data === 'object' && 'success' in data && data.success) {
          const courseResponse = data as CourseResponse;
          setFacultyCourses(courseResponse.courses || []);
        }
      } catch (err: unknown) {
        console.error('Failed to load faculty courses:', err);
      }
    };

    loadFacultyCourses();
  }, [user]);

  return (
    <div className="space-y-6">
      <FacultyApprovalPanel />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
              <Icon className={`w-8 h-8 ${stat.color}`} />
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-2">Attendance Overview</h3>
          <div className="h-64">
            {attendanceData[0].value === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                No attendance data available
              </div>
            ) : (
              <ul className="space-y-2">
                {attendanceData.map((entry) => (
                  <li key={entry.name} className="flex items-center">
                    <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
                    <span className="text-gray-700">{entry.name}: {entry.value}%</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-2">Recent Marks</h3>
          <div className="h-64">
            {marksData[0].marks === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                No marks data available
              </div>
            ) : (
              <ul className="space-y-2">
                {marksData.map((entry, index) => (
                  <li key={index} className="flex items-center justify-between">
                    <span className="text-gray-700">{entry.subject}</span>
                    <span className="font-semibold text-blue-600">{entry.marks}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}