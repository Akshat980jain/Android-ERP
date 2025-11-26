export interface User {
  _id?: string;
  id?: string;
  email: string;
  name: string;
  role: UserRole;
  profile: UserProfile;
  courses?: string[];
  department?: string;
  branch?: string;
  createdAt: string;
  adminPrograms?: string[];
  program?: string;
  twoFactorEnabled?: boolean;
}

export type UserRole = 'student' | 'faculty' | 'admin' | 'library' | 'placement';

export interface UserProfile {
  avatar?: string;
  phone?: string;
  address?: string;
  studentId?: string;
  employeeId?: string;
  semester?: string;
  section?: string;
  course?: string;
  branch?: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  faculty: string;
  credits: number;
  semester: number;
  schedule: CourseSchedule[];
}

export interface CourseSchedule {
  day: string;
  time: string;
  endTime?: string;
  duration: number;
  room: string;
}

export interface ScheduleAttendanceData {
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
      lectureCount?: number;
    }>;
  }>;
}

export interface ScheduleAttendanceResponse {
  success: boolean;
  course: {
    _id: string;
    name: string;
    code: string;
  };
  date: string;
  dayOfWeek: string;
  schedule: CourseSchedule[];
  attendanceMatrix: Array<{
    slot: CourseSchedule;
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
}

export interface Attendance {
  id: string;
  studentId: string;
  courseId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  remarks?: string;
}

export interface Marks {
  id: string;
  studentId: string;
  courseId: string;
  type: 'internal' | 'external' | 'assignment' | 'quiz';
  title: string;
  marksObtained: number;
  totalMarks: number;
  date: string;
}

export interface LibraryBook {
  id: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  availableCopies: number;
  totalCopies: number;
  issuedTo?: string[];
}

export interface BookIssue {
  id: string;
  bookId: string;
  studentId: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  fine?: number;
  status: 'issued' | 'returned' | 'overdue';
}

export interface PlacementJob {
  id: string;
  company: string;
  position: string;
  package: string;
  requirements: string[];
  deadline: string;
  status: 'active' | 'closed';
  appliedStudents: string[];
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  targetRole?: UserRole[];
}

export interface StudentService {
  id: string;
  studentId: string;
  type: 'bonafide' | 'no_dues' | 'backlog_form' | 'fee_receipt' | 'admit_card';
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
  approvedDate?: string;
  remarks?: string;
}