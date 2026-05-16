import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authAPI, profileAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import * as jwtDecodeModule from 'jwt-decode';
import { Mail, Lock, Github, ArrowRight, CheckCircle2, ShieldCheck, Briefcase, Star } from 'lucide-react';

const jwtDecode = jwtDecodeModule.default || jwtDecodeModule.jwtDecode || jwtDecodeModule;

// Fallback decoder in case library fails
const fallbackDecode = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    throw new Error('Invalid token');
  }
};

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [statusBanner, setStatusBanner] = useState(null); // { type: 'pending'|'rejected', message }
  const { login, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const tokenParam = params.get('token');
    const errorParam = params.get('error');

    if (errorParam) {
      toast.error(`GitHub Login Failed: ${errorParam}`);
      navigate('/login', { replace: true });
    } else if (tokenParam) {
      handleOAuthToken(tokenParam);
    } else if (code) {
      handleGithubCode(code);
    }
  }, [location.search, navigate]);

  const handleOAuthToken = async (token) => {
    try {
      setLoading(true);
      const { token: parsedToken, userData } = parseLoginResponse(token, '');
      if (!parsedToken || !userData) {
         throw new Error("Invalid token received from OAuth");
      }
      login(userData, parsedToken);
      
      try {
        const profileRes = await profileAPI.getProfileByEmail(userData.email);
        if (profileRes.data) updateUser({ ...userData, ...profileRes.data });
      } catch (_) {}

      toast.success('Welcome back via GitHub! 👋');
      navigate(userData.role === 'ADMIN' ? '/dashboard' : (userData.role === 'RECRUITER' ? '/recruiter' : '/dashboard'));
    } catch (err) {
      toast.error(getErrorMessage(err));
      navigate('/login', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const handleGithubCode = async (code) => {
    try {
      setLoading(true);
      const res = await authAPI.githubLogin(code);
      const { token, userData } = parseLoginResponse(res.data, '');
      if (!token || !userData) {
         throw new Error("Invalid token received from OAuth");
      }
      login(userData, token);

      try {
        const profileRes = await profileAPI.getProfileByEmail(userData.email);
        if (profileRes.data) updateUser({ ...userData, ...profileRes.data });
      } catch (_) {}

      toast.success('Welcome back via GitHub! 👋');
      navigate(userData.role === 'ADMIN' ? '/dashboard' : (userData.role === 'RECRUITER' ? '/recruiter' : '/dashboard'));
    } catch (err) {
      toast.error(getErrorMessage(err));
      navigate('/login', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const normalizeRole = (role) => {
    if (Array.isArray(role)) return role[0];
    if (typeof role === 'string') return role.replace(/^ROLE_/, '');
    return role;
  };

  const buildUserFromToken = (token, email) => {
    try {
      let decoded;
      try {
        decoded = typeof jwtDecode === 'function' ? jwtDecode(token) : fallbackDecode(token);
      } catch (e) {
        decoded = fallbackDecode(token);
      }
      const decodedEmail = decoded.email || decoded.sub || email;
      return {
        userId: decoded.userId || decoded.id,
        name: decoded.name || decoded.fullName || decodedEmail,
        email: decodedEmail,
        role: normalizeRole(decoded.role || decoded.authority || decoded.authorities) || 'CANDIDATE',
      };
    } catch (_) {
      return {
        email,
        name: email,
        role: 'CANDIDATE',
      };
    }
  };

  const parseLoginResponse = (data, email) => {
    if (typeof data === 'string') {
      return {
        token: data,
        userData: buildUserFromToken(data, email),
      };
    }

    const token = data?.token || data?.jwt || data?.accessToken || data?.access_token;
    let userData = data?.user || data?.userData || data?.profile || null;

    if (!userData && token) {
      const rest = { ...(data || {}) };
      delete rest.token;
      delete rest.jwt;
      delete rest.accessToken;
      delete rest.access_token;
      userData = Object.keys(rest).length ? rest : buildUserFromToken(token, email);
    }

    if (userData?.role) {
      userData = { ...userData, role: normalizeRole(userData.role) };
    }

    return { token, userData };
  };

  const getErrorMessage = (err) => {
    const data = err.response?.data;
    if (typeof data === 'string') return data;
    if (data?.message) return data.message;
    if (data?.error) return data.error;
    return err.message || 'Login failed. Please check your credentials.';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusBanner(null);

    try {
      const res = await authAPI.login(form.email, form.password);
      const { token, userData } = parseLoginResponse(res.data, form.email);
      if (!token || !userData) {
        throw new Error('Invalid login response from server');
      }

      login(userData, token);

      // Enrich with profile data if available
      try {
        const profileRes = await profileAPI.getProfileByEmail(form.email);
        if (profileRes.data) updateUser({ ...userData, ...profileRes.data });
      } catch (_) {
        // Profile may not exist yet — not an error
      }

      toast.success('Welcome back! 👋');

      if (userData.role === 'RECRUITER') {
        navigate('/recruiter');
      } else if (userData.role === 'ADMIN') {
        navigate('/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const message = getErrorMessage(err);
      const normalizedMessage = message.toLowerCase();

      // Detect specific backend status messages and show inline banners
      if (message.startsWith('PENDING:') || normalizedMessage.includes('pending approval')) {
        setStatusBanner({
          type: 'pending',
          message: 'Your recruiter application is awaiting admin approval. You will receive an email once approved.',
        });
      } else if (message.startsWith('REJECTED:') || normalizedMessage.includes('rejected')) {
        setStatusBanner({
          type: 'rejected',
          message: 'Your recruiter application was rejected by admin. Please contact support for more information.',
        });
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col pt-24 md:pt-32 overflow-x-hidden relative">
      {/* Background Glows for Premium Look */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="flex-1 flex flex-col justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-screen-xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          
          {/* Left Side: Branding & Illustration */}
          <div className="flex flex-col space-y-6 sm:space-y-8 lg:pr-8 animate-in fade-in slide-in-from-left-6 duration-700">
            <div className="space-y-4 text-center lg:text-left">
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                Connect with the <span className="text-blue-600 dark:text-blue-400">Future</span> of Hiring.
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-lg mx-auto lg:mx-0">
                Join thousands of professionals finding their dream roles and top companies hiring the best talent.
              </p>
            </div>

            {/* Mock Job Card Illustration */}
            <div className="relative group max-w-sm sm:max-w-md mx-auto lg:mx-0 w-full">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-violet-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-8 shadow-xl backdrop-blur-xl bg-opacity-95 dark:bg-opacity-95">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <div className="flex space-x-2">
                    <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] sm:text-xs font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full flex items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                      OPEN ROLE
                    </span>
                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] sm:text-xs font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full">NEW</span>
                  </div>
                  <Star className="text-amber-400 w-4 h-4 sm:w-5 sm:h-5 fill-amber-400" />
                </div>
                
                <h3 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white mb-1.5 sm:mb-2">Senior Frontend Engineer</h3>
                <p className="text-xs sm:text-base text-slate-500 dark:text-slate-400 mb-4 sm:mb-6 flex items-center">
                  <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                  TechCorp Inc. · Remote
                </p>

                <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-6 sm:mb-8">
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 sm:px-2.5 sm:py-1 rounded-lg text-[10px] sm:text-sm font-medium border border-slate-200 dark:border-slate-700">React</span>
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 sm:px-2.5 sm:py-1 rounded-lg text-[10px] sm:text-sm font-medium border border-slate-200 dark:border-slate-700">Tailwind</span>
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 sm:px-2.5 sm:py-1 rounded-lg text-[10px] sm:text-sm font-medium border border-slate-200 dark:border-slate-700">Node.js</span>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4 sm:pt-6">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm sm:text-lg">$90K – $130K <span className="text-[10px] sm:text-xs font-normal text-slate-500">/ yr</span></span>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-xl text-[10px] sm:text-sm font-bold transition-all shadow-lg shadow-blue-600/20">
                    Apply
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:gap-6 pt-2 sm:pt-4 max-w-lg mx-auto lg:mx-0">
              <div className="flex items-start space-x-2 sm:space-x-3">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 sm:p-2 rounded-lg text-blue-600 dark:text-blue-400 flex-shrink-0">
                  <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-base">Secure</h4>
                  <p className="text-[10px] sm:text-xs text-slate-500">Bank-grade auth</p>
                </div>
              </div>
              <div className="flex items-start space-x-2 sm:space-x-3">
                <div className="bg-violet-100 dark:bg-violet-900/30 p-1.5 sm:p-2 rounded-lg text-violet-600 dark:text-violet-400 flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-base">Verified</h4>
                  <p className="text-[10px] sm:text-xs text-slate-500">Top companies</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Login Form */}
          <div className="w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                <div className="text-center lg:text-left mb-6 sm:mb-10">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">Welcome back</h1>
                  <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">Sign in to your HireConnect account</p>
                </div>

                {statusBanner && (
                  <div className={`mb-6 p-4 rounded-2xl flex items-start space-x-3 ${statusBanner.type === 'pending' ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
                    <div className={statusBanner.type === 'pending' ? 'text-amber-600' : 'text-red-600'}>
                      {statusBanner.type === 'pending' ? '⏳' : '❌'}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className={`font-bold text-sm sm:text-base ${statusBanner.type === 'pending' ? 'text-amber-800 dark:text-amber-400' : 'text-red-800 dark:text-red-400'}`}>
                        {statusBanner.type === 'pending' ? 'Approval Pending' : 'Application Rejected'}
                      </h4>
                      <p className={`text-xs sm:text-sm leading-relaxed ${statusBanner.type === 'pending' ? 'text-amber-700 dark:text-amber-500' : 'text-red-700 dark:text-red-500'}`}>
                        {statusBanner.message}
                      </p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 ml-1 uppercase tracking-wider">Email Address</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                        <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <input
                        type="email"
                        placeholder="name@company.com"
                        className="w-full pl-11 pr-4 py-2.5 sm:py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all dark:text-white text-sm sm:text-base shadow-sm"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Password</label>
                      <Link to="/forgot-password" text="sm" className="text-[10px] sm:text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
                        Forgot?
                      </Link>
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                        <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="w-full pl-11 pr-4 py-2.5 sm:py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all dark:text-white text-sm sm:text-base shadow-sm"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 sm:py-4 rounded-xl shadow-lg shadow-blue-600/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:transform-none flex items-center justify-center space-x-2 text-sm sm:text-base group"
                  >
                    {loading ? (
                      <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>

                <div className="my-6 sm:my-8 flex items-center space-x-4">
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">or</span>
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                </div>

                <a
                  href={`https://github.com/login/oauth/authorize?client_id=Iv23liQdp7vbZ1tJSjmw&scope=user:email`}
                  className="w-full flex items-center justify-center space-x-3 bg-slate-900 hover:bg-black text-white font-bold py-3 sm:py-4 rounded-xl transition-all border border-slate-800 shadow-xl shadow-black/10 text-sm sm:text-base"
                >
                  <Github className="w-5 h-5 sm:w-6 sm:h-6 fill-white" />
                  <span className="text-white">Continue with GitHub</span>
                </a>

                <div className="mt-8 sm:mt-10 space-y-2 sm:space-y-3">
                  <p className="text-center text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
                    New to HireConnect? <Link to="/register" className="text-blue-600 font-bold hover:underline">Create an account</Link>
                  </p>
                  <p className="text-center text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
                    Recruiter? <Link to="/recruiter-apply" className="text-blue-600 font-bold hover:underline">Apply here</Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer Branding */}
      <div className="py-6 sm:py-10 px-4 text-center mt-auto">
        <p className="text-slate-400 text-[10px] sm:text-xs font-medium tracking-wide">
          © 2026 HIRECONNECT INC. ALL RIGHTS RESERVED.
        </p>
      </div>
    </div>
  );
}
