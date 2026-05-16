import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI, applicationAPI, jobAPI, notificationAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../utils/errorMessage';
import ProfileCompleteness from '../components/ProfileCompleteness';
import { 
  LayoutDashboard, 
  Briefcase, 
  Star, 
  Calendar, 
  PartyPopper, 
  Bell, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowUpRight,
  ShieldCheck,
  Users,
  Building2,
  FileText,
  CreditCard,
  RefreshCcw,
  Search,
  ExternalLink,
  ChevronRight,
  Trash2
} from 'lucide-react';

const STATUS_ICONS = {
  Applied: Clock,
  Shortlisted: Star,
  'Interview Scheduled': Calendar,
  Offered: PartyPopper,
  Accepted: CheckCircle2,
  Joined: ShieldCheck,
  Rejected: XCircle,
  Withdrawn: XCircle,
};

const STATUS_COLORS = {
  Applied: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
  Shortlisted: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
  'Interview Scheduled': 'text-violet-500 bg-violet-50 dark:bg-violet-900/20',
  Offered: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
  Accepted: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
  Joined: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
  Rejected: 'text-rose-500 bg-rose-50 dark:bg-rose-900/20',
  Withdrawn: 'text-slate-500 bg-slate-50 dark:bg-slate-900/20',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [pendingRecruiters, setPendingRecruiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [jobsById, setJobsById] = useState({});
  const [userName, setUserName] = useState('');
  const [userProfile, setUserProfile] = useState(null);

  const authUserId = user?.userId != null ? Number(user.userId) : null;
  const profilePk =
    user?.profileId != null
      ? Number(user.profileId)
      : user?.id != null
        ? Number(user.id)
        : user?.candidateId != null
          ? Number(user.candidateId)
          : null;
  const isAdmin = String(user?.role || '').toUpperCase() === 'ADMIN';

  const [allCandidates, setAllCandidates] = useState([]);
  const [allRecruiters, setAllRecruiters] = useState([]);
  const [allSubscriptions, setAllSubscriptions] = useState([]);
  const [allJobs, setAllJobs] = useState([]);
  const [allApps, setAllApps] = useState([]);
  const [adminTab, setAdminTab] = useState('approvals');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (isAdmin) {
          const [p, c, r, s, j, a] = await Promise.all([
            adminAPI.getPendingRecruiters().catch(() => ({ data: [] })),
            adminAPI.getAllUsers('CANDIDATE').catch(() => ({ data: [] })),
            adminAPI.getAllUsers('RECRUITER').catch(() => ({ data: [] })),
            import('../api').then(m => m.subscriptionAPI.getAll()).catch(() => ({ data: [] })),
            jobAPI.getAllJobs().catch(() => ({ data: [] })),
            applicationAPI.getAll().catch(() => ({ data: [] }))
          ]);
          setPendingRecruiters(Array.isArray(p.data) ? p.data : []);
          setAllCandidates(Array.isArray(c.data) ? c.data : []);
          setAllRecruiters((Array.isArray(r.data) ? r.data : []).filter(x => x.status !== 'PENDING_APPROVAL'));
          setAllSubscriptions(Array.isArray(s.data) ? s.data : []);
          setAllJobs(Array.isArray(j.data) ? j.data : []);
          setAllApps(Array.isArray(a.data) ? a.data : []);
          return;
        }

        const candidateIds = [...new Set([authUserId, profilePk].filter(x => x != null && !Number.isNaN(x)))];
        const appsPromise = candidateIds.length === 0 ? Promise.resolve([]) : 
          Promise.all(candidateIds.map(cid => applicationAPI.getByCandidate(cid).catch(() => ({ data: [] }))))
          .then(responses => {
            const merged = new Map();
            responses.forEach(r => {
              (r.data || []).forEach(a => merged.set(a.applicationId ?? `${a.candidateId}-${a.jobId}`, a));
            });
            return [...merged.values()].sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
          });

        const [appsList, jobsRes, notifsRes] = await Promise.all([
          appsPromise,
          jobAPI.getAllJobs().catch(() => ({ data: [] })),
          notificationAPI.getByUser(user?.profileId || user?.userId || user?.id).catch(() => ({ data: [] }))
        ]);

        setApplications(appsList);
        const lookup = {};
        (jobsRes.data || []).forEach(j => { lookup[j.jobId] = j; });
        setJobsById(lookup);
        setNotifications((notifsRes.data || []).sort((a, b) => (b.id || b.notificationId) - (a.id || a.notificationId)));

        try {
          const profileRes = await import('../api').then(m => m.profileAPI.getMyProfile());
          const prof = profileRes?.data || null;
          setUserProfile(prof);
          if (prof?.fullName || prof?.name) setUserName(prof.fullName || prof.name);
        } catch {}

      } catch (err) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [isAdmin, authUserId, profilePk, user?.profileId, user?.userId, user?.id]);

  const markRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications(prev => prev.map(n => (n.id === id || n.notificationId === id) ? { ...n, read: true } : n));
    } catch {}
  };

  const withdrawApp = async (id) => {
    if (!window.confirm('Are you sure you want to withdraw this application?')) return;
    try {
      await applicationAPI.withdrawApplication(id);
      setApplications(prev => prev.filter(a => a.applicationId !== id));
      toast.success('Application withdrawn successfully');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to withdraw'));
    }
  };

  const decideRecruiter = async (recruiter, decision) => {
    const rid = recruiter.profileId || recruiter.recruiterId || recruiter.id || recruiter.userId;
    setActionId(`${decision}-${rid}`);
    try {
      if (decision === 'approve') {
        await adminAPI.approveRecruiter(rid);
        toast.success('Recruiter approved successfully');
      } else {
        await adminAPI.rejectRecruiter(rid);
        toast.success('Recruiter application rejected');
      }
      setPendingRecruiters(prev => prev.filter(r => (r.profileId || r.recruiterId || r.id || r.userId) !== rid));
    } catch (err) {
      toast.error(getErrorMessage(err, `Failed to ${decision} recruiter`));
    } finally {
      setActionId(null);
    }
  };

  const candidateStats = [
    { label: 'Applied', value: applications.length, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Shortlisted', value: applications.filter(a => a.status === 'Shortlisted').length, icon: Star, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Interviews', value: applications.filter(a => a.status === 'Interview Scheduled').length, icon: Calendar, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20' },
    { label: 'Offers', value: applications.filter(a => ['Offered', 'Accepted', 'Joined'].includes(a.status)).length, icon: PartyPopper, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  ];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-8 animate-pulse">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div className="h-12 w-64 bg-slate-100 dark:bg-slate-800 rounded-2xl"></div>
          <div className="h-12 w-48 bg-slate-100 dark:bg-slate-800 rounded-2xl"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-50 dark:bg-slate-900 rounded-[32px]"></div>)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-[600px] bg-slate-50 dark:bg-slate-900 rounded-[32px]"></div>
          <div className="h-[400px] bg-slate-50 dark:bg-slate-900 rounded-[32px]"></div>
        </div>
      </div>
    );
  }

  if (isAdmin) {
    const adminStats = [
      { label: 'Pending', value: pendingRecruiters.length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
      { label: 'Candidates', value: allCandidates.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
      { label: 'Recruiters', value: allRecruiters.length, icon: Building2, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20' },
      { label: 'Active Jobs', value: allJobs.length, icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    ];

    return (
      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12 space-y-10 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <ShieldCheck className="w-10 h-10 text-blue-600" /> Admin Command Center
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">System-wide monitoring and governance portal.</p>
          </div>
          <button onClick={() => window.location.reload()} className="flex items-center justify-center space-x-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold rounded-2xl shadow-sm hover:bg-slate-50 transition-all">
            <RefreshCcw className="w-5 h-5" />
            <span>Refresh System Data</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {adminStats.map(s => (
            <div key={s.label} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-6 shadow-sm hover:shadow-md transition-all group">
              <div className={`w-12 h-12 rounded-2xl ${s.bg} ${s.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <s.icon className="w-6 h-6" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white mb-1">{s.value}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[40px] overflow-hidden shadow-sm">
          <div className="flex border-b border-slate-100 dark:border-slate-800 overflow-x-auto no-scrollbar">
            {[
              { id: 'approvals', label: 'Pending', icon: Clock },
              { id: 'recruiters', label: 'Recruiters', icon: Building2 },
              { id: 'candidates', label: 'Candidates', icon: Users },
              { id: 'jobs', label: 'Jobs', icon: Briefcase },
              { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setAdminTab(tab.id)}
                className={`flex items-center space-x-2 px-8 py-5 text-sm font-bold transition-all whitespace-nowrap border-b-2 ${
                  adminTab === tab.id 
                    ? 'text-blue-600 border-blue-600 bg-blue-50/50 dark:bg-blue-900/10' 
                    : 'text-slate-500 border-transparent hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.id === 'approvals' && pendingRecruiters.length > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 bg-rose-500 text-white text-[10px] rounded-full">{pendingRecruiters.length}</span>
                )}
              </button>
            ))}
          </div>

          <div className="p-8">
            {adminTab === 'approvals' && (
              <div className="space-y-6">
                {pendingRecruiters.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-[32px] flex items-center justify-center">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <p className="text-slate-500 font-bold">Queue clear! All applications reviewed.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {pendingRecruiters.map(r => {
                      const rid = r.profileId || r.recruiterId || r.id || r.userId;
                      return (
                        <div key={rid} className="p-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-[32px] flex flex-col justify-between space-y-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight">{r.fullName || r.name || r.email}</h3>
                              <p className="text-sm text-slate-500 font-medium">{r.email}</p>
                              {r.companyName && <p className="text-xs font-bold text-blue-600 uppercase tracking-widest pt-2 flex items-center"><Building2 className="w-3 h-3 mr-1" /> {r.companyName}</p>}
                            </div>
                            <span className="px-2.5 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] font-bold rounded-lg uppercase">Pending</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <button 
                              disabled={!!actionId}
                              onClick={() => decideRecruiter(r, 'approve')}
                              className="py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all text-sm disabled:opacity-50"
                            >
                              {actionId === `approve-${rid}` ? '...' : 'Approve'}
                            </button>
                            <button 
                              disabled={!!actionId}
                              onClick={() => decideRecruiter(r, 'reject')}
                              className="py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-rose-600 font-bold rounded-2xl transition-all text-sm disabled:opacity-50"
                            >
                              {actionId === `reject-${rid}` ? '...' : 'Reject'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {(adminTab === 'recruiters' || adminTab === 'candidates') && (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                      <th className="pb-6 pl-4">Identity</th>
                      <th className="pb-6">Role</th>
                      <th className="pb-6">Joined</th>
                      <th className="pb-6 text-right pr-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {(adminTab === 'recruiters' ? allRecruiters : allCandidates).map(u => (
                      <tr key={u.userId} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-5 pl-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-xl flex items-center justify-center text-slate-500 font-bold">
                              {(u.email?.[0] || 'U').toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{u.email}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">ID: #{u.userId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-5">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            u.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="py-5 text-sm font-medium text-slate-500">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-5 text-right pr-4">
                          <button className="p-2 text-slate-400 hover:text-rose-600 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {adminTab === 'jobs' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                      <th className="pb-6 pl-4">Job Title</th>
                      <th className="pb-6">Company</th>
                      <th className="pb-6">Apps</th>
                      <th className="pb-6 text-right pr-4">Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {allJobs.map(j => {
                      const count = allApps.filter(a => a.jobId === j.jobId).length;
                      return (
                        <tr key={j.jobId} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-5 pl-4">
                            <div className="space-y-0.5">
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{j.title}</p>
                              <p className="text-[10px] font-bold text-slate-400">ROLE ID: #{j.jobId}</p>
                            </div>
                          </td>
                          <td className="py-5">
                            <span className="text-xs font-bold text-blue-600 uppercase flex items-center"><Building2 className="w-3 h-3 mr-1" /> {j.company}</span>
                          </td>
                          <td className="py-5">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] font-bold rounded-md">{count} APPS</span>
                          </td>
                          <td className="py-5 text-right pr-4">
                            <Link to={`/jobs/${j.jobId}`} className="p-2 text-slate-400 hover:text-blue-600 transition-colors inline-block">
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Candidate Dashboard
  const greeting = userName || (user?.email && !user.email.includes('@') ? user.email : user?.email?.split('@')[0]) || 'Friend';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12 space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Welcome back, <span className="text-blue-600">{greeting}</span> 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Your professional progress and opportunities at a glance.</p>
        </div>
        <Link to="/jobs" className="flex items-center justify-center space-x-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/20 transition-all group">
          <span>Find New Opportunities</span>
          <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {candidateStats.map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-6 shadow-sm hover:shadow-md transition-all group">
            <div className={`w-12 h-12 rounded-2xl ${s.bg} ${s.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <s.icon className="w-6 h-6" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white mb-1">{s.value}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Feed: Applications */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-blue-600" /> Active Applications
            </h2>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{applications.length} total</span>
          </div>

          {applications.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-[40px] p-16 text-center space-y-6">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-[30px] flex items-center justify-center mx-auto text-slate-300">
                <FileText className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">No applications yet</h3>
                <p className="text-slate-500 font-medium max-w-xs mx-auto">Start your journey by applying to your first job today.</p>
              </div>
              <Link to="/jobs" className="inline-block px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-2xl transition-all">
                Browse Jobs
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map(app => {
                const job = jobsById[app.jobId];
                const StatusIcon = STATUS_ICONS[app.status] || Clock;
                return (
                  <div key={app.applicationId} className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-300">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center space-x-5">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-violet-600 rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-blue-600/20">
                          {(job?.title?.[0] || 'J').toUpperCase()}
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight group-hover:text-blue-600 transition-colors">
                            {job?.title || 'Unknown Role'}
                          </h3>
                          <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm font-medium">
                            <span className="font-bold text-blue-600 dark:text-blue-400 mr-2">{job?.company || 'Company'}</span>
                            <span>• {app.appliedAt || 'Applied recently'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className={`px-4 py-2 rounded-2xl flex items-center space-x-2 font-bold text-xs uppercase tracking-wider ${STATUS_COLORS[app.status] || 'bg-slate-100 text-slate-600'}`}>
                          <StatusIcon className="w-4 h-4" />
                          <span>{app.status}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Link to={`/jobs/${app.jobId}`} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-blue-600 transition-colors">
                            <ExternalLink className="w-5 h-5" />
                          </Link>
                          {app.status === 'Applied' && (
                            <button 
                              onClick={() => withdrawApp(app.applicationId)}
                              className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-rose-600 transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar: Profile & Notifications */}
        <div className="space-y-8">
          <ProfileCompleteness profile={userProfile} role={user?.role} />

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-600" /> Notifications
              </h3>
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-full animate-pulse">
                  {notifications.filter(n => !n.read).length} NEW
                </span>
              )}
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto no-scrollbar pr-1">
              {notifications.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <p className="text-slate-400 font-bold text-sm">Quiet for now</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">Notifications will appear here</p>
                </div>
              ) : (
                notifications.map(n => {
                  const id = n.id || n.notificationId;
                  return (
                    <div 
                      key={id} 
                      onClick={() => !n.read && markRead(id)}
                      className={`p-4 rounded-[24px] border transition-all cursor-pointer group ${
                        !n.read 
                          ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30' 
                          : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-60 grayscale hover:grayscale-0 hover:opacity-100'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-widest ${
                          !n.read ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                        }`}>
                          {n.type}
                        </span>
                        {!n.read && <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping"></div>}
                      </div>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                        {n.message?.includes('|') ? n.message.split('|')[0] : n.message}
                      </p>
                      <div className="mt-3 flex items-center justify-end">
                        <ChevronRight className="w-3 h-3 text-slate-300 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
