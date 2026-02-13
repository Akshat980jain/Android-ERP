import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';

const roles = [
  { value: 'student', label: 'Student' },
  { value: 'faculty', label: 'Faculty' },
  { value: 'library', label: 'Librarian' },
  { value: 'placement', label: 'Placement Officer' },
  { value: 'admin', label: 'Admin' }
];

const courses = [
  { value: 'B.Tech', label: 'B.Tech' },
  { value: 'M.Tech', label: 'M.Tech' },
  { value: 'MBA', label: 'MBA' },
  { value: 'MCA', label: 'MCA' },
  { value: 'B.Pharma', label: 'B.Pharma' },
  { value: 'M.Pharma', label: 'M.Pharma' },
];

const programs = [
  { value: 'B.Tech', label: 'B.Tech' },
  { value: 'M.Tech', label: 'M.Tech' },
  { value: 'B.Pharma', label: 'B.Pharma' },
  { value: 'MCA', label: 'MCA' },
  { value: 'MBA', label: 'MBA' }
];

const adminTypes = [
  { value: 'head', label: 'Head Admin (all programs)' },
  { value: 'program', label: 'Program Admin (one program, all branches)' },
  { value: 'branch', label: 'Branch Admin (one program + one branch)' }
];

export default function RequestVerificationPage() {
  const API_URL = import.meta.env.VITE_API_URL || '';
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    branch: '',
    course: '',
    requestedRole: 'student',
    program: '',
    adminType: '' as '' | 'head' | 'program' | 'branch'
  });
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => {
      const updated = { ...prev, [name]: value };
      // Reset dependent fields when role changes
      if (name === 'requestedRole') {
        updated.adminType = '' as '' | 'head' | 'program' | 'branch';
        updated.program = '';
        updated.course = '';
        updated.branch = '';
      }
      // Reset program/branch when admin type changes
      if (name === 'adminType') {
        updated.program = '';
        updated.branch = '';
      }
      // Reset branch when course/program changes
      if (name === 'course' || name === 'program') {
        updated.branch = '';
      }
      return updated;
    });
  };

  const validateForm = () => {
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (!form.name.trim() || !form.email.trim()) {
      setError('Name and email are required');
      return false;
    }

    const showCourseFields = ['student', 'faculty', 'placement'].includes(form.requestedRole);
    const branchEligibleCourses = new Set(['B.Tech', 'M.Tech']);

    if (showCourseFields && !form.course.trim()) {
      setError('Course is required for the selected role');
      return false;
    }
    if (showCourseFields && branchEligibleCourses.has(form.course) && !form.branch.trim()) {
      setError('Branch is required for B.Tech and M.Tech');
      return false;
    }

    // Admin type validation
    if (form.requestedRole === 'admin') {
      if (!form.adminType) {
        setError('Please select an admin type');
        return false;
      }
      if (form.adminType === 'program' && !form.program) {
        setError('Please select a program for Program Admin');
        return false;
      }
      if (form.adminType === 'branch') {
        if (!form.program) {
          setError('Please select a program for Branch Admin');
          return false;
        }
        if (branchEligibleCourses.has(form.program) && !form.branch.trim()) {
          setError('Branch is required for B.Tech/M.Tech Branch Admin');
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setStatus('');

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    const showCourseFields = ['student', 'faculty', 'placement'].includes(form.requestedRole);
    const branchEligibleCourses = new Set(['B.Tech', 'M.Tech']);
    const showBranchField = showCourseFields && branchEligibleCourses.has(form.course);

    try {
      const payload: Record<string, string> = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        requestedRole: form.requestedRole,
      };

      // Student/Faculty/Placement fields
      if (showCourseFields) {
        payload.course = form.course.trim();
        payload.program = form.course.trim();
      }
      if (showBranchField) {
        payload.branch = form.branch.trim();
      }

      // Admin fields
      if (form.requestedRole === 'admin') {
        payload.adminType = form.adminType;
        if (form.adminType === 'program' || form.adminType === 'branch') {
          payload.program = form.program;
        }
        if (form.adminType === 'branch' && form.branch.trim()) {
          payload.branch = form.branch.trim();
        }
      }

      console.log('Sending payload:', payload);

      const res = await fetch(`${API_URL}/api/auth/request-registration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      console.log('Response:', data);

      if (res.ok && data.success) {
        setStatus('Request submitted successfully! Awaiting admin approval.');
        setForm({
          name: '', email: '', password: '', confirmPassword: '',
          branch: '', course: '', requestedRole: 'student', program: '',
          adminType: '' as '' | 'head' | 'program' | 'branch'
        });
      } else {
        setError(data.message || 'Request failed. Please try again.');
      }
    } catch (err) {
      console.error('Request error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Visibility flags
  const showCourseFields = ['student', 'faculty', 'placement'].includes(form.requestedRole);
  const branchEligibleCourses = new Set(['B.Tech', 'M.Tech']);
  const showBranchField = showCourseFields && branchEligibleCourses.has(form.course);
  const isAdmin = form.requestedRole === 'admin';
  const showAdminProgram = isAdmin && (form.adminType === 'program' || form.adminType === 'branch');
  const showAdminBranch = isAdmin && form.adminType === 'branch' && branchEligibleCourses.has(form.program);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 px-2">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 p-6">
            <UserPlus className="w-8 h-8 text-white mr-3" />
            <h2 className="text-2xl font-bold text-white tracking-wide">Request Verification</h2>
          </div>

          <form className="p-8 space-y-5" onSubmit={handleSubmit}>
            <input name="name" value={form.name} onChange={handleChange} placeholder="Full Name"
              className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              required disabled={loading} />

            <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email"
              className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              required disabled={loading} />

            <input name="password" type="password" value={form.password} onChange={handleChange}
              placeholder="Password (min. 6 characters)"
              className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              required minLength={6} disabled={loading} />

            <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange}
              placeholder="Confirm Password"
              className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              required disabled={loading} />

            <select name="requestedRole" value={form.requestedRole} onChange={handleChange}
              className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              disabled={loading}>
              {roles.map(role => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>

            {/* Course + Branch for Student/Faculty/Placement */}
            {showCourseFields && (
              <>
                <select name="course" value={form.course} onChange={handleChange}
                  className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                  required={showCourseFields} disabled={loading}>
                  <option value="" disabled>Select a course</option>
                  {courses.map(course => (
                    <option key={course.value} value={course.value}>{course.label}</option>
                  ))}
                </select>

                {showBranchField && (
                  <input name="branch" value={form.branch} onChange={handleChange}
                    placeholder="Branch (e.g., Computer Science, Mechanical)"
                    className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                    required={showBranchField} disabled={loading} />
                )}
              </>
            )}

            {/* Admin Type Selector */}
            {isAdmin && (
              <select name="adminType" value={form.adminType} onChange={handleChange}
                className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                required disabled={loading}>
                <option value="" disabled>Select Admin Type</option>
                {adminTypes.map(at => (
                  <option key={at.value} value={at.value}>{at.label}</option>
                ))}
              </select>
            )}

            {/* Program for Program Admin / Branch Admin */}
            {showAdminProgram && (
              <select name="program" value={form.program} onChange={handleChange}
                className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                required disabled={loading}>
                <option value="" disabled>Select Program</option>
                {programs.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            )}

            {/* Branch for Branch Admin (B.Tech / M.Tech only) */}
            {showAdminBranch && (
              <input name="branch" value={form.branch} onChange={handleChange}
                placeholder="Branch (e.g., Computer Science, Mechanical)"
                className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                required disabled={loading} />
            )}

            <button type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 rounded-lg font-semibold text-lg shadow hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>

            {status && (
              <div className="text-green-700 text-center font-medium mt-2 p-2 bg-green-50 rounded">
                {status}
              </div>
            )}

            {error && (
              <div className="text-red-700 text-center font-medium mt-2 p-2 bg-red-50 rounded">
                {error}
              </div>
            )}
          </form>

          <div className="text-center mb-6">
            <a href="/" className="text-blue-600 hover:underline font-medium">
              Already have an account? Login here
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}