import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { jobAPI, applicationAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../utils/errorMessage';
import { 
  Building2, 
  MapPin, 
  Clock, 
  Users, 
  ChevronLeft, 
  Briefcase, 
  Trophy, 
  Zap, 
  ArrowRight,
  ShieldCheck,
  Globe,
  DollarSign,
  FileText,
  Send,
  X,
  CheckCircle2,
  Calendar,
  Star,
  PartyPopper
} from 'lucide-react';

export default function JobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [appCount, setAppCount] = useState(0);
  const [appForm, setAppForm] = useState({ coverLetter: '', resumeUrl: '' });
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [myApplication, setMyApplication] = useState(null);
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const role = String(user?.role || '').replace(/^ROLE_/, '').toUpperCase();
  const isCandidate = role === 'CANDIDATE';

  const candidateId = user?.profileId ?? user?.id ?? user?.candidateId ?? user?.userId ?? null;
  const authUserId = user?.userId != null ? Number(user.userId) : null;
  const profilePk = user?.profileId != null ? Number(user.profileId) : user?.id != null ? Number(user.id) : user?.candidateId != null ? Number(user.candidateId) : null;

  useEffect(() => {
    jobAPI.getJobById(id)
      .then(r => setJob(r.data))
      .catch(() => toast.error('Job not found'))
      .finally(() => setLoading(false));

    applicationAPI.getApplicationCount(id)
      .then(r => setAppCount(r.data))
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!isLoggedIn || !isCandidate || !id) {
      setAlreadyApplied(false);
      return;
    }
    if ((authUserId == null || Number.isNaN(authUserId)) && (profilePk == null || Number.isNaN(profilePk))) {
      setAlreadyApplied(false);
      return;
    }
    let cancelled = false;
    applicationAPI.getByJob(Number(id))
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        const myApp = list.find((a) => {
          const cid = Number(a.candidateId ?? a.candidate_id);
          if (Number.isNaN(cid)) return false;
          const mine = (profilePk != null && !Number.isNaN(profilePk) && cid === profilePk) || (authUserId != null && !Number.isNaN(authUserId) && cid === authUserId);
          return mine && String(a.status || '').toLowerCase() !== 'withdrawn';
        });
        if (!cancelled) {
          setAlreadyApplied(!!myApp);
          setMyApplication(myApp || null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAlreadyApplied(false);
          setMyApplication(null);
        }
      });
    return () => { cancelled = true; };
  }, [id, isLoggedIn, isCandidate, authUserId, profilePk]);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) { navigate('/login'); return; }
    if (!isCandidate) { toast.error('Only candidates can apply.'); return; }
    if (!candidateId) { toast.error('Profile missing. Complete your profile.'); return; }

    setApplying(true);
    try {
      await applicationAPI.submitApplication({
        jobId: parseInt(id),
        candidateId,
        coverLetter: appForm.coverLetter,
        resumeUrl: appForm.resumeUrl,
      });
      toast.success('Application submitted successfully! 🎉');
      setShowApplyModal(false);
      setAlreadyApplied(true);
      setMyApplication({ status: 'Applied' });
      setAppCount((c) => c + 1);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to submit application'));
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 animate-pulse space-y-12">
        <div className="h-10 w-32 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-[40px]"></div>
            <div className="h-96 bg-slate-100 dark:bg-slate-800 rounded-[40px]"></div>
          </div>
          <div className="h-96 bg-slate-100 dark:bg-slate-800 rounded-[40px]"></div>
        </div>
      </div>
    );
  }

  if (!job) return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
      <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-[40px] flex items-center justify-center text-slate-300 mb-6">
        <Briefcase className="w-12 h-12" />
      </div>
      <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Job not found</h2>
      <Link to="/jobs" className="mt-6 px-8 py-3 bg-blue-600 text-white font-bold rounded-2xl">Back to All Jobs</Link>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12 animate-in fade-in duration-700">
      <Link to="/jobs" className="inline-flex items-center space-x-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors mb-8 group">
        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span>Back to Job Board</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-10">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[40px] p-8 sm:p-10 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl"></div>
            
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
              <div className="flex items-start space-x-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-violet-600 rounded-[28px] flex items-center justify-center text-white font-extrabold text-3xl shadow-xl shadow-blue-600/20">
                  {(job.title?.[0] || 'J').toUpperCase()}
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
                    {job.title}
                  </h1>
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-bold text-blue-600 flex items-center">
                      <Building2 className="w-5 h-5 mr-1.5" /> {job.company || 'InnovateCorp'}
                    </span>
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-bold rounded-lg uppercase tracking-wider flex items-center">
                      <ShieldCheck className="w-3 h-3 mr-1" /> Verified
                    </span>
                  </div>
                </div>
              </div>
              <div className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-[0.2em] border ${job.status === 'OPEN' ? 'text-emerald-600 border-emerald-100 bg-emerald-50 dark:bg-emerald-900/10 dark:border-emerald-900/30' : 'text-rose-600 border-rose-100 bg-rose-50'}`}>
                {job.status}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-12 pt-10 border-t border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Location</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center"><MapPin className="w-3.5 h-3.5 mr-1.5 text-blue-600" /> {job.location || 'Remote'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Job Type</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center"><Clock className="w-3.5 h-3.5 mr-1.5 text-blue-600" /> {job.type || 'Full-time'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Applicants</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center"><Users className="w-3.5 h-3.5 mr-1.5 text-blue-600" /> {appCount} active</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Posted</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center"><Calendar className="w-3.5 h-3.5 mr-1.5 text-blue-600" /> {job.postedAt || 'Recently'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[40px] p-8 sm:p-10 shadow-sm space-y-10">
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600" /> Mission & Description
              </h2>
              <div className="text-slate-600 dark:text-slate-300 leading-relaxed space-y-4 font-medium">
                {job.description?.split('\n').map((para, i) => (
                  <p key={i}>{para}</p>
                )) || 'Detailed description coming soon...'}
              </div>
            </section>

            {job.skills?.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-blue-600" /> Skill Requirements
                </h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map(skill => (
                    <span key={skill} className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 shadow-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-blue-600 dark:to-blue-700 rounded-[40px] p-8 text-white shadow-2xl shadow-slate-200/50 dark:shadow-blue-600/20">
            <div className="space-y-8">
              {job.salaryMin && job.salaryMax && (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-white/60 uppercase tracking-widest">Annual Compensation</p>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-4xl font-extrabold">₹{(job.salaryMin / 1000).toFixed(0)}K</span>
                    <span className="text-white/60 font-bold"> – </span>
                    <span className="text-4xl font-extrabold">₹{(job.salaryMax / 1000).toFixed(0)}K</span>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/10 rounded-2xl border border-white/10">
                  <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Experience</span>
                  <span className="font-bold">{job.experienceRequired || '0-1'}+ Years</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/10 rounded-2xl border border-white/10">
                  <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Category</span>
                  <span className="font-bold">{job.category || 'Tech'}</span>
                </div>
              </div>

              {job.status === 'OPEN' && isCandidate && alreadyApplied ? (
                <div className="space-y-6">
                  <div className="w-full py-4 bg-white/20 border border-white/20 text-white font-bold rounded-2xl text-center">
                    Successfully Applied
                  </div>
                  {myApplication && (
                    <div className="space-y-6 bg-black/10 p-6 rounded-3xl border border-white/5">
                      <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Pipeline Status</p>
                      <div className="space-y-4">
                        {['Applied', 'Shortlisted', 'Interview Scheduled', 'Offered'].map((step, idx, arr) => {
                          const statusOrder = ['Applied', 'Shortlisted', 'Interview Scheduled', 'Offered'];
                          const currentIdx = statusOrder.indexOf(myApplication.status);
                          const isCompleted = idx <= currentIdx;
                          const isActive = idx === currentIdx;
                          const StepIcon = [Clock, Star, Calendar, PartyPopper][idx];
                          
                          return (
                            <div key={step} className={`flex items-center space-x-4 ${isCompleted ? 'opacity-100' : 'opacity-30'}`}>
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-white text-blue-600 scale-110 shadow-lg' : isCompleted ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white'}`}>
                                <StepIcon className="w-5 h-5" />
                              </div>
                              <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-white/70'}`}>{step}</span>
                              {isActive && <div className="ml-auto w-2 h-2 bg-white rounded-full animate-ping"></div>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : job.status === 'OPEN' && isCandidate ? (
                <button
                  onClick={() => (isLoggedIn ? setShowApplyModal(true) : navigate('/login'))}
                  className="w-full py-5 bg-white text-blue-600 hover:bg-blue-50 font-extrabold rounded-2xl shadow-xl transition-all flex items-center justify-center space-x-2 group"
                >
                  <span>Apply for this role</span>
                  <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
              ) : (
                <div className="p-4 bg-white/10 rounded-2xl border border-white/10 text-center text-sm font-bold opacity-60">
                  {!isCandidate && isLoggedIn ? 'Recruiter account cannot apply' : 'Applications currently closed'}
                </div>
              )}
              
              {!isLoggedIn && (
                <p className="text-center text-xs font-bold text-white/40">
                  <Link to="/login" className="text-white hover:underline">Sign in</Link> to submit your application
                </p>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[40px] p-8 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" /> Share this Role
            </h3>
            <p className="text-xs text-slate-500 font-medium">Know someone perfect for this position? Share the link below.</p>
            <div className="flex items-center space-x-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800">
              <input readOnly value={window.location.href} className="flex-1 bg-transparent border-none text-[10px] font-bold text-slate-400 outline-none" />
              <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }} className="text-[10px] font-bold text-blue-600 hover:underline">COPY</button>
            </div>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowApplyModal(false)}></div>
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Apply for Role</h2>
                <p className="text-xs text-slate-500 font-medium">Applying to <span className="text-blue-600 font-bold">{job.title}</span></p>
              </div>
              <button onClick={() => setShowApplyModal(false)} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleApply} className="p-8 space-y-8">
              <div className="space-y-2 group">
                <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 ml-1 uppercase tracking-wider flex items-center">
                  <Globe className="w-3.5 h-3.5 mr-1.5" /> Resume URL
                </label>
                <input
                  type="url"
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white font-medium"
                  placeholder="https://drive.google.com/your-resume"
                  value={appForm.resumeUrl}
                  onChange={e => setAppForm({ ...appForm, resumeUrl: e.target.value })}
                  required
                />
                {!appForm.resumeUrl && user?.resumeUrl && (
                  <p className="text-[10px] text-blue-600 font-bold ml-1 italic">Suggested: Your profile resume link</p>
                )}
              </div>

              <div className="space-y-2 group">
                <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 ml-1 uppercase tracking-wider flex items-center">
                  <FileText className="w-3.5 h-3.5 mr-1.5" /> Cover Letter
                </label>
                <textarea
                  rows={5}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white font-medium"
                  placeholder="Why are you the perfect candidate for this role?"
                  value={appForm.coverLetter}
                  onChange={e => setAppForm({ ...appForm, coverLetter: e.target.value })}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={applying}
                className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-70 group"
              >
                {applying ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Submit Application</span>
                    <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
