import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../ui/Card';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Toast } from '../ui/Toast';

interface RequestUser {
  _id: string;
  name: string;
  email: string;
  role: string;
}
interface VerificationRequest {
  _id: string;
  user?: RequestUser;
  requestedRole: string;
  status?: string;
  remarks?: string;
  name?: string;
  email?: string;
  password?: string;
  reason?: string;
  createdAt?: string;
  reviewedAt?: string;
  currentRole?: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const UserManagement: React.FC = () => {
  const { token } = useAuth();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [remarksMap, setRemarksMap] = useState<{ [key: string]: string }>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verification-requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setRequests(data.requests);
      } else {
        setError(data.message || 'Failed to fetch requests');
      }
    } catch {
      setError('Failed to fetch requests');
    }
    setLoading(false);
  };

  // Filtered and searched requests
  const filteredRequests = useMemo(() => {
    let filtered = requests;
    // Remove the strict filter, show all requests
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => (r.status || 'pending') === statusFilter);
    }
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      filtered = filtered.filter(r =>
        (r.user?.name?.toLowerCase().includes(s) ||
         r.user?.email?.toLowerCase().includes(s) ||
         r.name?.toLowerCase().includes(s) ||
         r.email?.toLowerCase().includes(s) ||
         r.requestedRole?.toLowerCase().includes(s) ||
         (r.status || 'pending').toLowerCase().includes(s))
      );
    }
    // Sort: pending first, then approved, then rejected, then by date desc
    filtered = filtered.sort((a, b) => {
      const statusOrder: Record<string, number> = { pending: 0, approved: 1, rejected: 2 };
      const sa = statusOrder[(a.status || 'pending').toLowerCase()] ?? 3;
      const sb = statusOrder[(b.status || 'pending').toLowerCase()] ?? 3;
      if (sa !== sb) return sa - sb;
      return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
    });
    return filtered;
  }, [requests, search, statusFilter]);

  // Avatar helper
  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return '?';
  };

  const handleDecision = async (id: string, status: 'approved' | 'rejected') => {
    const remarks = remarksMap[id] || '';
    try {
      const res = await fetch(`/api/auth/verification-requests/${id}/decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, remarks })
      });
      const data = await res.json();
      if (data.success) {
        setRequests(prev => prev.map(r => r._id === id ? { ...r, status, remarks, reviewedAt: new Date().toISOString() } : r));
        setRemarksMap(prev => { const copy = { ...prev }; delete copy[id]; return copy; });
        setToast({ message: `Request ${status} successfully!`, type: 'success' });
      } else {
        console.error('Decision error:', data);
        setToast({ message: data.message || 'Failed to process request', type: 'error' });
      }
    } catch {
      setToast({ message: 'Failed to process request', type: 'error' });
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">User Management</h2>
      <Card>
        <div className="p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
            <h3 className="text-lg font-semibold">All Verification Requests</h3>
            <div className="flex gap-2 flex-col md:flex-row">
              <input
                type="text"
                placeholder="Search by name, email, role, status..."
                className="border px-3 py-2 rounded focus:ring-2 focus:ring-blue-400 text-sm"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <select
                className="border px-2 py-2 rounded text-sm"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
          {loading ? (
            <LoadingSpinner />
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : (
            <div className="overflow-x-auto rounded-lg shadow">
              <table className="min-w-full border text-sm bg-white">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 border">User</th>
                    <th className="px-3 py-2 border">Email</th>
                    <th className="px-3 py-2 border">Requested Role</th>
                    <th className="px-3 py-2 border">Status</th>
                    <th className="px-3 py-2 border">Reason</th>
                    <th className="px-3 py-2 border">Requested At</th>
                    <th className="px-3 py-2 border">Reviewed At</th>
                    <th className="px-3 py-2 border">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-4">No requests found.</td></tr>
                  ) : (
                    filteredRequests.map(req => (
                      <tr key={req._id} className="hover:bg-gray-50 transition">
                        <td className="border px-3 py-2 flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-base">
                            {getInitials(req.user?.name || req.name, req.user?.email || req.email)}
                          </span>
                          <span>{req.user?.name || req.name || '-'}</span>
                        </td>
                        <td className="border px-3 py-2">{req.user?.email || req.email || '-'}</td>
                        <td className="border px-3 py-2 font-medium">{req.requestedRole}</td>
                        <td className="border px-3 py-2">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${statusColors[req.status || 'pending'] || 'bg-gray-100 text-gray-800'}`}>
                            {req.status || 'pending'}
                          </span>
                        </td>
                        <td className="border px-3 py-2 max-w-xs truncate" title={req.reason || ''}>{req.reason || '-'}</td>
                        <td className="border px-3 py-2">{req.createdAt ? new Date(req.createdAt).toLocaleString() : '-'}</td>
                        <td className="border px-3 py-2">{req.reviewedAt ? new Date(req.reviewedAt).toLocaleString() : '-'}</td>
                        <td className="border px-3 py-2">
                          {(!req.status || req.status === 'pending') ? (
                            <div className="flex flex-col gap-1">
                              <input
                                type="text"
                                placeholder="Remarks (optional)"
                                className="border px-2 py-1 rounded text-xs mb-1"
                                value={remarksMap[req._id] || ''}
                                onChange={e => setRemarksMap(prev => ({ ...prev, [req._id]: e.target.value }))}
                              />
                              <div className="flex gap-1">
                                <button
                                  className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                                  onClick={() => {
                                    const isRegistrationRequest = !req.user || req.currentRole === 'none';
                                    if (
                                      (isRegistrationRequest && req.reason) ||
                                      (!isRegistrationRequest && req.reason && req.currentRole && req.user)
                                    ) {
                                      handleDecision(req._id, 'approved');
                                    } else {
                                      setToast({ message: 'Cannot approve: missing required fields.', type: 'error' });
                                    }
                                  }}
                                >Approve</button>
                                <button
                                  className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                                  onClick={() => {
                                    const isRegistrationRequest = !req.user || req.currentRole === 'none';
                                    if (
                                      (isRegistrationRequest && req.reason) ||
                                      (!isRegistrationRequest && req.reason && req.currentRole && req.user)
                                    ) {
                                      handleDecision(req._id, 'rejected');
                                    } else {
                                      setToast({ message: 'Cannot reject: missing required fields.', type: 'error' });
                                    }
                                  }}
                                >Reject</button>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
};

export default UserManagement; 