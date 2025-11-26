import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { UserCheck, UserX, Clock, Mail, Phone, Building, GraduationCap, AlertCircle, CheckCircle2, X } from 'lucide-react';
import apiClient from '../../utils/api';

interface VerificationRequest {
  _id: string;
  name: string;
  email: string;
  requestedRole: string;
  program?: string;
  department?: string;
  phone?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  remarks?: string;
}

export function RequestApproval() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [decision, setDecision] = useState<'approved' | 'rejected'>('approved');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const response: any = await apiClient.getFacultyRequests();
      
      if (response.success && response.data) {
        setRequests(response.data);
      } else if (response.requests) {
        setRequests(response.requests);
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.error('Error fetching verification requests:', err);
      setError('Failed to load verification requests');
      setRequests([]);
    }
    setLoading(false);
  };

  const handleDecision = (request: VerificationRequest, status: 'approved' | 'rejected') => {
    setSelectedRequest(request);
    setDecision(status);
    setRemarks('');
    setShowDecisionModal(true);
  };

  const processDecision = async () => {
    if (!selectedRequest) return;
    if (decision === 'rejected' && !remarks.trim()) {
      alert('Please provide remarks for rejection');
      return;
    }

    setProcessingId(selectedRequest._id);
    setShowDecisionModal(false);

    try {
      const response: any = await apiClient.updateFacultyRequest(selectedRequest._id, {
        status: decision,
        ...{ remarks },
      } as any);

      if (response.success) {
        // Remove the processed request from the list
        setRequests(requests.filter(r => r._id !== selectedRequest._id));
        alert(`Request ${decision === 'approved' ? 'approved' : 'rejected'} successfully!`);
      } else {
        alert(response.message || 'Failed to process request');
      }
    } catch (err) {
      console.error('Error processing request:', err);
      alert('Failed to process request. Please try again.');
    }

    setProcessingId(null);
    setSelectedRequest(null);
    setRemarks('');
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'student':
        return 'text-blue-600 bg-blue-100';
      case 'faculty':
        return 'text-purple-600 bg-purple-100';
      case 'admin':
        return 'text-orange-600 bg-orange-100';
      case 'library':
        return 'text-violet-600 bg-violet-100';
      case 'placement':
        return 'text-pink-600 bg-pink-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'student':
        return <GraduationCap className="w-6 h-6" />;
      case 'faculty':
      case 'admin':
        return <UserCheck className="w-6 h-6" />;
      case 'library':
        return <Building className="w-6 h-6" />;
      case 'placement':
        return <Building className="w-6 h-6" />;
      default:
        return <UserCheck className="w-6 h-6" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading verification requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchRequests}>Retry</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Verification Requests</h1>
          <p className="text-gray-600 mt-1">
            {requests.length} pending request{requests.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={fetchRequests} variant="outline">
          <Clock className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">All Caught Up!</h3>
              <p className="text-gray-600">No pending verification requests</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {requests.map((request) => (
            <Card key={request._id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3">
                    <div className={`p-3 rounded-lg ${getRoleColor(request.requestedRole)}`}>
                      {getRoleIcon(request.requestedRole)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{request.name}</h3>
                      <p className="text-sm text-gray-600">{request.email}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(request.requestedRole)}`}>
                    {request.requestedRole.toUpperCase()}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
                  {request.program && (
                    <div className="flex items-center text-sm text-gray-600">
                      <GraduationCap className="w-4 h-4 mr-2" />
                      <span className="font-medium mr-2">Program:</span>
                      <span>{request.program}</span>
                    </div>
                  )}
                  {request.department && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Building className="w-4 h-4 mr-2" />
                      <span className="font-medium mr-2">Department:</span>
                      <span>{request.department}</span>
                    </div>
                  )}
                  {request.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2" />
                      <span className="font-medium mr-2">Phone:</span>
                      <span>{request.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <span className="font-medium mr-2">Requested:</span>
                    <span>{formatDate(request.createdAt)}</span>
                  </div>
                </div>

                {/* Actions */}
                {processingId === request._id ? (
                  <div className="flex items-center justify-center py-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-sm text-gray-600">Processing...</span>
                  </div>
                ) : (
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleDecision(request, 'rejected')}
                      className="flex-1 px-4 py-2 border-2 border-red-500 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium flex items-center justify-center"
                    >
                      <UserX className="w-4 h-4 mr-2" />
                      Reject
                    </button>
                    <button
                      onClick={() => handleDecision(request, 'approved')}
                      className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center justify-center"
                    >
                      <UserCheck className="w-4 h-4 mr-2" />
                      Approve
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Decision Modal */}
      {showDecisionModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {decision === 'approved' ? 'Approve' : 'Reject'} Request
              </h3>
              <button
                onClick={() => setShowDecisionModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-gray-700 mb-4">
              {decision === 'approved'
                ? `Are you sure you want to approve ${selectedRequest.name}'s request for ${selectedRequest.requestedRole} role?`
                : `Are you sure you want to reject ${selectedRequest.name}'s request?`}
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remarks {decision === 'rejected' ? '(Required)' : '(Optional)'}
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter remarks..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowDecisionModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={processDecision}
                disabled={decision === 'rejected' && !remarks.trim()}
                className={`flex-1 px-4 py-2 rounded-lg text-white font-medium ${
                  decision === 'approved'
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-red-500 hover:bg-red-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {decision === 'approved' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

