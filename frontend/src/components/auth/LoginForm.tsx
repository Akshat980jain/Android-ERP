// src/components/auth/LoginForm.tsx
import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, GraduationCap, Eye, EyeOff, AlertCircle, ArrowLeft, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';

// Create a simple Toast component inline
const Toast = ({ 
  message, 
  type, 
  onClose 
}: { 
  message: string; 
  type: 'success' | 'error' | 'info'; 
  onClose: () => void;
}) => {
  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
  };

  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, x: '-50%' }}
      animate={{ opacity: 1, y: 0, x: '-50%' }}
      exit={{ opacity: 0, y: -50, x: '-50%' }}
      className={`fixed top-4 left-1/2 z-50 max-w-md w-full mx-auto p-4 rounded-lg border shadow-lg ${styles[type]}`}
    >
      <div className="flex items-center space-x-3">
        <span>{icons[type]}</span>
        <span className="flex-1 font-medium">{message}</span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors ml-2"
        >
          ×
        </button>
      </div>
    </motion.div>
  );
};

// OTP Input Component
const OTPInput = ({ 
  value, 
  onChange, 
  error 
}: { 
  value: string; 
  onChange: (value: string) => void; 
  error?: string;
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  useEffect(() => {
    if (value) {
      const otpArray = value.split('').slice(0, 6);
      while (otpArray.length < 6) otpArray.push('');
      setOtp(otpArray);
    }
  }, [value]);

  const handleChange = (index: number, val: string) => {
    if (val.length > 1) {
      // Handle paste
      const pastedValue = val.slice(0, 6);
      const newOtp = [...otp];
      pastedValue.split('').forEach((char, i) => {
        if (index + i < 6) newOtp[index + i] = char;
      });
      setOtp(newOtp);
      onChange(newOtp.join(''));
      
      // Focus last filled input or next empty
      const nextIndex = Math.min(index + pastedValue.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    if (!/^\d*$/.test(val)) return; // Only digits

    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);
    onChange(newOtp.join(''));

    // Auto-focus next input
    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-center space-x-3">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            pattern="[0-9]"
            maxLength={6} // Allow paste
            value={otp[index]}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className={`w-12 h-12 text-center text-lg font-semibold border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
              error ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
            } ${otp[index] ? 'border-blue-500 bg-blue-50' : ''}`}
            autoComplete="one-time-code"
          />
        ))}
      </div>
      {error && (
        <div className="flex items-center justify-center space-x-1 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

// Validation schema
const loginSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .min(1, 'Email is required'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password is too long'),
  rememberMe: z.boolean().optional(),
  twoFactorCode: z.string().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string>('');
  const [otpValue, setOtpValue] = useState('');

  // Only destructure what you actually use from useAuth
  const { login, verifyTwoFactor, isLoading } = useAuth();
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [twoFactorMethod, setTwoFactorMethod] = useState<'totp' | 'sms' | 'email'>('email');
  const [maskedPhone, setMaskedPhone] = useState<string | undefined>(undefined);
  const [devCode, setDevCode] = useState<string | undefined>(undefined);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
      twoFactorCode: '',
    },
  });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  }, []);

  const handleOtpChange = useCallback((value: string) => {
    setOtpValue(value);
    setValue('twoFactorCode', value);
  }, [setValue]);

  const handleBackToLogin = useCallback(() => {
    setTwoFactorRequired(false);
    setTempToken(null);
    setOtpValue('');
    setValue('twoFactorCode', '');
    setValue('password', '');
  }, [setValue]);

  const handleResendOtp = useCallback(async () => {
    try {
      const res = await (await import('../../utils/api')).default.request(
        '/auth/request-otp', 
        { 
          method: 'POST', 
          body: JSON.stringify({ email: pendingEmail, purpose: 'login' }) 
        }, 
        ''
      );
      showToast('New verification code sent to your email.', 'success');
    } catch (e) {
      showToast('Failed to resend verification code. Please try again.', 'error');
    }
  }, [pendingEmail, showToast]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      console.log('Form submission started for email:', data.email);

      if (twoFactorRequired) {
        // Verify 2FA code
        if (!data.twoFactorCode || data.twoFactorCode.trim().length < 6) {
          showToast('Please enter the complete 6-digit verification code.', 'error');
          return;
        }
        const verifyResult = await verifyTwoFactor(tempToken || '', data.twoFactorCode.trim());
        if (verifyResult.success) {
          showToast('Login successful! Welcome back.', 'success');
          reset();
          setTwoFactorRequired(false);
          setTempToken(null);
          setOtpValue('');
          return;
        } else {
          showToast(verifyResult.message || 'Invalid verification code. Please try again.', 'error');
          setOtpValue('');
          setValue('twoFactorCode', '');
          return;
        }
      }

      // Validate form data before sending (credentials step only)
      if (!data.email || !data.password) {
        showToast('Please fill in all required fields.', 'error');
        return;
      }

      // First step: password login
      const result = await login(data.email, data.password);

      console.log('Login attempt completed. Success:', result?.success);

      // Show OTP screen if required: redirect to dedicated page
      if ((result as any)?.otpRequired || result?.twoFactorRequired) {
        navigate(`/verify-email-otp?email=${encodeURIComponent(data.email)}`);
        return;
      }

      // Handle successful login when no OTP required
      if (result && result.success) {
        showToast('Login successful! Welcome back.', 'success');
        reset();
        return;
      }

      // Handle login failure with specific error message
      const errorMessage = result?.message || 'Login failed. Please check your credentials and try again.';
      console.log('Login failed with message:', errorMessage);
      showToast(errorMessage, 'error');
      
      // Reset sensitive fields
      setValue('password', '');
      setValue('twoFactorCode', '');

    } catch (error) {
      console.error('Login form error details:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      // Provide more specific error messages based on error type
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('Server error')) {
          errorMessage = 'Server is currently unavailable. Please try again in a few moments.';
        } else if (error.message.includes('Network')) {
          errorMessage = 'Network connection error. Please check your internet connection.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.';
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          errorMessage = 'Invalid email or password. Please check your credentials.';
        } else if (error.message.includes('400')) {
          errorMessage = 'Invalid request. Please check your input and try again.';
        } else {
          errorMessage = error.message;
        }
      }

      showToast(errorMessage, 'error');
      
      // Reset sensitive fields
      setValue('password', '');
      setValue('twoFactorCode', '');
    }
  };

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  // Check if backend is reachable (optional diagnostic)
  const testConnection = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        showToast('Server connection is working!', 'success');
      } else {
        showToast(`Server responded with status: ${response.status}`, 'error');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      showToast('Cannot connect to server. Please check if the server is running on port 5000.', 'error');
    }
  }, [showToast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 px-4">
      <AnimatePresence mode="wait">
        {!twoFactorRequired ? (
          // Login Form
          <motion.div
            key="login"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md"
          >
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 p-6">
                <GraduationCap className="w-8 h-8 text-white mr-3" />
                <h2 className="text-2xl font-bold text-white tracking-wide">EduConnect Login</h2>
              </div>
              
              <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      {...register('email')}
                      type="email"
                      className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'}`}
                      placeholder="Enter your email address"
                    />
                  </div>
                  {errors.email && (
                    <div className="flex items-center space-x-1 text-red-600 text-sm mt-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.email.message}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      className={`w-full pl-12 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${errors.password ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'}`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <div className="flex items-center space-x-1 text-red-600 text-sm mt-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.password.message}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      {...register('rememberMe')}
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Remember me</span>
                  </label>
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    onClick={() => showToast('Password reset feature coming soon!', 'info')}
                  >
                    Forgot password?
                  </button>
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold text-lg shadow hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting || isLoading}
                >
                  {(isSubmitting || isLoading) ? (
                    <div className="flex items-center justify-center space-x-2">
                      <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                      <span>Signing In...</span>
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </button>
                
                <div className="text-center space-y-3">
                  <a href="/request-verification" className="block text-blue-600 hover:underline">
                    Need an account? Request verification here
                  </a>
                  
                  {/* Debug button - remove in production */}
                  <button
                    type="button"
                    onClick={testConnection}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    Test Server Connection
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        ) : (
          // OTP Verification Screen
          <motion.div
            key="otp"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md"
          >
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-center bg-gradient-to-r from-green-600 to-blue-600 p-6 relative">
                <button
                  onClick={handleBackToLogin}
                  className="absolute left-4 text-white hover:text-gray-200 transition-colors"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <Shield className="w-8 h-8 text-white mr-3" />
                <h2 className="text-2xl font-bold text-white tracking-wide">Verify Your Identity</h2>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Enter Verification Code</h3>
                  <p className="text-gray-600">
                    {twoFactorMethod === 'sms' 
                      ? `We've sent a 6-digit code to ${maskedPhone || 'your phone'}`
                      : `We've sent a 6-digit code to ${pendingEmail}`}
                  </p>
                </div>

                <OTPInput 
                  value={otpValue}
                  onChange={handleOtpChange}
                  error={errors.twoFactorCode?.message}
                />

                {devCode && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                  >
                    <p className="text-sm text-yellow-800">
                      <span className="font-semibold">Dev Mode:</span> Use code <span className="font-mono font-bold">{devCode}</span>
                    </p>
                  </motion.div>
                )}

                <button
                  onClick={handleSubmit(onSubmit)}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 rounded-lg font-semibold text-lg shadow hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-green-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting || isLoading || otpValue.length < 6}
                >
                  {(isSubmitting || isLoading) ? (
                    <div className="flex items-center justify-center space-x-2">
                      <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    'Verify Code'
                  )}
                </button>

                <div className="text-center space-y-3">
                  <p className="text-sm text-gray-600">
                    Didn't receive the code?
                  </p>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    Resend Verification Code
                  </button>
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    className="block w-full text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Back to Login
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notifications */}
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}