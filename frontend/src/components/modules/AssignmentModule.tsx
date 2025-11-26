import React, { useState, useEffect } from 'react';
import { FileText, Upload, Calendar, Clock, CheckCircle, AlertTriangle, Eye, Download, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
// Remove problematic PDF viewer imports
// import { Worker, Viewer } from '@react-pdf-viewer/core';
// import '@react-pdf-viewer/core/lib/styles/index.css';
// import '@react-pdf-viewer/default-layout/lib/styles/index.css';

interface Assignment {
  _id: string;
  title: string;
  description: string;
  course: {
    name: string;
    code: string;
    _id?: string;
  };
  startDate: string;
  dueDate: string;
  maxMarks: number;
  hasSubmitted?: boolean;
  submissionStatus?: string;
  marks?: number;
  feedback?: string;
  status: string;
  allowLateSubmission?: boolean;
  // Backend provides `attachments` with shape { filename (original name), url, size }
  attachments?: Array<{
    filename: string;
    url: string;
    size: number;
  }>;
  instructions?: string;
  lateSubmissionPenalty?: number;
}

interface Submission {
  student: {
    _id: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    studentId?: string;
    profile?: {
      studentId?: string;
    };
  };
  marks?: number;
  feedback?: string;
  status: string;
  submissionDate?: string;
  content?: string;
  files?: Array<{
    filename: string; // original name
    url: string;
    size: number;
  }>;
}

export function AssignmentModule() {
  const { user, token } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionContent, setSubmissionContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [courses, setCourses] = useState<Array<{ _id: string; name: string; code: string }>>([]);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    courseId: '',
    startDate: '',
    dueDate: '',
    maxMarks: 100,
    instructions: '',
    allowLateSubmission: false,
    lateSubmissionPenalty: 0
  });
  const [createFiles, setCreateFiles] = useState<FileList | null>(null);

  // Submissions / grading for faculty
  const [viewSubmissionsFor, setViewSubmissionsFor] = useState<Assignment | null>(null);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [submissionsError, setSubmissionsError] = useState('');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [gradesDraft, setGradesDraft] = useState<Record<string, { marks: number | ''; feedback: string; saving?: boolean }>>({});

  // Keep state for PDF modal
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);

  const openPdfModal = (url: string) => {
    setPdfUrl(url);
    setPdfModalOpen(true);
  };
  const closePdfModal = () => {
    setPdfModalOpen(false);
    setPdfUrl(null);
  };

  useEffect(() => {
    if (!token) return;
    fetchAssignments();
    if (user?.role === 'faculty' || user?.role === 'admin') {
      fetchCourses();
    }
  }, [user, token]);

  const fetchAssignments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/assignments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setAssignments(data.assignments || []);
      } else {
        setError(data.message || 'Failed to fetch assignments');
      }
    } catch {
      setError('Failed to fetch assignments');
    }
    setLoading(false);
  };

  const fetchCourses = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/courses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCourses(data.courses);
      } else {
        console.error('Failed to fetch courses:', data.message);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const createAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate dates
    const startDate = new Date(createForm.startDate);
    const dueDate = new Date(createForm.dueDate);
    const now = new Date();
    
    if (startDate >= dueDate) {
      setError('Due date must be after start date');
      return;
    }
    
    if (startDate < now) {
      setError('Start date cannot be in the past');
      return;
    }

    setCreating(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('title', createForm.title.trim());
      formData.append('description', createForm.description.trim());
      formData.append('courseId', createForm.courseId);
      formData.append('startDate', createForm.startDate);
      formData.append('dueDate', createForm.dueDate);
      formData.append('maxMarks', String(createForm.maxMarks));
      formData.append('instructions', createForm.instructions);
      formData.append('allowLateSubmission', String(createForm.allowLateSubmission));
      formData.append('lateSubmissionPenalty', String(createForm.lateSubmissionPenalty));
      
              // Add question files
        if (createFiles && createFiles.length > 0) {
          Array.from(createFiles).forEach(file => formData.append('attachments', file));
        }

      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setShowCreateForm(false);
        setCreateForm({
          title: '', description: '', courseId: '', startDate: '', dueDate: '', maxMarks: 100, instructions: '', allowLateSubmission: false, lateSubmissionPenalty: 0
        });
        setCreateFiles(null);
        fetchAssignments();
      } else {
        console.error('Assignment creation failed:', data);
        if (data.errors && Array.isArray(data.errors)) {
          const errorMessages = data.errors.map((err: { msg: string }) => err.msg).join(', ');
          setError(`Validation errors: ${errorMessages}`);
        } else {
          setError(data.message || 'Failed to create assignment');
        }
      }
    } catch (error) {
      console.error('Assignment creation error:', error);
      setError('Failed to create assignment. Please check your connection and try again.');
    }
    setCreating(false);
  };

  const [submissionFiles, setSubmissionFiles] = useState<FileList | null>(null);

  const submitAssignment = async (assignmentId: string) => {
    if (!submissionContent.trim() && (!submissionFiles || submissionFiles.length === 0)) {
      setError('Please provide submission content or upload files');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('content', submissionContent);
      if (submissionFiles) {
        Array.from(submissionFiles).forEach(file => formData.append('files', file));
      }
      const res = await fetch(`/api/assignments/${assignmentId}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedAssignment(null);
        setSubmissionContent('');
        setSubmissionFiles(null);
        fetchAssignments();
      } else {
        setError(data.message || 'Failed to submit assignment');
      }
    } catch {
      setError('Failed to submit assignment');
    }
    setSubmitting(false);
  };

  const downloadQuestionFile = async (file: { url: string; filename: string }) => {
    try {
      const res = await fetch(file.url, { headers: { 'Authorization': `Bearer ${token}` } });
      
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.filename || 'download';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError('Failed to download file');
      }
    } catch {
      setError('Failed to download file');
    }
  };

  const downloadSubmissionFile = async (file: { url: string; filename: string }) => {
    try {
      const res = await fetch(file.url, { headers: { 'Authorization': `Bearer ${token}` } });
      
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.filename || 'download';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError('Failed to download submission file');
      }
    } catch {
      setError('Failed to download submission file');
    }
  };

  const openSubmissions = async (assignment: Assignment) => {
    setViewSubmissionsFor(assignment);
    setSubmissionsError('');
    setSubmissions([]);
    setSubmissionsLoading(true);
    try {
      const res = await fetch(`/api/assignments/${assignment._id}/submissions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.assignment) {
        setSubmissions(
          (data.assignment.submissions || []).map((s: { student: { _id: string; firstName?: string; lastName?: string; name?: string; studentId?: string }; marks?: number; feedback?: string; status: string; submissionDate?: string; content?: string; files?: Array<{ filename: string; originalName: string; size: number }> }) => ({
            student: s.student,
            marks: s.marks,
            feedback: s.feedback,
            status: s.status,
            submissionDate: s.submissionDate,
            content: s.content,
            files: s.files || []
          }))
        );
        // Initialize editable drafts for marks and feedback
        const draft: Record<string, { marks: number | ''; feedback: string; saving?: boolean }> = {};
        (data.assignment.submissions || []).forEach((s: { student: { _id: string }; marks?: number; feedback?: string }) => {
          draft[s.student._id] = { marks: typeof s.marks === 'number' ? s.marks : '', feedback: s.feedback || '' };
        });
        setGradesDraft(draft);
      } else {
        setSubmissionsError(data.message || 'Failed to fetch submissions');
      }
    } catch {
      setSubmissionsError('Failed to fetch submissions');
    }
    setSubmissionsLoading(false);
  };

  const gradeSubmission = async (assignmentId: string, studentId: string, marks: number, feedback: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/grade/${studentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ marks: Number(marks), feedback })
      });
      const data = await res.json();
      if (res.ok) {
        if (viewSubmissionsFor) openSubmissions(viewSubmissionsFor);
        return true;
      } else {
        setSubmissionsError(data.message || 'Failed to grade submission');
        return false;
      }
    } catch {
      setSubmissionsError('Failed to grade submission');
      return false;
    }
  };

  const handleSaveGrade = async (studentId: string) => {
    if (!viewSubmissionsFor) return;
    const draft = gradesDraft[studentId];
    const numericMarks = typeof draft?.marks === 'string' ? Number(draft.marks) : draft?.marks;
    if (numericMarks === undefined || numericMarks === null || Number.isNaN(numericMarks)) {
      setSubmissionsError('Please enter valid marks');
      return;
    }
    if (numericMarks < 0 || numericMarks > viewSubmissionsFor.maxMarks) {
      setSubmissionsError(`Marks must be between 0 and ${viewSubmissionsFor.maxMarks}`);
      return;
    }
    setGradesDraft(prev => ({ ...prev, [studentId]: { ...prev[studentId], saving: true } }));
    const ok = await gradeSubmission(viewSubmissionsFor._id, studentId, numericMarks, draft?.feedback || '');
    setGradesDraft(prev => ({ ...prev, [studentId]: { ...prev[studentId], saving: false } }));
    if (ok) setSubmissionsError('');
  };

  const getStatusColor = (assignment: Assignment) => {
    const now = new Date();
    const startDate = new Date(assignment.startDate);
    const dueDate = new Date(assignment.dueDate);

    if (now < startDate) return 'text-gray-600'; // Not started
    if (assignment.hasSubmitted) {
      if (assignment.submissionStatus === 'graded') return 'text-green-600';
      return 'text-blue-600';
    }
    if (now > dueDate) return 'text-red-600'; // Overdue
    if (now > new Date(dueDate.getTime() - 24 * 60 * 60 * 1000)) return 'text-yellow-600'; // Due soon
    return 'text-gray-600';
  };

  const getStatusIcon = (assignment: Assignment) => {
    const now = new Date();
    const startDate = new Date(assignment.startDate);
    const dueDate = new Date(assignment.dueDate);

    if (now < startDate) return <Clock className="w-4 h-4 text-gray-500" />;
    if (assignment.hasSubmitted) {
      if (assignment.submissionStatus === 'graded') return <CheckCircle className="w-4 h-4 text-green-500" />;
      return <CheckCircle className="w-4 h-4 text-blue-500" />;
    }
    if (now > dueDate) return <AlertTriangle className="w-4 h-4 text-red-500" />;
    return <Calendar className="w-4 h-4 text-gray-500" />;
  };

  const getStatusText = (assignment: Assignment) => {
    const now = new Date();
    const startDate = new Date(assignment.startDate);
    const dueDate = new Date(assignment.dueDate);

    if (now < startDate) return 'Not Started';
    if (assignment.hasSubmitted) {
      if (assignment.submissionStatus === 'graded') return 'Graded';
      return 'Submitted';
    }
    if (now > dueDate) return 'Overdue';
    if (now > new Date(dueDate.getTime() - 24 * 60 * 60 * 1000)) return 'Due Soon';
    return 'Active';
  };

  const canSubmit = (assignment: Assignment) => {
    const now = new Date();
    const startDate = new Date(assignment.startDate);
    const dueDate = new Date(assignment.dueDate);
    
    if (now < startDate) return false; // Not started yet
    if (assignment.hasSubmitted) return false; // Already submitted
    if (now <= dueDate) return true; // Within deadline
    return assignment.allowLateSubmission; // Only if late submission allowed
  };

  const removeCreateFile = (index: number) => {
    if (createFiles) {
      const dt = new DataTransfer();
      Array.from(createFiles).forEach((file, i) => {
        if (i !== index) dt.items.add(file);
      });
      setCreateFiles(dt.files);
    }
  };

  const removeSubmissionFile = (index: number) => {
    if (submissionFiles) {
      const dt = new DataTransfer();
      Array.from(submissionFiles).forEach((file, i) => {
        if (i !== index) dt.items.add(file);
      });
      setSubmissionFiles(dt.files);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading assignments...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <FileText className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
        </div>
        {(user?.role === 'faculty' || user?.role === 'admin') && (
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            {showCreateForm ? 'Close' : 'New Assignment'}
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={() => setError('')}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Create Assignment Form */}
      {(user?.role === 'faculty' || user?.role === 'admin') && showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Assignment</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createAssignment} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assignment Title *</label>
                  <input 
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    value={createForm.title} 
                    onChange={e => setCreateForm({ ...createForm, title: e.target.value })} 
                    required 
                    placeholder="Enter assignment title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Course *</label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    value={createForm.courseId} 
                    onChange={e => setCreateForm({ ...createForm, courseId: e.target.value })} 
                    required
                  >
                    <option value="">Select a course</option>
                    {courses.map(c => (
                      <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  rows={4} 
                  value={createForm.description} 
                  onChange={e => setCreateForm({ ...createForm, description: e.target.value })} 
                  required 
                  placeholder="Describe the assignment objectives and requirements"
                />
              </div>

              {/* Assignment Schedule Section */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Assignment Schedule
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📅 Start Date & Time *
                    </label>
                    <input 
                      type="datetime-local" 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" 
                      value={createForm.startDate} 
                      onChange={e => setCreateForm({ ...createForm, startDate: e.target.value })} 
                      required 
                      min={new Date().toISOString().slice(0, 16)}
                    />
                    <p className="text-xs text-gray-500 mt-1">When students can start viewing and working on this assignment</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ⏰ Due Date & Time *
                    </label>
                    <input 
                      type="datetime-local" 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" 
                      value={createForm.dueDate} 
                      onChange={e => setCreateForm({ ...createForm, dueDate: e.target.value })} 
                      required 
                      min={createForm.startDate || new Date().toISOString().slice(0, 16)}
                    />
                    <p className="text-xs text-gray-500 mt-1">Final submission deadline</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Marks *</label>
                  <input 
                    type="number" 
                    min={1} 
                    max={1000}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    value={createForm.maxMarks} 
                    onChange={e => setCreateForm({ ...createForm, maxMarks: Number(e.target.value) })} 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Late Penalty (% per day)</label>
                  <input 
                    type="number" 
                    min={0} 
                    max={100} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    value={createForm.lateSubmissionPenalty} 
                    onChange={e => setCreateForm({ ...createForm, lateSubmissionPenalty: Number(e.target.value) })} 
                    disabled={!createForm.allowLateSubmission}
                  />
                </div>
              </div>

              {/* File Upload Section */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                  <Upload className="w-5 h-5 mr-2" />
                  📎 Assignment Files Upload
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📄 Question Files (PDF, DOC, PPT, etc.) *
                  </label>
                  <div className="border-2 border-dashed border-green-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors bg-white">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.png,.jpg,.jpeg"
                      onChange={e => setCreateFiles(e.target.files)}
                      className="hidden"
                      id="question-files"
                    />
                    <label htmlFor="question-files" className="cursor-pointer">
                      <Upload className="w-12 h-12 text-green-400 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-900 mb-2">📎 Upload Question Files</p>
                      <p className="text-sm text-gray-600 mb-1">Click to upload or drag and drop files here</p>
                      <p className="text-xs text-gray-500">Supported: PDF, DOC, PPT, XLS, TXT, Images (max 10 files, 50MB each)</p>
                    </label>
                  </div>
                
                {createFiles && createFiles.length > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm font-semibold text-blue-800 mb-3">Selected Question Files:</p>
                    <div className="space-y-2">
                      {Array.from(createFiles).map((file, i) => (
                        <div key={i} className="flex items-center justify-between bg-white p-2 rounded border">
                          <div className="flex items-center">
                            <FileText className="w-4 h-4 mr-2 text-blue-600" />
                            <span className="text-sm font-medium">{file.name}</span>
                            <span className="text-xs text-gray-500 ml-2">
                              ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeCreateFile(i)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Instructions</label>
                <textarea 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  rows={3} 
                  value={createForm.instructions} 
                  onChange={e => setCreateForm({ ...createForm, instructions: e.target.value })} 
                  placeholder="Additional instructions for students (optional)"
                />
              </div>

              <div className="flex items-center space-x-3">
                <input 
                  id="allowLate" 
                  type="checkbox" 
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                  checked={createForm.allowLateSubmission} 
                  onChange={e => setCreateForm({ ...createForm, allowLateSubmission: e.target.checked })} 
                />
                <label htmlFor="allowLate" className="text-sm font-medium text-gray-700">
                  Allow Late Submissions
                </label>
              </div>

              <div className="flex items-center space-x-3 pt-4 border-t">
                <Button type="submit" disabled={creating}>
                  {creating ? 'Creating Assignment...' : 'Create Assignment'}
                </Button>
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => {
                    setShowCreateForm(false);
                    setCreateForm({
                      title: '', description: '', courseId: '', startDate: '', dueDate: '', 
                      maxMarks: 100, instructions: '', allowLateSubmission: false, lateSubmissionPenalty: 0
                    });
                    setCreateFiles(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Assignments List */}
      {assignments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments found</h3>
            <p className="text-gray-600">
              {user?.role === 'student' 
                ? 'No assignments have been posted yet. Check back later!' 
                : 'Create your first assignment to get started.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((assignment) => (
            <Card key={assignment._id} className="hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{assignment.title}</h3>
                    <p className="text-sm text-blue-600 mb-2 font-medium">{assignment.course.name} ({assignment.course.code})</p>
                    <p className="text-sm text-gray-700 line-clamp-3">{assignment.description}</p>
                  </div>
                  <div className="ml-2 flex flex-col items-center">
                  {getStatusIcon(assignment)}
                    <span className={`text-xs font-medium mt-1 ${getStatusColor(assignment)}`}>
                      {getStatusText(assignment)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-gray-600 block">Start:</span>
                      <span className="font-medium text-green-600">
                        {new Date(assignment.startDate).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 block">Due:</span>
                    <span className={`font-medium ${getStatusColor(assignment)}`}>
                        {new Date(assignment.dueDate).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                    </span>
                  </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Max Marks:</span>
                    <span className="font-semibold">{assignment.maxMarks}</span>
                  </div>

                  {assignment.hasSubmitted && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`font-medium ${getStatusColor(assignment)}`}>
                          {assignment.submissionStatus === 'graded' ? 'Graded' : 'Submitted'}
                        </span>
                      </div>
                      {assignment.marks !== undefined && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Score:</span>
                          <span className="font-semibold text-green-600">
                            {assignment.marks}/{assignment.maxMarks}
                          </span>
                        </div>
                      )}
                      {assignment.feedback && (
                        <div className="mt-2 p-3 bg-blue-50 rounded-lg border">
                          <p className="text-xs font-medium text-blue-800 mb-1">Feedback:</p>
                          <p className="text-xs text-blue-700">{assignment.feedback}</p>
                        </div>
                      )}
                    </>
                  )}

                 {/* Question Files */}
                 {assignment.attachments && assignment.attachments.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-gray-600 mb-2">Question Files:</p>
                      <div className="space-y-1">
                        {assignment.attachments.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                            <div className="flex items-center">
                              <FileText className="w-3 h-3 mr-2 text-gray-500" />
                              <span className="text-xs font-medium">{file.filename}</span>
                            </div>
                            <div className="flex gap-2">
                              {file.filename.toLowerCase().endsWith('.pdf') && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openPdfModal(file.url)}
                                >
                                  View
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => downloadQuestionFile(file)}
                              >
                                <Download className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex space-x-2">
                  {user?.role === 'student' && canSubmit(assignment) && (
                    <Button
                      size="sm"
                      onClick={() => setSelectedAssignment(assignment)}
                      className="flex-1"
                    >
                      Submit Assignment
                    </Button>
                  )}
                  {(user?.role === 'faculty' || user?.role === 'admin') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openSubmissions(assignment)}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Submissions
                    </Button>
                  )}
                  </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Submit Assignment Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Submit Assignment: {selectedAssignment.title}</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedAssignment(null);
                  setSubmissionContent('');
                  setSubmissionFiles(null);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Assignment Details</h4>
                  <p className="text-sm text-blue-800">{selectedAssignment.description}</p>
                  {selectedAssignment.instructions && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-blue-900">Instructions:</p>
                      <p className="text-sm text-blue-800">{selectedAssignment.instructions}</p>
                    </div>
                  )}
                  <div className="mt-3 text-sm">
                    <span className="font-medium text-blue-900">Due: </span>
                    <span className="text-blue-800">
                      {new Date(selectedAssignment.dueDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Submission Content
                </label>
                <textarea
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={6}
                  value={submissionContent}
                    onChange={e => setSubmissionContent(e.target.value)}
                    placeholder="Enter your submission content here..."
                />
              </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Files (Optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.png,.jpg,.jpeg,.zip"
                      onChange={e => setSubmissionFiles(e.target.files)}
                      className="hidden"
                      id="submission-files"
                    />
                    <label htmlFor="submission-files" className="cursor-pointer">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Click to upload files</p>
                      <p className="text-xs text-gray-500">PDF, DOC, PPT, XLS, TXT, Images, ZIP</p>
                    </label>
                  </div>

                  {submissionFiles && submissionFiles.length > 0 && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg">
                      <p className="text-sm font-semibold text-green-800 mb-2">Selected Files:</p>
                      <div className="space-y-2">
                        {Array.from(submissionFiles).map((file, i) => (
                          <div key={i} className="flex items-center justify-between bg-white p-2 rounded border">
                            <div className="flex items-center">
                              <FileText className="w-4 h-4 mr-2 text-green-600" />
                              <span className="text-sm font-medium">{file.name}</span>
                              <span className="text-xs text-gray-500 ml-2">
                                ({(file.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeSubmissionFile(i)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-3 pt-4 border-t">
                <Button
                  onClick={() => submitAssignment(selectedAssignment._id)}
                  disabled={submitting}
                    className="flex-1"
                >
                  {submitting ? 'Submitting...' : 'Submit Assignment'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedAssignment(null);
                    setSubmissionContent('');
                      setSubmissionFiles(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Submissions Modal */}
      {viewSubmissionsFor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Submissions: {viewSubmissionsFor.title}</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setViewSubmissionsFor(null);
                  setSubmissions([]);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {submissionsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2">Loading submissions...</span>
                </div>
              ) : submissionsError ? (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {submissionsError}
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions yet</h3>
                  <p className="text-gray-600">Students haven't submitted their work yet.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {submissions.map((submission) => (
                    <div key={submission.student._id} className="border rounded-lg p-6 bg-gray-50">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                          {submission.student.name ||
                            `${submission.student.firstName || ''} ${submission.student.lastName || ''}`.trim() ||
                            'Unknown Student'}
                          </h4>
                          {(submission.student.studentId || submission.student.profile?.studentId) && (
                            <p className="text-sm text-gray-600">ID: {submission.student.studentId || submission.student.profile?.studentId}</p>
                          )}
                          {submission.submissionDate && (
                            <p className="text-sm text-gray-600">
                              Submitted: {new Date(submission.submissionDate).toLocaleDateString('en-US', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            submission.status === 'graded' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {submission.status === 'graded' ? 'Graded' : 'Submitted'}
                          </span>
                        </div>
                      </div>

                      {submission.content && (
                        <div className="mb-4">
                          <h5 className="font-medium text-gray-900 mb-2">Submission Content:</h5>
                          <div className="bg-white p-4 rounded-lg border">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{submission.content}</p>
                          </div>
                        </div>
                      )}

                      {submission.files && submission.files.length > 0 && (
                        <div className="mb-4">
                          <h5 className="font-medium text-gray-900 mb-2">Submitted Files:</h5>
                          <div className="space-y-2">
                            {submission.files.map((file, fileIndex) => (
                              <div key={fileIndex} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                                <div className="flex items-center">
                                  <FileText className="w-4 h-4 mr-2 text-blue-600" />
                                  <span className="text-sm font-medium">{file.filename}</span>
                                  <span className="text-xs text-gray-500 ml-2">
                                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                  </span>
                                </div>
                                <div className="flex gap-2">
                                  {file.filename.toLowerCase().endsWith('.pdf') && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openPdfModal(file.url)}
                                    >
                                      View
                                    </Button>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => downloadSubmissionFile(file)}
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Grading Section */}
                      <div className="border-t pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Marks (out of {viewSubmissionsFor.maxMarks})
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={viewSubmissionsFor.maxMarks}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              value={gradesDraft[submission.student._id]?.marks ?? ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? '' : Number(e.target.value);
                                setGradesDraft(prev => ({
                                  ...prev,
                                  [submission.student._id]: {
                                    ...prev[submission.student._id],
                                    marks: val
                                  }
                                }));
                              }}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Feedback
                            </label>
                            <textarea
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              rows={3}
                              value={gradesDraft[submission.student._id]?.feedback ?? ''}
                              placeholder="Provide feedback to the student..."
                              onChange={(e) => {
                                const val = e.target.value;
                                setGradesDraft(prev => ({
                                  ...prev,
                                  [submission.student._id]: {
                                    ...prev[submission.student._id],
                                    feedback: val
                                  }
                                }));
                              }}
                            />
                          </div>
                        </div>
                        <div className="mt-3 flex justify-end">
                          <Button
                            size="sm"
                            onClick={() => handleSaveGrade(submission.student._id)}
                            disabled={gradesDraft[submission.student._id]?.saving}
                          >
                            {gradesDraft[submission.student._id]?.saving ? 'Saving...' : 'Save Grade'}
                          </Button>
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

      {/* PDF Modal using native browser viewer */}
      {pdfModalOpen && pdfUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-4 w-[95vw] h-[95vh] max-w-none max-h-none flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold">PDF Viewer</span>
              <Button variant="outline" size="sm" onClick={closePdfModal}><X className="w-4 h-4" /></Button>
            </div>
            <div className="flex-1 overflow-hidden border rounded">
              <iframe
                src={pdfUrl}
                title="PDF"
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}