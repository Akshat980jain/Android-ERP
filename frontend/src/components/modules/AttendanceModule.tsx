// src/components/modules/AttendanceModule.tsx
import React, { useState, useEffect } from 'react';
import { Users, Calendar, CheckCircle, XCircle, Download, Clock, AlertTriangle, CheckSquare } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../utils/api';
import { ScheduleAttendanceData } from '../../types';

interface Student {
  _id: string;
  name: string;
  email: string;
  studentId: string;
}

interface Course {
  _id: string;
  name: string;
  code: string;
  schedule: Array<{
    day: string;
    time: string;
    room: string;
  }>;
}

interface ScheduleSlot {
  day: string;
  time: string;
  room: string;
}

interface AttendanceRecord {
  student: Student;
  status: 'present' | 'absent' | 'late' | null;
  markedAt: string | null;
  isWithinSchedule: boolean;
  remarks: string;
  lectureCount?: number;
}

export function AttendanceModule() {
  const { token, user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduleAttendance, setScheduleAttendance] = useState<ScheduleAttendanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!token) return;
    fetchCourses();
  }, [token]);

  useEffect(() => {
    if (selectedCourse && selectedDate) {
      fetchScheduleAttendance();
    }
  }, [selectedCourse, selectedDate]);

  const fetchCourses = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/courses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCourses(data.courses);
      }
    } catch {
      setError('Failed to fetch courses');
    }
  };

  const fetchScheduleAttendance = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiClient.getScheduleAttendance(selectedCourse, selectedDate);
      if (data.success) {
        setScheduleAttendance(data as ScheduleAttendanceData);
      } else {
        setError(data.message || 'Failed to fetch schedule attendance');
      }
    } catch (error) {
      console.error('Error fetching schedule attendance:', error);
      setError('Failed to fetch schedule attendance');
    }
    setLoading(false);
  };

  const isWithinTimeWindow = (slotTime: string, slotEndTime?: string) => {
    const now = currentTime;
    const slotStartTime = new Date(selectedDate + 'T' + slotTime);
    const endTime = slotEndTime
      ? new Date(selectedDate + 'T' + slotEndTime)
      : new Date(slotStartTime.getTime() + 60 * 60 * 1000); // default 1 hour
    
    // Allow marking attendance 15 minutes before and 30 minutes after the scheduled time
    const earlyWindow = new Date(slotStartTime.getTime() - 15 * 60 * 1000);
    const lateWindow = new Date(endTime.getTime() + 30 * 60 * 1000);
    
    return now >= earlyWindow && now <= lateWindow;
  };

  const getTimeStatus = (slotTime: string, slotEndTime?: string) => {
    const now = currentTime;
    const slotStartTime = new Date(selectedDate + 'T' + slotTime);
    const endTime = slotEndTime
      ? new Date(selectedDate + 'T' + slotEndTime)
      : new Date(slotStartTime.getTime() + 60 * 60 * 1000);
    
    if (now < slotStartTime) return 'upcoming';
    if (now >= slotStartTime && now <= endTime) return 'current';
    if (now > endTime) return 'past';
    return 'unknown';
  };

  const markAttendance = (slotIndex: number, studentIndex: number, status: 'present' | 'absent' | 'late') => {
    if (!scheduleAttendance) return;

    const updatedMatrix = [...scheduleAttendance.attendanceMatrix];
    updatedMatrix[slotIndex].attendance[studentIndex].status = status;
    updatedMatrix[slotIndex].attendance[studentIndex].markedAt = new Date().toISOString();
    updatedMatrix[slotIndex].attendance[studentIndex].isWithinSchedule = isWithinTimeWindow(updatedMatrix[slotIndex].slot.time, updatedMatrix[slotIndex].slot.endTime);

    setScheduleAttendance({
      ...scheduleAttendance,
      attendanceMatrix: updatedMatrix
    });
  };

  const submitAttendance = async (slotIndex: number) => {
    if (!scheduleAttendance) return;

    const slot = scheduleAttendance.attendanceMatrix[slotIndex];
    const attendanceData = slot.attendance
      .filter(record => record.status !== null && record.student._id)
      .map(record => ({
        studentId: record.student._id,
        status: record.status!,
        remarks: record.remarks
      }));

    if (attendanceData.length === 0) {
      setError('No attendance data to submit');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = await apiClient.markScheduleAttendance({
        courseId: selectedCourse,
        date: selectedDate,
        scheduleSlot: {
          startTime: slot.slot.time,
          endTime: slot.slot.endTime || slot.slot.time
        },
        attendanceData
      });

      if (data.success) {
        setSuccess(`Attendance marked successfully for ${slot.slot.time} slot!`);
        await fetchScheduleAttendance(); // Refresh data
      } else {
        setError(data.message || 'Failed to mark attendance');
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      setError('Failed to mark attendance');
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800 border-green-200';
      case 'absent': return 'bg-red-100 text-red-800 border-red-200';
      case 'late': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTimeStatusColor = (status: string) => {
    switch (status) {
      case 'current': return 'text-green-600';
      case 'upcoming': return 'text-blue-600';
      case 'past': return 'text-gray-500';
      default: return 'text-gray-600';
    }
  };

  const getTimeStatusIcon = (status: string) => {
    switch (status) {
      case 'current': return <Clock className="w-4 h-4" />;
      case 'upcoming': return <Calendar className="w-4 h-4" />;
      case 'past': return <CheckSquare className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Schedule-Based Attendance</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span>{currentTime.toLocaleTimeString()}</span>
        </div>
      </div>

      {error && <div className="text-red-700 bg-red-50 p-3 rounded flex items-center">
        <AlertTriangle className="w-4 h-4 mr-2" />
        {error}
      </div>}
      {success && <div className="text-green-700 bg-green-50 p-3 rounded">{success}</div>}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Course</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full border rounded px-3 py-2"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        {scheduleAttendance && (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">
                {scheduleAttendance.course.name} ({scheduleAttendance.course.code})
              </h3>
              <p className="text-blue-600">
                {new Date(scheduleAttendance.date).toLocaleDateString()} - {scheduleAttendance.dayOfWeek}
              </p>
            </div>

            {scheduleAttendance.attendanceMatrix.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No scheduled classes for this date</p>
              </div>
            ) : (
              <div className="space-y-6">
                {scheduleAttendance.attendanceMatrix.map((slotData, slotIndex) => {
                  const timeStatus = getTimeStatus(slotData.slot.time, slotData.slot.endTime);
                  const isWithinWindow = isWithinTimeWindow(slotData.slot.time, slotData.slot.endTime);
                  
                  return (
                    <div key={slotIndex} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          {getTimeStatusIcon(timeStatus)}
                          <div>
                            <h4 className="font-semibold text-lg">
                              {slotData.slot.time}{slotData.slot.endTime ? ` - ${slotData.slot.endTime}` : ''} - {slotData.slot.room}
                            </h4>
                            <p className={`text-sm ${getTimeStatusColor(timeStatus)}`}>
                              {timeStatus === 'current' ? 'Currently in session' :
                               timeStatus === 'upcoming' ? 'Upcoming' :
                               timeStatus === 'past' ? 'Completed' : 'Unknown'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!isWithinWindow && (
                            <div className="flex items-center text-orange-600 text-sm">
                              <AlertTriangle className="w-4 h-4 mr-1" />
                              Outside scheduled time window (updates still allowed)
                            </div>
                          )}
                          <button
                            onClick={() => submitAttendance(slotIndex)}
                            disabled={loading}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {loading ? 'Submitting...' : 'Submit Attendance'}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {slotData.attendance.map((record, studentIndex) => (
                          <div key={record.student._id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                            <div>
                              <div className="font-medium">{record.student.name}</div>
                              <div className="text-sm text-gray-600">
                                {record.student.studentId} • {record.student.email}
                              </div>
                              {record.markedAt && (
                                <div className="text-xs text-gray-500">
                                  Marked at: {new Date(record.markedAt).toLocaleTimeString()}
                                </div>
                              )}
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => markAttendance(slotIndex, studentIndex, 'present')}
                                className={`flex items-center px-3 py-1 rounded border ${
                                  record.status === 'present' 
                                    ? 'bg-green-600 text-white border-green-600' 
                                    : 'border-green-600 text-green-600 hover:bg-green-50'
                                }`}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Present
                              </button>
                              <button
                                onClick={() => markAttendance(slotIndex, studentIndex, 'absent')}
                                className={`flex items-center px-3 py-1 rounded border ${
                                  record.status === 'absent' 
                                    ? 'bg-red-600 text-white border-red-600' 
                                    : 'border-red-600 text-red-600 hover:bg-red-50'
                                }`}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Absent
                              </button>
                              <button
                                onClick={() => markAttendance(slotIndex, studentIndex, 'late')}
                                className={`flex items-center px-3 py-1 rounded border ${
                                  record.status === 'late' 
                                    ? 'bg-yellow-600 text-white border-yellow-600' 
                                    : 'border-yellow-600 text-yellow-600 hover:bg-yellow-50'
                                }`}
                              >
                                <Clock className="w-4 h-4 mr-1" />
                                Late
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {!selectedCourse && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Select a course to view schedule-based attendance</p>
          </div>
        )}
      </div>
    </div>
  );
}