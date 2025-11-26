import React, { useEffect, useState } from 'react';
import { Users, FileText, Download, Link as LinkIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../utils/api';

export function ParentPortal() {
  const { user } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [linkEmail, setLinkEmail] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiClient.parentChildren() as any;
        setChildren(data.children || []);
      } catch {
        setChildren(user?.children || []);
      }
    };
    load();
  }, [user]);

  const linkChild = async () => {
    try {
      await apiClient.parentLinkChild({ childEmail: linkEmail });
      setLinkEmail('');
      const data = await apiClient.parentChildren() as any;
      setChildren(data.children || []);
    } catch {
      setError('Failed to link student');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Users className="w-6 h-6 text-emerald-600" />
        <h1 className="text-2xl font-bold text-gray-900">Parent Portal</h1>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

      <Card>
        <CardHeader>
          <CardTitle>Your Children</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center space-x-2">
            <input value={linkEmail} onChange={e=>setLinkEmail(e.target.value)} placeholder="Student email" className="border rounded px-3 py-2 text-sm" />
            <button onClick={linkChild} className="text-blue-600 text-sm flex items-center"><LinkIcon className="w-4 h-4 mr-1"/>Link</button>
          </div>
          {children.length === 0 ? (
            <div className="text-gray-600">No linked student accounts yet.</div>
          ) : (
            <div className="space-y-3">
              {children.map((c: any) => (
                <div key={c._id} className="p-3 border rounded flex items-center justify-between">
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-sm text-gray-600">{c.profile?.studentId}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="text-blue-600 text-sm flex items-center" onClick={async()=>{ const d=await apiClient.parentChildAttendance(c._id); alert(`Attendance: ${d.percentage}%`); }}><FileText className="w-4 h-4 mr-1" /> Attendance</button>
                    <button className="text-blue-600 text-sm flex items-center" onClick={async()=>{ const d=await apiClient.parentChildMarks(c._id); alert(`Avg Marks: ${d.averagePercentage}%`); }}><FileText className="w-4 h-4 mr-1" /> Marks</button>
                    <button className="text-green-600 text-sm flex items-center" onClick={async()=>{ const d=await apiClient.parentChildReceipts(c._id); alert(`Receipts: ${d.receipts?.length||0}`); }}><Download className="w-4 h-4 mr-1" /> Fee Receipt</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


