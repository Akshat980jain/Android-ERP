import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MobileForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const isDesktop = useMemo(() => window.matchMedia('(min-width: 768px)').matches, []);

  useEffect(() => {
    if (isDesktop) {
      navigate('/login', { replace: true });
    }
  }, [isDesktop, navigate]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // No backend endpoint yet; provide UX feedback
    setMessage('Password reset is not set up yet. Please contact your administrator.');
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-[#111418] justify-between overflow-x-hidden" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <div>
        <div className="flex items-center bg-[#111418] p-4 pb-2 justify-between">
          <button className="text-white flex size-12 shrink-0 items-center" onClick={() => navigate(-1)} aria-label="Back">
            <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
              <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"></path>
            </svg>
          </button>
        </div>
        <h2 className="text-white tracking-light text-[28px] font-bold leading-tight px-4 text-left pb-3 pt-5">Forgot password?</h2>
        <p className="text-white text-base font-normal leading-normal pb-3 pt-1 px-4">
          Enter the email associated with your account and we'll send an email with instructions to reset your password.
        </p>
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
          <div className="flex px-4 py-3">
            <button
              type="submit"
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 flex-1 bg-[#0d80f2] text-white text-base font-bold leading-normal tracking-[0.015em]"
            >
              <span className="truncate">Send Reset Link</span>
            </button>
          </div>
        </form>
        {message && <p className="text-[#9cabba] text-sm font-normal leading-normal pb-3 pt-1 px-4 text-center">{message}</p>}
      </div>
      <div>
        <p className="text-[#9cabba] text-sm font-normal leading-normal pb-3 pt-1 px-4 text-center underline">
          <button onClick={() => navigate('/mobile/login')}>Remember your password? Sign In</button>
        </p>
        <div className="h-5 bg-[#111418]"></div>
      </div>
    </div>
  );
};

export default MobileForgotPassword;


