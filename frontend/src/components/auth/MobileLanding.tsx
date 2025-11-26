import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
              className="w-full bg-center bg-no-repeat bg-cover flex flex-col justify-end overflow-hidden bg-[#111418] rounded-lg min-h-80"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuComINePZqF6Ql-J7Mtpmoxvb-psEp3Or8GxkbkznHvS8i_LwL2YK6OA9psUJNmIHJ7wnHjLdmri4bmtoOAqmSf-24cUJFIRJG4z29vZVP2RcX5F6F9-QiiSHCvwT3CyrxuYQzs1woZXAAhnWZgjzcsOJhuiNBde0t5MkF81RwQZ8_WA1xVoN__sJ0tQc9SuGjy3oNhYF2lB17jja2cvXnxCGGeClqrpfsKvfK76wJFbiJQxW8aFUpTYFQVnUR5xfxsZX2IjDW0XC4")',
              }}
            ></div>
          </div>
        </div>
        <h2 className="text-white tracking-light text-[28px] font-bold leading-tight px-4 text-center pb-3 pt-5">
          EduConnect
        </h2>
        <p className="text-white text-base font-normal leading-normal pb-3 pt-1 px-4 text-center">
          Connecting Students, Faculty, and Administration
        </p>
      </div>
      <div className="pb-[env(safe-area-inset-bottom)] mb-8">
        <div className="flex justify-center">
          <div className="flex flex-1 gap-3 max-w-[480px] flex-col items-stretch px-4 py-3">
            <button
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-[#0d80f2] text-white text-base font-bold leading-normal tracking-[0.015em] w-full"
              onClick={() => navigate('/mobile/login')}
            >
              <span className="truncate">Login</span>
            </button>
            <button
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-[#283039] text-white text-base font-bold leading-normal tracking-[0.015em] w-full"
              onClick={() => navigate('/mobile/register')}
            >
              <span className="truncate">Sign Up</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileLanding;


