import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Calendar as CalendarIcon, Clock as ClockSmall } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../utils/api';

interface ExamQuestion {
  questionText: string;
  questionType: 'mcq' | 'short_answer' | 'long_answer' | 'true_false';
  options?: string[];
  correctAnswer?: string;
  marks: number;
}

interface Exam {
  _id?: string;
  title: string;
  description: string;
  course: string;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  questions: ExamQuestion[];
  isActive: boolean;
  settings?: {
    maxAttempts: number;
  };
}

export function ExamModule() {
  const { user } = useAuth();
  const [exams, setExams] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [_, setError] = useState('');
  const [gradingFor, setGradingFor] = useState<{ examId: string; exam?: any } | null>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [attemptsLoading, setAttemptsLoading] = useState(false);
  const [gradeDraft, setGradeDraft] = useState<Record<string, { feedback: string; manualMarks: Array<{ questionIndex: number; marksAwarded: number; comment?: string }> }>>({});
  const [statusView, setStatusView] = useState<
    | null
    | {
        kind: 'not_started' | 'ended' | 'error';
        message: string;
        exam?: any;
      }
  >(null);
  const [myAttempts, setMyAttempts] = useState<any[]>([]);

  // Faculty exam management
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [examForm, setExamForm] = useState<Exam>({
    title: '',
    description: '',
    course: '',
    startTime: '',
    endTime: '',
    duration: 60,
    questions: [],
    isActive: true,
    settings: { maxAttempts: 1 }
  });

  // Student taking exam
  const [activeExam, setActiveExam] = useState<any | null>(null);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    load();
    loadCourses();
    if (user?.role === 'student') {
      apiClient.listMyExamAttempts().then((res: any) => setMyAttempts(res.attempts || [])).catch(() => {});
    }
    // Enhanced anti-cheat: visibility, fullscreen, and tab change detection
    const handleVisibility = () => {
      if (activeExam) {
        apiClient.heartbeatExam(activeExam._id, { 
          visibility: document.visibilityState === 'visible', 
          fullscreen: !!document.fullscreenElement 
        }).catch(() => {});
        
        if (document.visibilityState === 'hidden') {
          alert('WARNING: You have switched away from the exam tab. This may be recorded as suspicious activity.');
        }
      }
    };

    const handleFullscreenChange = () => {
      if (activeExam && !document.fullscreenElement) {
        alert('WARNING: You have exited full-screen mode. Please return to full-screen to continue the exam.');
        // Try to re-enter fullscreen
        document.documentElement.requestFullscreen().catch(() => {
          alert('Please manually return to full-screen mode to continue the exam.');
        });
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (activeExam) {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave the exam? This will submit your exam automatically.';
        return e.returnValue;
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [activeExam]);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const res = await apiClient.listExams() as any;
      setExams(Array.isArray(res.exams) ? res.exams : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load exams');
    } finally { setLoading(false); }
  };

  const loadCourses = async () => {
    try {
      const res = await apiClient.request('/courses') as any;
      setCourses(Array.isArray(res.courses) ? res.courses : []);
    } catch (e: any) {
      console.error('Failed to load courses:', e);
    }
  };

  const resetForm = () => {
    setExamForm({
      title: '',
      description: '',
      course: '',
      startTime: '',
      endTime: '',
      duration: 60,
      questions: [],
      isActive: true,
      settings: { maxAttempts: 1 }
    });
    setEditingExam(null);
    setShowCreateForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (examForm.questions.length === 0) {
      setError('Please add at least one question');
      return;
    }

    try {
      if (editingExam?._id) {
        await apiClient.updateExam(editingExam._id, examForm);
      } else {
        await apiClient.createExam(examForm);
      }
      resetForm();
      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed to save exam');
    }
  };

  const addQuestion = () => {
    const newQuestion: ExamQuestion = {
      questionText: '',
      questionType: 'mcq',
      options: ['', '', '', ''],
      correctAnswer: '',
      marks: 1
    };
    setExamForm(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const updateQuestion = (index: number, field: keyof ExamQuestion, value: any) => {
    setExamForm(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      )
    }));
  };

  const removeQuestion = (index: number) => {
    setExamForm(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const editExam = (exam: any) => {
    setEditingExam(exam);
    setExamForm({
      title: exam.title,
      description: exam.description,
      course: (typeof exam.course === 'string' ? exam.course : exam.course._id),
      startTime: new Date(exam.startTime).toISOString().slice(0, 16),
      endTime: new Date(exam.endTime).toISOString().slice(0, 16),
      duration: exam.duration,
      questions: exam.questions,
      isActive: exam.isActive,
      settings: { maxAttempts: (exam.settings?.maxAttempts ?? 1) }
    });
    setShowCreateForm(true);
  };

  const deleteExam = async (examId: string) => {
    if (!confirm('Are you sure you want to delete this exam?')) return;
    try {
      await apiClient.deleteExam(examId);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed to delete exam');
    }
  };

  const openGrading = async (exam: any) => {
    setGradingFor({ examId: exam._id, exam });
    setAttemptsLoading(true);
    try {
      const res: any = await apiClient.listExamAttempts(exam._id);
      const atts = Array.isArray(res.attempts) ? res.attempts : [];
      setAttempts(atts);
      const draft: Record<string, { feedback: string; manualMarks: Array<{ questionIndex: number; marksAwarded: number; comment?: string }> }> = {};
      atts.forEach((a: any) => {
        const sid = typeof a.student === 'string' ? a.student : a.student?._id;
        if (sid) draft[sid] = { feedback: a.feedback || '', manualMarks: a.manualMarks || [] };
      });
      setGradeDraft(draft);
    } catch (e: any) {
      setError(e?.message || 'Failed to load attempts');
    }
    setAttemptsLoading(false);
  };

  const saveGrade = async (studentId: string) => {
    if (!gradingFor) return;
    try {
      const draft = gradeDraft[studentId] || { feedback: '', manualMarks: [] };
      await apiClient.gradeExamAttempt(gradingFor.examId, studentId, { manualMarks: draft.manualMarks, feedback: draft.feedback });
      const ex = exams.find(x => x._id === gradingFor.examId);
      if (ex) await openGrading(ex);
    } catch (e: any) {
      setError(e?.message || 'Failed to save grade');
    }
  };

  const startExam = async (examId: string) => {
    setError('');
    try {
      // Request full-screen before starting exam
      try {
        await document.documentElement.requestFullscreen();
      } catch (e) {
        alert('Please enable full-screen mode to start the exam for security purposes.');
        return;
      }

      await apiClient.startExam(examId);
      const examResp: any = await apiClient.getExam(examId);
      setActiveExam(examResp.exam);
      const now = Date.now();
      const end = new Date(examResp.exam.endTime).getTime();
      const durationMs = Math.min(end - now, (examResp.exam.duration || 0) * 60 * 1000);
      setTimeLeft(Math.max(0, Math.floor(durationMs / 1000)));
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = window.setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } catch (e: any) {
      const msg = e?.message || 'Failed to start exam';
      // Try to load details for nicer status view
      let examDetails: ListedExam | undefined;
      try {
        const fetched: any = await apiClient.getExam(examId);
        examDetails = fetched?.exam;
      } catch {}
      if (/has not started/i.test(msg)) {
        setStatusView({ kind: 'not_started', message: 'This exam has not started yet.', exam: examDetails });
        return;
      }
      if (/has ended/i.test(msg)) {
        setStatusView({ kind: 'ended', message: 'This exam has ended.', exam: examDetails });
        return;
      }
      setStatusView({ kind: 'error', message: msg, exam: examDetails });
    }
  };

  useEffect(() => {
    if (!activeExam) return;
    if (timeLeft <= 0 && timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
      submitExam(true);
    }
  }, [timeLeft, activeExam]);

  const submitExam = async (auto = false) => {
    if (!activeExam) return;
    try {
      const payload = { answers: Object.entries(answers).map(([idx, ans]) => ({ questionIndex: Number(idx), answer: ans })), meta: { browserInfo: navigator.userAgent } };
      const res: any = await apiClient.submitExam(activeExam._id, payload);
      setActiveExam(null);
      setAnswers({});
      await load();
      alert(auto ? 'Time up. Your exam was auto-submitted.' : 'Exam submitted successfully.');
    } catch (e: any) {
      alert(e?.message || 'Failed to submit exam');
    }
  };

  if (loading) return <div>Loading exams...</div>;
  if (statusView && !activeExam) {
    const e = statusView.exam;
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 border">
          <div className="flex items-start gap-3 mb-4">
            <div className={`p-2 rounded-full ${statusView.kind === 'error' ? 'bg-red-100' : 'bg-yellow-100'}`}>
              <AlertTriangle className={`w-5 h-5 ${statusView.kind === 'error' ? 'text-red-600' : 'text-yellow-700'}`} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {statusView.kind === 'not_started' && 'Exam not started'}
                {statusView.kind === 'ended' && 'Exam ended'}
                {statusView.kind === 'error' && 'Cannot start exam'}
              </h2>
              <p className="text-gray-700 mt-1">{statusView.message}</p>
              {e && (
                <div className="mt-3 text-sm text-gray-700 space-y-1">
                  <div className="font-medium">{e.title}</div>
                  <div className="flex items-center gap-2"><CalendarIcon className="w-4 h-4" /> {new Date(e.startTime).toLocaleString()} — {new Date(e.endTime).toLocaleString()}</div>
                  <div className="flex items-center gap-2"><ClockSmall className="w-4 h-4" /> Duration: {e.duration} min</div>
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
              onClick={() => setStatusView(null)}
            >
              Back to exams
            </button>
            {statusView.kind === 'not_started' && (
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => setStatusView(null)}
              >
                Refresh later
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (activeExam) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{activeExam.title}</h2>
          <div className="text-lg font-mono">Time Left: {Math.max(0, timeLeft)}s</div>
        </div>
        <div className="space-y-4">
          {activeExam.questions.map((q: ExamQuestion, i: number) => (
            <div key={i} className="p-4 bg-white rounded border">
              <div className="font-medium mb-2">Q{i + 1}. {q.questionText} ({q.marks} marks)</div>
              {q.questionType === 'mcq' && (
                <div className="space-y-2">
                  {q.options?.map((opt, idx) => (
                    <label key={idx} className="flex items-center space-x-2">
                      <input type="radio" name={`q-${i}`} checked={answers[i] === opt} onChange={() => setAnswers({ ...answers, [i]: opt })} />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              )}
              {q.questionType === 'true_false' && (
                <div className="space-x-4">
                  <label><input type="radio" name={`q-${i}`} checked={answers[i] === 'true'} onChange={() => setAnswers({ ...answers, [i]: 'true' })} /> True</label>
                  <label className="ml-4"><input type="radio" name={`q-${i}`} checked={answers[i] === 'false'} onChange={() => setAnswers({ ...answers, [i]: 'false' })} /> False</label>
                </div>
              )}
              {['short_answer', 'long_answer'].includes(q.questionType) && (
                <textarea className="w-full border rounded p-2" rows={q.questionType === 'short_answer' ? 2 : 5} value={answers[i] || ''} onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })} />
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button 
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700" 
            onClick={() => {
              if (document.fullscreenElement) {
                document.exitFullscreen();
              } else {
                document.documentElement.requestFullscreen();
              }
            }}
          >
            {document.fullscreenElement ? 'Exit Full-Screen' : 'Enter Full-Screen'}
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={() => submitExam(false)}>Submit</button>
        </div>
      </div>
    );
  }

  if (gradingFor && user?.role === 'faculty') {
    const examMeta = gradingFor.exam || exams.find(x => x._id === gradingFor.examId);
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Grade Exam: {examMeta?.title || ''}</h2>
          <button className="px-4 py-2 text-gray-600 hover:text-gray-800" onClick={() => setGradingFor(null)}>Close</button>
        </div>
        {attemptsLoading ? (
          <div>Loading attempts...</div>
        ) : attempts.length === 0 ? (
          <div className="text-gray-500">No attempts found.</div>
        ) : (
          <div className="space-y-4">
            {attempts.map((a) => (
              <div key={a._id} className="p-4 bg-white rounded border">
                  <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-semibold">{typeof a.student === 'string' ? a.student : (a.student?.name || a.student?.profile?.studentId || 'Student')}</div>
                    <div className="text-xs text-gray-500">Status: {a.status}</div>
                  </div>
                  <div className="text-sm text-gray-600">Total: {a.totalMarks ?? 0} / {examMeta?.totalMarks ?? 0}</div>
                </div>
                <div className="space-y-2">
                  {examMeta?.questions?.map((q: any, idx: number) => {
                    const objective = a.answers?.find((x: any) => x.questionIndex === idx)?.marksAwarded ?? 0;
                    const sid = typeof a.student === 'string' ? a.student : a.student?._id;
                    const manual = (gradeDraft[sid]?.manualMarks || []).find(m => m.questionIndex === idx)?.marksAwarded;
                    const current = manual !== undefined ? manual : objective;
                    const rawAnswer = a.answers?.find((x: any) => x.questionIndex === idx)?.answer;
                    let answerLabel = '';
                    if (q.questionType === 'mcq') {
                      answerLabel = String(rawAnswer ?? '');
                    } else if (q.questionType === 'true_false') {
                      answerLabel = rawAnswer === 'true' ? 'True' : rawAnswer === 'false' ? 'False' : '';
                    } else {
                      answerLabel = String(rawAnswer ?? '');
                    }
                    return (
                      <div key={idx} className="border rounded p-2">
                        <div className="text-sm font-medium">Q{idx + 1}: {q.questionText}</div>
                        <div className="text-xs text-gray-700 mt-1"><span className="font-semibold">Student Answer:</span> {answerLabel || <span className="italic text-gray-500">No answer</span>}</div>
                        {['mcq','true_false'].includes(q.questionType) && q.correctAnswer && (
                          <div className="text-xs text-gray-500"><span className="font-semibold">Correct:</span> {String(q.correctAnswer)}</div>
                        )}
                        <div className="text-xs text-gray-600 mb-1 mt-1">Auto Marks: {objective}</div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            className="w-24 border rounded p-1"
                            value={current}
                            min={0}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setGradeDraft(prev => {
                                const prevStudent = prev[sid] || { feedback: '', manualMarks: [] };
                                const others = prevStudent.manualMarks.filter(m => m.questionIndex !== idx);
                                return {
                                  ...prev,
                                  [sid!]: { feedback: prevStudent.feedback, manualMarks: [...others, { questionIndex: idx, marksAwarded: val }] }
                                };
                              });
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2">
                  <label className="block text-sm font-medium mb-1">Feedback</label>
                  <textarea
                    className="w-full border rounded p-2"
                    rows={2}
                    value={gradeDraft[sid || '']?.feedback || ''}
                    onChange={(e) => setGradeDraft(prev => ({ ...prev, [sid || '']: { ...(prev[sid || ''] || { manualMarks: [] }), feedback: e.target.value } }))}
                  />
                </div>
                <div className="mt-3 flex justify-end">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => saveGrade((typeof a.student === 'string' ? a.student : a.student?._id) as string)}>Save Grade</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (showCreateForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{editingExam ? 'Edit Exam' : 'Create New Exam'}</h2>
          <button className="px-4 py-2 text-gray-600 hover:text-gray-800" onClick={resetForm}>Cancel</button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                required
                className="w-full border rounded p-2"
                value={examForm.title}
                onChange={(e) => setExamForm(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Course</label>
              <select
                required
                className="w-full border rounded p-2"
                value={examForm.course}
                onChange={(e) => setExamForm(prev => ({ ...prev, course: e.target.value }))}
              >
                <option value="">Select Course</option>
                {courses.map(course => (
                  <option key={course._id} value={course._id}>{course.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Start Time</label>
              <input
                type="datetime-local"
                required
                className="w-full border rounded p-2"
                value={examForm.startTime}
                onChange={(e) => setExamForm(prev => ({ ...prev, startTime: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Time</label>
              <input
                type="datetime-local"
                required
                className="w-full border rounded p-2"
                value={examForm.endTime}
                onChange={(e) => setExamForm(prev => ({ ...prev, endTime: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
              <input
                type="number"
                required
                min="1"
                className="w-full border rounded p-2"
                value={examForm.duration}
                onChange={(e) => setExamForm(prev => ({ ...prev, duration: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Max Attempts</label>
              <input
                type="number"
                required
                min="1"
                className="w-full border rounded p-2"
                value={examForm.settings?.maxAttempts ?? 1}
                onChange={(e) => setExamForm(prev => ({ ...prev, settings: { ...(prev.settings || {}), maxAttempts: Math.max(1, Number(e.target.value) || 1) } }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                className="w-full border rounded p-2"
                value={examForm.isActive ? 'true' : 'false'}
                onChange={(e) => setExamForm(prev => ({ ...prev, isActive: e.target.value === 'true' }))}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              className="w-full border rounded p-2"
              rows={3}
              value={examForm.description}
              onChange={(e) => setExamForm(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Questions</h3>
              <button
                type="button"
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                onClick={addQuestion}
              >
                Add Question
              </button>
            </div>
            
            <div className="space-y-4">
              {examForm.questions.map((question, index) => (
                <div key={index} className="p-4 border rounded bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium">Question {index + 1}</span>
                    <button
                      type="button"
                      className="text-red-600 hover:text-red-800"
                      onClick={() => removeQuestion(index)}
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Question Type</label>
                      <select
                        className="w-full border rounded p-2"
                        value={question.questionType}
                        onChange={(e) => updateQuestion(index, 'questionType', e.target.value)}
                      >
                        <option value="mcq">Multiple Choice</option>
                        <option value="true_false">True/False</option>
                        <option value="short_answer">Short Answer</option>
                        <option value="long_answer">Long Answer</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Marks</label>
                      <input
                        type="number"
                        min="1"
                        className="w-full border rounded p-2"
                        value={question.marks}
                        onChange={(e) => updateQuestion(index, 'marks', Number(e.target.value))}
                      />
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Question Text</label>
                    <textarea
                      required
                      className="w-full border rounded p-2"
                      rows={2}
                      value={question.questionText}
                      onChange={(e) => updateQuestion(index, 'questionText', e.target.value)}
                    />
                  </div>
                  
                  {question.questionType === 'mcq' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Options</label>
                      <div className="space-y-2">
                        {question.options?.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center space-x-2">
                            <input
                              type="text"
                              className="flex-1 border rounded p-2"
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...(question.options || [])];
                                newOptions[optIndex] = e.target.value;
                                updateQuestion(index, 'options', newOptions);
                              }}
                            />
                            <input
                              type="radio"
                              name={`correct-${index}`}
                              checked={question.correctAnswer === option}
                              onChange={() => updateQuestion(index, 'correctAnswer', option)}
                            />
                            <span className="text-sm text-gray-600">Correct</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {question.questionType === 'true_false' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Correct Answer</label>
                      <div className="space-x-4">
                        <label>
                          <input
                            type="radio"
                            name={`correct-${index}`}
                            checked={question.correctAnswer === 'true'}
                            onChange={() => updateQuestion(index, 'correctAnswer', 'true')}
                          />
                          True
                        </label>
                        <label>
                          <input
                            type="radio"
                            name={`correct-${index}`}
                            checked={question.correctAnswer === 'false'}
                            onChange={() => updateQuestion(index, 'correctAnswer', 'false')}
                          />
                          False
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex gap-4">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {editingExam ? 'Update Exam' : 'Create Exam'}
            </button>
            <button
              type="button"
              className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              onClick={resetForm}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Exams</h2>
        {user?.role === 'faculty' && (
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => setShowCreateForm(true)}
          >
            Create Exam
          </button>
        )}
      </div>
      
      {exams.length === 0 ? (
        <div className="text-gray-500">No exams available.</div>
      ) : (
        <div className="space-y-2">
          {exams.map((e) => (
            <div key={e._id} className="p-4 bg-white rounded border">
            <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-semibold text-lg">{e.title}</div>
                <div className="text-sm text-gray-600">{e.course?.name} • {new Date(e.startTime).toLocaleString()} - {new Date(e.endTime).toLocaleString()}</div>
                <div className="text-sm text-gray-500">Duration: {e.duration} minutes • Questions: {e.questions?.length || 0} • Max Attempts: {e.settings?.maxAttempts ?? 1}</div>
                </div>
                <div className="flex gap-2">
                  {user?.role === 'student' && (
                    <button className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700" onClick={() => startExam(e._id)}>Start</button>
                  )}
                  {user?.role === 'faculty' && (
                    <>
                      <button className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={() => editExam(e)}>Edit</button>
                      <button className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700" onClick={() => deleteExam(e._id)}>Delete</button>
                      <button className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700" onClick={() => openGrading(e)}>Grade</button>
                    </>
                  )}
                </div>
              </div>
              {e.description && (
                <div className="text-sm text-gray-700 mt-2">{e.description}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {user?.role === 'student' && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">My Exam Results</h3>
          {myAttempts.length === 0 ? (
            <div className="text-gray-500">No attempts yet.</div>
          ) : (
            <div className="space-y-2">
              {myAttempts.map((a) => (
                <div key={`${a.examId}-${a.submittedAt || a.status}`} className="p-3 border rounded bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{a.examTitle}</div>
                      <div className="text-xs text-gray-600">{a.course?.name} • {a.status}{a.gradedAt ? ' • Graded' : ''}</div>
                    </div>
                    <div className="text-sm text-gray-700">{a.totalMarks}/{a.maximumMarks} ({a.percentage}%)</div>
                  </div>
                  {a.feedback && <div className="text-sm text-gray-700 mt-1">Feedback: {a.feedback}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


