import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus, ArrowLeft, GraduationCap, Users, Shield, Briefcase, BookOpen,
  CheckCircle, AlertCircle, Mail, Lock, User, Eye, EyeOff
} from 'lucide-react';

/* ─── Data ─── */
const roleCards = [
  { value: 'student', label: 'Student', icon: GraduationCap, color: '#3B82F6', loginPath: '/login/student' },
  { value: 'faculty', label: 'Faculty', icon: Users, color: '#8B5CF6', loginPath: '/login/faculty' },
  { value: 'admin', label: 'Admin', icon: Shield, color: '#06B6D4', loginPath: '/login/admin' },
  { value: 'placement', label: 'Placement', icon: Briefcase, color: '#22C55E', loginPath: '/login/placement' },
  { value: 'library', label: 'Librarian', icon: BookOpen, color: '#F59E0B', loginPath: '/login/library' },
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
  { value: 'MBA', label: 'MBA' },
];

const adminTypes = [
  { value: 'head', label: 'Head Admin (all programs)' },
  { value: 'program', label: 'Program Admin (one program, all branches)' },
  { value: 'branch', label: 'Branch Admin (one program + one branch)' },
];

const benefits = [
  'Access your personalized dashboard',
  'Collaborate with peers & faculty',
  'Track academic progress in real-time',
  'Secure, verified accounts only',
];

/* ─── Floating orbs ─── */
const FloatingOrbs = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: 5 }).map((_, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full opacity-[0.06]"
        style={{
          width: 180 + i * 90,
          height: 180 + i * 90,
          background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
          left: `${5 + i * 18}%`,
          top: `${10 + (i % 3) * 25}%`,
        }}
        animate={{ y: [0, -15, 0], x: [0, 8, 0], scale: [1, 1.04, 1] }}
        transition={{ duration: 9 + i * 2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.6 }}
      />
    ))}
  </div>
);

/* ─── Shared input class builder ─── */
const inputCls = (hasError?: boolean) =>
  `w-full pl-12 pr-4 py-3.5 bg-white/[0.05] border rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:border-transparent transition-all text-sm ${hasError ? 'border-red-500/50 bg-red-500/5' : 'border-white/[0.1] hover:border-white/[0.2]'
  }`;

const selectCls =
  'w-full px-4 py-3.5 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm appearance-none hover:border-white/[0.2] [&>option]:bg-[#0d1526] [&>option]:text-white';

/* ════════════════════════════════════════════════
   REQUEST VERIFICATION PAGE
   ════════════════════════════════════════════════ */
export default function RequestVerificationPage() {
  const API_URL = import.meta.env.VITE_API_URL || '';
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    branch: '', course: '', requestedRole: 'student',
    program: '', adminType: '' as '' | 'head' | 'program' | 'branch',
  });
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const selectedRole = roleCards.find((r) => r.value === form.requestedRole) || roleCards[0];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'requestedRole') {
        updated.adminType = '' as '' | 'head' | 'program' | 'branch';
        updated.program = ''; updated.course = ''; updated.branch = '';
      }
      if (name === 'adminType') { updated.program = ''; updated.branch = ''; }
      if (name === 'course' || name === 'program') { updated.branch = ''; }
      return updated;
    });
    setError('');
  };

  const validateForm = () => {
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return false; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return false; }
    if (!form.name.trim() || !form.email.trim()) { setError('Name and email are required'); return false; }
    const showCourseFields = ['student', 'faculty', 'placement'].includes(form.requestedRole);
    const branchEligible = new Set(['B.Tech', 'M.Tech']);
    if (showCourseFields && !form.course.trim()) { setError('Course is required'); return false; }
    if (showCourseFields && branchEligible.has(form.course) && !form.branch.trim()) { setError('Branch is required for B.Tech / M.Tech'); return false; }
    if (form.requestedRole === 'admin') {
      if (!form.adminType) { setError('Please select an admin type'); return false; }
      if (form.adminType === 'program' && !form.program) { setError('Select a program'); return false; }
      if (form.adminType === 'branch') {
        if (!form.program) { setError('Select a program'); return false; }
        if (branchEligible.has(form.program) && !form.branch.trim()) { setError('Branch is required'); return false; }
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setStatus('');
    if (!validateForm()) { setLoading(false); return; }
    const showCourseFields = ['student', 'faculty', 'placement'].includes(form.requestedRole);
    const branchEligible = new Set(['B.Tech', 'M.Tech']);
    const showBranch = showCourseFields && branchEligible.has(form.course);
    try {
      const payload: Record<string, string> = {
        name: form.name.trim(), email: form.email.trim(),
        password: form.password, confirmPassword: form.confirmPassword,
        requestedRole: form.requestedRole,
      };
      if (showCourseFields) { payload.course = form.course.trim(); payload.program = form.course.trim(); }
      if (showBranch) { payload.branch = form.branch.trim(); }
      if (form.requestedRole === 'admin') {
        payload.adminType = form.adminType;
        if (form.adminType === 'program' || form.adminType === 'branch') payload.program = form.program;
        if (form.adminType === 'branch' && form.branch.trim()) payload.branch = form.branch.trim();
      }
      const res = await fetch(`${API_URL}/api/auth/request-registration`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus('Request submitted successfully! Awaiting admin approval.');
        setForm({ name: '', email: '', password: '', confirmPassword: '', branch: '', course: '', requestedRole: 'student', program: '', adminType: '' as '' | 'head' | 'program' | 'branch' });
      } else {
        setError(data.message || 'Request failed. Please try again.');
      }
    } catch { setError('Network error. Please check your connection.'); }
    finally { setLoading(false); }
  };

  // Visibility flags
  const showCourseFields = ['student', 'faculty', 'placement'].includes(form.requestedRole);
  const branchEligible = new Set(['B.Tech', 'M.Tech']);
  const showBranchField = showCourseFields && branchEligible.has(form.course);
  const isAdmin = form.requestedRole === 'admin';
  const showAdminProgram = isAdmin && (form.adminType === 'program' || form.adminType === 'branch');
  const showAdminBranch = isAdmin && form.adminType === 'branch' && branchEligible.has(form.program);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#0a0f1e] to-indigo-950 flex relative overflow-hidden">
      <FloatingOrbs />

      {/* ── Left Branding Panel (desktop) ── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] flex-col justify-center px-12 xl:px-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
        >
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-10 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Home
          </Link>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center shadow-lg">
              <UserPlus className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl xl:text-4xl font-bold text-white">Request Access</h1>
              <p className="text-gray-400 mt-1">Create your EduConnect account</p>
            </div>
          </div>

          <div className="mt-10 space-y-4">
            {benefits.map((b, i) => (
              <motion.div
                key={b}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-indigo-400" />
                </div>
                <span className="text-gray-300 text-base">{b}</span>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 flex items-center gap-3 opacity-50">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm text-gray-500 font-medium">EduConnect ERP</span>
          </div>
        </motion.div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="w-full lg:w-1/2 xl:w-[45%] flex items-start lg:items-center justify-center px-4 sm:px-8 py-8 relative z-10 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md"
        >
          {/* Mobile header */}
          <div className="lg:hidden mb-6">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Request Access</h1>
                <p className="text-sm text-gray-400">Create your EduConnect account</p>
              </div>
            </div>
          </div>

          {/* Card */}
          <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-5 flex items-center justify-center gap-3">
              <UserPlus className="w-6 h-6 text-white" />
              <h2 className="text-lg font-bold text-white tracking-wide">Request Verification</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
              {/* ── Role Selection Cards ── */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Select your role</label>
                <div className="grid grid-cols-5 gap-2">
                  {roleCards.map((r) => {
                    const Icon = r.icon;
                    const isSelected = form.requestedRole === r.value;
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => handleChange({ target: { name: 'requestedRole', value: r.value } } as any)}
                        className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl border text-xs font-medium transition-all ${isSelected
                            ? 'border-white/30 bg-white/[0.08] text-white scale-[1.02]'
                            : 'border-white/[0.06] bg-white/[0.02] text-gray-500 hover:border-white/[0.12] hover:text-gray-300'
                          }`}
                      >
                        <Icon className="w-5 h-5" style={{ color: isSelected ? r.color : undefined }} />
                        <span className="truncate w-full text-center">{r.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Name ── */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input name="name" value={form.name} onChange={handleChange} placeholder="Enter your full name"
                    className={inputCls()} required disabled={loading} />
                </div>
              </div>

              {/* ── Email ── */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Enter your email"
                    className={inputCls()} required disabled={loading} />
                </div>
              </div>

              {/* ── Password ── */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input name="password" type={showPassword ? 'text' : 'password'} value={form.password}
                    onChange={handleChange} placeholder="Min. 6 characters"
                    className={inputCls()} required minLength={6} disabled={loading} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors" tabIndex={-1}>
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* ── Confirm Password ── */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input name="confirmPassword" type={showConfirm ? 'text' : 'password'} value={form.confirmPassword}
                    onChange={handleChange} placeholder="Re-enter your password"
                    className={inputCls()} required disabled={loading} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors" tabIndex={-1}>
                    {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* ── Course & Branch (Student/Faculty/Placement) ── */}
              <AnimatePresence mode="wait">
                {showCourseFields && (
                  <motion.div key="course-fields" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300">Course / Program</label>
                      <select name="course" value={form.course} onChange={handleChange} className={selectCls} required disabled={loading}>
                        <option value="" disabled>Select a course</option>
                        {courses.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                    {showBranchField && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Branch</label>
                        <div className="relative">
                          <input name="branch" value={form.branch} onChange={handleChange}
                            placeholder="e.g., Computer Science, Mechanical"
                            className="w-full px-4 py-3.5 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm hover:border-white/[0.2]"
                            required disabled={loading} />
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Admin Type ── */}
              <AnimatePresence mode="wait">
                {isAdmin && (
                  <motion.div key="admin-fields" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300">Admin Type</label>
                      <select name="adminType" value={form.adminType} onChange={handleChange} className={selectCls} required disabled={loading}>
                        <option value="" disabled>Select Admin Type</option>
                        {adminTypes.map((at) => <option key={at.value} value={at.value}>{at.label}</option>)}
                      </select>
                    </div>
                    {showAdminProgram && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Program</label>
                        <select name="program" value={form.program} onChange={handleChange} className={selectCls} required disabled={loading}>
                          <option value="" disabled>Select Program</option>
                          {programs.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </select>
                      </motion.div>
                    )}
                    {showAdminBranch && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Branch</label>
                        <input name="branch" value={form.branch} onChange={handleChange}
                          placeholder="e.g., Computer Science, Mechanical"
                          className="w-full px-4 py-3.5 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm hover:border-white/[0.2]"
                          required disabled={loading} />
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Submit ── */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3.5 rounded-xl font-semibold text-base shadow-lg hover:shadow-xl hover:from-blue-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </span>
                ) : 'Submit Request'}
              </button>

              {/* ── Status / Error ── */}
              <AnimatePresence>
                {status && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{status}</span>
                  </motion.div>
                )}
                {error && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Login link ── */}
              <div className="text-center pt-2">
                <Link
                  to={selectedRole.loginPath}
                  className="text-sm text-indigo-400 hover:text-indigo-300 hover:underline transition-colors"
                >
                  Already have an account? Login as {selectedRole.label}
                </Link>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}