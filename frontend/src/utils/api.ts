const API_BASE_URL = 'http://localhost:5000/api';

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private getAuthHeaders(token?: string): HeadersInit {
    // If an explicit empty string is provided, skip attaching Authorization
    const authToken = token === '' ? undefined : (token || localStorage.getItem('educonnect_token'));
    console.log('Getting auth headers, token:', authToken ? authToken.substring(0, 20) + '...' : 'No token');
    return {
      'Content-Type': 'application/json',
      ...(authToken && { Authorization: `Bearer ${authToken}` })
    };
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    token?: string
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      headers: this.getAuthHeaders(token),
      ...options
    };

    // Add debugging for login requests
    if (endpoint === '/auth/login' && options.body) {
      console.log('Login request body:', options.body);
    }

    try {
      console.log(`Making API Request: ${options.method || 'GET'} ${url}`);
      console.log('Request config:', {
        headers: config.headers,
        method: config.method,
        body: options.body ? 'Request body present' : 'No body'
      });

      const response = await fetch(url, config);
      
      // Log response details for debugging
      console.log(`Response status: ${response.status}`);
      console.log(`Response ok: ${response.ok}`);
      console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));
      
      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        console.log(`HTTP ${response.status}: ${response.statusText}`);
        console.log(`Content-Type: ${response.headers.get('content-type')}`);
        
        // Try to get the response text for debugging
        const errorText = await response.text();
        console.log('Raw response text:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }
        
        console.log('Parsed response data:', errorData);
        
        throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);

      return data;
    } catch (error) {
      console.error('API Error Response:', {
        status: error instanceof Response ? error.status : 'Unknown',
        statusText: error instanceof Response ? error.statusText : 'Unknown',
        data: error,
        url,
        config
      });
      throw error;
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    try {
      // Validate input before sending
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // Trim and validate email format
      const trimmedEmail = email.trim().toLowerCase();
      if (!trimmedEmail.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      const requestBody = { 
        email: trimmedEmail, 
        password: password 
      };

      console.log('Sending login request with:', { email: trimmedEmail, password: '***' });

      // Explicitly pass an empty token to avoid sending any Authorization header
      // which can interfere with public login endpoints if a stale token exists
      return this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      }, '');
    } catch (error) {
      console.error('Login method error:', error);
      throw error;
    }
  }

  async verifyOtp(email: string, otp: string) {
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp, issueToken: true })
    }, '');
  }

  async requestOtp(email: string, purpose: string = 'login') {
    return this.request('/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ email, purpose })
    }, '');
  }

  async verifyLogin2FA(tempToken: string, code: string) {
    // Do not attach Authorization when verifying 2FA with the temporary token
    return this.request('/auth/2fa/verify-login', {
      method: 'POST',
      body: JSON.stringify({ tempToken, code })
    }, '');
  }

  async initiate2FASetup(payload?: { method?: 'totp' | 'sms'; phone?: string }) {
    return this.request('/auth/2fa/setup', {
      method: 'POST',
      body: JSON.stringify(payload || { method: 'totp' })
    });
  }

  async verify2FASetup(code: string, method: 'totp' | 'sms' = 'totp') {
    return this.request('/auth/2fa/verify-setup', {
      method: 'POST',
      body: JSON.stringify({ code, method })
    });
  }

  async disable2FA(code: string) {
    return this.request('/auth/2fa/disable', {
      method: 'POST',
      body: JSON.stringify({ code })
    });
  }

  async resend2FACode() {
    return this.request('/auth/2fa/resend', {
      method: 'POST'
    });
  }

  async getCurrentUser(token?: string) {
    return this.request('/auth/me', {}, token);
  }

  async updateProfile(profileData: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    studentId?: string;
    employeeId?: string;
    semester?: string;
    section?: string;
    department?: string;
  }) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  // Admin endpoints
  async getVerificationRequests(token?: string) {
    return this.request('/auth/verification-requests', {}, token);
  }

  async processVerificationRequest(id: string, status: 'approved' | 'rejected', remarks: string, token?: string) {
    return this.request(`/auth/verification-requests/${id}/decision`, {
      method: 'POST',
      body: JSON.stringify({ status, remarks })
    }, token);
  }

  async getAdminsByProgram(program: string, token?: string) {
    return this.request(`/auth/admins-by-program?program=${encodeURIComponent(program)}`, {}, token);
  }

  async getAdminStats(token?: string) {
    return this.request('/auth/admin-stats', {}, token);
  }

  async getDepartmentEnrollment(token?: string) {
    return this.request('/auth/department-enrollment', {}, token);
  }

  async getMonthlyRevenue(token?: string) {
    return this.request('/auth/monthly-revenue', {}, token);
  }

  // Test server connectivity
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return { success: true, message: 'Server connection successful' };
      } else {
        return { 
          success: false, 
          message: `Server responded with status: ${response.status} ${response.statusText}` 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  // Notifications
  async getNotifications(params?: { category?: string; read?: string }) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request(`/notifications${queryString}`);
  }

  async markNotificationAsRead(id: string) {
    return this.request(`/notifications/${id}/read`, { method: 'PUT' });
  }

  async markAllNotificationsAsRead() {
    return this.request('/notifications/mark-all-read', { method: 'PUT' });
  }

  async generateReminders() {
    return this.request('/notifications/generate-reminders', { method: 'POST' });
  }

  // Academic
  async getAttendance(courseId?: string) {
    const queryString = courseId ? `?courseId=${courseId}` : '';
    return this.request(`/academic/attendance${queryString}`);
  }

  async updateAttendance(attendanceData: {
    courseId: string;
    studentId: string;
    date: string;
    status: 'present' | 'absent';
    remarks?: string;
  }) {
    return this.request('/academic/attendance', {
      method: 'PUT',
      body: JSON.stringify(attendanceData)
    });
  }

  // Schedule-based attendance methods
  async getScheduleAttendance(courseId: string, date: string): Promise<{
    success: boolean;
    course: {
      _id: string;
      name: string;
      code: string;
    };
    date: string;
    dayOfWeek: string;
    schedule: Array<{
      day: string;
      time: string;
      endTime?: string;
      room: string;
    }>;
    attendanceMatrix: Array<{
      slot: {
        day: string;
        time: string;
        endTime?: string;
        room: string;
      };
      attendance: Array<{
        student: {
          _id: string;
          name: string;
          email: string;
          studentId: string;
        };
        status: 'present' | 'absent' | 'late' | null;
        markedAt: string | null;
        isWithinSchedule: boolean;
        remarks: string;
      }>;
    }>;
    message?: string;
  }> {
    return this.request(`/academic/schedule-attendance?courseId=${courseId}&date=${date}`);
  }

  async markScheduleAttendance(data: {
    courseId: string;
    date: string;
    scheduleSlot: {
      startTime: string;
      endTime: string;
    };
    attendanceData: Array<{
      studentId: string;
      status: 'present' | 'absent' | 'late';
      remarks?: string;
    }>;
  }): Promise<{
    success: boolean;
    message: string;
    results: Array<{
      studentId: string;
      status: string;
    }>;
    isWithinTimeWindow: boolean;
  }> {
    return this.request('/academic/schedule-attendance', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getAttendanceSchedule(courseId: string): Promise<{
    success: boolean;
    course: {
      _id: string;
      name: string;
      code: string;
    };
    date: string;
    dayOfWeek: string;
    schedule: Array<{
      day: string;
      time: string;
      room: string;
      attendanceCount: number;
      markedCount: number;
    }>;
  }> {
    return this.request(`/academic/attendance-schedule?courseId=${courseId}`);
  }

  async enrollStudent(courseId: string, studentId: string) {
    return this.request(`/courses/${courseId}/enroll`, {
      method: 'POST',
      body: JSON.stringify({ studentId })
    });
  }

  // Course management
  async getCourses() {
    return this.request('/courses');
  }

  async getMyCourses() {
    return this.request('/courses/my-courses');
  }

  async getFacultyCourses() {
    return this.request('/courses/faculty-courses');
  }

  async createCourse(courseData: Record<string, unknown>) {
    return this.request('/courses', {
      method: 'POST',
      body: JSON.stringify(courseData)
    });
  }

  async updateCourse(courseId: string, courseData: Record<string, unknown>) {
    return this.request(`/courses/${courseId}`, {
      method: 'PUT',
      body: JSON.stringify(courseData)
    });
  }

  async deleteCourse(courseId: string) {
    return this.request(`/courses/${courseId}`, {
      method: 'DELETE'
    });
  }

  // Marks
  async getMarks(courseId?: string) {
    const queryString = courseId ? `?courseId=${courseId}` : '';
    return this.request(`/academic/marks${queryString}`);
  }

  // Exams
  async listExams() {
    return this.request('/exams');
  }
  async createExam(payload: any) {
    return this.request('/exams', { method: 'POST', body: JSON.stringify(payload) });
  }
  async getExam(examId: string) {
    return this.request(`/exams/${examId}`);
  }
  async startExam(examId: string) {
    return this.request(`/exams/${examId}/start`, { method: 'POST' });
  }
  async submitExam(examId: string, payload: { answers: any[]; meta?: any }) {
    return this.request(`/exams/${examId}/submit`, { method: 'POST', body: JSON.stringify(payload) });
  }
  async heartbeatExam(examId: string, payload: { visibility: boolean; fullscreen: boolean }) {
    return this.request(`/exams/${examId}/heartbeat`, { method: 'POST', body: JSON.stringify(payload) });
  }

  async updateExam(examId: string, payload: any) {
    return this.request(`/exams/${examId}`, { method: 'PUT', body: JSON.stringify(payload) });
  }

  async listExamAttempts(examId: string) {
    return this.request(`/exams/${examId}/attempts`);
  }

  async gradeExamAttempt(examId: string, studentId: string, payload: { manualMarks: Array<{ questionIndex: number; marksAwarded: number; comment?: string }>; feedback?: string; }) {
    return this.request(`/exams/${examId}/grade/${studentId}`, { method: 'POST', body: JSON.stringify(payload) });
  }

  async listMyExamAttempts() {
    return this.request('/exams/my-attempts');
  }

  async deleteExam(examId: string) {
    return this.request(`/exams/${examId}`, { method: 'DELETE' });
  }

  // Feedback
  async submitFeedback(payload: any) {
    return this.request('/feedback', { method: 'POST', body: JSON.stringify(payload) });
  }
  async getFeedbackSummary(params?: { courseId?: string; semester?: number; academicYear?: string }) {
    const qs = params ? `?${new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([_,v]) => v!==undefined && v!==null).map(([k,v]) => [k, String(v)]))).toString()}` : '';
    return this.request(`/feedback/summary${qs}`);
  }

  // Academic Calendar
  async getAcademicCalendar() {
    return this.request('/calendar');
  }

  async createCalendar(payload: any) {
    return this.request('/calendar', { method: 'POST', body: JSON.stringify(payload) });
  }

  async updateCalendar(calendarId: string, payload: any) {
    return this.request(`/calendar/${calendarId}`, { method: 'PUT', body: JSON.stringify(payload) });
  }

  async deleteCalendar(calendarId: string) {
    return this.request(`/calendar/${calendarId}`, { method: 'DELETE' });
  }

  // Library
  async getBooks(params?: { search?: string; category?: string; searchType?: string }) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request(`/library/books${queryString}`);
  }

  async getBookIssues() {
    return this.request('/library/issues');
  }

  async addBook(bookData: any) {
    return this.request('/library/books', {
      method: 'POST',
      body: JSON.stringify(bookData)
    });
  }

  async issueBook(bookId: string, studentId: string, dueDate: string) {
    return this.request('/library/issue', {
      method: 'POST',
      body: JSON.stringify({ bookId, studentId, dueDate })
    });
  }

  async returnBook(issueId: string, fine?: number, remarks?: string) {
    return this.request(`/library/return/${issueId}`, {
      method: 'PUT',
      body: JSON.stringify({ fine, remarks })
    });
  }

  // Placement
  async getJobs(params?: { type?: string; status?: string }) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request(`/placement/jobs${queryString}`);
  }

  async getJobApplications() {
    return this.request('/placement/applications');
  }

  async applyForJob(jobId: string, resume: string, coverLetter?: string) {
    return this.request('/placement/apply', {
      method: 'POST',
      body: JSON.stringify({ jobId, resume, coverLetter })
    });
  }

  async getPlacementStats() {
    return this.request('/placement/stats');
  }

  // Finance
  async getFees() {
    return this.request('/finance/fees');
  }

  async payFee(feeId: string, paymentMethod: string, transactionId: string) {
    return this.request(`/finance/fees/${feeId}/pay`, {
      method: 'PUT',
      body: JSON.stringify({ paymentMethod, transactionId })
    });
  }

  async getPaymentHistory() {
    return this.request('/finance/payment-history');
  }

  // Student Services
  async getStudentServices() {
    return this.request('/services');
  }

  async applyForService(type: string, reason: string, documents?: string[]) {
    return this.request('/services', {
      method: 'POST',
      body: JSON.stringify({ type, reason, documents })
    });
  }

  // Schedule methods
  async getSchedule() {
    return this.request('/schedule');
  }

  async addScheduleItem(scheduleData: Record<string, unknown>) {
    return this.request('/schedule', {
      method: 'POST',
      body: JSON.stringify(scheduleData)
    });
  }

  async updateScheduleItem(id: string, scheduleData: Record<string, unknown>) {
    return this.request(`/schedule/${id}`, {
      method: 'PUT',
      body: JSON.stringify(scheduleData)
    });
  }

  async deleteScheduleItem(id: string, scheduleData: Record<string, unknown>) {
    return this.request(`/schedule/${id}`, {
      method: 'DELETE',
      body: JSON.stringify(scheduleData)
    });
  }

  // Students
  async getStudents(params?: { courseId?: string }) {
    if (params?.courseId) {
      return this.request(`/students/course/${params.courseId}`);
    }
    return this.request('/students');
  }

  // Transport
  async listTransportRoutes() {
    return this.request('/transport/routes');
  }
  async subscribeTransportRoute(routeId: string, stop: string) {
    return this.request(`/transport/routes/${routeId}/subscribe`, { method: 'POST', body: JSON.stringify({ stop }) });
  }
  async getRouteEta(routeId: string) {
    return this.request(`/transport/routes/${routeId}/eta`);
  }

  // Hostel
  async listHostels() {
    return this.request('/hostel');
  }
  async allocateHostel(hostelId: string, roomNumber: string, studentId: string) {
    return this.request(`/hostel/${hostelId}/allocate`, { method: 'POST', body: JSON.stringify({ roomNumber, studentId }) });
  }
  async logVisitor(hostelId: string, payload: { student: string; name: string; relation?: string; checkIn: string; checkOut?: string; idProof?: string; }) {
    return this.request(`/hostel/${hostelId}/visitor`, { method: 'POST', body: JSON.stringify(payload) });
  }

  // Parent portal
  async parentLinkChild(payload: { childEmail?: string; childId?: string }) {
    return this.request('/parents/link', { method: 'POST', body: JSON.stringify(payload) });
  }
  async parentUnlinkChild(childId: string) {
    return this.request(`/parents/link/${childId}`, { method: 'DELETE' });
  }
  async parentChildren() {
    return this.request('/parents/children');
  }
  async parentChildAttendance(childId: string) {
    return this.request(`/parents/children/${childId}/attendance`);
  }
  async parentChildMarks(childId: string) {
    return this.request(`/parents/children/${childId}/marks`);
  }
  async parentChildReceipts(childId: string) {
    return this.request(`/parents/children/${childId}/fees/receipts`);
  }

  async getStudentsByCourse(courseId: string) {
    return this.request(`/students/course/${courseId}`);
  }

  // Faculty requests
  async getFacultyRequests() {
    return this.request('/auth/verification-requests');
  }

  async updateFacultyRequest(requestId: string, data: { status: 'approved' | 'rejected' }) {
    return this.request(`/auth/verification-requests/${requestId}/decision`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;