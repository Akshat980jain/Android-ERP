import React, { useState, useEffect } from 'react';
import { Settings, Building, GraduationCap, Bell, Shield, Database, Download, TestTube, Save, QrCode, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../utils/api';

interface SystemSettings {
  institution: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    logo: string;
  };
  academic: {
    currentAcademicYear: string;
    currentSemester: string;
    gradingSystem: string;
    passPercentage: number;
    maxAttendancePercentage: number;
    assignmentSubmissionDeadline: number;
    examDuration: number;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    notificationRetentionDays: number;
  };
  security: {
    passwordMinLength: number;
    passwordComplexity: string;
    sessionTimeout: number;
    maxLoginAttempts: number;
    twoFactorAuth: boolean;
  };
  features: {
    chatEnabled: boolean;
    fileUploadEnabled: boolean;
    analyticsEnabled: boolean;
    backupEnabled: boolean;
  };
}

interface UserPreferences {
  theme: string;
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    academic: boolean;
    financial: boolean;
    events: boolean;
  };
  dashboard: {
    defaultView: string;
    widgets: string[];
    refreshInterval: number;
  };
  privacy: {
    profileVisibility: string;
    contactInfoVisibility: string;
    academicInfoVisibility: string;
  };
}

interface NotificationSettings {
  general: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  academic: {
    assignments: boolean;
    exams: boolean;
    grades: boolean;
    attendance: boolean;
  };
  financial: {
    feeReminders: boolean;
    paymentConfirmations: boolean;
    overdueNotices: boolean;
  };
  events: {
    upcomingEvents: boolean;
    eventReminders: boolean;
    scheduleChanges: boolean;
  };
  frequency: {
    immediate: boolean;
    daily: boolean;
    weekly: boolean;
  };
}

export function SettingsModule() {
  const { user, token, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('system');
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAdmin] = useState(user?.role === 'admin');

  // Two-Factor Authentication (per-user) state
  const [twoFactorSetupInProgress, setTwoFactorSetupInProgress] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [twoFactorMessage, setTwoFactorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin && activeTab === 'system') {
      fetchSystemSettings();
    } else if (activeTab === 'preferences') {
      fetchUserPreferences();
    } else if (activeTab === 'notifications') {
      fetchNotificationSettings();
    }
  }, [activeTab, isAdmin]);

  const fetchSystemSettings = async () => {
    try {
      const response = await fetch('/api/settings/system', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSystemSettings(data.settings);
      }
    } catch (error) {
      setError('Failed to fetch system settings');
    }
  };

  // 2FA actions (per-user)
  const startTwoFactorSetup = async () => {
    try {
      setTwoFactorLoading(true);
      setTwoFactorMessage(null);
      const resp = await apiClient.initiate2FASetup();
      setQrDataUrl(resp.qrDataUrl);
      setTwoFactorSetupInProgress(true);
    } catch (e: any) {
      setTwoFactorMessage(e?.message || 'Failed to start 2FA setup');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const verifyTwoFactorSetup = async () => {
    if (!twoFactorCode || twoFactorCode.trim().length < 6) {
      setTwoFactorMessage('Enter the 6-digit code from your authenticator app.');
      return;
    }
    try {
      setTwoFactorLoading(true);
      setTwoFactorMessage(null);
      await apiClient.verify2FASetup(twoFactorCode.trim());
      setTwoFactorSetupInProgress(false);
      setQrDataUrl(null);
      setTwoFactorCode('');
      if (user) {
        updateUser({ ...user, twoFactorEnabled: true });
      }
      setTwoFactorMessage('Two-factor authentication enabled.');
    } catch (e: any) {
      setTwoFactorMessage(e?.message || 'Invalid code. Please try again.');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const disableTwoFactor = async () => {
    if (!twoFactorCode || twoFactorCode.trim().length < 6) {
      setTwoFactorMessage('Enter your current 6-digit code to disable.');
      return;
    }
    try {
      setTwoFactorLoading(true);
      setTwoFactorMessage(null);
      await apiClient.disable2FA(twoFactorCode.trim());
      setTwoFactorCode('');
      if (user) {
        updateUser({ ...user, twoFactorEnabled: false });
      }
      setTwoFactorMessage('Two-factor authentication disabled.');
    } catch (e: any) {
      setTwoFactorMessage(e?.message || 'Failed to disable 2FA');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const fetchUserPreferences = async () => {
    try {
      const response = await fetch('/api/settings/preferences', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUserPreferences(data.preferences);
      }
    } catch (error) {
      setError('Failed to fetch user preferences');
    }
  };

  const fetchNotificationSettings = async () => {
    try {
      const response = await fetch('/api/settings/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setNotificationSettings(data.notificationSettings);
      }
    } catch (error) {
      setError('Failed to fetch notification settings');
    }
  };

  const updateSystemSettings = async () => {
    if (!systemSettings) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('/api/settings/system', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(systemSettings)
      });
      
      if (response.ok) {
        setSuccess('System settings updated successfully');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update system settings');
      }
    } catch (error) {
      setError('Failed to update system settings');
    } finally {
      setLoading(false);
    }
  };

  const updateUserPreferences = async () => {
    if (!userPreferences) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('/api/settings/preferences', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userPreferences)
      });
      
      if (response.ok) {
        setSuccess('User preferences updated successfully');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update preferences');
      }
    } catch (error) {
      setError('Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  const updateNotificationSettings = async () => {
    if (!notificationSettings) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(notificationSettings)
      });
      
      if (response.ok) {
        setSuccess('Notification settings updated successfully');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update notification settings');
      }
    } catch (error) {
      setError('Failed to update notification settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSystemSettingChange = (section: keyof SystemSettings, field: string, value: any) => {
    if (!systemSettings) return;
    
    setSystemSettings(prev => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [field]: value
      }
    }));
  };

  const handlePreferenceChange = (section: keyof UserPreferences, field: string, value: any) => {
    if (!userPreferences) return;
    
    setUserPreferences(prev => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [field]: value
      }
    }));
  };

  const handleNotificationSettingChange = (section: keyof NotificationSettings, field: string, value: any) => {
    if (!notificationSettings) return;
    
    setNotificationSettings(prev => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [field]: value
      }
    }));
  };

  const tabs = [
    { id: 'system', label: 'System Settings', icon: Settings, adminOnly: true },
    { id: 'preferences', label: 'User Preferences', icon: Settings, adminOnly: false },
    { id: 'notifications', label: 'Notifications', icon: Bell, adminOnly: false }
  ].filter(tab => !tab.adminOnly || isAdmin);

  const renderSystemSettings = () => {
    if (!systemSettings) return null;

    return (
      <div className="space-y-6">
        {/* Institution Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="w-5 h-5 mr-2" />
              Institution Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Institution Name</label>
                <Input
                  value={systemSettings.institution.name}
                  onChange={(e) => handleSystemSettingChange('institution', 'name', e.target.value)}
                  placeholder="Enter institution name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <Input
                  type="email"
                  value={systemSettings.institution.email}
                  onChange={(e) => handleSystemSettingChange('institution', 'email', e.target.value)}
                  placeholder="Enter email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <Input
                  value={systemSettings.institution.phone}
                  onChange={(e) => handleSystemSettingChange('institution', 'phone', e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <Input
                  value={systemSettings.institution.website}
                  onChange={(e) => handleSystemSettingChange('institution', 'website', e.target.value)}
                  placeholder="Enter website URL"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <Input
                value={systemSettings.institution.address}
                onChange={(e) => handleSystemSettingChange('institution', 'address', e.target.value)}
                placeholder="Enter full address"
              />
            </div>
          </CardContent>
        </Card>

        {/* Academic Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <GraduationCap className="w-5 h-5 mr-2" />
              Academic Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                <Input
                  type="number"
                  value={systemSettings.academic.currentAcademicYear}
                  onChange={(e) => handleSystemSettingChange('academic', 'currentAcademicYear', e.target.value)}
                  placeholder="2024"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Semester</label>
                <select
                  value={systemSettings.academic.currentSemester}
                  onChange={(e) => handleSystemSettingChange('academic', 'currentSemester', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="1st">1st Semester</option>
                  <option value="2nd">2nd Semester</option>
                  <option value="3rd">3rd Semester</option>
                  <option value="4th">4th Semester</option>
                  <option value="5th">5th Semester</option>
                  <option value="6th">6th Semester</option>
                  <option value="7th">7th Semester</option>
                  <option value="8th">8th Semester</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pass Percentage</label>
                <Input
                  type="number"
                  value={systemSettings.academic.passPercentage}
                  onChange={(e) => handleSystemSettingChange('academic', 'passPercentage', parseInt(e.target.value))}
                  placeholder="40"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password Min Length</label>
                <Input
                  type="number"
                  value={systemSettings.security.passwordMinLength}
                  onChange={(e) => handleSystemSettingChange('security', 'passwordMinLength', parseInt(e.target.value))}
                  placeholder="8"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Login Attempts</label>
                <Input
                  type="number"
                  value={systemSettings.security.maxLoginAttempts}
                  onChange={(e) => handleSystemSettingChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                  placeholder="5"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="twoFactorAuth"
                checked={systemSettings.security.twoFactorAuth}
                onChange={(e) => handleSystemSettingChange('security', 'twoFactorAuth', e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="twoFactorAuth" className="text-sm font-medium text-gray-700">
                Enable Two-Factor Authentication
              </label>
            </div>
            {/* Per-user Two-Factor Authentication */}
            <div className="mt-4 border-t pt-4">
              <div className="flex items-center mb-3">
                <QrCode className="w-5 h-5 mr-2" />
                <span className="font-medium">Two-Factor Authentication (your account)</span>
              </div>
              {!user?.twoFactorEnabled && !twoFactorSetupInProgress && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">Add an extra layer of security by requiring a code from an authenticator app when you sign in.</p>
                  <Button onClick={startTwoFactorSetup} disabled={twoFactorLoading}>
                    {twoFactorLoading ? 'Starting…' : 'Enable Two-Factor'}
                  </Button>
                </div>
              )}
              {twoFactorSetupInProgress && (
                <div className="space-y-3">
                  {qrDataUrl && (
                    <img src={qrDataUrl} alt="Scan QR code with authenticator app" className="w-40 h-40" />
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Enter 6-digit code</label>
                    <input
                      className="w-full p-2 border border-gray-300 rounded-md"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value)}
                      placeholder="123456"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button onClick={verifyTwoFactorSetup} disabled={twoFactorLoading}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {twoFactorLoading ? 'Verifying…' : 'Verify & Enable'}
                    </Button>
                    <Button variant="secondary" onClick={() => { setTwoFactorSetupInProgress(false); setQrDataUrl(null); setTwoFactorCode(''); }} disabled={twoFactorLoading}>
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
              {user?.twoFactorEnabled && !twoFactorSetupInProgress && (
                <div className="space-y-3">
                  <div className="text-sm text-green-700">Two-factor is enabled on your account.</div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Enter current 6-digit code to disable</label>
                    <input
                      className="w-full p-2 border border-gray-300 rounded-md"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value)}
                      placeholder="123456"
                    />
                  </div>
                  <Button onClick={disableTwoFactor} disabled={twoFactorLoading}>
                    {twoFactorLoading ? 'Disabling…' : 'Disable Two-Factor'}
                  </Button>
                </div>
              )}
              {twoFactorMessage && (
                <div className="mt-2 text-sm text-gray-700">{twoFactorMessage}</div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={updateSystemSettings} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    );
  };

  const renderUserPreferences = () => {
    if (!userPreferences) return null;

    return (
      <div className="space-y-6">
        {/* Theme and Language */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance & Language</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
                <select
                  value={userPreferences.theme}
                  onChange={(e) => handlePreferenceChange('theme', 'theme', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                <select
                  value={userPreferences.language}
                  onChange={(e) => handlePreferenceChange('language', 'language', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="es">Spanish</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                <select
                  value={userPreferences.timezone}
                  onChange={(e) => handlePreferenceChange('timezone', 'timezone', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="UTC">UTC</option>
                  <option value="Asia/Kolkata">Asia/Kolkata</option>
                  <option value="America/New_York">America/New_York</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dashboard Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Dashboard Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default View</label>
                <select
                  value={userPreferences.dashboard.defaultView}
                  onChange={(e) => handlePreferenceChange('dashboard', 'defaultView', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="overview">Overview</option>
                  <option value="academic">Academic</option>
                  <option value="finance">Finance</option>
                  <option value="schedule">Schedule</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Refresh Interval (seconds)</label>
                <Input
                  type="number"
                  value={userPreferences.dashboard.refreshInterval}
                  onChange={(e) => handlePreferenceChange('dashboard', 'refreshInterval', parseInt(e.target.value))}
                  placeholder="300"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={updateUserPreferences} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </div>
    );
  };

  const renderNotificationSettings = () => {
    if (!notificationSettings) return null;

    return (
      <div className="space-y-6">
        {/* General Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>General Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="emailNotif"
                  checked={notificationSettings.general.email}
                  onChange={(e) => handleNotificationSettingChange('general', 'email', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="emailNotif" className="text-sm font-medium text-gray-700">
                  Email Notifications
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="smsNotif"
                  checked={notificationSettings.general.sms}
                  onChange={(e) => handleNotificationSettingChange('general', 'sms', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="smsNotif" className="text-sm font-medium text-gray-700">
                  SMS Notifications
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="pushNotif"
                  checked={notificationSettings.general.push}
                  onChange={(e) => handleNotificationSettingChange('general', 'push', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="pushNotif" className="text-sm font-medium text-gray-700">
                  Push Notifications
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Academic Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Academic Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="assignmentNotif"
                  checked={notificationSettings.academic.assignments}
                  onChange={(e) => handleNotificationSettingChange('academic', 'assignments', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="assignmentNotif" className="text-sm font-medium text-gray-700">
                  Assignment Updates
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="examNotif"
                  checked={notificationSettings.academic.exams}
                  onChange={(e) => handleNotificationSettingChange('academic', 'exams', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="examNotif" className="text-sm font-medium text-gray-700">
                  Exam Notifications
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="gradeNotif"
                  checked={notificationSettings.academic.grades}
                  onChange={(e) => handleNotificationSettingChange('academic', 'grades', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="gradeNotif" className="text-sm font-medium text-gray-700">
                  Grade Updates
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={updateNotificationSettings} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Notification Settings'}
          </Button>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'system':
        return renderSystemSettings();
      case 'preferences':
        return renderUserPreferences();
      case 'notifications':
        return renderNotificationSettings();
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account preferences and system settings</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="text-green-800">{success}</div>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4 inline mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  );
}
