import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowRight, 
  Search, 
  Users, 
  Building2, 
  Briefcase, 
  CheckCircle2, 
  Zap, 
  Bell, 
  BarChart3, 
  ShieldCheck,
  Code,
  Palette,
  LineChart,
  Wallet,
  Handshake,
  Box,
  Truck,
  FlaskConical
} from 'lucide-react';

const stats = [
  { value: '12K+', label: 'Active Jobs', icon: Briefcase },
  { value: '4.8K+', label: 'Companies', icon: Building2 },
  { value: '98K+', label: 'Candidates', icon: Users },
  { value: '89%', label: 'Hire Rate', icon: CheckCircle2 },
];

const categories = [
  { name: 'Engineering', icon: Code, count: '2.4K', color: 'blue' },
  { name: 'Design', icon: Palette, count: '890', color: 'pink' },
  { name: 'Marketing', icon: LineChart, count: '1.1K', color: 'orange' },
  { name: 'Finance', icon: Wallet, count: '760', color: 'emerald' },
  { name: 'Sales', icon: Handshake, count: '1.5K', color: 'indigo' },
  { name: 'Product', icon: Box, count: '430', color: 'amber' },
  { name: 'Operations', icon: Truck, count: '680', color: 'slate' },
  { name: 'Data Science', icon: FlaskConical, count: '920', color: 'violet' },
];

const features = [
  {
    icon: Zap,
    title: 'Smart Matching',
    desc: 'AI-powered job recommendations based on your skills and experience.',
    color: 'amber'
  },
  {
    icon: Bell,
    title: 'Real-time Alerts',
    desc: 'Instant notifications for new jobs, application updates, and interviews.',
    color: 'blue'
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    desc: 'Track your application pipeline and optimize your job search strategy.',
    color: 'emerald'
  },
  {
    icon: ShieldCheck,
    title: 'Verified Companies',
    desc: 'All recruiters are manually vetted and approved for your safety.',
    color: 'violet'
  },
];

export default function Home() {
  const { isLoggedIn } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.search.includes('code=') || location.search.includes('token=')) {
      navigate(`/login${location.search}`, { replace: true });
    }
  }, [location.search, navigate]);

  return (
    <div className="flex flex-col overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-fit lg:min-h-[90vh] flex items-center pt-36 pb-20 lg:pt-44 lg:pb-32">
        {/* Background Mesh Gradients */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-[120px] animate-pulse delay-700"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col gap-10 sm:gap-12 text-center lg:text-left animate-in fade-in slide-in-from-left-8 duration-1000">
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 shadow-sm w-fit mx-auto lg:mx-0 mt-8 sm:mt-0">
                <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-ping"></span>
                <span className="text-[10px] sm:text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">✦ Now Hiring: 12,000+ jobs updated today</span>
              </div>
              
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1] sm:leading-[1.1]">
                Find Your Dream<br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600"> Career Path</span>
              </h1>
              
              <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                HireConnect bridges exceptional talent with world-class companies. 
                Discover roles that match your ambition, not just your résumé.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 w-full">
                {isLoggedIn ? (
                  <>
                    <Link to="/jobs" className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center space-x-2 group">
                      <span>Browse Jobs</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link to="/dashboard" className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-center">
                      My Dashboard
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/register" className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center space-x-2 group">
                      <span>Get Started Free</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link to="/jobs" className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-center">
                      Explore Jobs
                    </Link>
                  </>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-8 border-t border-slate-100 dark:border-slate-800">
                {stats.map((s) => (
                  <div key={s.label} className="space-y-1">
                    <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{s.value}</p>
                    <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-500 uppercase tracking-widest">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Decoration - Visible on Desktop */}
            <div className="hidden xl:block relative animate-in fade-in zoom-in-95 duration-1000 delay-200">
              <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl bg-opacity-80 dark:bg-opacity-80">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                  </div>
                  <div className="h-6 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Candidate Pipeline</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className={`p-4 rounded-2xl border flex items-center justify-between transition-all hover:scale-[1.02] cursor-default ${
                      i === 1 
                        ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30' 
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${
                          i === 1 ? 'bg-blue-600' : i === 2 ? 'bg-emerald-500' : 'bg-violet-500'
                        }`}>
                          {i === 1 ? 'TC' : i === 2 ? 'MS' : 'GO'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {i === 1 ? 'TechCorp Inc.' : i === 2 ? 'MegaSoft' : 'GlobalOrg'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {i === 1 ? 'Frontend Developer' : i === 2 ? 'Product Designer' : 'Data Scientist'}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                        i === 1 
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' 
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500'
                      }`}>
                        {i === 1 ? 'INTERVIEWING' : 'PENDING'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Decorative Floating Elements */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-blue-600 to-violet-600 rounded-2xl shadow-xl flex items-center justify-center text-white animate-bounce-slow">
                <Search className="w-10 h-10" />
              </div>
              <div className="absolute -bottom-10 -left-10 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl flex items-center space-x-4 animate-float">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Offer Received</p>
                  <p className="text-xs text-slate-500">2 minutes ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-white dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 space-y-4 md:space-y-0 text-center md:text-left">
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Browse by Category</h2>
              <p className="text-lg text-slate-500 dark:text-slate-400">Find roles in your area of expertise</p>
            </div>
            <Link to="/jobs" className="text-blue-600 font-bold hover:underline flex items-center justify-center md:justify-start space-x-1">
              <span>View all categories</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                to={`/jobs?category=${encodeURIComponent(cat.name)}`}
                className="group p-6 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl hover:shadow-blue-600/5 hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-14 h-14 rounded-2xl mb-6 flex items-center justify-center transition-transform group-hover:scale-110 duration-300 ${
                  cat.color === 'blue' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' :
                  cat.color === 'pink' ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/30' :
                  cat.color === 'orange' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30' :
                  cat.color === 'emerald' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' :
                  cat.color === 'indigo' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30' :
                  cat.color === 'amber' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30' :
                  cat.color === 'slate' ? 'bg-slate-200 text-slate-600 dark:bg-slate-800' :
                  'bg-violet-100 text-violet-600 dark:bg-violet-900/30'
                }`}>
                  <cat.icon className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{cat.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{cat.count} open roles</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-64 h-64 bg-violet-500/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Everything You Need</h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">Land your next role with confidence using our powerful suite of career tools.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f) => (
              <div key={f.title} className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-300">
                <div className={`w-12 h-12 rounded-xl mb-6 flex items-center justify-center ${
                  f.color === 'amber' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                  f.color === 'blue' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                  f.color === 'emerald' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                  'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400'
                }`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{f.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative p-10 lg:p-16 rounded-[40px] bg-slate-900 dark:bg-blue-600 overflow-hidden text-center lg:text-left">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-600/20 to-transparent pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-violet-500/30 rounded-full blur-[80px] -mr-32 -mb-32"></div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">Ready to make<br />your next move?</h2>
                <p className="text-lg text-blue-100 font-medium">Join thousands of professionals already growing their careers on HireConnect.</p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-end gap-4">
                {!isLoggedIn && (
                  <>
                    <Link to="/register" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 font-bold rounded-2xl hover:bg-blue-50 transition-all shadow-xl shadow-black/20">
                      Create Free Account
                    </Link>
                    <Link to="/recruiter-apply" className="w-full sm:w-auto px-8 py-4 bg-transparent text-white border border-white/20 hover:bg-white/10 font-bold rounded-2xl transition-all">
                      Post a Job
                    </Link>
                  </>
                )}
                {isLoggedIn && (
                  <Link to="/jobs" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 font-bold rounded-2xl hover:bg-blue-50 transition-all shadow-xl shadow-black/20">
                    Find Your Next Role
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Footer */}
      <footer className="py-16 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2 space-y-6">
              <Link to="/" className="flex items-center space-x-2 group w-fit">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform">
                  HC
                </div>
                <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  HireConnect
                </span>
              </Link>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed font-medium">
                Connecting talent with opportunity through smart matching and a verified network of world-class companies.
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-6">Platform</h4>
              <ul className="space-y-4">
                <li><Link to="/jobs" className="text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors font-medium">Browse Jobs</Link></li>
                <li><Link to="/register" className="text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors font-medium">Sign Up</Link></li>
                <li><Link to="/login" className="text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors font-medium">Sign In</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-6">For Recruiters</h4>
              <ul className="space-y-4">
                <li><Link to="/recruiter-apply" className="text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors font-medium">Apply as Recruiter</Link></li>
                <li><Link to="/subscription" className="text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors font-medium">Pricing Plans</Link></li>
                <li><Link to="/dashboard" className="text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors font-medium">Post a Job</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 dark:border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-500 dark:text-slate-500 font-medium tracking-tight">© 2026 HireConnect Inc. All rights reserved.</p>
            <div className="flex space-x-6">
              <a href="#" className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Twitter</a>
              <a href="#" className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">LinkedIn</a>
              <a href="#" className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
