// src/components/modules/ScheduleModule.tsx
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Plus, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../utils/api';

interface ScheduleItem {
  _id: string;
  course: {
    _id: string;
    name: string;
    code: string;
  };
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string;
  type: 'lecture' | 'lab' | 'tutorial' | 'seminar';
  faculty: {
    _id: string;
    name: string;
  };
  lectureCount?: number;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', 
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', 
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
];

// Utility function to convert time string to minutes for sorting
const timeToMinutes = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Utility function to validate time range
const isValidTimeRange = (startTime: string, endTime: string) => {
  return timeToMinutes(endTime) > timeToMinutes(startTime);
};

// Utility function to get end time 1 hour after start time
const getDefaultEndTime = (startTime: string) => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const endHours = hours + 1;
  const endMinutes = minutes;
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
};

// Utility function to calculate duration between two times
const getDuration = (startTime: string, endTime: string) => {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const durationMinutes = endMinutes - startMinutes;
  
  if (durationMinutes <= 0) return '0 min';
  
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  
  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${minutes}m`;
  }
};

export function ScheduleModule() {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [courses, setCourses] = useState<Array<{ _id: string; name: string; code: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [newScheduleItem, setNewScheduleItem] = useState({
    course: '',
    dayOfWeek: 'Monday',
    startTime: '09:00',
    endTime: '10:00',
    room: '',
    type: 'lecture' as 'lecture' | 'lab' | 'tutorial' | 'seminar'
  });

  useEffect(() => {
    fetchSchedule();
    fetchCourses();
  }, []);

  // Clear success/error messages after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const fetchSchedule = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiClient.getSchedule() as { success: boolean; schedule: ScheduleItem[]; message?: string };
      console.log('Fetched schedule data:', data);
      if (data.success) {
        console.log('Setting schedule with items:', data.schedule.length);
        setSchedule(data.schedule);
      } else {
        setError(data.message || 'Failed to fetch schedule');
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
      setError('Failed to fetch schedule');
    }
    setLoading(false);
  };

  const fetchCourses = async () => {
    try {
      const data = await apiClient.getCourses() as { success: boolean; courses: Array<{ _id: string; name: string; code: string }>; message?: string };
      if (data.success) {
        setCourses(data.courses);
      }
    } catch {
      console.log('Failed to fetch courses');
    }
  };

  const addScheduleItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate time range
    if (!isValidTimeRange(newScheduleItem.startTime, newScheduleItem.endTime)) {
      setError('End time must be after start time');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const scheduleData = {
        courseId: newScheduleItem.course,
        dayOfWeek: newScheduleItem.dayOfWeek,
        startTime: newScheduleItem.startTime,
        endTime: newScheduleItem.endTime,
        room: newScheduleItem.room,
        type: newScheduleItem.type
      };
      
      const data = await apiClient.addScheduleItem(scheduleData) as { success: boolean; message?: string };
      if (data.success) {
        await fetchSchedule(); // Refresh the schedule
        setNewScheduleItem({
          course: '',
          dayOfWeek: 'Monday',
          startTime: '09:00',
          endTime: '10:00', // Always 1 hour after start time
          room: '',
          type: 'lecture'
        });
        setShowAddForm(false);
        setSuccess('Schedule item added successfully!');
      } else {
        setError(data.message || 'Failed to add schedule item');
      }
    } catch {
      setError('Failed to add schedule item');
    }
    setLoading(false);
  };

  const updateScheduleItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    // Validate time range
    if (!isValidTimeRange(newScheduleItem.startTime, newScheduleItem.endTime)) {
      setError('End time must be after start time');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const scheduleData = {
        courseId: newScheduleItem.course,
        dayOfWeek: newScheduleItem.dayOfWeek,
        startTime: newScheduleItem.startTime,
        endTime: newScheduleItem.endTime,
        room: newScheduleItem.room,
        type: newScheduleItem.type,
        // Provide original identifiers so backend can find and update the correct slot
        originalCourseId: editingItem.course._id,
        originalDayOfWeek: editingItem.dayOfWeek,
        originalStartTime: editingItem.startTime,
      };
      
      const data = await apiClient.updateScheduleItem(editingItem.course._id, scheduleData) as { success: boolean; message?: string };
      console.log('Update response:', data);
      if (data.success) {
        console.log('Update successful, refreshing schedule...');
        await fetchSchedule(); // Refresh the schedule
        setEditingItem(null);
        setShowAddForm(false);
        setNewScheduleItem({
          course: '',
          dayOfWeek: 'Monday',
          startTime: '09:00',
          endTime: '10:00', // Always 1 hour after start time
          room: '',
          type: 'lecture'
        });
        setSuccess('Schedule item updated successfully!');
      } else {
        setError(data.message || 'Failed to update schedule item');
      }
    } catch {
      setError('Failed to update schedule item');
    }
    setLoading(false);
  };

  const deleteScheduleItem = async (item: ScheduleItem) => {
    if (!window.confirm('Are you sure you want to delete this schedule item?')) return;

    try {
      const scheduleData = {
        courseId: item.course._id,
        dayOfWeek: item.dayOfWeek,
        startTime: item.startTime
      };
      
      const data = await apiClient.deleteScheduleItem(item.course._id, scheduleData) as { success: boolean; message?: string };
      if (data.success) {
        await fetchSchedule(); // Refresh the schedule
        setSuccess('Schedule item deleted successfully!');
      } else {
        setError(data.message || 'Failed to delete schedule item');
      }
    } catch {
      setError('Failed to delete schedule item');
    }
  };

  const startEditing = (item: ScheduleItem) => {
    setEditingItem(item);
    setNewScheduleItem({
      course: item.course._id,
      dayOfWeek: item.dayOfWeek,
      startTime: item.startTime,
      endTime: item.endTime,
      room: item.room,
      type: item.type
    });
    setShowAddForm(true);
  };

  const getScheduleForDay = (day: string) => {
    return schedule
      .filter(item => item.dayOfWeek === day)
      .sort((a, b) => {
        // Convert time strings to minutes for proper numerical sorting
        const aMinutes = timeToMinutes(a.startTime);
        const bMinutes = timeToMinutes(b.startTime);
        
        return aMinutes - bMinutes; // Sort in ascending order (earliest first)
      });
  };

  const getTotalDayDuration = (day: string) => {
    const daySchedule = getScheduleForDay(day);
    let totalMinutes = 0;
    
    daySchedule.forEach(item => {
      totalMinutes += timeToMinutes(item.endTime) - timeToMinutes(item.startTime);
    });
    
    if (totalMinutes <= 0) return '0 min';
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lecture': return 'bg-blue-100 text-blue-800';
      case 'lab': return 'bg-green-100 text-green-800';
      case 'tutorial': return 'bg-yellow-100 text-yellow-800';
      case 'seminar': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Schedule</h2>
        {user?.role !== 'student' && (
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setEditingItem(null);
              setNewScheduleItem({
                course: '',
                dayOfWeek: 'Monday',
                startTime: '09:00',
                endTime: '10:00', // Always 1 hour after start time
                room: '',
                type: 'lecture'
              });
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            {editingItem ? 'Cancel Edit' : 'Add Schedule'}
          </button>
        )}
      </div>

      {error && <div className="text-red-700 bg-red-50 p-3 rounded">{error}</div>}
      {success && <div className="text-green-700 bg-green-50 p-3 rounded">{success}</div>}

      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4">
            {editingItem ? 'Edit Schedule Item' : 'Add New Schedule Item'}
          </h3>
          <form onSubmit={editingItem ? updateScheduleItem : addScheduleItem} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                <select
                  value={newScheduleItem.course}
                  onChange={(e) => setNewScheduleItem({ ...newScheduleItem, course: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  <option value="">Select a course</option>
                  {courses.map(course => (
                    <option key={course._id} value={course._id}>
                      {course.name} ({course.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={newScheduleItem.type}
                  onChange={(e) => setNewScheduleItem({ ...newScheduleItem, type: e.target.value as 'lecture' | 'lab' | 'tutorial' | 'seminar' })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="lecture">Lecture</option>
                  <option value="lab">Lab</option>
                  <option value="tutorial">Tutorial</option>
                  <option value="seminar">Seminar</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                <select
                  value={newScheduleItem.dayOfWeek}
                  onChange={(e) => setNewScheduleItem({ ...newScheduleItem, dayOfWeek: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  {DAYS_OF_WEEK.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <div className="flex gap-2">
                  <input
                    type="time"
                    value={newScheduleItem.startTime}
                    onChange={(e) => {
                      const newStartTime = e.target.value;
                      setNewScheduleItem({ 
                        ...newScheduleItem, 
                        startTime: newStartTime,
                        // Auto-adjust end time if it's now invalid
                        endTime: newStartTime && newScheduleItem.endTime && 
                                !isValidTimeRange(newStartTime, newScheduleItem.endTime)
                                  ? getDefaultEndTime(newStartTime)
                                  : newScheduleItem.endTime
                      });
                    }}
                    className="flex-1 border rounded px-3 py-2"
                    required
                  />
                  <select
                    value={newScheduleItem.startTime}
                    onChange={(e) => {
                      const newStartTime = e.target.value;
                      if (newStartTime) {
                        setNewScheduleItem({ 
                          ...newScheduleItem, 
                          startTime: newStartTime,
                          // Auto-adjust end time if it's now invalid
                          endTime: newScheduleItem.endTime && 
                                  !isValidTimeRange(newStartTime, newScheduleItem.endTime)
                                    ? getDefaultEndTime(newStartTime)
                                    : newScheduleItem.endTime
                        });
                      }
                    }}
                    className="w-24 border rounded px-2 py-2 text-xs"
                  >
                    <option value="">Quick</option>
                    {TIME_SLOTS.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-gray-500 mt-1">Enter custom time or use quick select</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <div className="flex gap-2">
                  <input
                    type="time"
                    value={newScheduleItem.endTime}
                    onChange={(e) => setNewScheduleItem({ ...newScheduleItem, endTime: e.target.value })}
                    className={`flex-1 border rounded px-3 py-2 ${
                      newScheduleItem.startTime && newScheduleItem.endTime && 
                      !isValidTimeRange(newScheduleItem.startTime, newScheduleItem.endTime)
                        ? 'border-red-500' : ''
                    }`}
                    required
                  />
                  <select
                    value={newScheduleItem.endTime}
                    onChange={(e) => setNewScheduleItem({ ...newScheduleItem, endTime: e.target.value })}
                    className="w-24 border rounded px-2 py-2 text-xs"
                  >
                    <option value="">Quick</option>
                    {TIME_SLOTS.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {newScheduleItem.startTime && newScheduleItem.endTime && 
                   !isValidTimeRange(newScheduleItem.startTime, newScheduleItem.endTime)
                    ? '⚠️ End time must be after start time'
                    : 'Enter custom time or use quick select'
                  }
                </p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
              <input
                type="text"
                placeholder="Room number or location"
                value={newScheduleItem.room}
                onChange={(e) => setNewScheduleItem({ ...newScheduleItem, room: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div className="flex space-x-2">
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700" disabled={loading}>
                {loading ? (editingItem ? 'Updating...' : 'Adding...') : (editingItem ? 'Update' : 'Add')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingItem(null);
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-7 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
          {DAYS_OF_WEEK.map(day => (
            <div key={day} className="p-4">
              <h3 className="font-semibold text-lg text-gray-800 mb-4 flex items-center justify-between">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  {day}
                </div>
                <span className="text-sm text-gray-500 font-normal">
                  {getTotalDayDuration(day)}
                </span>
              </h3>
              <div className="space-y-2">
                {getScheduleForDay(day).map((item, index) => (
                  <div key={`${item._id}-${index}`} className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900 mb-1">
                          {item.course.name}
                        </div>
                        <div className="text-xs text-gray-600 mb-2">
                          {item.course.code}
                        </div>
                        <div className="flex items-center text-xs text-gray-500 mb-1">
                          <Clock className="w-3 h-3 mr-1" />
                          {item.startTime} - {item.endTime}
                          <span className="ml-2 text-gray-400">
                            ({getDuration(item.startTime, item.endTime)})
                          </span>
                          {item.lectureCount && item.lectureCount > 1 && (
                            <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                              {item.lectureCount} lectures
                            </span>
                          )}
                        </div>
                        <div className="flex items-center text-xs text-gray-500 mb-2">
                          <MapPin className="w-3 h-3 mr-1" />
                          {item.room}
                        </div>
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(item.type)}`}>
                          {item.type}
                        </span>
                      </div>
                      {user?.role !== 'student' && (
                        <div className="flex space-x-1 ml-2">
                          <button
                            onClick={() => startEditing(item)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="Edit"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => deleteScheduleItem(item)}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {getScheduleForDay(day).length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <Calendar className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-xs">No classes scheduled</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
