import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, AlertTriangle, Target, Award } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';

interface StudentAnalytics {
  student: {
    name: string;
    studentId: string;
    department: string;
    semester: number;
  };
  attendance: {
    totalClasses: number;
    presentClasses: number;
    percentage: number;
  };
  academic: {
    totalAssessments: number;
    averagePercentage: number;
    cgpa: string;
  };
  financial: {
    totalFees: number;
    paidFees: number;
    pendingFees: number;
  };
  predictions: {
    dropoutRisk: {
      score: number;
      level: string;
      factors: string[];
    };
    expectedCGPA: string;
    recommendedActions: string[];
  };
}

interface DepartmentAnalytics {
  totalStudents: number;
  averageAttendance: number;
  averageMarks: number;
  feeCollection: {
    total: number;
    collected: number;
  };
}

export function AnalyticsModule() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [studentAnalytics, setStudentAnalytics] = useState<StudentAnalytics | null>(null);
  const [departmentAnalytics, setDepartmentAnalytics] = useState<DepartmentAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');

  useEffect(() => {
    if (user?.role === 'student') {
      fetchStudentAnalytics();
    } else if (user?.role === 'admin' && selectedDepartment) {
      fetchDepartmentAnalytics(selectedDepartment);
    }
  }, [user, selectedDepartment]);

  const fetchStudentAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/analytics/student', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setStudentAnalytics(data.analytics);
      } else {
        setError(data.message || 'Failed to fetch analytics');
      }
    } catch {
      setError('Failed to fetch analytics');
    }
    setLoading(false);
  };

  const fetchDepartmentAnalytics = async (department: string) => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/analytics/department/${department}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setDepartmentAnalytics(data.analytics);
      } else {
        setError(data.message || 'Failed to fetch department analytics');
      }
    } catch {
      setError('Failed to fetch department analytics');
    }
    setLoading(false);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const tabs = user?.role === 'student' 
    ? [
        { id: 'overview', label: 'Performance Overview' },
        { id: 'predictions', label: 'Predictions & Insights' },
        { id: 'recommendations', label: 'Recommendations' }
      ]
    : [
        { id: 'overview', label: 'Department Overview' },
        { id: 'trends', label: 'Trends & Patterns' },
        { id: 'predictions', label: 'Risk Analysis' }
      ];

  const departments = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Chemical'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Insights</h1>
        </div>
        
        {user?.role === 'admin' && (
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Department</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        )}
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading analytics...</div>
      ) : user?.role === 'student' && studentAnalytics ? (
        <>
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="text-center p-6">
                    <Target className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{studentAnalytics.attendance.percentage}%</p>
                    <p className="text-sm text-gray-600">Attendance Rate</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="text-center p-6">
                    <Award className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{studentAnalytics.academic.cgpa}</p>
                    <p className="text-sm text-gray-600">Current CGPA</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="text-center p-6">
                    <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{studentAnalytics.academic.averagePercentage}%</p>
                    <p className="text-sm text-gray-600">Average Marks</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Attendance Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Total Classes:</span>
                        <span className="font-medium">{studentAnalytics.attendance.totalClasses}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Classes Attended:</span>
                        <span className="font-medium text-green-600">{studentAnalytics.attendance.presentClasses}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${studentAnalytics.attendance.percentage}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Financial Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Total Fees:</span>
                        <span className="font-medium">₹{studentAnalytics.financial.totalFees.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Paid:</span>
                        <span className="font-medium text-green-600">₹{studentAnalytics.financial.paidFees.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Pending:</span>
                        <span className="font-medium text-red-600">₹{studentAnalytics.financial.pendingFees.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'predictions' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Dropout Risk Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className={`px-4 py-2 rounded-lg ${getRiskColor(studentAnalytics.predictions.dropoutRisk.level)}`}>
                      <span className="font-medium">
                        {studentAnalytics.predictions.dropoutRisk.level.toUpperCase()} RISK
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {studentAnalytics.predictions.dropoutRisk.score}%
                    </div>
                  </div>
                  
                  {studentAnalytics.predictions.dropoutRisk.factors.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Risk Factors:</h4>
                      <ul className="space-y-1">
                        {studentAnalytics.predictions.dropoutRisk.factors.map((factor, index) => (
                          <li key={index} className="flex items-center text-sm text-gray-600">
                            <AlertTriangle className="w-4 h-4 mr-2 text-yellow-500" />
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'recommendations' && (
            <Card>
              <CardHeader>
                <CardTitle>Personalized Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {studentAnalytics.predictions.recommendedActions.map((action, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                      <Target className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">{action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : user?.role === 'admin' && departmentAnalytics && selectedDepartment ? (
        <>
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="text-center p-6">
                    <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{departmentAnalytics.totalStudents}</p>
                    <p className="text-sm text-gray-600">Total Students</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="text-center p-6">
                    <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{departmentAnalytics.averageAttendance}%</p>
                    <p className="text-sm text-gray-600">Avg Attendance</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="text-center p-6">
                    <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{departmentAnalytics.averageMarks}%</p>
                    <p className="text-sm text-gray-600">Avg Marks</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="text-center p-6">
                    <TrendingUp className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.round((departmentAnalytics.feeCollection.collected / departmentAnalytics.feeCollection.total) * 100)}%
                    </p>
                    <p className="text-sm text-gray-600">Fee Collection</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Department Performance Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-4">Fee Collection Status</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Total Fees:</span>
                          <span className="font-medium">₹{departmentAnalytics.feeCollection.total.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Collected:</span>
                          <span className="font-medium text-green-600">₹{departmentAnalytics.feeCollection.collected.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Pending:</span>
                          <span className="font-medium text-red-600">
                            ₹{(departmentAnalytics.feeCollection.total - departmentAnalytics.feeCollection.collected).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-4">Performance Metrics</h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-600">Average Attendance</span>
                            <span className="text-sm font-medium">{departmentAnalytics.averageAttendance}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${departmentAnalytics.averageAttendance}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-600">Average Marks</span>
                            <span className="text-sm font-medium">{departmentAnalytics.averageMarks}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${departmentAnalytics.averageMarks}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Dashboard</h3>
            <p className="text-gray-600">
              {user?.role === 'admin' 
                ? 'Select a department to view detailed analytics and insights.'
                : 'Analytics and insights for your academic performance.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}