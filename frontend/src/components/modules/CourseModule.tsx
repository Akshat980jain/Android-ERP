// src/components/modules/CourseModule.tsx
import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  GraduationCap, 
  Users, 
  Calendar, 
  Clock, 
  MapPin,
  MessageSquare,
  Star
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../utils/api';

interface Course {
  _id: string;
  name: string;
  code: string;
  department: string;
  credits: number;
  faculty: string;
  students: string[];
  schedule: {
    day: string;
    time: string;
    room?: string;
  }[];
  description?: string;
  semester: string;
  year: number;
  status: 'active' | 'inactive';
  maxStudents?: number;
}

export function CourseModule() {
  const { user, token } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [newCourse, setNewCourse] = useState({
    name: '',
    code: '',
    department: '',
    credits: 0,
    schedule: [{ day: '', time: '', room: '' }] as { day: string; time: string; room?: string }[],
    description: '',
    semester: '',
    year: new Date().getFullYear(),
    maxStudents: 50
  });

  // Feedback state
  const [showFeedbackForm, setShowFeedbackForm] = useState<string | null>(null);
  const [feedbackForm, setFeedbackForm] = useState({
    rating: 5,
    comment: '',
    anonymous: false
  });
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const departments = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Chemical'];
  const semesters = ['Odd', 'Even' ];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [courses, searchTerm, filterDepartment]);

  const fetchCourses = async () => {
    setLoading(true);
    setError('');
    try {
      let data;
      if (user?.role === 'student') {
        data = await apiClient.getMyCourses() as { success: boolean; courses: Course[]; message?: string };
      } else if (user?.role === 'faculty') {
        data = await apiClient.getFacultyCourses() as { success: boolean; courses: Course[]; message?: string };
      } else {
        data = await apiClient.getCourses() as { success: boolean; courses: Course[]; message?: string };
      }
      
      if (data.success) {
        setCourses(data.courses);
      } else {
        setError(data.message || 'Failed to fetch courses');
      }
    } catch (err) {
      setError('Failed to fetch courses. Please check your connection.');
    }
    setLoading(false);
  };

  const filterCourses = () => {
    let filtered = courses;
    
    if (searchTerm) {
      filtered = filtered.filter(course => 
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterDepartment) {
      filtered = filtered.filter(course => course.department === filterDepartment);
    }
    
    setFilteredCourses(filtered);
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCourse()) return;
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = await apiClient.createCourse({
        ...newCourse,
        faculty: user?._id,
        status: 'active'
      }) as { success: boolean; course: Course; message?: string };
      
      if (data.success) {
        setCourses([...courses, data.course]);
        resetForm();
        setSuccess('Course added successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to add course');
      }
    } catch (err) {
      setError('Failed to add course. Please try again.');
    }
    setLoading(false);
  };

  const handleEditCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse || !validateCourse()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Attempting to update course:', editingCourse._id);
      console.log('Current user:', user);
      console.log('Update data:', newCourse);
      
      const data = await apiClient.updateCourse(editingCourse._id, newCourse) as { success: boolean; course: Course; message?: string };
      console.log('Update response:', data);
      
      if (data.success) {
        setCourses(courses.map(course => 
          course._id === editingCourse._id ? data.course : course
        ));
        resetForm();
        setSuccess('Course updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to update course');
      }
    } catch (err) {
      console.error('Update course error:', err);
      setError('Failed to update course. Please try again.');
    }
    setLoading(false);
  };

  const deleteCourse = async (courseId: string) => {
    const course = courses.find(c => c._id === courseId);
    const hasEnrolledStudents = course?.students && course.students.length > 0;
    
    const confirmMessage = hasEnrolledStudents 
      ? `Are you sure you want to delete this course? This will remove ${course.students.length} enrolled student(s) from the course. This action cannot be undone.`
      : 'Are you sure you want to delete this course? This action cannot be undone.';
    
    if (!window.confirm(confirmMessage)) return;

    setLoading(true);
    try {
      console.log('Attempting to delete course:', courseId);
      console.log('Current user:', user);
      console.log('Course has enrolled students:', hasEnrolledStudents);
      
      const data = await apiClient.deleteCourse(courseId) as { success: boolean; message?: string };
      console.log('Delete response:', data);
      
      if (data.success) {
        setCourses(courses.filter(course => course._id !== courseId));
        setSuccess('Course deleted successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to delete course');
      }
    } catch (err) {
      console.error('Delete course error:', err);
      setError('Failed to delete course. Please try again.');
    }
    setLoading(false);
  };

  const validateCourse = () => {
    if (!newCourse.name.trim()) {
      setError('Course name is required');
      return false;
    }
    if (!newCourse.code.trim()) {
      setError('Course code is required');
      return false;
    }
    if (newCourse.credits < 1 || newCourse.credits > 6) {
      setError('Credits must be between 1 and 6');
      return false;
    }
    return true;
  };

  const startEditing = (course: Course) => {
    setEditingCourse(course);
    setNewCourse({
      name: course.name,
      code: course.code,
      department: course.department,
      credits: course.credits,
      schedule: course.schedule,
      description: course.description || '',
      semester: course.semester,
      year: course.year,
      maxStudents: course.maxStudents || 50
    });
    setShowAddForm(true);
    setError('');
  };

  const resetForm = () => {
    setNewCourse({
      name: '',
      code: '',
      department: '',
      credits: 0,
      schedule: [{ day: '', time: '', room: '' }] as { day: string; time: string; room?: string }[],
      description: '',
      semester: '',
      year: new Date().getFullYear(),
      maxStudents: 50
    });
    setEditingCourse(null);
    setShowAddForm(false);
    setError('');
  };

  const addScheduleSlot = () => {
    setNewCourse({
      ...newCourse,
      schedule: [...newCourse.schedule, { day: '', time: '', room: '' }] as { day: string; time: string; room?: string }[]
    });
  };

  const removeScheduleSlot = (index: number) => {
    setNewCourse({
      ...newCourse,
      schedule: newCourse.schedule.filter((_, i) => i !== index)
    });
  };

  const updateScheduleSlot = (index: number, field: string, value: string) => {
    const updatedSchedule = newCourse.schedule.map((slot, i) => 
      i === index ? { ...slot, [field]: value } : slot
    );
    setNewCourse({ ...newCourse, schedule: updatedSchedule });
  };

  const submitFeedback = async (courseId: string) => {
    if (!feedbackForm.comment.trim()) {
      setError('Please provide a comment');
      return;
    }

    setFeedbackLoading(true);
    setError('');
    
    try {
      await apiClient.submitFeedback({
        courseId,
        rating: feedbackForm.rating,
        comment: feedbackForm.comment,
        anonymous: feedbackForm.anonymous
      });
      
      setSuccess('Feedback submitted successfully!');
      setShowFeedbackForm(null);
      setFeedbackForm({ rating: 5, comment: '', anonymous: false });
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit feedback');
    } finally {
      setFeedbackLoading(false);
    }
  };

  const resetFeedbackForm = () => {
    setShowFeedbackForm(null);
    setFeedbackForm({ rating: 5, comment: '', anonymous: false });
    setError('');
  };

  if (loading && courses.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading courses...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center">
            <GraduationCap className="w-8 h-8 mr-3 text-blue-600" />
            {user?.role === 'student' ? 'My Enrolled Courses' : 'Course Management'}
          </h2>
          <p className="text-gray-600 mt-1">
            {user?.role === 'student' 
              ? 'View your enrolled courses and schedules' 
              : 'Manage and organize your courses'}
          </p>
        </div>
        
        {user?.role !== 'student' && (
          <button
            onClick={() => {
              if (showAddForm) {
                resetForm();
              } else {
                setShowAddForm(true);
                setError('');
              }
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center transition-colors"
            disabled={loading}
          >
            <Plus className="w-4 h-4 mr-2" />
            {showAddForm ? 'Cancel' : 'Add Course'}
          </button>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {/* <AlertCircle className="w-5 h-5 mr-2" /> */}
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {/* <CheckCircle className="w-5 h-5 mr-2" /> */}
          {success}
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <Filter className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-lg border">
          <h3 className="text-xl font-semibold mb-6 flex items-center">
            {editingCourse ? <Edit className="w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
            {editingCourse ? 'Edit Course' : 'Add New Course'}
          </h3>
          
          <form onSubmit={editingCourse ? handleEditCourse : handleAddCourse} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Introduction to Computer Science"
                  value={newCourse.name}
                  onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Code *</label>
                <input
                  type="text"
                  placeholder="e.g., CS101"
                  value={newCourse.code}
                  onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value.toUpperCase() })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                <select
                  value={newCourse.department}
                  onChange={(e) => setNewCourse({ ...newCourse, department: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Credits *</label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={newCourse.credits || ''}
                  onChange={(e) => setNewCourse({ ...newCourse, credits: parseInt(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                <select
                  value={newCourse.semester}
                  onChange={(e) => setNewCourse({ ...newCourse, semester: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Semester</option>
                  {semesters.map(sem => (
                    <option key={sem} value={sem}>{sem}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Students</label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={newCourse.maxStudents || ''}
                  onChange={(e) => setNewCourse({ ...newCourse, maxStudents: parseInt(e.target.value) || 50 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                placeholder="Course description..."
                value={newCourse.description}
                onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Schedule */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">Schedule</label>
                <button
                  type="button"
                  onClick={addScheduleSlot}
                  className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Slot
                </button>
              </div>
              
              {newCourse.schedule.map((slot, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <select
                    value={slot.day}
                    onChange={(e) => updateScheduleSlot(index, 'day', e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Day</option>
                    {days.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                  <input
                    type="time"
                    value={slot.time}
                    onChange={(e) => updateScheduleSlot(index, 'time', e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Room"
                    value={slot.room || ''}
                    onChange={(e) => updateScheduleSlot(index, 'room', e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {newCourse.schedule.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeScheduleSlot(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button 
                type="submit" 
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center transition-colors"
                disabled={loading}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : null}
                {loading ? (editingCourse ? 'Updating...' : 'Adding...') : (editingCourse ? 'Update Course' : 'Add Course')}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <div key={course._id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 leading-tight">{course.name}</h3>
                    <p className="text-sm text-gray-600 font-medium">{course.code}</p>
                  </div>
                </div>
                
                {user?.role !== 'student' && (
                  <div className="flex space-x-1">
                    <button
                      onClick={() => startEditing(course)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Course"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteCourse(course._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Course"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center text-gray-600">
                  <GraduationCap className="w-4 h-4 mr-2" />
                  <span className="font-medium">Department:</span>
                  <span className="ml-1">{course.department}</span>
                </div>
                
                <div className="flex items-center text-gray-600">
                  <span className="font-medium">Credits:</span>
                  <span className="ml-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                    {course.credits}
                  </span>
                </div>

                <div className="flex items-center text-gray-600">
                  <Users className="w-4 h-4 mr-2" />
                  <span>{course.students?.length || 0}/{course.maxStudents || 'N/A'} Students</span>
                </div>

                {course.schedule && course.schedule.length > 0 && (
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-center text-gray-600 mb-2">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span className="font-medium">Schedule:</span>
                    </div>
                    <div className="space-y-1">
                      {course.schedule.map((slot, index) => (
                        <div key={index} className="flex items-center text-xs text-gray-500 ml-6">
                          <Clock className="w-3 h-3 mr-1" />
                          <span>{slot.day} at {slot.time}</span>
                          {slot.room && (
                            <>
                              <MapPin className="w-3 h-3 mr-1 ml-2" />
                              <span>{slot.room}</span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Feedback Section */}
                {user?.role === 'student' && (
                  <div className="pt-3 border-t border-gray-100">
                    <button
                      onClick={() => setShowFeedbackForm(showFeedbackForm === course._id ? null : course._id)}
                      className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      <MessageSquare className="w-4 h-4 mr-1" />
                      {showFeedbackForm === course._id ? 'Cancel Feedback' : 'Give Feedback'}
                    </button>
                  </div>
                )}
              </div>

              {/* Feedback Form */}
              {showFeedbackForm === course._id && user?.role === 'student' && (
                <div className="border-t border-gray-100 p-4 bg-gray-50">
                  <h4 className="font-medium text-gray-900 mb-3">Course Feedback</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setFeedbackForm(prev => ({ ...prev, rating: star }))}
                            className={`p-1 ${feedbackForm.rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                          >
                            <Star className="w-5 h-5 fill-current" />
                          </button>
                        ))}
                        <span className="ml-2 text-sm text-gray-600">{feedbackForm.rating}/5</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
                      <textarea
                        value={feedbackForm.comment}
                        onChange={(e) => setFeedbackForm(prev => ({ ...prev, comment: e.target.value }))}
                        placeholder="Share your thoughts about this course..."
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`anonymous-${course._id}`}
                        checked={feedbackForm.anonymous}
                        onChange={(e) => setFeedbackForm(prev => ({ ...prev, anonymous: e.target.checked }))}
                        className="mr-2"
                      />
                      <label htmlFor={`anonymous-${course._id}`} className="text-sm text-gray-700">
                        Submit anonymously
                      </label>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => submitFeedback(course._id)}
                        disabled={feedbackLoading || !feedbackForm.comment.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {feedbackLoading ? 'Submitting...' : 'Submit Feedback'}
                      </button>
                      <button
                        onClick={resetFeedbackForm}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredCourses.length === 0 && !loading && (
        <div className="text-center py-16">
          <BookOpen className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {searchTerm || filterDepartment ? 'No matching courses found' : 'No courses available'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || filterDepartment 
              ? 'Try adjusting your search or filter criteria' 
              : user?.role !== 'student' 
              ? 'Get started by adding your first course' 
              : 'No courses are currently assigned to you'
            }
          </p>
          {!searchTerm && !filterDepartment && user?.role !== 'student' && (
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center mx-auto transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Your First Course
            </button>
          )}
        </div>
      )}
    </div>
  );
}