import { useState, useEffect } from 'react';
import {
    Calendar, Clock, FileText, CheckCircle, XCircle, Plus,
    AlertCircle, Filter
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../utils/api';

interface Leave {
    _id: string;
    student: { _id: string; name: string; profile?: { studentId?: string } };
    type: 'duty' | 'medical' | 'casual';
    reason: string;
    startDate: string;
    endDate: string;
    status: 'pending' | 'approved' | 'rejected';
    approvedBy?: { name: string };
    createdAt: string;
}

const TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
    duty: { label: 'Duty Leave', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
    medical: { label: 'Medical Leave', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
    casual: { label: 'Casual Leave', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
};

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    pending: { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: Clock },
    approved: { label: 'Approved', color: 'text-green-700', bg: 'bg-green-50 border-green-200', icon: CheckCircle },
    rejected: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: XCircle },
};

export function LeaveModule() {
    const { user } = useAuth();
    const isStudent = user?.role === 'student';
    const isApprover = user?.role === 'faculty' || user?.role === 'admin';

    const [leaves, setLeaves] = useState<Leave[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        type: 'casual' as 'duty' | 'medical' | 'casual',
        reason: '',
        startDate: '',
        endDate: '',
    });
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => {
        fetchLeaves();
    }, []);

    const fetchLeaves = async () => {
        try {
            setLoading(true);
            const resp = await apiClient.getLeaves() as any;
            if (resp.success) {
                setLeaves(resp.leaves || []);
            }
        } catch (err: any) {
            setError(err?.message || 'Failed to load leaves');
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!formData.type || !formData.startDate || !formData.endDate) {
            setError('Please fill in all required fields');
            return;
        }
        if (new Date(formData.endDate) < new Date(formData.startDate)) {
            setError('End date must be on or after start date');
            return;
        }

        try {
            setFormLoading(true);
            const resp = await apiClient.applyForLeave(formData) as any;
            if (resp.success) {
                setSuccess('Leave application submitted successfully!');
                setShowForm(false);
                setFormData({ type: 'casual', reason: '', startDate: '', endDate: '' });
                fetchLeaves();
            }
        } catch (err: any) {
            setError(err?.message || 'Failed to submit leave application');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDecision = async (id: string, status: 'approved' | 'rejected') => {
        try {
            setActionLoading(id);
            setError('');
            const resp = await apiClient.updateLeaveDecision(id, status) as any;
            if (resp.success) {
                setSuccess(`Leave ${status} successfully`);
                fetchLeaves();
            }
        } catch (err: any) {
            setError(err?.message || 'Failed to process decision');
        } finally {
            setActionLoading(null);
        }
    };

    const filteredLeaves = filter === 'all' ? leaves : leaves.filter(l => l.status === filter);

    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
    });

    const getDays = (start: string, end: string) => {
        const diff = new Date(end).getTime() - new Date(start).getTime();
        return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
    };

    // Stats
    const stats = {
        total: leaves.length,
        pending: leaves.filter(l => l.status === 'pending').length,
        approved: leaves.filter(l => l.status === 'approved').length,
        rejected: leaves.filter(l => l.status === 'rejected').length,
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
                    <p className="text-gray-500 mt-1">
                        {isStudent ? 'Apply for and track your leave requests' : 'Review and manage leave applications'}
                    </p>
                </div>
                {isStudent && (
                    <Button onClick={() => { setShowForm(!showForm); setError(''); setSuccess(''); }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Apply for Leave
                    </Button>
                )}
            </div>

            {/* Messages */}
            {error && (
                <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                    {error}
                </div>
            )}
            {success && (
                <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                    <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                    {success}
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Requests', value: stats.total, color: 'bg-blue-500' },
                    { label: 'Pending', value: stats.pending, color: 'bg-amber-500' },
                    { label: 'Approved', value: stats.approved, color: 'bg-green-500' },
                    { label: 'Rejected', value: stats.rejected, color: 'bg-red-500' },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">{s.label}</span>
                            <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                        </div>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Apply Form */}
            {showForm && isStudent && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <FileText className="w-5 h-5 mr-2" />
                            New Leave Application
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleApply} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type *</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    >
                                        <option value="casual">Casual Leave</option>
                                        <option value="medical">Medical Leave</option>
                                        <option value="duty">Duty Leave</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                                    <Input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                                    <Input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                                <textarea
                                    value={formData.reason}
                                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                                    className="w-full p-3 border border-gray-300 rounded-md resize-none"
                                    rows={3}
                                    placeholder="Describe the reason for your leave..."
                                />
                            </div>
                            <div className="flex items-center space-x-3">
                                <Button type="submit" disabled={formLoading}>
                                    {formLoading ? 'Submitting...' : 'Submit Application'}
                                </Button>
                                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Filter */}
            <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">Filter:</span>
                {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 text-sm rounded-full transition-colors ${filter === f
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                        {f !== 'all' && ` (${stats[f]})`}
                    </button>
                ))}
            </div>

            {/* Leave List */}
            {filteredLeaves.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium">No leave requests found</p>
                    <p className="text-sm">{isStudent ? 'Click "Apply for Leave" to submit your first request.' : 'No leave applications to review.'}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredLeaves.map(leave => {
                        const typeInfo = TYPE_LABELS[leave.type] || TYPE_LABELS.casual;
                        const statusInfo = STATUS_LABELS[leave.status] || STATUS_LABELS.pending;
                        const StatusIcon = statusInfo.icon;
                        const days = getDays(leave.startDate, leave.endDate);

                        return (
                            <div key={leave._id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        {/* Top row: type badge, status badge */}
                                        <div className="flex items-center space-x-2 mb-2">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${typeInfo.bg} ${typeInfo.color}`}>
                                                {typeInfo.label}
                                            </span>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusInfo.bg} ${statusInfo.color}`}>
                                                <StatusIcon className="w-3 h-3 mr-1" />
                                                {statusInfo.label}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {days} day{days > 1 ? 's' : ''}
                                            </span>
                                        </div>

                                        {/* Student name (for approvers) */}
                                        {isApprover && (
                                            <p className="text-sm font-semibold text-gray-900 mb-1">
                                                {leave.student?.name || 'Unknown Student'}
                                                {leave.student?.profile?.studentId && (
                                                    <span className="text-gray-400 font-normal ml-2">({leave.student.profile.studentId})</span>
                                                )}
                                            </p>
                                        )}

                                        {/* Dates */}
                                        <div className="flex items-center text-sm text-gray-600 mb-1">
                                            <Calendar className="w-3.5 h-3.5 mr-1.5" />
                                            {formatDate(leave.startDate)} — {formatDate(leave.endDate)}
                                        </div>

                                        {/* Reason */}
                                        {leave.reason && (
                                            <p className="text-sm text-gray-500 mt-1">{leave.reason}</p>
                                        )}

                                        {/* Meta */}
                                        <p className="text-xs text-gray-400 mt-2">
                                            Applied on {formatDate(leave.createdAt)}
                                        </p>
                                    </div>

                                    {/* Action buttons for approvers */}
                                    {isApprover && leave.status === 'pending' && (
                                        <div className="flex items-center space-x-2 ml-4">
                                            <button
                                                onClick={() => handleDecision(leave._id, 'approved')}
                                                disabled={actionLoading === leave._id}
                                                className="p-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors"
                                                title="Approve"
                                            >
                                                <CheckCircle className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDecision(leave._id, 'rejected')}
                                                disabled={actionLoading === leave._id}
                                                className="p-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors"
                                                title="Reject"
                                            >
                                                <XCircle className="w-5 h-5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
