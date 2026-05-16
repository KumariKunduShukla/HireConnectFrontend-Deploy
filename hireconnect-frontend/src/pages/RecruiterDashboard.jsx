import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobAPI, applicationAPI, interviewAPI, normalizeResumeLink } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../utils/errorMessage';
import { 
  Plus, 
  Briefcase, 
  Users, 
  Search, 
  Calendar, 
  ChevronRight, 
  MapPin, 
  Building2, 
  Clock, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  ExternalLink,
  FileText,
  Video,
  Map,
  MessageSquare,
  ArrowLeft,
  X,
  CreditCard,
  Zap,
  LayoutDashboard
} from 'lucide-react';

const STATUS_OPTIONS = ['Applied', 'Shortlisted', 'Interview Scheduled', 'Offered', 'Accepted', 'Joined', 'Rejected'];

const STATUS_COLORS = {
  Applied: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Shortlisted: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'Interview Scheduled': 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  Offered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Accepted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Joined: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
};

export default function RecruiterDashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [candidateNames, setCandidateNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showScheduleFor, setShowScheduleFor] = useState(null);
  const [scheduling, setScheduling] = useState(false);
  const [interviewsByApp, setInterviewsByApp] = useState({});
  const [loadingInterviews, setLoadingInterviews] = useState({});
  const [expandedInterviews, setExpandedInterviews] = useState({});
  const [rescheduleTimes, setRescheduleTimes] = useState({});
  const [scheduleForm, setScheduleForm] = useState({
    scheduledAt: '',
    mode: 'ONLINE',
    meetLink: '',
    location: '',
    notes: '',
  });
  const [jobForm, setJobForm] = useState({
    title: '', company: '', category: '', type: '', location: '', description: '',
    salaryMin: '', salaryMax: '', experienceRequired: '', skills: '',
    postedBy: user?.profileId || user?.userId || 1,
  });
  const [saving, setSaving] = useState(false);

  const recruiterId = user?.profileId || user?.userId || 1;

  useEffect(() => {
    jobAPI.getAllJobs()
      .then(r => {
        const mine = (r.data || []).filter(j => Number(j.postedBy) === Number(recruiterId));
        setJobs(mine);
        if (mine.length > 0) {
          loadApplications(mine[0].jobId);
        }
      })
      .catch(() => toast.error('Failed to load jobs'))
      .finally(() => setLoading(false));
  }, [recruiterId]);

  const loadApplications = async (jobId) => {
    setSelectedJob(jobId);
    setLoading(true);
    try {
      const res = await applicationAPI.getByJob(jobId);
      const apps = res.data || [];
      setApplications(apps);
      
      const uniqueCids = [...new Set(apps.map(a => Number(a.candidateId || a.candidate_id)))].filter(id => !Number.isNaN(id) && id > 0);
      uniqueCids.forEach(cid => {
         import('../api').then(m => m.profileAPI.getProfileById(cid))
           .then(pRes => {
              const name = pRes.data?.fullName || pRes.data?.name || pRes.data?.email;
              if (name) {
                 setCandidateNames(prev => ({ ...prev, [cid]: name }));
              }
           })
           .catch(() => {});
      });
    } catch {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...jobForm,
        salaryMin: parseFloat(jobForm.salaryMin) || 0,
        salaryMax: parseFloat(jobForm.salaryMax) || 0,
        experienceRequired: parseInt(jobForm.experienceRequired) || 0,
        skills: jobForm.skills.split(',').map(s => s.trim()).filter(Boolean),
        postedBy: recruiterId,
      };
      const res = await jobAPI.addJob(payload);
      setJobs(prev => [res.data, ...prev]);
      toast.success('Job posted successfully! 🎉');
      setShowJobModal(false);
      setJobForm({ title: '', company: '', category: '', type: '', location: '', description: '', salaryMin: '', salaryMax: '', experienceRequired: '', skills: '', postedBy: recruiterId });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to post job'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteJob = async (id) => {
    if (!window.confirm('Delete this job?')) return;
    try {
      await jobAPI.deleteJob(id);
      setJobs(prev => prev.filter(j => j.jobId !== id));
      if (selectedJob === id) { setSelectedJob(null); setApplications([]); }
      toast.success('Job deleted');
    } catch {
      toast.error('Failed to delete job');
    }
  };

  const handleStatusChange = async (appId, status) => {
    try {
      await applicationAPI.updateStatus(appId, status);
      setApplications(prev => prev.map(a => a.applicationId === appId ? { ...a, status } : a));
      toast.success(`Status updated to ${status}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleScheduleInterview = async (app) => {
    if (!scheduleForm.scheduledAt) {
      toast.error('Please select date and time for interview');
      return;
    }

    setScheduling(true);
    try {
      await interviewAPI.schedule({
        applicationId: app.applicationId,
        scheduledAt: scheduleForm.scheduledAt,
        mode: scheduleForm.mode,
        meetLink: scheduleForm.mode === 'ONLINE' ? scheduleForm.meetLink : '',
        location: scheduleForm.mode === 'OFFLINE' ? scheduleForm.location : '',
        notes: scheduleForm.notes,
      });

      await applicationAPI.updateStatus(app.applicationId, 'Interview Scheduled');
      setApplications(prev => prev.map(a => a.applicationId === app.applicationId ? { ...a, status: 'Interview Scheduled' } : a));
      toast.success('Interview scheduled successfully');
      setShowScheduleFor(null);
      setScheduleForm({ scheduledAt: '', mode: 'ONLINE', meetLink: '', location: '', notes: '' });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to schedule interview'));
    } finally {
      setScheduling(false);
    }
  };

  const loadInterviews = async (appId) => {
    setLoadingInterviews(prev => ({ ...prev, [appId]: true }));
    try {
      const res = await interviewAPI.getByApplication(appId);
      setInterviewsByApp(prev => ({ ...prev, [appId]: res.data || [] }));
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load interviews'));
    } finally {
      setLoadingInterviews(prev => ({ ...prev, [appId]: false }));
    }
  };

  const toggleInterviews = (appId) => {
    setExpandedInterviews(prev => {
      const next = !prev[appId];
      if (next && !interviewsByApp[appId]) {
        loadInterviews(appId);
      }
      return { ...prev, [appId]: next };
    });
  };

  if (loading && jobs.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Synchronizing your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Recruiter Command</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Manage your hiring pipeline and talent network.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/subscription" className="flex items-center justify-center space-x-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold rounded-2xl shadow-sm hover:bg-slate-50 transition-all">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <span>Plan: Premium</span>
          </Link>
          <button 
            onClick={() => setShowJobModal(true)}
            className="flex items-center justify-center space-x-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/20 transition-all group"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            <span>Post New Job</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left: Job List */}
        <div className="lg:col-span-1 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" /> Active Postings
            </h2>
            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold rounded-md uppercase tracking-wider">{jobs.length} jobs</span>
          </div>

          {jobs.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-[40px] p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-[30px] flex items-center justify-center mx-auto text-slate-300">
                <Briefcase className="w-8 h-8" />
              </div>
              <p className="text-slate-500 font-bold text-sm">No jobs posted yet</p>
              <button onClick={() => setShowJobModal(true)} className="text-blue-600 font-bold text-sm hover:underline">Create your first listing →</button>
            </div>
          ) : (
            <div className="space-y-4 max-h-[700px] overflow-y-auto no-scrollbar pr-1">
              {jobs.map(job => (
                <div 
                  key={job.jobId}
                  onClick={() => loadApplications(job.jobId)}
                  className={`group relative p-6 rounded-[32px] border cursor-pointer transition-all duration-300 ${
                    selectedJob === job.jobId 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-600/20' 
                      : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-blue-500/50 hover:shadow-lg'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <h3 className={`font-bold text-lg leading-tight truncate pr-4 ${selectedJob === job.jobId ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                        {job.title}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-widest ${
                        selectedJob === job.jobId ? 'bg-white/20 text-white' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600'
                      }`}>
                        {job.status}
                      </span>
                    </div>
                    
                    <div className={`flex items-center text-xs font-medium space-x-3 ${selectedJob === job.jobId ? 'text-white/80' : 'text-slate-400'}`}>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location || 'Remote'}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {job.type}</span>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex gap-2">
                        <Link to={`/jobs/${job.jobId}`} className={`p-2 rounded-xl transition-all ${selectedJob === job.jobId ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-blue-600'}`}>
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteJob(job.jobId); }} className={`p-2 rounded-xl transition-all ${selectedJob === job.jobId ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-600'}`}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <ChevronRight className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${selectedJob === job.jobId ? 'text-white' : 'text-slate-300'}`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Applications Panel */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedJob ? (
            <div className="h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[40px] p-20 flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-[40px] flex items-center justify-center shadow-lg shadow-blue-600/5">
                <Users className="w-12 h-12" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">Select a posting</h3>
                <p className="text-slate-500 font-medium max-w-sm">Pick a job from the left to manage applicants and schedule interviews.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <LayoutDashboard className="w-5 h-5 text-blue-600" /> Application Pipeline
                </h2>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-bold rounded-full">{applications.length} TOTAL</span>
                </div>
              </div>

              {applications.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-[40px] p-20 text-center space-y-4">
                  <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-[30px] flex items-center justify-center mx-auto text-slate-300">
                    <Search className="w-10 h-10" />
                  </div>
                  <p className="text-slate-500 font-bold">No applications yet for this role.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {applications.map(app => (
                    <div key={app.applicationId} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[40px] p-8 shadow-sm hover:shadow-xl transition-all duration-300 space-y-8">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center space-x-5">
                          <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-[22px] flex items-center justify-center text-slate-500 font-extrabold text-2xl">
                            {(candidateNames[app.candidateId]?.[0] || 'C').toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-xl">
                              {candidateNames[app.candidateId] || `Candidate #${app.candidateId}`}
                            </h3>
                            <p className="text-sm text-slate-500 font-medium">Applied on {app.appliedAt}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <select 
                              value={app.status}
                              onChange={e => handleStatusChange(app.applicationId, e.target.value)}
                              className={`pl-4 pr-10 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider appearance-none cursor-pointer outline-none border-none shadow-sm ${STATUS_COLORS[app.status] || 'bg-slate-100 text-slate-600'}`}
                            >
                              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rotate-90 pointer-events-none opacity-50" />
                          </div>
                        </div>
                      </div>

                      {app.coverLetter && (
                        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[28px] border border-slate-100 dark:border-slate-800">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center"><MessageSquare className="w-3.5 h-3.5 mr-2" /> Candidate Note</p>
                          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{app.coverLetter}</p>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-4 pt-2">
                        {app.resumeUrl && (
                          <a 
                            href={normalizeResumeLink(app.resumeUrl)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-2xl transition-all shadow-lg"
                          >
                            <FileText className="w-4 h-4" />
                            <span>Review Resume</span>
                          </a>
                        )}
                        <button 
                          onClick={() => setShowScheduleFor(showScheduleFor === app.applicationId ? null : app.applicationId)}
                          className={`flex items-center space-x-2 px-6 py-3 font-bold rounded-2xl transition-all border ${
                            showScheduleFor === app.applicationId 
                              ? 'bg-rose-50 border-rose-100 text-rose-600' 
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white hover:bg-slate-50'
                          }`}
                        >
                          <Calendar className="w-4 h-4" />
                          <span>{showScheduleFor === app.applicationId ? 'Cancel' : 'Schedule Interview'}</span>
                        </button>
                        <button 
                          onClick={() => toggleInterviews(app.applicationId)}
                          className="flex items-center space-x-2 px-6 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 font-bold rounded-2xl transition-all hover:bg-blue-100"
                        >
                          <Video className="w-4 h-4" />
                          <span>{expandedInterviews[app.applicationId] ? 'Hide Details' : 'Interview History'}</span>
                        </button>
                      </div>

                      {/* Scheduling Form */}
                      {showScheduleFor === app.applicationId && (
                        <div className="mt-8 p-8 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-[32px] animate-in slide-in-from-top-4 duration-500">
                          <h4 className="text-lg font-bold text-blue-900 dark:text-blue-400 mb-6 flex items-center gap-2">
                            <Zap className="w-5 h-5" /> Quick Schedule
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-blue-700/60 uppercase tracking-widest ml-1">Date & Time</label>
                              <input 
                                type="datetime-local"
                                className="w-full px-5 py-3.5 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white font-medium"
                                value={scheduleForm.scheduledAt}
                                onChange={e => setScheduleForm({ ...scheduleForm, scheduledAt: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-blue-700/60 uppercase tracking-widest ml-1">Interview Mode</label>
                              <select 
                                className="w-full px-5 py-3.5 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white font-bold"
                                value={scheduleForm.mode}
                                onChange={e => setScheduleForm({ ...scheduleForm, mode: e.target.value })}
                              >
                                <option value="ONLINE">Video Conference (Online)</option>
                                <option value="OFFLINE">In-Person (Office)</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-6">
                            {scheduleForm.mode === 'ONLINE' ? (
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold text-blue-700/60 uppercase tracking-widest ml-1">Meeting Link</label>
                                <div className="relative">
                                  <Video className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                  <input 
                                    type="url"
                                    placeholder="https://meet.google.com/..."
                                    className="w-full pl-12 pr-5 py-3.5 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white font-medium"
                                    value={scheduleForm.meetLink}
                                    onChange={e => setScheduleForm({ ...scheduleForm, meetLink: e.target.value })}
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold text-blue-700/60 uppercase tracking-widest ml-1">Office Location</label>
                                <div className="relative">
                                  <Map className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                  <input 
                                    type="text"
                                    placeholder="Full office address"
                                    className="w-full pl-12 pr-5 py-3.5 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white font-medium"
                                    value={scheduleForm.location}
                                    onChange={e => setScheduleForm({ ...scheduleForm, location: e.target.value })}
                                  />
                                </div>
                              </div>
                            )}

                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-blue-700/60 uppercase tracking-widest ml-1">Interviewer Notes</label>
                              <textarea 
                                rows={3}
                                placeholder="Preparation instructions or agenda..."
                                className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white font-medium"
                                value={scheduleForm.notes}
                                onChange={e => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                              />
                            </div>

                            <button 
                              onClick={() => handleScheduleInterview(app)}
                              disabled={scheduling}
                              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center space-x-2"
                            >
                              {scheduling ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <span>Send Interview Invitation</span>}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Interview History */}
                      {expandedInterviews[app.applicationId] && (
                        <div className="mt-8 space-y-4 animate-in fade-in duration-500">
                          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-2">Interview History</h4>
                          {loadingInterviews[app.applicationId] ? (
                            <div className="p-10 text-center animate-pulse">Checking records...</div>
                          ) : (interviewsByApp[app.applicationId] || []).length === 0 ? (
                            <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-3xl text-center text-slate-400 text-sm font-bold italic">No sessions found</div>
                          ) : (
                            (interviewsByApp[app.applicationId] || []).map(interview => (
                              <div key={interview.interviewId} className="p-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-center space-x-4">
                                  <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                                    {interview.mode === 'ONLINE' ? <Video className="w-6 h-6" /> : <MapPin className="w-6 h-6" />}
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-900 dark:text-white">{interview.scheduledAt}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{interview.mode} • ID: #{interview.interviewId}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold uppercase tracking-wider">{interview.status}</span>
                                  {interview.status === 'SCHEDULED' && (
                                    <button onClick={() => interviewAPI.cancel(interview.interviewId).then(() => loadInterviews(app.applicationId))} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Post Job Modal */}
      {showJobModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowJobModal(false)}></div>
          <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
            <div className="p-8 sm:p-10 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
              <div className="space-y-1">
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Create Listing</h2>
                <p className="text-sm text-slate-500 font-medium italic">Reach the top 1% of talent across India</p>
              </div>
              <button onClick={() => setShowJobModal(false)} className="p-3 bg-white dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handlePostJob} className="p-8 sm:p-10 max-h-[70vh] overflow-y-auto no-scrollbar space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Position Title *</label>
                  <input className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white font-bold" value={jobForm.title} onChange={e => setJobForm({ ...jobForm, title: e.target.value })} placeholder="e.g. Lead System Architect" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Company Name *</label>
                  <input className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white font-bold" value={jobForm.company} onChange={e => setJobForm({ ...jobForm, company: e.target.value })} placeholder="Your company name" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Industry Sector</label>
                  <select className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white font-bold cursor-pointer" value={jobForm.category} onChange={e => setJobForm({ ...jobForm, category: e.target.value })}>
                    <option value="">Select industry</option>
                    {['Engineering', 'Design', 'Marketing', 'Finance', 'Sales', 'Product', 'Operations', 'Data Science'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Employment Type</label>
                  <select className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white font-bold cursor-pointer" value={jobForm.type} onChange={e => setJobForm({ ...jobForm, type: e.target.value })}>
                    <option value="">Select type</option>
                    {['Full-time', 'Part-time', 'Remote', 'Contract', 'Internship'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Role Description *</label>
                <textarea rows={5} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white font-medium" value={jobForm.description} onChange={e => setJobForm({ ...jobForm, description: e.target.value })} placeholder="What makes this role unique? Define mission and expectations..." required />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Budget Min (₹)</label>
                  <input type="number" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none dark:text-white font-bold" value={jobForm.salaryMin} onChange={e => setJobForm({ ...jobForm, salaryMin: e.target.value })} placeholder="600000" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Budget Max (₹)</label>
                  <input type="number" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none dark:text-white font-bold" value={jobForm.salaryMax} onChange={e => setJobForm({ ...jobForm, salaryMax: e.target.value })} placeholder="1500000" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Min. Exp (Years)</label>
                  <input type="number" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none dark:text-white font-bold" value={jobForm.experienceRequired} onChange={e => setJobForm({ ...jobForm, experienceRequired: e.target.value })} placeholder="3" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Core Tech Stack (Comma separated)</label>
                <div className="relative">
                  <Code className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white font-medium" value={jobForm.skills} onChange={e => setJobForm({ ...jobForm, skills: e.target.value })} placeholder="React, Node.js, GraphQL, PostgreSQL" />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowJobModal(false)} className="w-full sm:w-auto px-8 py-4 text-slate-500 font-bold hover:text-slate-900 transition-all">Cancel</button>
                <button type="submit" disabled={saving} className="w-full sm:w-auto px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center space-x-2">
                  {saving ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <span>Publish Job Listing</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
