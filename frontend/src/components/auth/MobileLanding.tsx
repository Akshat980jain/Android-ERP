import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const roleButtons = [
  { label: 'Student Login', path: '/login/student', color: '#3B82F6', emoji: '🎓' },
  { label: 'Faculty Login', path: '/login/faculty', color: '#8B5CF6', emoji: '👨‍🏫' },
  { label: 'Admin Login', path: '/login/admin', color: '#06B6D4', emoji: '🛡️' },
  { label: 'Placement Officer', path: '/login/placement', color: '#22C55E', emoji: '💼' },
  { label: 'Librarian Login', path: '/login/library', color: '#F59E0B', emoji: '📚' },
];

const MobileLanding: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    if (mq.matches) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  return (
    <div
      className="relative flex min-h-[100dvh] h-[100dvh] flex-col bg-[#111418] dark:bg-gray-900 justify-between overflow-hidden"
      style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}
    >
      <div>
        <div>
          <div className="px-4 py-3">
            <div
              className="w-full bg-center bg-no-repeat bg-cover flex flex-col justify-end overflow-hidden bg-[#111418] rounded-lg min-h-52"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuComINePZqF6Ql-J7Mtpmoxvb-psEp3Or8GxkbkznHvS8i_LwL2YK6OA9psUJNmIHJ7wnHjLdmri4bmtoOAqmSf-24cUJFIRJG4z29vZVP2RcX5F6F9-QiiSHCvwT3CyrxuYQzs1woZXAAhnWZgjzcsOJhuiNBde0t5MkF81RwQZ8_WA1xVoN__sJ0tQc9SuGjy3oNhYF2lB17jja2cvXnxCGGeClqrpfsKvfK76wJFbiJQxW8aFUpTYFQVnUR5xfxsZX2IjDW0XC4")',
              }}
            ></div>
          </div>
        </div>
        <h2 className="text-white tracking-light text-[28px] font-bold leading-tight px-4 text-center pb-2 pt-4">
          EduConnect
        </h2>
        <p className="text-white text-sm font-normal leading-normal pb-3 pt-1 px-4 text-center opacity-60">
          Select your portal to login
        </p>
      </div>
      <div className="pb-[env(safe-area-inset-bottom)] mb-4 flex-1 overflow-y-auto">
        <div className="flex justify-center">
          <div className="flex flex-1 gap-2.5 max-w-[480px] flex-col items-stretch px-4 py-2">
            {roleButtons.map((btn) => (
              <button
                key={btn.path}
                className="flex min-w-[84px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl h-12 px-5 text-white text-base font-bold leading-normal tracking-[0.015em] w-full transition-all active:scale-[0.98]"
                style={{ background: `${btn.color}25`, border: `1px solid ${btn.color}40` }}
                onClick={() => navigate(btn.path)}
              >
                <span>{btn.emoji}</span>
                <span className="truncate">{btn.label}</span>
              </button>
            ))}
            <button
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 px-5 bg-[#283039] text-white text-sm font-bold leading-normal tracking-[0.015em] w-full mt-1"
              onClick={() => navigate('/mobile/register')}
            >
              <span className="truncate">Don't have an account? Sign Up</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileLanding;
