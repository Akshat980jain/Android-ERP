import React, { useState, useEffect } from 'react';
import { FileText, Download, Clock, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import apiClient from '../../utils/api';

interface StudentService {
  _id: string;
  type: string;
  status: string;
  requestDate?: string;
  approvedDate?: string;
  remarks?: string;
}

interface DownloadFile {
  name: string;
  type: string;
  date: string;
  size: string;
}

export function StudentServices() {
  const [activeTab, setActiveTab] = useState('apply');
  const [services, setServices] = useState<StudentService[]>([]);
  const [downloads, setDownloads] = useState<DownloadFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchServicesData() {
      setLoading(true);
      setError('');
      try {
        const servicesRes = await apiClient.getStudentServices();
        const list = Array.isArray(servicesRes.services) ? servicesRes.services : [];
        // Normalize to expected shape
        const normalized: StudentService[] = list.map((s: any) => ({
          _id: s._id,
          type: s.type || s.name || 'Service',
          status: s.status || 'pending',
          requestDate: s.requestDate ? new Date(s.requestDate).toLocaleDateString() : '',
          approvedDate: s.approvedDate ? new Date(s.approvedDate).toLocaleDateString() : undefined,
          remarks: s.remarks || ''
        }));
        setServices(normalized);
        // If you have a downloads API, fetch it here. Otherwise, leave as empty.
        setDownloads([]);
      } catch {
        setError('Failed to load student services. Please try again later.');
        setServices([]);
        setDownloads([]);
      }
      setLoading(false);
    }
    fetchServicesData();
  }, []);

  const tabs = [
    { id: 'apply', label: 'Apply for Services' },
    { id: 'status', label: 'Application Status' },
    { id: 'downloads', label: 'Downloads' },
  ];

  return (
    <div className="space-y-6">
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

      {activeTab === 'apply' && (
          <Card>
            <CardHeader>
              <CardTitle>Available Services</CardTitle>
            </CardHeader>
            <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading services...</div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">{error}</div>
            ) : services.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No services available.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((service) => (
                  <div key={service._id} className="p-4 border-2 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <FileText className="w-6 h-6 text-blue-600 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{service.type}</h3>
                        <p className="text-sm text-gray-600 mt-1">Status: {service.status}</p>
                        <p className="text-sm text-gray-600 mt-1">Requested: {service.requestDate}</p>
                        {service.approvedDate && <p className="text-sm text-gray-600 mt-1">Approved: {service.approvedDate}</p>}
                        {service.remarks && <p className="text-sm text-gray-600 mt-1">Remarks: {service.remarks}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
              </CardContent>
            </Card>
      )}

      {activeTab === 'status' && (
        <Card>
          <CardHeader>
            <CardTitle>Application Status</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading applications...</div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">{error}</div>
            ) : services.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No applications found.</div>
            ) : (
            <div className="space-y-4">
                {services.map((app) => (
                <div key={app._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                      {app.status === 'approved' ? <CheckCircle className="w-5 h-5 text-green-500" /> : app.status === 'pending' ? <Clock className="w-5 h-5 text-yellow-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                    <div>
                      <h4 className="font-medium text-gray-900">{app.type}</h4>
                        <p className="text-sm text-gray-600">Applied on: {app.requestDate}</p>
                        {app.approvedDate && <p className="text-sm text-gray-600">Approved on: {app.approvedDate}</p>}
                        {app.remarks && <p className="text-sm text-gray-600">Remarks: {app.remarks}</p>}
                      </div>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      app.status === 'approved' ? 'bg-green-100 text-green-800' :
                      app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      app.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </span>
                </div>
              ))}
            </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'downloads' && (
        <Card>
          <CardHeader>
            <CardTitle>Available Downloads</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading downloads...</div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">{error}</div>
            ) : downloads.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No downloads found.</div>
            ) : (
            <div className="space-y-4">
              {downloads.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <FileText className="w-8 h-8 text-blue-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">{file.name}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>{file.type}</span>
                        <span>•</span>
                        <span>{file.size}</span>
                        <span>•</span>
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {file.date}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}