import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../utils/api';

export function FeedbackModule() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role === 'faculty' || user?.role === 'admin') {
      loadSummary();
    }
  }, [user]);

  const loadSummary = async () => {
    setLoading(true); setError('');
    try {
      const res: any = await apiClient.getFeedbackSummary();
      setSummary(res.summary || []);
    } catch (e: any) { setError(e?.message || 'Failed to load feedback'); }
    finally { setLoading(false); }
  };

  if (loading) return <div>Loading feedback...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  if (user?.role === 'student') {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Course Feedback</h2>
        <p className="text-gray-600">Open a course page to submit feedback. (Submission form can be embedded per course.)</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Feedback Summary</h2>
      {summary.length === 0 ? (
        <div className="text-gray-500">No feedback yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {summary.map((s, i) => (
            <div key={i} className="p-4 bg-white rounded border">
              <div className="font-semibold">{s.course?.name || 'Course'}</div>
              <div className="text-sm text-gray-600">Responses: {s.count}</div>
              <div className="mt-2 text-sm">
                <div>Teaching Quality: {s.averages.teachingQuality}/5</div>
                <div>Course Content: {s.averages.courseContent}/5</div>
                <div>Communication: {s.averages.communication}/5</div>
                <div>Availability: {s.averages.availability}/5</div>
                <div className="font-medium">Overall: {s.averages.overall}/5</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


