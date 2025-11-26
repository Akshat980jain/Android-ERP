import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const MobileLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login, verifyTwoFactor, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorMethod, setTwoFactorMethod] = useState<'totp' | 'sms' | 'email'>('email');
  const [maskedPhone, setMaskedPhone] = useState<string | undefined>(undefined);
  const [devCode, setDevCode] = useState<string | undefined>(undefined);
  const [pendingEmail, setPendingEmail] = useState<string>('');

  const isDesktop = useMemo(() => window.matchMedia('(min-width: 768px)').matches, []);

  useEffect(() => {
    if (isDesktop) {
      navigate('/login', { replace: true });
    }
  }, [isDesktop, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (twoFactorRequired) {
      if (!twoFactorCode || twoFactorCode.trim().length < 6) {
        setError('Enter the 6-digit authentication code');
        return;
      }
      const verify = await verifyTwoFactor(tempToken || '', twoFactorCode.trim());
      if (!verify.success) {
        setError(verify.message || 'Invalid code');
      } else {
        setTwoFactorRequired(false);
        setTempToken(null);
        setTwoFactorCode('');
      }
      return;
    }

    const res = await login(email, password);
    if (res.twoFactorRequired) {
      setTwoFactorRequired(true);
      setTempToken(res.tempToken || null);
      setTwoFactorMethod(res.method || 'email');
      setMaskedPhone(res.maskedPhone);
      setDevCode(res.devCode);
      setPendingEmail(email);
      return;
    }
    if (!res.success) {
      setError(res.message || 'Login failed');
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] h-[100dvh] flex-col bg-[#111418] dark:bg-gray-900 overflow-hidden" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <div className="flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center bg-[#111418] p-4 pb-2 justify-between">
          <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pl-12 pr-12">EduConnect</h2>
        </div>
        <div className="px-4 py-3">
          <div
            className="w-full bg-center bg-no-repeat bg-cover flex flex-col justify-end overflow-hidden bg-[#111418] rounded-lg min-h-80"
            style={{
              backgroundImage:
                'url("https://lh3.googleusercontent.com/aida-public/AB6AXuComINePZqF6Ql-J7Mtpmoxvb-psEp3Or8GxkbkznHvS8i_LwL2YK6OA9psUJNmIHJ7wnHjLdmri4bmtoOAqmSf-24cUJFIRJG4z29vZVP2RcX5F6F9-QiiSHCvwT3CyrxuYQzs1woZXAAhnWZgjzcsOJhuiNBde0t5MkF81RwQZ8_WA1xVoN__sJ0tQc9SuGjy3oNhYF2lB17jja2cvXnxCGGeClqrpfsKvfK76wJFbiJQxW8aFUpTYFQVnUR5xfxsZX2IjDW0XC4")',
            }}
          ></div>
        </div>
        <form onSubmit={onSubmit}>
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
              <p className="text-white text-base font-medium leading-normal pb-2">Password</p>
              <div className="flex w-full flex-1 items-stretch rounded-lg">
                <input
                  placeholder="Enter your password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-white focus:outline-0 focus:ring-0 border-none bg-[#283039] focus:border-none h-14 placeholder:text-[#9cabba] p-4 rounded-r-none border-r-0 pr-2 text-base font-normal leading-normal"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="text-[#9cabba] flex border-none bg-[#283039] items-center justify-center pr-4 rounded-r-lg border-l-0 w-12"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                    <path
                      d="M247.31,124.76c-.35-.79-8.82-19.58-27.65-38.41C194.57,61.26,162.88,48,128,48S61.43,61.26,36.34,86.35C17.51,105.18,9,124,8.69,124.76a8,8,0,0,0,0,6.5c.35.79,8.82,19.57,27.65,38.4C61.43,194.74,93.12,208,128,208s66.57-13.26,91.66-38.34c18.83-18.83,27.3-37.61,27.65-38.4A8,8,0,0,0,247.31,124.76ZM128,192c-30.78,0-57.67-11.19-79.93-33.25A133.47,133.47,0,0,1,25,128,133.33,133.33,0,0,1,48.07,97.25C70.33,75.19,97.22,64,128,64s57.67,11.19,79.93,33.25A133.46,133.46,0,0,1,231.05,128C223.84,141.46,192.43,192,128,192Zm0-112a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Z"
                    ></path>
                  </svg>
                </button>
              </div>
            </label>
          </div>
          {twoFactorRequired && (
            <div className="px-4">
              <label className="text-white text-base font-medium leading-normal pb-2">
                {twoFactorMethod === 'sms' ? `Enter code sent to ${maskedPhone || 'your phone'}` : 'Authentication code'}
              </label>
              <input
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                className="form-input w-full rounded-lg text-white focus:outline-0 focus:ring-0 border-none bg-[#283039] h-14 placeholder:text-[#9cabba] p-4 text-base"
                placeholder="6-digit code"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-[#9cabba]">Sent to: <strong>{pendingEmail}</strong></span>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const api = (await import('../../utils/api')).default;
                      await api.request('/auth/request-otp', { method: 'POST', body: JSON.stringify({ email: pendingEmail, purpose: 'login' }) }, '');
                      setError('OTP resent to your email');
                    } catch (e) {
                      setError('Failed to resend OTP');
                    }
                  }}
                  className="text-xs text-blue-400"
                >
                  Resend OTP
                </button>
              </div>
              {devCode && (
                <div className="mt-2 text-xs text-yellow-300">Dev code: {devCode}</div>
              )}
            </div>
          )}

          <div className="flex px-4 py-3">
            <button
              type="submit"
              disabled={isLoading}
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 flex-1 bg-[#0d80f2] text-white text-base font-bold leading-normal tracking-[0.015em] disabled:opacity-60"
            >
              <span className="truncate">{isLoading ? 'Signing in...' : twoFactorRequired ? 'Verify Code' : 'Login'}</span>
            </button>
          </div>
          {error && <p className="text-red-400 text-sm px-4">{error}</p>}
        </form>
        <p className="text-[#9cabba] text-sm font-normal leading-normal pb-3 pt-1 px-4 text-center underline">
          <button onClick={() => navigate('/mobile/forgot-password')}>Forgot Password?</button>
        </p>
      </div>
    </div>
  );
};

export default MobileLogin;


