import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, FileText, Download, Link as LinkIcon, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../utils/api';

export function ParentPortal() {
  const { user } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [linkEmail, setLinkEmail] = useState('');
  const [childDetail, setChildDetail] = useState<{ childId: string; type: string; data: any } | null>(null);

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

  const viewDetail = async (childId: string, type: string) => {
    try {
      let data: any;
      if (type === 'attendance') {
        data = await apiClient.parentChildAttendance(childId);
      } else if (type === 'marks') {
        data = await apiClient.parentChildMarks(childId);
      } else {
        data = await apiClient.parentChildReceipts(childId);
      }
      setChildDetail({ childId, type, data });
    } catch {
      setError(`Failed to load ${type}`);
    }
  };

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="flex items-center space-x-3">
        <Users className="w-6 h-6 text-emerald-600" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Parent Portal</h1>
      </div>

      {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">{error}</div>}

      <Card>
        <CardHeader>
          <CardTitle>Your Children</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center space-x-2">
            <input value={linkEmail} onChange={e => setLinkEmail(e.target.value)} placeholder="Student email" className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
            <button onClick={linkChild} className="text-blue-600 dark:text-blue-400 text-sm flex items-center hover:underline"><LinkIcon className="w-4 h-4 mr-1" />Link</button>
          </div>
          {children.length === 0 ? (
            <div className="text-gray-600 dark:text-gray-400">No linked student accounts yet.</div>
          ) : (
            <div className="space-y-3">
              {children.map((c: any) => (
                <div key={c._id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">{c.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{c.profile?.studentId}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 dark:text-blue-400 text-sm flex items-center hover:underline" onClick={() => viewDetail(c._id, 'attendance')}><FileText className="w-4 h-4 mr-1" /> Attendance</button>
                      <button className="text-blue-600 dark:text-blue-400 text-sm flex items-center hover:underline" onClick={() => viewDetail(c._id, 'marks')}><FileText className="w-4 h-4 mr-1" /> Marks</button>
                      <button className="text-green-600 dark:text-green-400 text-sm flex items-center hover:underline" onClick={() => viewDetail(c._id, 'receipts')}><Download className="w-4 h-4 mr-1" /> Fee Receipt</button>
                    </div>
                  </div>

                  {/* Inline detail panel */}
                  {childDetail && childDetail.childId === c._id && (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 capitalize">{childDetail.type} Details</h4>
                        <button onClick={() => setChildDetail(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="w-4 h-4" /></button>
                      </div>
                      {childDetail.type === 'attendance' && (
                        <p className="text-sm text-gray-700 dark:text-gray-300">Attendance: <span className="font-bold text-blue-600 dark:text-blue-400">{childDetail.data.percentage}%</span></p>
                      )}
                      {childDetail.type === 'marks' && (
                        <p className="text-sm text-gray-700 dark:text-gray-300">Average Marks: <span className="font-bold text-blue-600 dark:text-blue-400">{childDetail.data.averagePercentage}%</span></p>
                      )}
                      {childDetail.type === 'receipts' && (
                        <p className="text-sm text-gray-700 dark:text-gray-300">Fee Receipts: <span className="font-bold text-green-600 dark:text-green-400">{childDetail.data.receipts?.length || 0}</span></p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
