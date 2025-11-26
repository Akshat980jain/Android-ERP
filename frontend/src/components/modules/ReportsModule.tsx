import React, { useState, useEffect } from 'react';
import { FileText, Download, Filter, BarChart3, TrendingUp, Users, CreditCard, Calendar, Award } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface ReportData {
  academic?: any;
  financial?: any;
  attendance?: any;
  performance?: any;
}

interface FilterOptions {
  department: string;
  semester: string;
  academicYear: string;
  courseId: string;
  startDate: string;
  endDate: string;
}

export function ReportsModule() {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('academic');
  const [reportData, setReportData] = useState<ReportData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    department: '',
    semester: '',
    academicYear: new Date().getFullYear().toString(),
    courseId: '',
    startDate: '',
    endDate: ''
  });
  const [departments, setDepartments] = useState<string[]>([]);
  const [courses, setCourses] = useState<Array<{ _id: string; name: string }>>([]);

  useEffect(() => {
    fetchDepartments();
    fetchCourses();
    generateReport();
  }, [activeTab, filters]);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/auth/departments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments || []);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    setError('');
    
    try {
      let url = `/api/reports/${activeTab}?`;
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await fetch(url + params.toString(), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReportData(prev => ({ ...prev, [activeTab]: data.report }));
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to generate report');
      }
    } catch (error) {
      setError('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const exportReport = async (format: 'pdf' | 'csv') => {
    try {
      const response = await fetch('/api/reports/export', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reportType: activeTab,
          format,
          filters
        })
      });
      
      if (response.ok) {
        // In a real implementation, this would download the file
        alert(`${format.toUpperCase()} export will be implemented soon`);
      }
    } catch (error) {
      setError('Failed to export report');
    }
  };

  const tabs = [
    { id: 'academic', label: 'Academic Performance', icon: Award },
    { id: 'financial', label: 'Financial Reports', icon: CreditCard },
    { id: 'attendance', label: 'Attendance Reports', icon: Calendar },
    { id: 'performance', label: 'Performance Analysis', icon: TrendingUp }
  ];

  const renderAcademicReport = () => {
    const data = reportData.academic;
    if (!data) return null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalStudents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Average Marks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.performance?.averageMarks}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Pass Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.performance?.passRate}%</div>
            </CardContent>
          </Card>
        </div>

        {data.performance?.subjectWisePerformance && (
          <Card>
            <CardHeader>
              <CardTitle>Subject-wise Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.performance.subjectWisePerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="average" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {data.performance?.topPerformers && (
          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.performance.topPerformers.map((student: any, index: number) => (
                  <div key={student.studentId} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="font-medium">#{index + 1} Student {student.studentId}</span>
                    <span className="text-blue-600 font-bold">{student.average}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderFinancialReport = () => {
    const data = reportData.financial;
    if (!data) return null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Total Fees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{data.totalFees?.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Collected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">₹{data.collectedFees?.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">₹{data.pendingFees?.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Collection Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.collectionRate}%</div>
            </CardContent>
          </Card>
        </div>

        {data.departmentWise && (
          <Card>
            <CardHeader>
              <CardTitle>Department-wise Collection</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.departmentWise}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="collected" fill="#10b981" />
                  <Bar dataKey="pending" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {data.monthlyCollection && (
          <Card>
            <CardHeader>
              <CardTitle>Monthly Collection Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.monthlyCollection}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderAttendanceReport = () => {
    const data = reportData.attendance;
    if (!data) return null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Total Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalClasses}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Average Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.averageAttendance}%</div>
            </CardContent>
          </Card>
        </div>

        {data.departmentWise && (
          <Card>
            <CardHeader>
              <CardTitle>Department-wise Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.departmentWise}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="percentage" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {data.dateWise && (
          <Card>
            <CardHeader>
              <CardTitle>Date-wise Attendance Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.dateWise}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="percentage" stroke="#8b5cf6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {data.lowAttendanceStudents && (
          <Card>
            <CardHeader>
              <CardTitle>Low Attendance Students (&lt; 75%)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.lowAttendanceStudents.map((student: any) => (
                  <div key={student.studentId} className="flex justify-between items-center p-2 bg-red-50 rounded">
                    <span className="font-medium">{student.name}</span>
                    <span className="text-red-600 font-bold">{student.percentage}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderPerformanceReport = () => {
    const data = reportData.performance;
    if (!data) return null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalStudents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Average CGPA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.performanceMetrics?.averageCGPA}</div>
            </CardContent>
          </Card>
        </div>

        {data.performanceMetrics?.gradeDistribution && (
          <Card>
            <CardHeader>
              <CardTitle>Grade Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={Object.entries(data.performanceMetrics.gradeDistribution).map(([grade, count]) => ({
                      name: grade,
                      value: count
                    }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {Object.entries(data.performanceMetrics.gradeDistribution).map(([grade, count], index) => (
                      <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#6b7280'][index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {data.performanceMetrics?.subjectRankings && (
          <Card>
            <CardHeader>
              <CardTitle>Subject Rankings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.performanceMetrics.subjectRankings.map((subject: any, index: number) => (
                  <div key={subject.subject} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="font-medium">#{index + 1} {subject.subject}</span>
                    <span className="text-blue-600 font-bold">{subject.average}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {data.recommendations && (
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.recommendations.map((rec: string, index: number) => (
                  <div key={index} className="flex items-start space-x-2 p-2 bg-blue-50 rounded">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderReportContent = () => {
    switch (activeTab) {
      case 'academic':
        return renderAcademicReport();
      case 'financial':
        return renderFinancialReport();
      case 'attendance':
        return renderAttendanceReport();
      case 'performance':
        return renderPerformanceReport();
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Generate comprehensive reports for better decision making</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => exportReport('pdf')} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button onClick={() => exportReport('csv')} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                value={filters.department}
                onChange={(e) => handleFilterChange('department', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
              <select
                value={filters.semester}
                onChange={(e) => handleFilterChange('semester', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">All Semesters</option>
                <option value="1st">1st Semester</option>
                <option value="2nd">2nd Semester</option>
                <option value="3rd">3rd Semester</option>
                <option value="4th">4th Semester</option>
                <option value="5th">5th Semester</option>
                <option value="6th">6th Semester</option>
                <option value="7th">7th Semester</option>
                <option value="8th">8th Semester</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
              <Input
                type="number"
                value={filters.academicYear}
                onChange={(e) => handleFilterChange('academicYear', e.target.value)}
                placeholder="2024"
              />
            </div>
            {activeTab === 'attendance' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <Input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <Input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  />
                </div>
              </>
            )}
            {(activeTab === 'academic' || activeTab === 'performance') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                <select
                  value={filters.courseId}
                  onChange={(e) => handleFilterChange('courseId', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">All Courses</option>
                  {courses.map(course => (
                    <option key={course._id} value={course._id}>{course.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4 inline mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Report Content */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Generating report...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">{error}</div>
          <Button onClick={generateReport}>Try Again</Button>
        </div>
      ) : (
        renderReportContent()
      )}
    </div>
  );
}
