// src/components/modules/MarksModule.tsx
import React, { useState, useEffect } from 'react';
import { GraduationCap, TrendingUp, FileText, Edit, Save, Plus, Trash2, Download, Upload } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface StudentMark {
  _id: string;
  student: {
    _id: string;
    name: string;
    email: string;
    studentId: string;
  };
  course: string;
  assessment: string;
  marks: number;
  maxMarks: number;
  grade: string;
  remarks?: string;
}

interface Assessment {
  _id: string;
  name: string;
  type: 'quiz' | 'assignment' | 'midterm' | 'final' | 'project';
  maxMarks: number;
  course: string;
  date: string;
}

interface Assignment {
  _id: string;
  title: string;
  description: string;
  course: {
    _id: string;
    name: string;
    code: string;
  };
  startDate: string;
  dueDate: string;
  maxMarks: number;
  status: string;
  submissions?: Array<{
    student: {
      _id: string;
      name: string;
      studentId: string;
    };
    marks?: number;
    feedback?: string;
    status: string;
    submittedAt: string;
  }>;
}

export function MarksModule() {
  const { user, token } = useAuth();
  const [marks, setMarks] = useState<StudentMark[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedAssessment, setSelectedAssessment] = useState('');
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingMark, setEditingMark] = useState<string | null>(null);
  const [tempMarks, setTempMarks] = useState<{ [key: string]: number }>({});
  const [showAddAssessment, setShowAddAssessment] = useState(false);
  const [newAssessment, setNewAssessment] = useState({
    name: '',
    type: 'quiz' as const,
    maxMarks: 0,
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (!token) return;
    fetchCourses();
  }, [token]);

  useEffect(() => {
    if (selectedCourse) {
      fetchAssessments();
      fetchAssignments();
    }
  }, [selectedCourse]);

  useEffect(() => {
    if (selectedAssessment) {
      fetchMarks();
    }
  }, [selectedAssessment]);

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

  const fetchAssessments = async () => {
    try {
      const res = await fetch(`/api/assessments?course=${selectedCourse}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setAssessments(data.assessments);
      }
    } catch {
      setError('Failed to fetch assessments');
    }
  };

  const fetchAssignments = async () => {
    try {
      const res = await fetch(`/api/assignments?courseId=${selectedCourse}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.assignments) {
        setAssignments(data.assignments);
      }
    } catch {
      setError('Failed to fetch assignments');
    }
  };

  const fetchMarks = async () => {
    setLoading(true);
    try {
      // Check if selected assessment is an assignment
      if (selectedAssessment.startsWith('assignment-')) {
        const assignmentId = selectedAssessment.replace('assignment-', '');
        const res = await fetch(`/api/assignments/${assignmentId}/submissions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.assignment && data.assignment.submissions) {
          // Convert assignment submissions to marks format
          const assignmentMarks = data.assignment.submissions.map((submission: any) => ({
            _id: `${assignmentId}-${submission.student._id}`,
            student: submission.student,
            course: selectedCourse,
            assessment: assignmentId,
            marks: submission.marks || 0,
            maxMarks: data.assignment.maxMarks,
            grade: submission.marks ? calculateGrade(submission.marks, data.assignment.maxMarks) : 'Not Graded',
            remarks: submission.feedback || ''
          }));
          setMarks(assignmentMarks);
        } else {
          setError('Failed to fetch assignment submissions');
        }
      } else {
        // Regular assessment marks
        const res = await fetch(`/api/marks?course=${selectedCourse}&assessment=${selectedAssessment}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setMarks(data.marks);
        } else {
          setError(data.message || 'Failed to fetch marks');
        }
      }
    } catch {
      setError('Failed to fetch marks');
    }
    setLoading(false);
  };

  const calculateGrade = (marks: number, maxMarks: number): string => {
    const percentage = (marks / maxMarks) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C+';
    if (percentage >= 40) return 'C';
    return 'F';
  };

  const updateMarks = async (markId: string, newMarks: number) => {
    try {
      // Check if this is an assignment mark
      if (selectedAssessment.startsWith('assignment-')) {
        const assignmentId = selectedAssessment.replace('assignment-', '');
        const studentId = markId.split('-')[1]; // Extract student ID from markId
        
        const res = await fetch(`/api/assignments/${assignmentId}/grade/${studentId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            marks: newMarks, 
            feedback: `Grade: ${newMarks}/${marks.find(m => m._id === markId)?.maxMarks || 100}` 
          })
        });

        const data = await res.json();
        if (data.success) {
          setMarks(marks.map(mark => 
            mark._id === markId 
              ? { ...mark, marks: newMarks, grade: calculateGrade(newMarks, mark.maxMarks) }
              : mark
          ));
          setSuccess('Assignment graded successfully!');
          setEditingMark(null);
          setTempMarks({});
        } else {
          setError(data.message || 'Failed to grade assignment');
        }
      } else {
        // Regular assessment marks
        const assessment = assessments.find(a => a._id === selectedAssessment);
        if (!assessment) return;

        const grade = calculateGrade(newMarks, assessment.maxMarks);
        
        const res = await fetch(`/api/marks/${markId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ marks: newMarks, grade })
        });

        const data = await res.json();
        if (data.success) {
          setMarks(marks.map(mark => 
            mark._id === markId 
              ? { ...mark, marks: newMarks, grade }
              : mark
          ));
          setSuccess('Marks updated successfully!');
          setEditingMark(null);
          setTempMarks({});
        } else {
          setError(data.message || 'Failed to update marks');
        }
      }
    } catch {
      setError('Failed to update marks');
    }
  };

  const addAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) {
      setError('Please select a course first');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newAssessment,
          course: selectedCourse
        })
      });

      const data = await res.json();
      if (data.success) {
        setAssessments([...assessments, data.assessment]);
        setNewAssessment({
          name: '',
          type: 'quiz',
          maxMarks: 0,
          date: new Date().toISOString().split('T')[0]
        });
        setShowAddAssessment(false);
        setSuccess('Assessment added successfully!');
      } else {
        setError(data.message || 'Failed to add assessment');
      }
    } catch {
      setError('Failed to add assessment');
    }
    setLoading(false);
  };

  const deleteAssessment = async (assessmentId: string) => {
    if (!window.confirm('Are you sure? This will delete all marks for this assessment.')) return;

    try {
      const res = await fetch(`/api/assessments/${assessmentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();
      if (data.success) {
        setAssessments(assessments.filter(a => a._id !== assessmentId));
        if (selectedAssessment === assessmentId) {
          setSelectedAssessment('');
          setMarks([]);
        }
        setSuccess('Assessment deleted successfully!');
      } else {
        setError(data.message || 'Failed to delete assessment');
      }
    } catch {
      setError('Failed to delete assessment');
    }
  };

  const exportMarks = async () => {
    if (!selectedCourse || !selectedAssessment) return;

    try {
      const res = await fetch(`/api/marks/export?course=${selectedCourse}&assessment=${selectedAssessment}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `marks_${selectedCourse}_${selectedAssessment}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Failed to export marks');
    }
  };

  const importMarks = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedAssessment) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('assessment', selectedAssessment);

    try {
      const res = await fetch('/api/marks/import', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      if (data.success) {
        fetchMarks();
        setSuccess('Marks imported successfully!');
      } else {
        setError(data.message || 'Failed to import marks');
      }
    } catch {
      setError('Failed to import marks');
    }
    
    // Reset file input
    event.target.value = '';
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A': return 'text-green-600 bg-green-50';
      case 'B+':
      case 'B': return 'text-blue-600 bg-blue-50';
      case 'C+':
      case 'C': return 'text-yellow-600 bg-yellow-50';
      case 'F': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const calculateStats = () => {
    if (marks.length === 0) return { average: 0, highest: 0, lowest: 0, totalStudents: 0 };
    
    const markValues = marks.map(m => (m.marks / m.maxMarks) * 100);
    const average = markValues.reduce((a, b) => a + b, 0) / markValues.length;
    const highest = Math.max(...markValues);
    const lowest = Math.min(...markValues);
    
    return { 
      average: Math.round(average * 10) / 10, 
      highest: Math.round(highest * 10) / 10, 
      lowest: Math.round(lowest * 10) / 10,
      totalStudents: marks.length
    };
  };

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Marks & Grades</h2>
        <div className="flex items-center space-x-2">
          {selectedAssessment && (
            <>
              <input
                type="file"
                accept=".csv"
                onChange={importMarks}
                className="hidden"
                id="import-marks"
              />
              <label
                htmlFor="import-marks"
                className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 cursor-pointer flex items-center text-sm"
              >
                <Upload className="w-4 h-4 mr-1" />
                Import
              </label>
              <button
                onClick={exportMarks}
                className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 flex items-center text-sm"
              >
                <Download className="w-4 h-4 mr-1" />
                Export
              </button>
            </>
          )}
        </div>
      </div>

      {error && <div className="text-red-700 bg-red-50 p-3 rounded">{error}</div>}
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
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Select Assessment</label>
              {selectedCourse && user?.role !== 'student' && (
                <button
                  onClick={() => setShowAddAssessment(!showAddAssessment)}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Assessment
                </button>
              )}
            </div>
            <select
              value={selectedAssessment}
              onChange={(e) => setSelectedAssessment(e.target.value)}
              className="w-full border rounded px-3 py-2"
              disabled={!selectedCourse}
            >
              <option value="">Choose an assessment</option>
              {/* Regular Assessments */}
              {assessments.map(assessment => (
                <option key={assessment._id} value={assessment._id}>
                  {assessment.name} ({assessment.type}) - {assessment.maxMarks} marks
                </option>
              ))}
              {/* Assignments */}
              {assignments.map(assignment => (
                <option key={`assignment-${assignment._id}`} value={`assignment-${assignment._id}`}>
                  📝 {assignment.title} (Assignment) - {assignment.maxMarks} marks
                </option>
              ))}
            </select>
          </div>
        </div>

        {showAddAssessment && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Add New Assessment</h3>
            <form onSubmit={addAssessment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Assessment Name"
                  value={newAssessment.name}
                  onChange={(e) => setNewAssessment({ ...newAssessment, name: e.target.value })}
                  className="border rounded px-3 py-2"
                  required
                />
                <select
                  value={newAssessment.type}
                  onChange={(e) => setNewAssessment({ ...newAssessment, type: e.target.value as any })}
                  className="border rounded px-3 py-2"
                >
                  <option value="quiz">Quiz</option>
                  <option value="assignment">Assignment</option>
                  <option value="midterm">Midterm</option>
                  <option value="final">Final</option>
                  <option value="project">Project</option>
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="Maximum Marks"
                  value={newAssessment.maxMarks || ''}
                  onChange={(e) => setNewAssessment({ ...newAssessment, maxMarks: parseInt(e.target.value) || 0 })}
                  className="border rounded px-3 py-2"
                  required
                />
                <input
                  type="date"
                  value={newAssessment.date}
                  onChange={(e) => setNewAssessment({ ...newAssessment, date: e.target.value })}
                  className="border rounded px-3 py-2"
                  required
                />
              </div>
              <div className="flex space-x-2">
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Assessment'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddAssessment(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {selectedAssessment && marks.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Average Score</p>
                    <p className="text-2xl font-bold text-blue-800">{stats.average}%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Highest Score</p>
                    <p className="text-2xl font-bold text-green-800">{stats.highest}%</p>
                  </div>
                  <GraduationCap className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600">Lowest Score</p>
                    <p className="text-2xl font-bold text-orange-800">{stats.lowest}%</p>
                  </div>
                  <FileText className="w-8 h-8 text-orange-600" />
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Total Students</p>
                    <p className="text-2xl font-bold text-purple-800">{stats.totalStudents}</p>
                  </div>
                  <FileText className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Marks
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percentage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grade
                    </th>
                    {user?.role !== 'student' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {marks.map((mark) => (
                    <tr key={mark._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{mark.student.name}</div>
                          <div className="text-sm text-gray-500">{mark.student.studentId}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingMark === mark._id ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              min="0"
                              max={mark.maxMarks}
                              value={tempMarks[mark._id] ?? mark.marks}
                              onChange={(e) => setTempMarks({
                                ...tempMarks,
                                [mark._id]: parseInt(e.target.value) || 0
                              })}
                              className="border rounded px-2 py-1 w-20"
                            />
                            <span className="text-sm text-gray-500">/ {mark.maxMarks}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-900">
                            {mark.marks} / {mark.maxMarks}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {Math.round((mark.marks / mark.maxMarks) * 100)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getGradeColor(mark.grade)}`}>
                          {mark.grade}
                        </span>
                      </td>
                      {user?.role !== 'student' && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {editingMark === mark._id ? (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => updateMarks(mark._id, tempMarks[mark._id] ?? mark.marks)}
                                className="text-green-600 hover:text-green-900"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingMark(null);
                                  setTempMarks({});
                                }}
                                className="text-gray-600 hover:text-gray-900"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setEditingMark(mark._id)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {selectedCourse && (assessments.length > 0 || assignments.length > 0) && user?.role !== 'student' && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Assessment Management</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Regular Assessments */}
              {assessments.map(assessment => (
                <div key={assessment._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{assessment.name}</h4>
                    <button
                      onClick={() => deleteAssessment(assessment._id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Type: <span className="capitalize">{assessment.type}</span></div>
                    <div>Max Marks: {assessment.maxMarks}</div>
                    <div>Date: {new Date(assessment.date).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
              
              {/* Assignments */}
              {assignments.map(assignment => (
                <div key={`assignment-${assignment._id}`} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-blue-50">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">📝 {assignment.title}</h4>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Assignment</span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Course: {assignment.course.name}</div>
                    <div>Max Marks: {assignment.maxMarks}</div>
                    <div>Due: {new Date(assignment.dueDate).toLocaleDateString()}</div>
                    <div>Status: <span className="capitalize">{assignment.status}</span></div>
                    {assignment.submissions && (
                      <div>Submissions: {assignment.submissions.length}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!selectedCourse && (
          <div className="text-center py-12">
            <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Select a course to view marks and grades</p>
          </div>
        )}
      </div>
    </div>
  );
}