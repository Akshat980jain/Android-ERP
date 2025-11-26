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

export default function RequestVerificationPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    branch: '',
    course: '',
    requestedRole: 'student',
    program: ''
  });
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    // Check if passwords match
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    // Check password strength
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    // Check required fields
    if (!form.name.trim() || !form.email.trim()) {
      setError('Name and email are required');
      return false;
    }

    // Check course and branch requirements per role and course type
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

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setStatus('');

    // Validate form before submitting
    if (!validateForm()) {
      setLoading(false);
      return;
    }

    // Check if course/branch are needed for this role
    const showCourseFields = ['student', 'faculty', 'placement'].includes(form.requestedRole);
    const branchEligibleCourses = new Set(['B.Tech', 'M.Tech']);
    const showBranchField = showCourseFields && branchEligibleCourses.has(form.course);

    try {
      // Create payload with ALL necessary fields including confirmPassword
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword, // Add this field
        requestedRole: form.requestedRole,
        // Include course for relevant roles
        ...(showCourseFields && { course: form.course.trim() }),
        // Include branch only when applicable (B.Tech/M.Tech)
        ...(showBranchField && { branch: form.branch.trim() }),
        // Only include program if it's selected
        ...(form.requestedRole === 'admin' && form.program && { program: form.program })
      };

      console.log('Sending payload:', payload); // Debug log

      const res = await fetch('/api/auth/request-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      console.log('Response:', data); // Debug log
      
      if (res.ok && data.success) {
        setStatus('Request submitted successfully! Awaiting admin approval.');
        setForm({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          branch: '',
          course: '',
          requestedRole: 'student',
          program: ''
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

  // Determine visibility for course and branch fields
  const showCourseFields = ['student', 'faculty', 'placement'].includes(form.requestedRole);
  const branchEligibleCourses = new Set(['B.Tech', 'M.Tech']);
  const showBranchField = showCourseFields && branchEligibleCourses.has(form.course);
  const showProgram = form.requestedRole === 'admin';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 px-2">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 p-6">
            <UserPlus className="w-8 h-8 text-white mr-3" />
            <h2 className="text-2xl font-bold text-white tracking-wide">Request Verification</h2>
          </div>
          
          <form className="p-8 space-y-5" onSubmit={handleSubmit}>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Full Name"
              className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              required
              disabled={loading}
            />
            
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email"
              className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              required
              disabled={loading}
            />
            
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Password (min. 6 characters)"
              className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              required
              minLength={6}
              disabled={loading}
            />
            
            <input
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm Password"
              className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              required
              disabled={loading}
            />
            
            <select
              name="requestedRole"
              value={form.requestedRole}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              disabled={loading}
            >
              {roles.map(role => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
            
            {showCourseFields && (
              <>
                <select
                  name="course"
                  value={form.course}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                  required={showCourseFields}
                  disabled={loading}
                >
                  <option value="" disabled>Select a course</option>
                  {courses.map(course => (
                    <option key={course.value} value={course.value}>{course.label}</option>
                  ))}
                </select>

                {showBranchField && (
                  <input
                    name="branch"
                    value={form.branch}
                    onChange={handleChange}
                    placeholder="Branch (e.g., Computer Science, Mechanical)"
                    className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                    required={showBranchField}
                    disabled={loading}
                  />
                )}
              </>
            )}
            {showProgram && (
              <select
                name="program"
                value={form.program}
                onChange={handleChange}
                className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                disabled={loading}
              >
                <option value="">Head Admin (No specific program)</option>
                {programs.map(program => (
                  <option key={program.value} value={program.value}>{program.label}</option>
                ))}
              </select>
            )}
            
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 rounded-lg font-semibold text-lg shadow hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
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