import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

/* ── subtle floating orbs — same pattern as RoleLoginPage ── */
const FloatingOrbs = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <motion.div
        key={i}
        className="absolute rounded-full opacity-[0.07]"
        style={{
          width: 200 + i * 80,
          height: 200 + i * 80,
          background: '#3B82F6',
          left: `${10 + i * 15}%`,
          top: `${5 + (i % 3) * 30}%`,
        }}
        animate={{ y: [0, -20, 0], x: [0, 10, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 8 + i * 2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
      />
    ))}
  </div>
);

export default function EmailOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyEmailOtp } = useAuth();

  const params = new URLSearchParams(location.search);
  const initialEmail = params.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(
    initialEmail ? `Code sent to ${initialEmail}` : 'Please enter your email address'
  );
  const [resendTimer, setResendTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  /* ── timers ── */
  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer((n) => n - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const u = p.get('email') || '';
    if (u && u !== email) { setEmail(u); setInfo(`Code sent to ${u}`); }
  }, [location.search]);

  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  /* ── OTP helpers ── */
  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;
    const next = [...otp]; next[index] = value; setOtp(next); setError(null);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!digits.length) return;
    const next = Array(6).fill('');
    [...digits].forEach((d, i) => { next[i] = d; });
    setOtp(next);
    inputRefs.current[Math.min(digits.length, 5)]?.focus();
  };

  /* ── submit ── */
  const handleSubmit = useCallback(async () => {
    setError(null);
    const code = otp.join('');
    if (!email) { setError('Please enter your email address'); return; }
    if (code.length < 6) { setError('Please enter the complete 6-digit code'); return; }
    setLoading(true);
    const res = await verifyEmailOtp(email.trim().toLowerCase(), code);
    setLoading(false);
    if (!res.success) {
      setError(res.message || 'Invalid code. Please try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      return;
    }
    navigate('/app', { replace: true });
  }, [email, otp, verifyEmailOtp, navigate]);

  /* ── resend ── */
  const handleResend = () => {
    if (!email || resendTimer > 0) return;
    setResendTimer(60);
    setInfo(`New code sent to ${email}`);
    setError(null);
  };

  const isComplete = otp.every((d) => d !== '');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-950 to-indigo-950 flex items-center justify-center px-4 relative overflow-hidden">
      <FloatingOrbs />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>

        {/* Glass card */}
        <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl">

          {/* Header bar */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 flex items-center justify-center gap-3">
            <ShieldCheck className="w-6 h-6 text-white" />
            <h2 className="text-lg font-bold text-white tracking-wide">Email Verification</h2>
          </div>

          {/* Body */}
          <div className="p-6 sm:p-8 space-y-6">

            {/* Icon + heading */}
            <div className="text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: '#3B82F620', boxShadow: '0 0 40px #3B82F615' }}
              >
                <Mail className="w-8 h-8 text-blue-400" />
              </motion.div>
              <h1 className="text-2xl font-bold text-white">Check Your Email</h1>
              <p className="text-gray-400 text-sm mt-1">We've sent a 6-digit verification code</p>
            </div>

            {/* Info banner */}
            <AnimatePresence>
              {info && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm"
                >
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  {info}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email field */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (e.target.value) setInfo(`Code sent to ${e.target.value}`); }}
                  placeholder={initialEmail || 'your@email.com'}
                  readOnly={!!initialEmail}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/[0.05] border border-white/[0.1] hover:border-white/[0.2] rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all read-only:opacity-70 read-only:cursor-not-allowed"
                />
              </div>
              {initialEmail && (
                <p className="text-xs text-gray-500">Email address from login attempt</p>
              )}
            </div>

            {/* OTP inputs */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">Verification Code</label>
              <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                {otp.map((digit, i) => (
                  <motion.input
                    key={i}
                    ref={(el) => (inputRefs.current[i] = el)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 bg-white/[0.05] text-white outline-none transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent ${digit
                        ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                        : 'border-white/[0.1] hover:border-white/20'
                      }`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 text-center">Enter "123456" to test</p>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading || !isComplete}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3.5 rounded-xl font-semibold text-base shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Verifying...
                </span>
              ) : (
                'Verify & Continue'
              )}
            </button>

            {/* Resend + Back */}
            <div className="text-center space-y-3">
              <p className="text-sm text-gray-500">Didn't receive the code?</p>
              <button
                onClick={handleResend}
                disabled={resendTimer > 0 || !email}
                className="text-sm font-medium text-blue-400 hover:text-blue-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
              >
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
              </button>
            </div>

            <button
              onClick={() => navigate(-1)}
              className="w-full text-gray-500 hover:text-gray-300 text-sm font-medium py-1 flex items-center justify-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </button>
          </div>
        </div>

        {/* Footer hint */}
        <p className="text-center text-xs text-gray-600 mt-6">
          Check your spam folder if you don't see the email
        </p>
      </motion.div>
    </div>
  );
}