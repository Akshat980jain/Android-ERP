export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'faculty' | 'admin' | 'parent';
  profilePicture?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Student extends User {
  studentId: string;
  enrollmentNumber: string;
  course: string;
  semester: number;
  year: number;
  department: string;
  parentId?: string;
}

export interface Faculty extends User {
  employeeId: string;
  department: string;
  designation: string;
  qualification: string;
  experience: number;
  subjects: string[];
}

export interface Course {
  _id: string;
  courseCode: string;
  courseName: string;
  description: string;
  credits: number;
  semester: number;
  department: string;
  facultyId: string;
  isActive: boolean;
}

export interface Assignment {
  _id: string;
  title: string;
  description: string;
  course: {
    _id: string;
    name: string;
    code: string;
  };
  faculty: {
    _id: string;
    name: string;
    firstName?: string;
    lastName?: string;
  };
  startDate: string;
  dueDate: string;
  maxMarks: number;
  instructions?: string;
  allowLateSubmission?: boolean;
  lateSubmissionPenalty?: number;
  attachments?: Array<{
    filename: string;
    url: string;
    size: number;
  }>;
  submissions?: Array<{
    _id: string;
    student: string;
    content?: string;
    attachments?: any[];
    status: string;
    marks?: number;
    feedback?: string;
    submittedAt: string;
  }>;
  hasSubmitted?: boolean;
  submissionStatus?: string;
  marks?: number;
  feedback?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  _id: string;
  studentId: string;
  courseId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  remarks?: string;
}

export interface Marks {
  _id: string;
  studentId: string;
  courseId: string;
  assignmentId?: string;
  examId?: string;
  marks: number;
  maxMarks: number;
  grade?: string;
  remarks?: string;
}

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  recipientId: string;
  isRead: boolean;
  createdAt: string;
}

export interface Exam {
  _id: string;
  title: string;
  courseId: string;
  examType: 'midterm' | 'final' | 'quiz' | 'assignment';
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  maxMarks: number;
  instructions?: string;
}

export interface Fee {
  _id: string;
  studentId: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  description: string;
  academicYear: string;
  semester: number;
}

export interface LibraryBook {
  _id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  available: boolean;
  totalCopies: number;
  availableCopies: number;
}

export interface BookIssue {
  _id: string;
  studentId: string;
  bookId: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'issued' | 'returned' | 'overdue';
  fine?: number;
}

export interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  type: 'academic' | 'cultural' | 'sports' | 'other';
  organizer: string;
}

export interface ScheduleItem {
  _id: string;
  course: {
    _id: string;
    name: string;
    code: string;
  };
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string;
  type: 'lecture' | 'lab' | 'tutorial' | 'seminar';
  faculty: {
    _id: string;
    name: string;
  };
  lectureCount?: number;
}

export interface Schedule {
  _id: string;
  courseId: string;
  facultyId: string;
  day: string;
  startTime: string;
  endTime: string;
  venue: string;
  semester: number;
  academicYear: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: User;
  token?: string;
  twoFactorRequired?: boolean;
  tempToken?: string;
  method?: 'totp' | 'sms' | 'email';
  maskedPhone?: string;
  devCode?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
