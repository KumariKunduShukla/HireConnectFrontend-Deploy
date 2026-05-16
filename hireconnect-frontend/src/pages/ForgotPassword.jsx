import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import toast from 'react-hot-toast';
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  ShieldQuestion, 
  KeyRound, 
  ChevronLeft 
} from 'lucide-react';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1 = email, 2 = otp + new password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      toast.success('OTP sent to your email!');
      setStep(2);
    } catch (err) {
      let msg = 'Failed to send OTP.';
      if (err.response?.data) {
        msg = typeof err.response.data === 'string' ? err.response.data : (err.response.data.error || JSON.stringify(err.response.data));
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await authAPI.resetPassword(email, otp, newPassword);
      toast.success('Password successfully reset! Please sign in.');
      navigate('/login');
    } catch (err) {
      let msg = 'Failed to reset password.';
      if (err.response?.data) {
        msg = typeof err.response.data === 'string' ? err.response.data : (err.response.data.error || JSON.stringify(err.response.data));
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
      {/* Background elements */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[120px] animate-pulse delay-700"></div>
      </div>

      <div className="w-full max-w-lg animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* Brand Link */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center space-x-2 group">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-110 transition-transform">
              HC
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              HireConnect
            </span>
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[40px] p-8 sm:p-12 shadow-2xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden">
          {/* Subtle decoration */}
          <div className="absolute -top-12 -right-12 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl"></div>
          
          {step === 1 ? (
            <>
              <div className="mb-10 text-center">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <ShieldQuestion className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">Forgot Password?</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                  No worries, it happens. Enter your email to receive a reset code.
                </p>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1 uppercase tracking-wider flex items-center">
                    <Mail className="w-3.5 h-3.5 mr-1.5" /> Registered Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white font-medium"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-70 group"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Send Reset Code</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 text-center">
                <Link to="/login" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back to Sign In
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="mb-10 text-center">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <KeyRound className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">Reset Password</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
                  We've sent a code to <span className="text-slate-900 dark:text-white font-bold">{email}</span>
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1 uppercase tracking-wider text-center block">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white text-center text-2xl font-bold tracking-[0.5em]"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    maxLength={6}
                    placeholder="000000"
                  />
                </div>

                <div className="grid grid-cols-1 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1 uppercase tracking-wider">New Password</label>
                    <input
                      type="password"
                      className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white font-medium"
                      placeholder="Min. 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1 uppercase tracking-wider">Confirm New Password</label>
                    <input
                      type="password"
                      className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white font-medium"
                      placeholder="Repeat new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/20 transition-all disabled:opacity-70"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </form>

              <div className="mt-8 text-center">
                <button 
                  type="button" 
                  onClick={() => setStep(1)}
                  className="text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Use a different email
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
