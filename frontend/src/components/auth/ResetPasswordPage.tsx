// src/components/auth/ResetPasswordPage.tsx
import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Lock, CheckCircle, AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';
    const email = searchParams.get('email') || '';

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!token || !email) {
            setError('Invalid reset link. Please request a new one.');
            return;
        }
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, email, newPassword }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setSuccess(true);
            } else {
                setError(data.message || 'Failed to reset password.');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <Lock className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
                        <p className="text-gray-500 mt-1">Enter your new password below</p>
                    </div>

                    {success ? (
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900">Password Reset Successfully!</h2>
                            <p className="text-gray-500">You can now log in with your new password.</p>
                            <Link
                                to="/login"
                                className="inline-flex items-center justify-center w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Go to Login
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="flex items-start p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                    <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            {(!token || !email) && (
                                <div className="flex items-start p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                                    <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                                    Invalid or missing reset link. Please request a new one from the login page.
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="At least 6 characters"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-10"
                                        required
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Re-enter your password"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    required
                                    minLength={6}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !token || !email}
                                className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Resetting...' : 'Set New Password'}
                            </button>

                            <div className="text-center">
                                <Link to="/login" className="text-sm text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center">
                                    <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                                    Back to Login
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
