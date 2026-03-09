// src/components/auth/ResetPasswordPage.tsx
// Password reset is now handled via OTP in the login page modal.
// This page gracefully redirects users who arrive via old emails.
import { Link } from 'react-router-dom';
import { Lock, ArrowLeft, Mail } from 'lucide-react';

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center space-y-5">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                        <Lock className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Link Expired</h1>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        Password reset links are no longer used. Please use the <strong>Forgot Password</strong> option
                        on the login page — you'll receive a 6-digit OTP directly in your email instead.
                    </p>
                    <div className="flex flex-col gap-3 pt-2">
                        <Link
                            to="/login/student"
                            className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                        >
                            <Mail className="w-4 h-4" />
                            Go to Login &amp; Use Forgot Password
                        </Link>
                        <Link
                            to="/"
                            className="inline-flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
