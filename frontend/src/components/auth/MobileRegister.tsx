import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../utils/api';

const MobileRegister: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');
  const [course, setCourse] = useState('');
  const [branch, setBranch] = useState('');
  const [program, setProgram] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isDesktop = useMemo(() => window.matchMedia('(min-width: 768px)').matches, []);

  useEffect(() => {
    if (isDesktop) {
      navigate('/request-verification', { replace: true });
    }
  }, [isDesktop, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name || !email || !password || !confirmPassword || !role) {
      setError('Please fill all required fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    const showCourseFields = ['student', 'faculty', 'placement'].includes(role);
    const branchEligibleCourses = new Set(['B.Tech', 'M.Tech']);
    const showBranchField = showCourseFields && branchEligibleCourses.has(course);

    if (showCourseFields && !course) {
      setError('Course is required for the selected role');
      return;
    }
    if (showBranchField && !branch) {
      setError('Branch is required for B.Tech and M.Tech');
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.request('/auth/request-registration', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          password,
          confirmPassword,
          requestedRole: role,
          ...(showCourseFields && { course }),
          ...(showBranchField && { branch }),
          ...(role === 'admin' && program && { program })
        }),
      });
      setSuccess('Registration request submitted. Please wait for admin approval.');
      setTimeout(() => navigate('/mobile/login'), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="relative flex min-h-[100dvh] h-[100dvh] flex-col bg-[#111418] dark:bg-gray-900 overflow-hidden"
      style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}
    >
      <div className="flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center bg-[#111418] p-4 pb-2 justify-between">
          <button className="text-white flex size-12 shrink-0 items-center" onClick={() => navigate(-1)} aria-label="Back">
            <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
              <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"></path>
            </svg>
          </button>
          <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">Create Account</h2>
        </div>
        <form onSubmit={onSubmit}>
          <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
            <label className="flex flex-col min-w-40 flex-1">
              <p className="text-white text-base font-medium leading-normal pb-2">Full Name</p>
              <input
                placeholder="Enter your full name"
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-white focus:outline-0 focus:ring-0 border-none bg-[#283039] focus:border-none h-14 placeholder:text-[#9cabba] p-4 text-base font-normal leading-normal"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
          </div>
          <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
            <label className="flex flex-col min-w-40 flex-1">
              <p className="text-white text-base font-medium leading-normal pb-2">Email Address</p>
              <input
                placeholder="Enter your email"
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-white focus:outline-0 focus:ring-0 border-none bg-[#283039] focus:border-none h-14 placeholder:text-[#9cabba] p-4 text-base font-normal leading-normal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
          </div>
          <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
            <label className="flex flex-col min-w-40 flex-1">
              <p className="text-white text-base font-medium leading-normal pb-2">Phone Number</p>
              <input
                placeholder="Enter your phone number"
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-white focus:outline-0 focus:ring-0 border-none bg-[#283039] focus:border-none h-14 placeholder:text-[#9cabba] p-4 text-base font-normal leading-normal"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>
          </div>
          <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
            <label className="flex flex-col min-w-40 flex-1">
              <p className="text-white text-base font-medium leading-normal pb-2">Password</p>
              <input
                placeholder="Create a password"
                type="password"
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-white focus:outline-0 focus:ring-0 border-none bg-[#283039] focus:border-none h-14 placeholder:text-[#9cabba] p-4 text-base font-normal leading-normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
          </div>
          <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
            <label className="flex flex-col min-w-40 flex-1">
              <p className="text-white text-base font-medium leading-normal pb-2">Confirm Password</p>
              <input
                placeholder="Confirm your password"
                type="password"
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-white focus:outline-0 focus:ring-0 border-none bg-[#283039] focus:border-none h-14 placeholder:text-[#9cabba] p-4 text-base font-normal leading-normal"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </label>
          </div>
          <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
            <label className="flex flex-col min-w-40 flex-1">
              <p className="text-white text-base font-medium leading-normal pb-2">Role</p>
              <div className="relative">
                <select
                  className="appearance-none form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-white focus:outline-0 focus:ring-0 border-none bg-[#283039] focus:border-none h-14 placeholder:text-[#9cabba] p-4 pr-12 text-base font-normal leading-normal"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="">Select your role</option>
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="library">Librarian</option>
                  <option value="placement">Placement Officer</option>
                  <option value="admin">Admin</option>
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[#9cabba]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
                    <path d="M181.66,170.34a8,8,0,0,1,0,11.32l-48,48a8,8,0,0,1-11.32,0l-48-48a8,8,0,0,1,11.32-11.32L128,212.69l42.34-42.35A8,8,0,0,1,181.66,170.34ZM85.66,85.66,128,43.31l42.34,42.35a8,8,0,0,0,11.32-11.32l-48-48a8,8,0,0,0-11.32,0l-48,48A8,8,0,0,0,85.66,85.66Z" />
                  </svg>
                </span>
              </div>
            </label>
          </div>

          {/* Course selection for Student/Faculty/Placement */}
          {(['student','faculty','placement'] as const).includes(role as any) && (
            <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
              <label className="flex flex-col min-w-40 flex-1">
                <p className="text-white text-base font-medium leading-normal pb-2">Course</p>
                <div className="relative">
                  <select
                    className="appearance-none form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-white focus:outline-0 focus:ring-0 border-none bg-[#283039] focus:border-none h-14 placeholder:text-[#9cabba] p-4 pr-12 text-base font-normal leading-normal"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                  >
                    <option value="">Select a course</option>
                    <option value="B.Tech">B.Tech</option>
                    <option value="M.Tech">M.Tech</option>
                    <option value="MBA">MBA</option>
                    <option value="MCA">MCA</option>
                    <option value="B.Pharma">B.Pharma</option>
                    <option value="M.Pharma">M.Pharma</option>
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[#9cabba]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
                      <path d="M181.66,170.34a8,8,0,0,1,0,11.32l-48,48a8,8,0,0,1-11.32,0l-48-48a8,8,0,0,1,11.32-11.32L128,212.69l42.34-42.35A8,8,0,0,1,181.66,170.34ZM85.66,85.66,128,43.31l42.34,42.35a8,8,0,0,0,11.32-11.32l-48-48a8,8,0,0,0-11.32,0l-48,48A8,8,0,0,0,85.66,85.66Z" />
                    </svg>
                  </span>
                </div>
              </label>
            </div>
          )}

          {/* Branch appears for B.Tech / M.Tech only */}
          {(['student','faculty','placement'] as const).includes(role as any) && (course === 'B.Tech' || course === 'M.Tech') && (
            <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
              <label className="flex flex-col min-w-40 flex-1">
                <p className="text-white text-base font-medium leading-normal pb-2">Branch</p>
                <input
                  placeholder="Branch (e.g., Computer Science, Mechanical)"
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-white focus:outline-0 focus:ring-0 border-none bg-[#283039] focus:border-none h-14 placeholder:text-[#9cabba] p-4 text-base font-normal leading-normal"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                />
              </label>
            </div>
          )}

          {/* Program for Admin only */}
          {role === 'admin' && (
            <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
              <label className="flex flex-col min-w-40 flex-1">
                <p className="text-white text-base font-medium leading-normal pb-2">Admin Program</p>
                <div className="relative">
                  <select
                    className="appearance-none form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-white focus:outline-0 focus:ring-0 border-none bg-[#283039] focus:border-none h-14 placeholder:text-[#9cabba] p-4 pr-12 text-base font-normal leading-normal"
                    value={program}
                    onChange={(e) => setProgram(e.target.value)}
                  >
                    <option value="">Head Admin (No specific program)</option>
                    <option value="B.Tech">B.Tech</option>
                    <option value="M.Tech">M.Tech</option>
                    <option value="B.Pharma">B.Pharma</option>
                    <option value="MCA">MCA</option>
                    <option value="MBA">MBA</option>
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[#9cabba]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
                      <path d="M181.66,170.34a8,8,0,0,1,0,11.32l-48,48a8,8,0,0,1-11.32,0l-48-48a8,8,0,0,1,11.32-11.32L128,212.69l42.34-42.35A8,8,0,0,1,181.66,170.34ZM85.66,85.66,128,43.31l42.34,42.35a8,8,0,0,0,11.32-11.32l-48-48a8,8,0,0,0-11.32,0l-48,48A8,8,0,0,0,85.66,85.66Z" />
                    </svg>
                  </span>
                </div>
              </label>
            </div>
          )}
          <div className="flex px-4 py-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 flex-1 bg-[#0d80f2] text-white text-base font-bold leading-normal tracking-[0.015em] disabled:opacity-60"
            >
              <span className="truncate">{submitting ? 'Submitting...' : 'Register'}</span>
            </button>
          </div>
          {error && <p className="text-red-400 text-sm px-4">{error}</p>}
          {success && <p className="text-green-400 text-sm px-4">{success}</p>}
        </form>
        <p className="text-[#9cabba] text-sm font-normal leading-normal pb-3 pt-1 px-4 text-center underline">
          <button onClick={() => navigate('/mobile/login')}>Already have an account? Sign in</button>
        </p>
      </div>
    </div>
  );
};

export default MobileRegister;


