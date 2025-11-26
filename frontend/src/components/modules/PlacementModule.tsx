import React, { useState, useEffect } from 'react';
import { Briefcase, Building, Calendar, Users, TrendingUp, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import apiClient from '../../utils/api';

interface Job {
  id?: string;
  _id?: string;
  company: string;
  position: string;
  package: string | { min: number; max: number; currency: string };
  location: string;
  requirements: string[];
  deadline: string;
  status: 'active' | 'closed';
  appliedStudents: number;
  description: string;
  type: 'full-time' | 'internship';
}

interface Application {
  id: string;
  jobId: string;
  company: string;
  position: string;
  appliedDate: string;
  status: string;
  feedback?: string;
}

interface PlacementStats {
  totalCompanies: number;
  totalOffers: number;
  averagePackage: string;
  highestPackage: string;
  placementRate: string;
}

export function PlacementModule() {
  const [activeTab, setActiveTab] = useState('jobs');
  const [filter, setFilter] = useState<'all' | 'full-time' | 'internship'>('all');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [placementStats, setPlacementStats] = useState<PlacementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchPlacementData() {
      setLoading(true);
      setError('');
      try {
        const jobsRes: unknown = await apiClient.getJobs();
        let jobsArr: Job[] = [];
        if (jobsRes && typeof jobsRes === 'object' && 'jobs' in jobsRes && Array.isArray((jobsRes as { jobs?: unknown }).jobs)) {
          jobsArr = (jobsRes as { jobs: Job[] }).jobs;
        } else if (Array.isArray(jobsRes)) {
          jobsArr = jobsRes as Job[];
        }
        setJobs(jobsArr);

        const appsRes: unknown = await apiClient.getJobApplications();
        let appsArr: Application[] = [];
        if (appsRes && typeof appsRes === 'object' && 'applications' in appsRes && Array.isArray((appsRes as { applications?: unknown }).applications)) {
          appsArr = (appsRes as { applications: Application[] }).applications;
        } else if (Array.isArray(appsRes)) {
          appsArr = appsRes as Application[];
        }
        setApplications(appsArr);

        const statsRes: unknown = await apiClient.getPlacementStats();
        let stats: PlacementStats | null = null;
        if (statsRes && typeof statsRes === 'object' && 'stats' in statsRes && typeof (statsRes as { stats?: unknown }).stats === 'object') {
          stats = (statsRes as { stats: PlacementStats }).stats;
        }
        setPlacementStats(stats);
      } catch {
        setError('Failed to load placement data. Please try again later.');
        setJobs([]);
        setApplications([]);
        setPlacementStats(null);
      }
      setLoading(false);
    }
    fetchPlacementData();
  }, []);

  const tabs = [
    { id: 'jobs', label: 'Job Opportunities' },
    { id: 'applications', label: 'My Applications' },
    { id: 'stats', label: 'Placement Statistics' },
  ];

  const filteredJobs = jobs.filter(job => {
    if (filter === 'all') return true;
    return job.type === filter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Briefcase className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Placement Portal</h1>
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

      {activeTab === 'jobs' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Filter by type:</span>
              <select
                value={filter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilter(e.target.value as 'all' | 'full-time' | 'internship')}
                className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Jobs</option>
                <option value="full-time">Full-time</option>
                <option value="internship">Internships</option>
              </select>
            </div>
            <p className="text-sm text-gray-600">{filteredJobs.length} opportunities available</p>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading jobs...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No jobs found.</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredJobs.map((job, idx) => {
                const jobId = job.id || job._id || `idx-${idx}`;
                return (
                  <Card key={`job-${jobId}`}>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <Building className="w-8 h-8 text-blue-600" />
                            <div>
                              <h3 className="font-semibold text-gray-900">{job.position}</h3>
                              <p className="text-sm text-gray-600">{job.company}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              job.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                            </span>
                            <p className="text-xs text-gray-500 mt-1 capitalize">{job.type}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Package:</span>
                            <span className="font-medium text-green-600">
                              {typeof job.package === 'string'
                                ? job.package
                                : job.package && typeof job.package === 'object'
                                  ? `${job.package.currency} ${job.package.min} - ${job.package.max}`
                                  : ''}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Deadline:</span>
                            <span className="font-medium text-red-600">{job.deadline}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Applied:</span>
                            <span className="font-medium">{job.appliedStudents} students</span>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Requirements:</h4>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {job.requirements.map((req, index) => (
                              <li key={`${jobId}-req-${index}`} className="flex items-center space-x-2">
                                <div className="w-1 h-1 bg-gray-400 rounded-full" />
                                <span>{req}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <p className="text-sm text-gray-600">{job.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'applications' && (
        <Card>
          <CardHeader>
            <CardTitle>My Applications</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading applications...</div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">{error}</div>
            ) : applications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No applications found.</div>
            ) : (
              <div className="space-y-4">
                {applications.map((application) => (
                  <div key={`app-${application.id}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <CheckCircle className="w-6 h-6 text-green-500" />
                      <div>
                        <h4 className="font-medium text-gray-900">{application.position}</h4>
                        <p className="text-sm text-gray-600">{application.company}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span>Applied: {application.appliedDate}</span>
                        </div>
                        {application.feedback && (
                          <p className="text-xs text-blue-600 mt-1">{application.feedback}</p>
                        )}
                      </div>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800`}>
                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'stats' && (
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading placement stats...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : !placementStats ? (
            <div className="text-center py-8 text-gray-500">No placement stats found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              <Card key="stat-totalCompanies">
                <CardContent className="text-center">
                  <Building className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{placementStats.totalCompanies}</p>
                  <p className="text-sm text-gray-600">Companies Visited</p>
                </CardContent>
              </Card>
              <Card key="stat-totalOffers">
                <CardContent className="text-center">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{placementStats.totalOffers}</p>
                  <p className="text-sm text-gray-600">Total Offers</p>
                </CardContent>
              </Card>
              <Card key="stat-averagePackage">
                <CardContent className="text-center">
                  <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{placementStats.averagePackage}</p>
                  <p className="text-sm text-gray-600">Average Package</p>
                </CardContent>
              </Card>
              <Card key="stat-highestPackage">
                <CardContent className="text-center">
                  <Briefcase className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{placementStats.highestPackage}</p>
                  <p className="text-sm text-gray-600">Highest Package</p>
                </CardContent>
              </Card>
              <Card key="stat-placementRate">
                <CardContent className="text-center">
                  <Users className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{placementStats.placementRate}</p>
                  <p className="text-sm text-gray-600">Placement Rate</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}