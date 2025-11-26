// src/components/modules/StudentModule.tsx
import React, { useState, useEffect } from 'react';
import { Users, UserPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Toast } from '../ui/Toast';
import apiClient from '../../utils/api';

interface Student {
  _id: string;
  name: string;
  email: string;
  studentId: string;
  department: string;
  year: number;
  courses?: string[];
  attendance?: {
    present: number;
    total: number;
    percentage: number;
  };
  averageGrade?: string;
}

interface Course {
  _id: string;
  name: string;
  code: string;
}

export function StudentModule() {
  const { user, token } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    studentId: '',
    department: '',
    year: 1,
    password: ''
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const [toastMessage, setToastMessage] = useState('');
  const [enrolledCourses, setEnrolledCourses] = useState<{ [studentId: string]: Course[] }>({});

  useEffect(() => {
    if (!token) return;
    fetchStudents();
    fetchCourses();
  }, [token]);

  useEffect(() => {
    const safeStudents = Array.isArray(students) ? students : [];
    // Client-side safeguard: if faculty, filter by same program and, for B.Tech/M.Tech, by branch
    const program = (user as any)?.program || (user as any)?.department || '';
    const branch = (user as any)?.branch || (user as any)?.department || '';
    const isFaculty = (user as any)?.role === 'faculty';
    const requiresBranch = ['B.Tech', 'M.Tech'].includes(program);

    const filtered = safeStudents
      .filter(student => {
        if (!isFaculty) return true;
        const studentProgram = (student as any).program || (student as any).profile?.course || '';
        const studentBranch = (student as any).branch || (student as any).department || (student as any).profile?.branch || '';
        const programMatches = program ? studentProgram === program : true;
        const branchMatches = !requiresBranch || (branch ? studentBranch === branch : false);
        return programMatches && branchMatches;
      })
      .filter(student =>
        student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.department?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    setFilteredStudents(filtered);
  }, [students, searchTerm, user]);

  // Auto-dismiss toast after 2 seconds
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/students', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.students)) {
        // Ensure each student has a courses array
        const studentsWithCourses = data.students.map((student: Partial<Student>) => ({
          ...student,
          courses: Array.isArray(student.courses) ? student.courses : []
        }));
        setStudents(studentsWithCourses as Student[]);
      } else {
        setStudents([]);
      }
    } catch {
      setStudents([]);
    }
    setLoading(false);
  };

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/courses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.courses)) {
        setCourses(data.courses);
      }
    } catch {
      // ignore
    }
  };

  const addStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch('/api/auth/create-student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newStudent)
      });
      const data = await res.json();
      if (data.success) {
        setStudents([...students, data.student]);
        setNewStudent({ name: '', email: '', studentId: '', department: '', year: 1, password: '' });
        setShowAddForm(false);
      } else {
        setToastType('error');
        setToastMessage(data.message || 'Failed to add student');
        setShowToast(true);
      }
    } catch {
      setToastType('error');
      setToastMessage('Failed to add student');
      setShowToast(true);
    }
    setLoading(false);
  };

  const deleteStudent = async (studentId: string) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;

    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setStudents(students.filter(s => s._id !== studentId));
        setToastType('success');
        setToastMessage('Student deleted successfully!');
        setShowToast(true);
      } else {
        setToastType('error');
        setToastMessage(data.message || 'Failed to delete student');
        setShowToast(true);
      }
    } catch {
      setToastType('error');
      setToastMessage('Failed to delete student');
      setShowToast(true);
    }
  };

  const enrollStudent = async (studentId: string) => {
    if (!selectedCourse) {
      setToastType('error');
      setToastMessage('Please select a course first.');
      setShowToast(true);
      return;
    }
    setLoading(true);
    try {
      console.log('Enrolling student:', { studentId, selectedCourse });
      
      // Use API client method
      const data = await apiClient.enrollStudent(selectedCourse, studentId) as {
        success: boolean;
        message?: string;
        alreadyEnrolled?: boolean;
        courseFull?: boolean;
      };
      
      console.log('Enrollment response data:', data);
      
      if (data.success) {
        setToastType('success');
        setToastMessage(data.message || 'Student added to course successfully!');
        setShowToast(true);
        // Update the student's courses array in local state with proper null checks
        setStudents(prev => prev.map(s => {
          if (s._id === studentId) {
            const currentCourses = Array.isArray(s.courses) ? s.courses : [];
            if (!currentCourses.includes(selectedCourse)) {
              return { ...s, courses: [...currentCourses, selectedCourse] };
            }
          }
          return s;
        }));
        // Refresh enrolled courses for this student
        await fetchEnrolledCourses(studentId);
      } else {
        setToastType('error');
        // Provide more specific error messages
        if (data.alreadyEnrolled) {
          setToastMessage(`${data.message}. Students can enroll in multiple different courses, but not the same course twice.`);
        } else if (data.courseFull) {
          setToastMessage(data.message);
        } else {
          setToastMessage(data.message || 'Failed to add student to course');
        }
        setShowToast(true);
      }
    } catch (error: unknown) {
      console.error('Enrollment error:', error);
      const msg = error instanceof Error ? error.message : 'Failed to add student to course';
      // Surface specific server messages (e.g., already enrolled) to the user
      setToastType('error');
      setToastMessage(msg);
      setShowToast(true);
    }
    setLoading(false);
  };

  // Helper to check if student is enrolled in selected course
  const isStudentEnrolled = (student: Student) => {
    if (!selectedCourse) return false;
    // Find the selected course in the courses array
    const course = courses.find(c => c._id === selectedCourse);
    if (!course) return false;
    // If student.courses is an array of course IDs, check for selectedCourse with null check
    const studentCourses = Array.isArray(student.courses) ? student.courses : [];
    return studentCourses.includes(selectedCourse);
  };

  // Helper to get enrolled courses for a student
  const getStudentEnrolledCourses = (studentId: string) => {
    return enrolledCourses[studentId] || [];
  };

  const fetchEnrolledCourses = async (studentId: string) => {
    try {
      const res = await fetch(`/api/courses/student/${studentId}/enrolled`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setEnrolledCourses(prev => ({
          ...prev,
          [studentId]: data.enrolledCourses
        }));
      }
    } catch (error) {
      console.error('Failed to fetch enrolled courses:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Students</h2>
        {user?.role !== 'student' && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Student
          </button>
        )}
      </div>
      {(user?.role === 'faculty' || user?.role === 'admin') && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Course to Add Students</label>
          <select
            value={selectedCourse}
            onChange={e => setSelectedCourse(e.target.value)}
            className="w-full md:w-1/2 border rounded px-3 py-2"
          >
            <option value="">Choose a course</option>
            {courses.map(course => (
              <option key={course._id} value={course._id}>
                {course.name} ({course.code})
              </option>
            ))}
          </select>
        </div>
      )}

      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}

      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4">Add New Student</h3>
          <form onSubmit={addStudent} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Full Name"
                value={newStudent.name}
                onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                className="border rounded px-3 py-2"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={newStudent.email}
                onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                className="border rounded px-3 py-2"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Student ID"
                value={newStudent.studentId}
                onChange={(e) => setNewStudent({ ...newStudent, studentId: e.target.value })}
                className="border rounded px-3 py-2"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={newStudent.password}
                onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                className="border rounded px-3 py-2"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Department"
                value={newStudent.department}
                onChange={(e) => setNewStudent({ ...newStudent, department: e.target.value })}
                className="border rounded px-3 py-2"
                required
              />
              <input
                type="number"
                placeholder="Year"
                min="1"
                max="4"
                value={newStudent.year || ''}
                onChange={(e) => setNewStudent({ ...newStudent, year: parseInt(e.target.value) || 1 })}
                className="border rounded px-3 py-2"
                required
              />
            </div>
            <div className="flex space-x-2">
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700" disabled={loading}>
                {loading ? 'Adding...' : 'Add Student'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="relative">
            <input
              type="text"
              placeholder="Search students by name, email, ID, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">Loading students...</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredStudents.map((student) => (
              <div key={student._id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="font-medium">{student.name}</div>
                    <div className="text-sm text-gray-600">{student.studentId} • {student.email}</div>
                    <div className="text-sm text-gray-500">Department: {student.department}</div>
                    {/* Display enrolled courses */}
                    {getStudentEnrolledCourses(student._id).length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-gray-500 mb-1">Enrolled Courses:</div>
                        <div className="flex flex-wrap gap-1">
                          {getStudentEnrolledCourses(student._id).map(course => (
                            <span key={course._id} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {course.name} ({course.code})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {!isStudentEnrolled(student) ? (
                      <button
                        onClick={() => enrollStudent(student._id)}
                        disabled={loading}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                      >
                        {loading ? 'Adding...' : 'Add to Course'}
                      </button>
                    ) : (
                      <span className="text-green-600 text-sm font-medium">✓ Already Enrolled</span>
                    )}
                    <button
                      onClick={() => deleteStudent(student._id)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
            ))}
          </div>
        )}

        {filteredStudents.length === 0 && !loading && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm ? 'No students found matching your search' : 'No students available'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}