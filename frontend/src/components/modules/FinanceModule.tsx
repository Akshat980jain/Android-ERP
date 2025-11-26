import React, { useState, useEffect } from 'react';
import { CreditCard, Download, Calendar, CheckCircle, Clock, AlertTriangle, DollarSign } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import apiClient from '../../utils/api';

interface FeeRecord {
  id: string;
  type: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'paid' | 'pending' | 'overdue';
  semester: string;
}

interface PaymentHistory {
  id: string;
  description: string;
  amount: number;
  date: string;
  method: string;
  transactionId: string;
}

interface Scholarship {
  id: string;
  name: string;
  amount: number;
  status: string;
  appliedDate: string;
  description: string;
}

export function FinanceModule() {
  const [activeTab, setActiveTab] = useState('overview');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedFee, setSelectedFee] = useState<string>('');
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchFinanceData() {
      setLoading(true);
      setError('');
      try {
        const feesRes = await apiClient.getFees();
        setFeeRecords(Array.isArray(feesRes.fees) ? feesRes.fees : []);
        const historyRes = await apiClient.getPaymentHistory();
        setPaymentHistory(Array.isArray(historyRes.history) ? historyRes.history : []);
        // If you have a scholarships API, fetch it here. Otherwise, leave as empty.
        setScholarships([]);
      } catch {
        setError('Failed to load finance data. Please try again later.');
        setFeeRecords([]);
        setPaymentHistory([]);
        setScholarships([]);
      }
      setLoading(false);
    }
    fetchFinanceData();
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'fees', label: 'Fee Details' },
    { id: 'payment', label: 'Make Payment' },
    { id: 'history', label: 'Payment History' },
    { id: 'scholarships', label: 'Scholarships' },
  ];

  const totalPending = feeRecords
    .filter(fee => fee.status === 'pending' || fee.status === 'overdue')
    .reduce((sum, fee) => sum + fee.amount, 0);

  const totalPaid = paymentHistory.reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <CreditCard className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Finance Management</h1>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Pending</p>
                  <p className="text-2xl font-bold text-red-600">₹{totalPending.toLocaleString()}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Paid</p>
                  <p className="text-2xl font-bold text-green-600">₹{totalPaid.toLocaleString()}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Scholarships</p>
                  <p className="text-2xl font-bold text-blue-600">₹{scholarships.reduce((sum, s) => sum + s.amount, 0).toLocaleString()}</p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-600" />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading transactions...</div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">{error}</div>
              ) : paymentHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No transactions found.</div>
              ) : (
                <div className="space-y-4">
                  {paymentHistory.slice(0, 3).map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{payment.description}</p>
                        <p className="text-sm text-gray-600">{payment.date} • {payment.method}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">₹{payment.amount.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{payment.transactionId}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'fees' && (
        <Card>
          <CardHeader>
            <CardTitle>Fee Details</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading fees...</div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">{error}</div>
            ) : feeRecords.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No fees found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {feeRecords.map((fee) => (
                      <tr key={fee.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">{fee.type}</p>
                              <p className="text-sm text-gray-500">{fee.semester}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₹{fee.amount.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{fee.dueDate}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            fee.status === 'paid' ? 'bg-green-100 text-green-800' :
                            fee.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            fee.status === 'overdue' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'payment' && (
        <Card>
          <CardHeader>
            <CardTitle>Make Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Fee Type
                </label>
                <select
                  value={selectedFee}
                  onChange={(e) => setSelectedFee(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select a fee to pay</option>
                  {feeRecords
                    .filter(fee => fee.status !== 'paid')
                    .map(fee => (
                      <option key={fee.id} value={fee.type}>
                        {fee.type} - ₹{fee.amount.toLocaleString()}
                      </option>
                    ))}
                </select>
              </div>

              <Input
                label="Payment Amount"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter amount"
              />

              <Button 
                onClick={() => {}}
                disabled={!selectedFee || !paymentAmount}
                className="w-full"
              >
                Proceed to Payment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'history' && (
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading payment history...</div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">{error}</div>
            ) : paymentHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No payment history found.</div>
            ) : (
              <div className="space-y-4">
                {paymentHistory.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <CheckCircle className="w-6 h-6 text-green-500" />
                      <div>
                        <p className="font-medium text-gray-900">{payment.description}</p>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{payment.date}</span>
                          <span>•</span>
                          <span>{payment.method}</span>
                        </div>
                        <p className="text-xs text-gray-500">Transaction ID: {payment.transactionId}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">₹{payment.amount.toLocaleString()}</p>
                      <Button variant="outline" size="sm" className="mt-2">
                        <Download className="w-4 h-4 mr-2" />
                        Receipt
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'scholarships' && (
        <Card>
          <CardHeader>
            <CardTitle>Scholarships</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading scholarships...</div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">{error}</div>
            ) : scholarships.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No scholarships found.</div>
            ) : (
              <div className="space-y-4">
                {scholarships.map((scholarship) => (
                  <div key={scholarship.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{scholarship.name}</h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        scholarship.status === 'approved' ? 'bg-green-100 text-green-800' :
                        scholarship.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        scholarship.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {scholarship.status.charAt(0).toUpperCase() + scholarship.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{scholarship.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        Applied: {scholarship.appliedDate}
                      </div>
                      <div className="font-bold text-blue-600">₹{scholarship.amount.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full">
                  Apply for New Scholarship
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}