import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NativeModules } from 'react-native';
import { AuthResponse, ApiResponse, User } from '../types';

// Base URL and candidates
const API_BASE_URL = __DEV__ 
  ? 'http://192.168.1.14:5000/api'  // Development - use current computer IP
  : 'http://192.168.1.14:5000/api'; // Production - same for now

function getCandidateBaseUrls(): string[] {
  const urls: string[] = [];
  // Prefer the configured base first
  urls.push(API_BASE_URL);

  // Try using the Metro bundler host IP (useful in Expo/React Native dev)
  try {
    const scriptURL: string | undefined = (NativeModules as any)?.SourceCode?.scriptURL;
    if (scriptURL) {
      const parsed = new URL(scriptURL);
      const host = parsed.hostname;
      if (host && host !== 'localhost' && host !== '127.0.0.1') {
        urls.push(`http://${host}:5000/api`);
      }
    }
  } catch (_) {}

  // If running on Android emulator, 10.0.2.2 maps to host machine
  if (Platform.OS === 'android') {
    urls.push('http://10.0.2.2:5000/api');
  }

  // Typical LAN IPs that might be used during development
  urls.push('http://192.168.1.14:5000/api');
  urls.push('http://192.168.1.14:5000/api');

  // 'localhost' only makes sense on iOS simulator or web; exclude on Android
  if (Platform.OS !== 'android') {
    urls.push('http://localhost:5000/api');
  }

  // De-duplicate while preserving order
  const seen = new Set<string>();
  return urls.filter((u) => {
    if (seen.has(u)) return false;
    seen.add(u);
    return true;
  });
}

class ApiService {
  private baseURL: string;
  private cachedToken: string | null = null;
  private static readonly VERBOSE_LOGS: boolean = false; // set true only when debugging

  private debugLog(...args: any[]) {
    if (ApiService.VERBOSE_LOGS) {
      // eslint-disable-next-line no-console
      console.log(...args);
    }
  }

  constructor() {
    this.baseURL = API_BASE_URL;
    // Prime cache from storage (best-effort)
    AsyncStorage.getItem('educonnect_token').then((t) => { this.cachedToken = t; }).catch(() => {});
  }

  private async getToken(): Promise<string | null> {
    if (this.cachedToken) return this.cachedToken;
    try {
      const t = await AsyncStorage.getItem('educonnect_token');
      this.cachedToken = t;
      return t;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  private async getHeaders(): Promise<HeadersInit> {
    const token = await this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private shouldStopRetriesForStatus(status: number): boolean {
    // Do not try alternate base URLs for auth/route errors
    return status === 401 || status === 403 || status === 404;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const urlsToTry = getCandidateBaseUrls();
    
    for (let i = 0; i < urlsToTry.length; i++) {
      const baseURL = urlsToTry[i];
      const url = `${baseURL}${endpoint}`;
      
      try {
        this.debugLog(`Attempt ${i + 1}: Making API request to:`, url);
        this.debugLog('Network status check - attempting connection...');
        this.debugLog('Current baseURL:', this.baseURL);
        this.debugLog('All URLs to try:', urlsToTry);
        this.debugLog('Testing basic network connectivity...');
        
        const headers = await this.getHeaders();
        
        // Create AbortController for timeout (shorter to fail over faster)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(url, {
          ...options,
          headers: {
            ...headers,
            ...options.headers,
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        this.debugLog('Response status:', response.status);
        this.debugLog('Response headers:', response.headers);

        // If server did not return JSON, avoid parsing and return a clean error
        const contentType = (response.headers as any)?.get?.('content-type')?.toLowerCase?.() || '';
        if (!contentType.includes('application/json')) {
          // Read text for logging, but do not throw to avoid noisy banners
          if (ApiService.VERBOSE_LOGS) {
            const nonJsonBody = await response.text();
            this.debugLog('Non-JSON response body (truncated):', nonJsonBody?.slice?.(0, 200));
          }
          const errMsg = `HTTP ${response.status}`;
          if (!response.ok || this.shouldStopRetriesForStatus(response.status)) {
            return { success: false, error: errMsg } as any;
          }
          // For unexpected non-error non-JSON, still return graceful error
          return { success: false, error: 'Unexpected non-JSON response from server' } as any;
        }

        let data: any;
        let responseText = '';
        
        try {
          // First, get the response as text to avoid "Already read" error
          responseText = await response.text();
          this.debugLog('Response text (truncated):', responseText?.slice?.(0, 200));
          
          // Try to parse as JSON
          if (responseText.trim()) {
            data = JSON.parse(responseText);
            this.debugLog('Response data (keys):', Object.keys(data || {}));
          } else {
            data = {};
          }
        } catch (jsonError) {
          this.debugLog('JSON Parse Error:', jsonError);
          this.debugLog('Response status:', response.status);
          this.debugLog('Response headers:', response.headers);
          
          // If it's HTML, it might be an error page
          if (responseText.includes('<html>') || responseText.includes('<!DOCTYPE')) {
            if (this.shouldStopRetriesForStatus(response.status)) {
              return { success: false, error: `HTTP ${response.status}` } as any;
            }
            return { success: false, error: 'Server returned HTML instead of JSON' } as any;
          }
          
          return { success: false, error: 'Invalid JSON returned by server' } as any;
        }

        if (!response.ok) {
          const message = data?.message || data?.error || `Request failed with status ${response.status}`;
          // Stop retries for certain statuses
          if (this.shouldStopRetriesForStatus(response.status)) {
            return { success: false, error: message } as any;
          }
          throw new Error(message);
        }

        // Check if response indicates token error (even with 200 status)
        if (data?.success === false && data?.error) {
          const errorMsg = data.error;
          if (errorMsg.includes('Token is not valid') || errorMsg.includes('No token')) {
            // Clear invalid token
            this.cachedToken = null;
            await AsyncStorage.removeItem('educonnect_token');
            await AsyncStorage.removeItem('educonnect_user');
            throw new Error(errorMsg);
          }
        }

        return data;
      } catch (error: any) {
        this.debugLog(`Attempt ${i + 1} failed:`, error?.message || String(error));
        
        // If this is the last attempt, return the error
        if (i === urlsToTry.length - 1) {
          // eslint-disable-next-line no-console
          console.warn('API request failed for all candidate URLs:', {
            endpoint,
            tried: urlsToTry,
            reason: error?.name === 'AbortError' ? 'timeout' : (error?.message || 'unknown')
          });
          
          // Return a more user-friendly error message
          let errorMessage = 'Network error';
          if (error.name === 'AbortError') {
            errorMessage = 'Request timed out. Please check your connection and try again.';
          } else if (error.message.includes('JSON Parse error')) {
            errorMessage = 'Server returned invalid data. Please try again.';
          } else if (error.message.includes('HTML instead of JSON')) {
            errorMessage = 'Server is not responding properly. Please check your connection.';
          } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            errorMessage = 'No token, authorization denied';
          } else if (error.message.includes('fetch') || error.message.includes('Network')) {
            errorMessage = 'Cannot connect to server. Please check your internet connection.';
          } else {
            errorMessage = error.message;
          }
          
          return {
            success: false,
            error: errorMessage,
          } as any;
        }
        
        // Continue to next URL
        this.debugLog(`Trying next URL...`);
      }
    }
    
    return {
      success: false,
      error: 'All connection attempts failed',
    } as any;
  }

  private async persistAuthFromResponse(resp: any): Promise<void> {
    const token = resp?.data?.token || resp?.token;
    const user = resp?.data?.user || resp?.user;
    if (token) {
      this.cachedToken = token;
      await AsyncStorage.setItem('educonnect_token', token);
    }
    if (user) {
      await AsyncStorage.setItem('educonnect_user', JSON.stringify(user));
    }
  }

  // Authentication methods
  async login(email: string, password: string): Promise<AuthResponse> {
    const response: any = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // login returns otpRequired/tempToken or full token depending on flow
    await this.persistAuthFromResponse(response);
    return response;
  }

  async register(userData: any): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }) as any;
  }

  async verifyOtp(email: string, otp: string): Promise<AuthResponse> {
    const response: any = await this.request<AuthResponse>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp, issueToken: true }),
    });

    await this.persistAuthFromResponse(response);
    return response;
  }

  async verifyLogin2FA(tempToken: string, code: string): Promise<AuthResponse> {
    const response: any = await this.request<AuthResponse>('/auth/2fa/verify-login', {
      method: 'POST',
      body: JSON.stringify({ tempToken, code }),
    });

    await this.persistAuthFromResponse(response);
    return response;
  }

  async getCurrentUser(): Promise<User | null> {
    const response: any = await this.request<{ user: User }>('/auth/me');
    if (!response || response.success === false) {
      return null;
    }
    return (response.data?.user || response.user) as User;
  }

  async getProfile(): Promise<ApiResponse<any>> {
    // Backend provides profile via /auth/me, but also supports PUT /auth/profile for updates
    return this.request('/auth/me');
  }

  async updateProfile(profile: any): Promise<ApiResponse<any>> {
    // Matches backend route: PUT /api/auth/profile
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
  }

  async logout(): Promise<void> {
    this.cachedToken = null;
    await AsyncStorage.removeItem('educonnect_token');
    await AsyncStorage.removeItem('educonnect_user');
  }

  async forgotPassword(email: string): Promise<ApiResponse<any>> {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, password: string): Promise<ApiResponse<any>> {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }

  // Student methods
  async getStudentProfile(): Promise<ApiResponse<any>> {
    return this.request('/students/profile');
  }

  async getStudentCourses(): Promise<ApiResponse<any>> {
    // Backend exposes courses filtered by role at /courses, and student-specific at /courses/my-courses
    // Prefer /courses for richer population; fall back to /courses/my-courses
    const primary = await this.request('/courses');
    if ((primary as any)?.success !== false) return primary;
    return this.request('/courses/my-courses');
  }

  async getStudentAttendance(): Promise<ApiResponse<any>> {
    // Attendance router is mounted at /api/attendance in backend
    return this.request('/attendance');
  }

  async getStudentMarks(): Promise<ApiResponse<any>> {
    return this.request('/students/marks');
  }

  async getStudentAssignments(): Promise<ApiResponse<any>> {
    // Assignments are served from assignments router
    return this.request('/assignments');
  }

  async getAssignmentById(assignmentId: string): Promise<ApiResponse<any>> {
    return this.request(`/assignments/${assignmentId}`);
  }

  async submitAssignment(assignmentId: string, submissionData: {
    content?: string;
    attachments?: any[];
  }): Promise<ApiResponse<any>> {
    return this.request(`/assignments/${assignmentId}/submit`, {
      method: 'POST',
      body: JSON.stringify(submissionData),
    });
  }

  async createAssignment(assignmentData: {
    title: string;
    description: string;
    courseId: string;
    startDate: string;
    dueDate: string;
    maxMarks: number;
    instructions?: string;
    allowLateSubmission?: boolean;
    lateSubmissionPenalty?: number;
  }): Promise<ApiResponse<any>> {
    return this.request('/assignments', {
      method: 'POST',
      body: JSON.stringify(assignmentData),
    });
  }

  async updateAssignment(assignmentId: string, assignmentData: {
    title?: string;
    description?: string;
    dueDate?: string;
    maxMarks?: number;
    instructions?: string;
    allowLateSubmission?: boolean;
    lateSubmissionPenalty?: number;
  }): Promise<ApiResponse<any>> {
    return this.request(`/assignments/${assignmentId}`, {
      method: 'PUT',
      body: JSON.stringify(assignmentData),
    });
  }

  async deleteAssignment(assignmentId: string): Promise<ApiResponse<any>> {
    return this.request(`/assignments/${assignmentId}`, {
      method: 'DELETE',
    });
  }

  async getStudentSchedule(): Promise<ApiResponse<any>> {
    return this.request('/students/schedule');
  }

  async getStudentFees(): Promise<ApiResponse<any>> {
    // Finance endpoints live under finance router
    return this.request('/finance/fees');
  }

  // Attempts a set of likely attendance endpoints and normalizes the result to a percentage number
  async getAttendanceSummary(studentId?: string): Promise<{ success: boolean; percentage?: number; error?: string; tried: string[] }> {
    const candidates: string[] = [];
    const sid = studentId ? encodeURIComponent(studentId) : '';
    // Most likely patterns seen in many backends
    candidates.push('/attendance');
    candidates.push('/attendance/summary');
    if (sid) {
      candidates.push(`/attendance/student/${sid}`);
      candidates.push(`/students/${sid}/attendance`);
      candidates.push(`/attendance?studentId=${sid}`);
    }
    // Fallback student-scoped route
    candidates.push('/students/attendance');

    const tried: string[] = [];
    for (const path of candidates) {
      tried.push(path);
      const resp: any = await this.request<any>(path).catch(() => ({ success: false }));
      if (resp && resp.success !== false) {
        // Prefer root-level fields first (most backends return { success, percentage, ... })
        let percent =
          resp?.averageAttendance ??
          resp?.attendancePercentage ??
          resp?.average ??
          resp?.percentage ??
          resp?.attendance?.average ?? undefined;

        // Then try common wrappers
        if (typeof percent !== 'number') {
          const data = resp?.data;
          percent = data?.averageAttendance ?? data?.attendancePercentage ?? data?.average ?? data?.percentage ?? data?.attendance?.average ?? percent;
        }
        if (typeof percent !== 'number') {
          const summary = resp?.summary;
          percent = summary?.averageAttendance ?? summary?.attendancePercentage ?? summary?.average ?? summary?.percentage ?? summary?.attendance?.average ?? percent;
        }

        if (typeof percent === 'number') {
          return { success: true, percentage: Math.round(percent), tried };
        }
      }
    }
    return { success: false, error: 'Attendance endpoint not found', tried };
  }

  // Faculty methods
  async getFacultyProfile(): Promise<ApiResponse<any>> {
    return this.request('/faculty/profile');
  }

  async getFacultyCourses(): Promise<ApiResponse<any>> {
    return this.request('/faculty/courses');
  }

  async getFacultyStudents(): Promise<ApiResponse<any>> {
    return this.request('/faculty/students');
  }

  async getFacultySchedule(): Promise<ApiResponse<any>> {
    return this.request('/faculty/schedule');
  }

  async markAttendance(attendanceData: any): Promise<ApiResponse<any>> {
    return this.request('/faculty/attendance', {
      method: 'POST',
      body: JSON.stringify(attendanceData),
    });
  }

  async addMarks(marksData: any): Promise<ApiResponse<any>> {
    return this.request('/faculty/marks', {
      method: 'POST',
      body: JSON.stringify(marksData),
    });
  }

  // Student enrollment methods (for faculty)
  async enrollStudent(studentId: string, courseId: string): Promise<ApiResponse<any>> {
    return this.request('/students/enroll', {
      method: 'POST',
      body: JSON.stringify({ studentId, courseId }),
    });
  }

  async unenrollStudent(studentId: string, courseId: string): Promise<ApiResponse<any>> {
    return this.request('/students/unenroll', {
      method: 'POST',
      body: JSON.stringify({ studentId, courseId }),
    });
  }

  // Admin methods
  async getAllUsers(): Promise<ApiResponse<any>> {
    return this.request('/auth/all-users');
  }

  async getAllCourses(): Promise<ApiResponse<any>> {
    return this.request('/courses');
  }

  async getAdminStats(): Promise<ApiResponse<any>> {
    return this.request('/auth/admin-stats');
  }

  async getDepartmentEnrollment(): Promise<ApiResponse<any>> {
    return this.request('/auth/department-enrollment');
  }

  async getMonthlyRevenue(): Promise<ApiResponse<any>> {
    return this.request('/auth/monthly-revenue');
  }

  async getVerificationRequests(): Promise<ApiResponse<any>> {
    return this.request('/auth/verification-requests');
  }

  async processVerificationRequest(id: string, status: 'approved' | 'rejected', remarks: string): Promise<ApiResponse<any>> {
    return this.request(`/auth/verification-requests/${id}/decision`, {
      method: 'POST',
      body: JSON.stringify({ status, remarks }),
    });
  }

  async createUser(userData: any): Promise<ApiResponse<any>> {
    return this.request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(userId: string, userData: any): Promise<ApiResponse<any>> {
    return this.request(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId: string): Promise<ApiResponse<any>> {
    return this.request(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // Notifications
  async getNotifications(): Promise<ApiResponse<any>> {
    return this.request('/notifications');
  }

  async markNotificationAsRead(notificationId: string): Promise<ApiResponse<any>> {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsAsRead(): Promise<ApiResponse<any>> {
    return this.request('/notifications/mark-all-read', {
      method: 'PUT',
    });
  }

  async deleteNotification(notificationId: string): Promise<ApiResponse<any>> {
    return this.request(`/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  }

  // Library
  async getBooks(search?: string, category?: string, searchType?: string): Promise<ApiResponse<any>> {
    let query = new URLSearchParams();
    if (search) query.append('search', search);
    if (category && category !== 'all') query.append('category', category);
    if (searchType) query.append('searchType', searchType);
    
    const queryString = query.toString();
    return this.request(`/library/books${queryString ? `?${queryString}` : ''}`);
  }

  async searchBooks(query: string, searchType: string = 'title'): Promise<ApiResponse<any>> {
    return this.getBooks(query, undefined, searchType);
  }

  async getBookIssues(): Promise<ApiResponse<any>> {
    return this.request('/library/issues');
  }

  async issueBook(bookId: string, studentId: string, dueDate: string): Promise<ApiResponse<any>> {
    return this.request('/library/issue', {
      method: 'POST',
      body: JSON.stringify({ bookId, studentId, dueDate }),
    });
  }

  async returnBook(issueId: string, fine?: number, remarks?: string): Promise<ApiResponse<any>> {
    return this.request(`/library/return/${issueId}`, {
      method: 'PUT',
      body: JSON.stringify({ fine, remarks }),
    });
  }

  async addBook(bookData: any): Promise<ApiResponse<any>> {
    return this.request('/library/books', {
      method: 'POST',
      body: JSON.stringify(bookData),
    });
  }

  // Events
  async getEvents(): Promise<ApiResponse<any>> {
    return this.request('/events');
  }

  async createEvent(eventData: any): Promise<ApiResponse<any>> {
    return this.request('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  // Reports
  async getReports(): Promise<ApiResponse<any>> {
    return this.request('/reports');
  }

  async generateReport(reportType: string, params: any): Promise<ApiResponse<any>> {
    return this.request('/reports/generate', {
      method: 'POST',
      body: JSON.stringify({ reportType, params }),
    });
  }

  // Schedule methods
  async getSchedule(): Promise<ApiResponse<any>> {
    return this.request('/schedule');
  }

  async addScheduleItem(scheduleData: {
    courseId: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    room: string;
    type: 'lecture' | 'lab' | 'tutorial' | 'seminar';
  }): Promise<ApiResponse<any>> {
    return this.request('/schedule', {
      method: 'POST',
      body: JSON.stringify(scheduleData),
    });
  }

  async updateScheduleItem(scheduleId: string, scheduleData: {
    courseId: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    room: string;
    type: 'lecture' | 'lab' | 'tutorial' | 'seminar';
    originalCourseId?: string;
    originalDayOfWeek?: string;
    originalStartTime?: string;
  }): Promise<ApiResponse<any>> {
    return this.request(`/schedule/${scheduleId}`, {
      method: 'PUT',
      body: JSON.stringify(scheduleData),
    });
  }

  async deleteScheduleItem(scheduleId: string, scheduleData: {
    courseId: string;
    dayOfWeek: string;
    startTime: string;
  }): Promise<ApiResponse<any>> {
    return this.request(`/schedule/${scheduleId}`, {
      method: 'DELETE',
      body: JSON.stringify(scheduleData),
    });
  }

  // Settings methods
  async getSystemSettings(): Promise<ApiResponse<any>> {
    return this.request('/settings/system');
  }

  async updateSystemSettings(settings: any): Promise<ApiResponse<any>> {
    return this.request('/settings/system', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async getUserPreferences(): Promise<ApiResponse<any>> {
    return this.request('/settings/preferences');
  }

  async updateUserPreferences(preferences: any): Promise<ApiResponse<any>> {
    return this.request('/settings/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }

  async getNotificationSettings(): Promise<ApiResponse<any>> {
    return this.request('/settings/notifications');
  }

  async updateNotificationSettings(notifications: any): Promise<ApiResponse<any>> {
    return this.request('/settings/notifications', {
      method: 'PUT',
      body: JSON.stringify(notifications),
    });
  }

  // Reports Module
  async getReports(): Promise<ApiResponse<any>> {
    return this.request('/reports');
  }

  async getReport(reportType: string): Promise<ApiResponse<any>> {
    return this.request(`/reports/${reportType}`);
  }

  async generateReport(reportType: string, params: any): Promise<ApiResponse<any>> {
    return this.request(`/reports/${reportType}/generate`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async downloadReport(reportId: string): Promise<ApiResponse<any>> {
    return this.request(`/reports/${reportId}/download`);
  }

  // Events Module
  async getEvents(): Promise<ApiResponse<any>> {
    return this.request('/events');
  }

  async getEvent(eventId: string): Promise<ApiResponse<any>> {
    return this.request(`/events/${eventId}`);
  }

  async createEvent(eventData: any): Promise<ApiResponse<any>> {
    return this.request('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  async updateEvent(eventId: string, eventData: any): Promise<ApiResponse<any>> {
    return this.request(`/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
  }

  async deleteEvent(eventId: string): Promise<ApiResponse<any>> {
    return this.request(`/events/${eventId}`, {
      method: 'DELETE',
    });
  }

  async registerForEvent(eventId: string): Promise<ApiResponse<any>> {
    return this.request(`/events/${eventId}/register`, {
      method: 'POST',
    });
  }

  async unregisterFromEvent(eventId: string): Promise<ApiResponse<any>> {
    return this.request(`/events/${eventId}/unregister`, {
      method: 'POST',
    });
  }

  // Finance Module
  async getFees(): Promise<ApiResponse<any>> {
    return this.request('/finance/fees');
  }

  async getFee(feeId: string): Promise<ApiResponse<any>> {
    return this.request(`/finance/fees/${feeId}`);
  }

  async getFinanceStats(): Promise<ApiResponse<any>> {
    return this.request('/finance/stats');
  }

  async createFee(feeData: any): Promise<ApiResponse<any>> {
    return this.request('/finance/fees', {
      method: 'POST',
      body: JSON.stringify(feeData),
    });
  }

  async updateFee(feeId: string, feeData: any): Promise<ApiResponse<any>> {
    return this.request(`/finance/fees/${feeId}`, {
      method: 'PUT',
      body: JSON.stringify(feeData),
    });
  }

  async deleteFee(feeId: string): Promise<ApiResponse<any>> {
    return this.request(`/finance/fees/${feeId}`, {
      method: 'DELETE',
    });
  }

  async payFee(feeId: string, paymentData: any): Promise<ApiResponse<any>> {
    return this.request(`/finance/fees/${feeId}/pay`, {
      method: 'PUT',
      body: JSON.stringify(paymentData),
    });
  }

  async getPaymentHistory(): Promise<ApiResponse<any>> {
    return this.request('/finance/payment-history');
  }

  async downloadReceipt(feeId: string): Promise<ApiResponse<any>> {
    return this.request(`/finance/fees/${feeId}/receipt`);
  }
}

export default new ApiService();
