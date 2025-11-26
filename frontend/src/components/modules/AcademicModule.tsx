import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Calendar, 
  BookOpen, 
  TrendingUp, 
  Award, 
  Clock, 
  Search,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Bell
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import apiClient from '../../utils/api';

// Enhanced Interfaces
interface Course {
  id: string;
  name: string;
  code: string;
  faculty: string;
  credits: number;
  semester: string;
  department: string;
  description?: string;
  attendance?: number;
  totalClasses?: number;
  attendedClasses?: number;
  status: 'active' | 'completed' | 'dropped';
}

interface Mark {
  id?: string;
  course: string;
  courseName?: string;
  type: string;
  marks: number;
  total: number;
  percentage: number;
  grade?: string;
  date: string;
  semester?: string;
  weightage?: number;
}

interface AttendanceRecord {
  courseId: string;
  courseName: string;
  totalClasses: number;
  attendedClasses: number;
  percentage: number;
  status: 'good' | 'warning' | 'critical';
  lastUpdated: string;
}

interface AcademicStats {
  overallAttendance: number;
  averageMarks: number;
  totalCredits: number;
  completedCredits: number;
  currentSemester: string;
  cgpa?: number;
  sgpa?: number;
}

// Enhanced Component
export function AcademicModule() {
  // State Management
  const [activeTab, setActiveTab] = useState('dashboard');
  const [courses, setCourses] = useState<Course[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [academicStats, setAcademicStats] = useState<AcademicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('current');
  const [sortBy, setSortBy] = useState<'name' | 'attendance' | 'marks' | 'credits'>('name');
  const [refreshing, setRefreshing] = useState(false);

  // Memoized filtered and sorted data
  const filteredCourses = useMemo(() => {
    return courses
      .filter(course => 
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.faculty.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        switch (sortBy) {
          case 'attendance':
            return (b.attendance || 0) - (a.attendance || 0);
          case 'credits':
            return b.credits - a.credits;
          case 'name':
          default:
            return a.name.localeCompare(b.name);
        }
      });
  }, [courses, searchTerm, sortBy]);

  const filteredMarks = useMemo(() => {
    return marks.filter(mark => 
      selectedSemester === 'current' || mark.semester === selectedSemester
    );
  }, [marks, selectedSemester]);

  // Enhanced data fetching
  const fetchAcademicData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');

    try {
      const [coursesRes, marksRes, attendanceRes] = await Promise.allSettled([
        apiClient.getMyCourses(),
        apiClient.getMarks(),
        apiClient.getAttendance()
      ]);

      // Process courses
      if (coursesRes.status === 'fulfilled' && coursesRes.value && typeof coursesRes.value === 'object' && 'courses' in coursesRes.value) {
        const courseList = Array.isArray(coursesRes.value.courses) 
          ? coursesRes.value.courses.map((course: any) => ({
              ...course,
              status: course.status || 'active'
            }))
          : [];
        setCourses(courseList);
      }

      // Process marks
      if (marksRes.status === 'fulfilled' && marksRes.value && typeof marksRes.value === 'object' && 'marks' in marksRes.value) {
        const marksList = Array.isArray(marksRes.value.marks)
          ? marksRes.value.marks.map((mark: any) => ({
              ...mark,
              percentage: ((mark.marks / mark.total) * 100).toFixed(1),
              grade: calculateGrade(mark.marks, mark.total)
            }))
          : [];
        setMarks(marksList);
      }

      // Process attendance
      if (attendanceRes.status === 'fulfilled' && attendanceRes.value && typeof attendanceRes.value === 'object' && 'stats' in attendanceRes.value) {
        console.log('Raw attendance response:', attendanceRes.value);
        console.log('Attendance stats:', attendanceRes.value.stats);
        
        const attendanceList = (attendanceRes.value.stats as any[]).map((stat: any) => {
          console.log('Processing attendance stat:', stat);
          return {
            courseId: stat.course?._id || stat.course?.id || '',
            courseName: stat.course?.name || 'Unknown Course',
            totalClasses: stat.total || 0, // Map from backend 'total' field
            attendedClasses: stat.present || 0, // Map from backend 'present' field
            percentage: stat.percentage || 0,
            status: getAttendanceStatus(stat.percentage || 0),
            lastUpdated: new Date().toISOString()
          };
        });
        
        console.log('Processed attendance list:', attendanceList);
        setAttendanceRecords(attendanceList);
        
        // Calculate overall attendance percentage
        if (attendanceList.length > 0) {
          const totalClasses = attendanceList.reduce((sum, record) => sum + record.totalClasses, 0);
          const totalAttended = attendanceList.reduce((sum, record) => sum + record.attendedClasses, 0);
          const overallPercentage = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 0;
          
          console.log('Overall attendance calculation:', {
            totalClasses,
            totalAttended,
            overallPercentage
          });
          
          setAcademicStats(prev => {
            if (!prev) {
              return {
                overallAttendance: overallPercentage,
                averageMarks: 0,
                totalCredits: 0,
                completedCredits: 0,
                currentSemester: '',
                cgpa: 0,
                sgpa: 0
              };
            }
            return {
              ...prev,
              overallAttendance: overallPercentage
            };
          });
        }
      }

      // Set default academic stats if not available
      if (!academicStats) {
        setAcademicStats({
          overallAttendance: 0,
          averageMarks: 0,
          totalCredits: 0,
          completedCredits: 0,
          currentSemester: '',
          cgpa: 0,
          sgpa: 0
        });
      }

    } catch (err) {
      setError('Failed to load academic data. Please try again later.');
      console.error('Academic data fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAcademicData();
  }, [fetchAcademicData]);

  // Helper functions
  const calculateGrade = (marks: number, total: number): string => {
    const percentage = (marks / total) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
  };

  const getAttendanceStatus = (percentage: number): 'good' | 'warning' | 'critical' => {
    if (percentage >= 85) return 'good';
    if (percentage >= 75) return 'warning';
    return 'critical';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'critical': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  // Enhanced tabs
  const tabs = [
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'marks', label: 'Marks & Grades', icon: Award },
    { id: 'schedule', label: 'Timetable', icon: Calendar },
  ];

  if (loading && !refreshing) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading academic data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with search and controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses, faculty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'attendance' | 'marks' | 'credits')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="name">Sort by Name</option>
            <option value="attendance">Sort by Attendance</option>
            <option value="credits">Sort by Credits</option>
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => fetchAcademicData(true)}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Error state */}
      {error && (
        <Card>
          <CardContent>
            <div className="text-center py-8">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 font-medium mb-2">Error Loading Data</p>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => fetchAcademicData()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && !error && (
        <div className="space-y-6">
          {/* Stats overview */}
          {academicStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Overall Attendance</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {academicStats.overallAttendance > 0 ? `${academicStats.overallAttendance}%` : 'N/A'}
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Average Marks</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {academicStats.averageMarks > 0 ? `${academicStats.averageMarks}%` : 'N/A'}
                      </p>
                    </div>
                    <Award className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Credits Progress</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {academicStats.totalCredits > 0 ? `${academicStats.completedCredits}/${academicStats.totalCredits}` : 'N/A'}
                      </p>
                    </div>
                    <BookOpen className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">CGPA</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {academicStats.cgpa && academicStats.cgpa > 0 ? academicStats.cgpa : 'N/A'}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Quick alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Quick Alerts</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {attendanceRecords.filter(record => record.status === 'critical').map(record => (
                  <div key={record.courseId} className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <div className="flex-1">
                      <p className="font-medium text-red-900">Low attendance in {record.courseName}</p>
                      <p className="text-sm text-red-700">
                        Current: {record.percentage}% - {record.requiredClasses && record.requiredClasses > 0 ? `Attend next ${record.requiredClasses} classes to reach 75%` : 'Attendance needs improvement'}
                      </p>
                    </div>
                  </div>
                ))}
                {attendanceRecords.filter(record => record.status === 'critical').length === 0 && (
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <p className="text-green-900">
                      {attendanceRecords.length > 0 ? 'All attendance requirements are on track!' : 'No attendance data available.'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Attendance Tab */}
      {activeTab === 'attendance' && !error && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {attendanceRecords.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No attendance data available.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {attendanceRecords.map((record) => (
                    <div key={record.courseId} className="p-4 bg-gray-50 rounded-lg border-l-4 border-l-blue-500">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium text-gray-900">{record.courseName}</h4>
                        {getStatusIcon(record.status)}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Attendance:</span>
                          <span className={`font-bold ${
                            record.status === 'good' ? 'text-green-600' : 
                            record.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {record.percentage.toFixed(1)}%
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Classes:</span>
                          <span className="text-gray-900">{record.attendedClasses}/{record.totalClasses}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                          <div
                            className={`h-2 rounded-full ${
                              record.status === 'good' ? 'bg-green-500' : 
                              record.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(record.percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Marks Tab */}
      {activeTab === 'marks' && !error && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Marks & Grades</CardTitle>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="current">Current Semester</option>
                  <option value="all">All Semesters</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              {filteredMarks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No marks data available.</div>
              ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assessment</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marks</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                      {filteredMarks.map((mark, index) => (
                        <tr key={mark.id || index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {mark.courseName || mark.course}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{mark.type}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {mark.marks}/{mark.total}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{mark.percentage}%</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              mark.grade === 'A+' || mark.grade === 'A' ? 'bg-green-100 text-green-800' :
                              mark.grade === 'B+' || mark.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                              mark.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {mark.grade}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(mark.date).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Schedule Tab */}
      {activeTab === 'schedule' && !error && (
        <Card>
          <CardHeader>
            <CardTitle>Weekly Timetable</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No timetable data available.</p>
              <p className="text-sm text-gray-400 mt-2">Contact admin to update your schedule.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Courses Tab */}
      {activeTab === 'courses' && !error && (
        <div className="space-y-6">
          {filteredCourses.length === 0 ? (
            <Card>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No courses found.</p>
                  <p className="text-sm text-gray-400 mt-2">
                    {searchTerm ? 'Try adjusting your search terms.' : 'Contact admin for course enrollment.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => {
                const attendanceRecord = attendanceRecords.find(record => record.courseId === course.id);
                return (
                  <Card key={course.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{course.name}</h3>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p><span className="font-medium">Code:</span> {course.code}</p>
                            <p><span className="font-medium">Credits:</span> {course.credits}</p>
                            <p><span className="font-medium">Faculty:</span> {course.faculty}</p>
                            <p><span className="font-medium">Department:</span> {course.department}</p>
                          </div>
                        </div>
                        <div className="ml-4">
                          <BookOpen className="w-8 h-8 text-blue-600" />
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-2 ${
                            course.status === 'active' ? 'bg-green-100 text-green-800' :
                            course.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {course.status}
                          </span>
                        </div>
                      </div>
                      
                      {attendanceRecord && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Attendance</span>
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(attendanceRecord.status)}
                              <span className={`font-bold text-sm ${
                                attendanceRecord.status === 'good' ? 'text-green-600' : 
                                attendanceRecord.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {attendanceRecord.percentage.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                attendanceRecord.status === 'good' ? 'bg-green-500' : 
                                attendanceRecord.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(attendanceRecord.percentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {course.description && (
                        <div className="mt-4">
                          <p className="text-sm text-gray-600">{course.description}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}