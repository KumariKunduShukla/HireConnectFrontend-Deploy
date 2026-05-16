import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import toast from 'react-hot-toast';
import { 
  User, 
  Mail, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Briefcase 
} from 'lucide-react';

export default function Register() {
  const [step, setStep] = useState(1); // 1=form, 2=otp
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'CANDIDATE' });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!/^[a-zA-Z\s]+$/.test(form.name)) {
      toast.error('Name should contain only letters and spaces');
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      localStorage.setItem('hc_fullName', form.name);
      await authAPI.register({ email: form.email, password: form.password });
      toast.success('OTP sent to your email!');
      setStep(2);
    } catch (err) {
      let msg = 'Registration failed.';
      if (err.response?.data) {
        msg = typeof err.response.data === 'string' ? err.response.data : (err.response.data.error || JSON.stringify(err.response.data));
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.verifyOtp(form.email, otp, { email: form.email, password: form.password });
      toast.success('Account created! Please sign in.');
      navigate('/login');
    } catch (err) {
      let msg = 'OTP verification failed.';
      if (err.response?.data) {
        msg = typeof err.response.data === 'string' ? err.response.data : (err.response.data.error || JSON.stringify(err.response.data));
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
      {/* Background elements */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[120px] animate-pulse delay-700"></div>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Section: Branding & Social Proof */}
        <div className="hidden lg:flex flex-col space-y-12 pr-12 animate-in fade-in slide-in-from-left-8 duration-1000">
          <div className="space-y-6">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-blue-600/30 group-hover:scale-110 transition-transform">
                HC
              </div>
              <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                HireConnect
              </span>
            </Link>
            <h1 className="text-5xl font-extrabold text-slate-900 dark:text-white leading-tight">
              Start your journey <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">to success.</span>
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-md">
              Join 98,000+ professionals discovering world-class career opportunities every day.
            </p>
          </div>

          <div className="space-y-6">
            {[
              { icon: Zap, text: 'Personalized job recommendations', color: 'text-amber-500' },
              { icon: ShieldCheck, text: 'Verified company profiles', color: 'text-blue-500' },
              { icon: CheckCircle2, text: 'Direct application tracking', color: 'text-emerald-500' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center space-x-4 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all">
                <div className={`p-2 rounded-xl bg-slate-50 dark:bg-slate-800 ${item.color}`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <span className="font-bold text-slate-700 dark:text-slate-300">{item.text}</span>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
            <div className="flex -space-x-3 mb-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-950 bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                  <img src={`https://i.pravatar.cc/100?u=${i + 10}`} alt="user" className="w-full h-full object-cover" />
                </div>
              ))}
              <div className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-950 bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
                +2k
              </div>
            </div>
            <p className="text-sm text-slate-500 font-medium">Joined by 2,000+ professionals this week</p>
          </div>
        </div>

        {/* Right Section: Form Card */}
        <div className="w-full animate-in fade-in slide-in-from-right-8 duration-1000">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[40px] p-8 sm:p-12 shadow-2xl shadow-slate-200/50 dark:shadow-none">
            {step === 1 ? (
              <>
                <div className="mb-10 text-center lg:text-left">
                  <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Create Account</h2>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">Join HireConnect and find your dream role</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-5">
                  <div className="space-y-2 group">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1 uppercase tracking-wider flex items-center">
                      <User className="w-3.5 h-3.5 mr-1.5" /> Full Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white font-medium shadow-sm"
                      placeholder="Enter your name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2 group">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1 uppercase tracking-wider flex items-center">
                      <Mail className="w-3.5 h-3.5 mr-1.5" /> Email Address
                    </label>
                    <input
                      type="email"
                      className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white font-medium shadow-sm"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2 group">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1 uppercase tracking-wider flex items-center">
                        <Lock className="w-3.5 h-3.5 mr-1.5" /> Password
                      </label>
                      <input
                        type="password"
                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white font-medium shadow-sm"
                        placeholder="••••••••"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        required
                        minLength={8}
                      />
                    </div>
                    <div className="space-y-2 group">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1 uppercase tracking-wider flex items-center">
                        <Lock className="w-3.5 h-3.5 mr-1.5" /> Confirm
                      </label>
                      <input
                        type="password"
                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white font-medium shadow-sm"
                        placeholder="••••••••"
                        value={form.confirmPassword}
                        onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                        required
                        minLength={8}
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl mb-8">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                          <Briefcase className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">Account Type</span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        Registering as a <span className="font-bold text-blue-600">Job Seeker</span>. Recruiters should use the 
                        <Link to="/recruiter-apply" className="text-blue-600 hover:underline ml-1 font-bold">Partner Portal →</Link>
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-70 group"
                    >
                      {loading ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <span>Create Free Account</span>
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </form>

                <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
                  <p className="text-slate-500 font-medium">
                    Already have an account?{' '}
                    <Link to="/login" className="text-blue-600 hover:underline font-bold">Sign In</Link>
                  </p>
                </div>
              </>
            ) : (
              /* OTP Step */
              <div className="animate-in fade-in zoom-in-95 duration-500">
                <div className="mb-10 text-center">
                  <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-[30px] flex items-center justify-center mx-auto mb-6">
                    <Mail className="w-10 h-10" />
                  </div>
                  <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Check your inbox</h2>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">
                    We've sent a 6-digit code to <span className="text-slate-900 dark:text-white font-bold">{form.email}</span>
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-8">
                  <div className="space-y-2 group">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1 uppercase tracking-wider text-center block">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      className="w-full px-5 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-3xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white text-center text-3xl font-bold tracking-[0.5em] shadow-sm"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      maxLength={6}
                      placeholder="000000"
                    />
                  </div>

                  <div className="space-y-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-70"
                    >
                      {loading ? (
                        <div className="w-6 h-6 border-2 border-white/20 border-t-white dark:border-t-slate-900 rounded-full animate-spin"></div>
                      ) : (
                        <span>Verify & Create Account</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="w-full py-4 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold rounded-2xl transition-all"
                    >
                      Use a different email
                    </button>
                  </div>
                </form>

                <div className="mt-10 text-center">
                  <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto">
                    Didn't receive the code? Check your spam folder or wait a few minutes.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}