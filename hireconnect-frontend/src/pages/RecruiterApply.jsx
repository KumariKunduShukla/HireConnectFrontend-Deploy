import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI, profileAPI } from '../api';
import toast from 'react-hot-toast';
import { 
  Building2, 
  Mail, 
  User, 
  ArrowRight, 
  Target, 
  Zap, 
  BarChart3, 
  Bell, 
  MessageSquare,
  ChevronLeft,
  ShieldCheck,
  CheckCircle2,
  Lock
} from 'lucide-react';

export default function RecruiterApply() {
  const [step, setStep] = useState(1); // 1=apply, 2=set-password, 3=success
  const [form, setForm] = useState({ email: '', name: '', company: '' });
  const [pwForm, setPwForm] = useState({ otp: '', newPassword: '', confirm: '', email: '' });
  const [appliedEmail, setAppliedEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const getErrorMessage = (err, fallback) => {
    const data = err.response?.data;
    if (typeof data === 'string') return data;
    if (data?.message) return data.message;
    return fallback;
  };

  // Step 1: Submit recruiter application
  const handleApply = async (e) => {
    e.preventDefault();
    
    if (form.name && !/^[a-zA-Z\s]+$/.test(form.name)) {
      toast.error('Name should contain only letters and spaces');
      return;
    }

    setLoading(true);
    try {
      const profilePayload = {
        email: form.email,
        fullName: form.name || form.email.split('@')[0],
        companyName: form.company || 'Not provided',
        status: 'PENDING_APPROVAL',
      };
      
      const results = await Promise.allSettled([
        authAPI.recruiterApply({ email: form.email }),
        profileAPI.createRecruiterProfile(profilePayload),
      ]);

      if (results.every((result) => result.status === 'rejected')) {
        throw results[0].reason;
      }

      setAppliedEmail(form.email);
      setPwForm(prev => ({ ...prev, email: form.email }));
      toast.success('Application submitted! Await admin approval.');
      setStep(2);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Application failed. Email may already be registered.'));
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Set password after approval OTP received via email
  const handleSetPassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (pwForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await authAPI.recruiterSetPassword(
        pwForm.email || appliedEmail,
        pwForm.otp,
        pwForm.newPassword
      );
      toast.success('Account activated! You can now sign in.');
      setStep(3);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to set password. OTP may have expired.'));
    } finally {
      setLoading(false);
    }
  };

  const perks = [
    { icon: Target, text: 'Access to 98K+ verified candidates', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { icon: Zap, text: 'Post jobs in under 2 minutes', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { icon: BarChart3, text: 'Track applicant pipeline visually', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { icon: Bell, text: 'Auto-notify shortlisted candidates', color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20' },
    { icon: MessageSquare, text: 'Schedule interviews in-platform', color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-900/20' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
      {/* Background elements */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[120px] animate-pulse delay-700"></div>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Section: Info & Perks */}
        <div className="hidden lg:flex flex-col space-y-12 pr-12 animate-in fade-in slide-in-from-left-8 duration-1000">
          <div className="space-y-6">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-blue-600/30 group-hover:scale-110 transition-transform">
                HC
              </div>
              <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                HireConnect <span className="text-blue-600">Partner</span>
              </span>
            </Link>
            <h1 className="text-5xl font-extrabold text-slate-900 dark:text-white leading-tight">
              Hire the best <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600 text-6xl">talent, faster.</span>
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-md">
              Join thousands of world-class companies using HireConnect to build exceptional teams.
            </p>
          </div>

          <div className="space-y-4">
            {perks.map((p, idx) => (
              <div key={idx} className="flex items-center space-x-4 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] shadow-sm hover:shadow-md transition-all group">
                <div className={`p-3 rounded-2xl ${p.bg} ${p.color} group-hover:scale-110 transition-transform`}>
                  <p.icon className="w-6 h-6" />
                </div>
                <span className="font-bold text-slate-700 dark:text-slate-300">{p.text}</span>
              </div>
            ))}
          </div>

          <div className="p-6 bg-slate-900 dark:bg-blue-600 rounded-[32px] text-white shadow-xl">
            <p className="text-sm font-bold opacity-80 uppercase tracking-widest mb-4">Trusted by Industry Leaders</p>
            <div className="flex flex-wrap gap-6 opacity-60 grayscale brightness-200">
              {['Google', 'Meta', 'Amazon', 'Apple'].map(brand => (
                <span key={brand} className="text-xl font-extrabold tracking-tighter">{brand}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Section: Form Card */}
        <div className="w-full animate-in fade-in slide-in-from-right-8 duration-1000">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[40px] p-8 sm:p-12 shadow-2xl shadow-slate-200/50 dark:shadow-none">
            
            {step === 1 && (
              <>
                <div className="mb-10 text-center lg:text-left">
                  <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Recruiter Partner</h2>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">Apply for a hiring partner account</p>
                </div>

                <form onSubmit={handleApply} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1 uppercase tracking-wider flex items-center">
                      <Mail className="w-3.5 h-3.5 mr-1.5" /> Work Email
                    </label>
                    <input
                      type="email"
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white font-medium"
                      placeholder="recruiter@company.com"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1 uppercase tracking-wider flex items-center">
                      <User className="w-3.5 h-3.5 mr-1.5" /> Your Full Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white font-medium"
                      placeholder="John Smith"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1 uppercase tracking-wider flex items-center">
                      <Building2 className="w-3.5 h-3.5 mr-1.5" /> Company Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white font-medium"
                      placeholder="Acme Corp"
                      value={form.company}
                      onChange={e => setForm({ ...form, company: e.target.value })}
                      required
                    />
                  </div>

                  <div className="p-5 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-3xl flex items-start space-x-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/50 text-blue-600 rounded-xl">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-blue-900 dark:text-blue-400 uppercase tracking-widest mb-1">Approval Process</p>
                      <p className="text-xs text-blue-700/70 dark:text-blue-400/70 font-medium leading-relaxed">
                        Our team will review your application within 24-48 hours. Once approved, you'll receive an OTP to set your password.
                      </p>
                    </div>
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
                        <span>Submit Application</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center space-y-3">
                  <p className="text-slate-500 font-medium text-sm">
                    Already approved?{' '}
                    <button onClick={() => setStep(2)} className="text-blue-600 hover:underline font-bold">Set your password →</button>
                  </p>
                  <p className="text-slate-500 font-medium text-sm">
                    Job seeker? <Link to="/register" className="text-blue-600 hover:underline font-bold">Join here</Link>
                  </p>
                </div>
              </>
            )}

            {step === 2 && (
              <div className="animate-in fade-in zoom-in-95 duration-500">
                <div className="mb-10 text-center">
                  <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-[30px] flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Activate Account</h2>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">
                    Enter the code from your approval email
                  </p>
                </div>

                <form onSubmit={handleSetPassword} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1 uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white font-medium shadow-sm"
                      value={pwForm.email || appliedEmail}
                      onChange={e => setPwForm({ ...pwForm, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1 uppercase tracking-wider text-center block">OTP from Approval Email</label>
                    <input
                      type="text"
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white text-center text-2xl font-bold tracking-[0.5em] shadow-sm"
                      value={pwForm.otp}
                      onChange={e => setPwForm({ ...pwForm, otp: e.target.value })}
                      required
                      maxLength={6}
                      placeholder="000000"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1 uppercase tracking-wider flex items-center"><Lock className="w-3 h-3 mr-1" /> New Password</label>
                      <input
                        type="password"
                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white font-medium shadow-sm"
                        placeholder="Min. 8 chars"
                        value={pwForm.newPassword}
                        onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                        required
                        minLength={8}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1 uppercase tracking-wider flex items-center"><Lock className="w-3 h-3 mr-1" /> Confirm</label>
                      <input
                        type="password"
                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white font-medium shadow-sm"
                        placeholder="Repeat"
                        value={pwForm.confirm}
                        onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-70"
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <span>Activate Account</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full py-4 text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold transition-all"
                  >
                    ← Back to Application
                  </button>
                </form>
              </div>
            )}

            {step === 3 && (
              <div className="text-center animate-in zoom-in-95 duration-500 py-6">
                <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-[40px] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-blue-600/10">
                  <Target className="w-12 h-12" />
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4">You're all set!</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium mb-10 leading-relaxed">
                  Your recruiter account is now active. You can start posting jobs and building your dream team immediately.
                </p>
                <Link 
                  to="/login" 
                  className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center space-x-2 group"
                >
                  <span>Sign In Now</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
