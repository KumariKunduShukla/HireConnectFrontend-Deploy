import React, { useEffect, useMemo, useState } from 'react';
import { profileAPI, authAPI, getProfileResumeDownloadUrl } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Globe, 
  Code, 
  FileText, 
  Edit3, 
  Save, 
  X, 
  Shield, 
  Lock,
  ChevronRight,
  ExternalLink,
  Download
} from 'lucide-react';

const EMPTY_FORM = {
  fullName: '',
  phone: '',
  location: '',
  headline: '',
  bio: '',
  companyName: '',
  website: '',
  skills: '',
};

const normalizeRole = (role) => String(role || '').replace(/^ROLE_/, '').toUpperCase();

const getProfileId = (profile) =>
  profile?.profileId || profile?.id || profile?.candidateId || profile?.recruiterId || null;

const mapProfileToForm = (profile) => ({
  fullName: profile?.fullName || profile?.name || '',
  phone: profile?.phone || profile?.phoneNumber || '',
  location: profile?.location || '',
  headline: profile?.headline || profile?.title || '',
  bio: profile?.bio || profile?.about || '',
  companyName: profile?.companyName || profile?.company || '',
  website: profile?.website || '',
  skills: Array.isArray(profile?.skills) ? profile.skills.join(', ') : profile?.skills || '',
});

const buildPayload = (form, email, role, userId) => {
  const payload = {
    email,
    fullName: form.fullName,
    phone: form.phone,
    location: form.location,
    headline: form.headline,
    bio: form.bio,
    skills: form.skills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  };

  if (role === 'RECRUITER') {
    payload.companyName = form.companyName;
    payload.website = form.website;
  }

  if (userId) {
    payload.userId = userId;
  }

  return payload;
};

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);

  // Email change state
  const [emailStep, setEmailStep] = useState(0); // 0=none, 1=enter email, 2=enter otp
  const [newEmail, setNewEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  const role = useMemo(() => normalizeRole(user?.role) || 'CANDIDATE', [user?.role]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await profileAPI.getProfileByEmail(user.email);
        const found = res?.data || null;
        setProfile(found);
        if (found) {
          setForm((prev) => ({ ...prev, ...mapProfileToForm(found) }));
          updateUser({ ...user, ...found, profileId: getProfileId(found) });
          setIsEditing(false);
        } else {
          setForm((prev) => ({ ...prev, fullName: prev.fullName || localStorage.getItem('hc_fullName') || (user?.name !== user?.email ? user?.name : '') || '' }));
          setIsEditing(true);
        }
      } catch (_) {
        setForm((prev) => ({ ...prev, fullName: prev.fullName || localStorage.getItem('hc_fullName') || (user?.name !== user?.email ? user?.name : '') || '' }));
        setIsEditing(true);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user?.email, user?.name]);

  const onChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user?.email) {
      toast.error('Please sign in again before updating profile.');
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload(form, user.email, role, user?.userId || user?.id);
      const id = getProfileId(profile) || user?.profileId;
      let res;

      if (!id) {
        if (role === 'CANDIDATE') {
          if (!resumeFile) {
            toast.error('Please upload your resume before saving.');
            setSaving(false);
            return;
          }
          const formData = new FormData();
          formData.append('profile', JSON.stringify(payload));
          formData.append('resume', resumeFile);
          res = await profileAPI.createCandidateProfile(formData);
        } else {
          res = await profileAPI.createRecruiterProfile(payload);
        }
      } else {
        res = await profileAPI.updateProfile(id, payload);
      }

      const data = res?.data || payload;
      const savedId = getProfileId(data) || id || null;
      setProfile({ ...data, profileId: savedId });

      if (typeof updateUser === 'function') {
        updateUser({
          ...user,
          fullName: data.fullName || data.name || user?.fullName || user?.name,
          profileId: savedId,
          resumeUrl: data.resumeUrl || user?.resumeUrl
        });
      }

      toast.success('Profile updated successfully! ✨');
      setIsEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestEmailChange = async (e) => {
    e.preventDefault();
    setEmailLoading(true);
    try {
      await authAPI.requestEmailChange(user.email, newEmail);
      toast.success('OTP sent to new email!');
      setEmailStep(2);
    } catch (err) {
      toast.error(typeof err.response?.data === 'string' ? err.response.data : 'Failed to request email change.');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleVerifyEmailChange = async (e) => {
    e.preventDefault();
    setEmailLoading(true);
    try {
      await authAPI.verifyEmailChange(user.email, emailOtp);
      toast.success('Email successfully updated! Please sign in again.');
      logout();
    } catch (err) {
      toast.error(typeof err.response?.data === 'string' ? err.response.data : 'Failed to verify OTP.');
    } finally {
      setEmailLoading(false);
    }
  };

  const getInitials = (name) => {
    return (name || 'HC')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium animate-pulse">Loading your professional identity...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 lg:py-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">My Profile</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            {isEditing ? 'Complete your profile to stand out to employers.' : 'View how others see your professional brand.'}
          </p>
        </div>
        {!isEditing && profile && (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/20 transition-all group"
          >
            <Edit3 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span>Edit Profile</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-8 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-blue-600 to-violet-600 opacity-10"></div>
            <div className="relative z-10">
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-blue-500 to-violet-500 rounded-full flex items-center justify-center text-white text-3xl sm:text-4xl font-extrabold border-4 border-white dark:border-slate-800 shadow-xl mb-6 mx-auto">
                {getInitials(profile?.fullName || user?.fullName || user?.name || user?.email)}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2 truncate max-w-full">
                {profile?.fullName || user?.fullName || user?.name || user?.email}
              </h2>
              <p className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-4">
                {role}
              </p>
              {profile?.location && (
                <div className="flex items-center justify-center space-x-2 text-slate-500 dark:text-slate-400 text-sm font-medium">
                  <MapPin className="w-4 h-4" />
                  <span>{profile.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats or Actions */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest px-2">Account Status</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Visibility</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-bold rounded-md">PUBLIC</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Applications</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">12</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Details & Forms */}
        <div className="lg:col-span-2 space-y-8">
          {!isEditing && profile ? (
            <div className="space-y-8">
              {/* Professional Identity */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-8 shadow-sm space-y-8">
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 text-blue-600 dark:text-blue-400">
                    <Briefcase className="w-6 h-6" />
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Professional Identity</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Headline</p>
                      <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{profile.headline || 'Not specified'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Phone</p>
                      <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{profile.phone || 'Not specified'}</p>
                    </div>
                    {role === 'RECRUITER' && (
                      <>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Company</p>
                          <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{profile.companyName || 'Not specified'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Website</p>
                          {profile.website ? (
                            <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-lg font-bold text-blue-600 flex items-center hover:underline">
                              <span>Visit Website</span>
                              <ExternalLink className="w-4 h-4 ml-1" />
                            </a>
                          ) : (
                            <p className="text-lg font-bold text-slate-400 italic">Not specified</p>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Bio / Background</p>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 whitespace-pre-wrap">
                      {profile.bio || 'Tell recruiters about yourself by editing your profile.'}
                    </p>
                  </div>

                  {profile.skills && profile.skills.length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Skills & Expertise</p>
                      <div className="flex flex-wrap gap-2">
                        {profile.skills.map((skill, idx) => (
                          <span key={idx} className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-xl text-sm font-bold border border-blue-100 dark:border-blue-800">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Resume Section */}
              {role === 'CANDIDATE' && getProfileId(profile) && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-2xl flex items-center justify-center">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">Curriculum Vitae</h4>
                      <p className="text-sm text-slate-500 font-medium">Standard PDF/DOCX resume</p>
                    </div>
                  </div>
                  <a
                    href={getProfileResumeDownloadUrl(getProfileId(profile))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-2xl transition-all shadow-lg"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Resume</span>
                  </a>
                </div>
              )}
            </div>
          ) : (
            /* Editing Form */
            <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-8 shadow-sm space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-3 text-blue-600">
                  <Edit3 className="w-6 h-6" />
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Edit Profile Details</h3>
                </div>
                {profile && (
                  <button type="button" onClick={() => setIsEditing(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                    <X className="w-6 h-6" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1 uppercase tracking-wider flex items-center">
                    <User className="w-3.5 h-3.5 mr-1.5" /> Full Name
                  </label>
                  <input 
                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white font-medium shadow-sm"
                    value={form.fullName} 
                    onChange={onChange('fullName')} 
                    required 
                  />
                </div>
                <div className="space-y-2 opacity-70">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1 uppercase tracking-wider flex items-center">
                    <Mail className="w-3.5 h-3.5 mr-1.5" /> Email Address
                  </label>
                  <input 
                    className="w-full px-5 py-3.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl cursor-not-allowed dark:text-slate-500 font-medium"
                    value={user?.email || ''} 
                    disabled 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1 uppercase tracking-wider flex items-center">
                    <Phone className="w-3.5 h-3.5 mr-1.5" /> Phone Number
                  </label>
                  <input 
                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white font-medium shadow-sm"
                    value={form.phone} 
                    onChange={onChange('phone')} 
                    placeholder="+91 98765 43210" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1 uppercase tracking-wider flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1.5" /> Location
                  </label>
                  <input 
                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white font-medium shadow-sm"
                    value={form.location} 
                    onChange={onChange('location')} 
                    placeholder="City, Country" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1 uppercase tracking-wider flex items-center">
                  <Zap className="w-3.5 h-3.5 mr-1.5" /> Professional Headline
                </label>
                <input 
                  className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white font-medium shadow-sm"
                  value={form.headline} 
                  onChange={onChange('headline')} 
                  placeholder="Senior Frontend Engineer | React & Node.js" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1 uppercase tracking-wider flex items-center">
                  <Edit3 className="w-3.5 h-3.5 mr-1.5" /> Short Biography
                </label>
                <textarea
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white font-medium shadow-sm"
                  value={form.bio}
                  onChange={onChange('bio')}
                  rows={4}
                  placeholder="Tell recruiters about your background, goals, and what you're passionate about."
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1 uppercase tracking-wider flex items-center">
                  <Code className="w-3.5 h-3.5 mr-1.5" /> Skills (comma separated)
                </label>
                <input 
                  className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white font-medium shadow-sm"
                  value={form.skills} 
                  onChange={onChange('skills')} 
                  placeholder="React, Tailwind CSS, TypeScript, AWS" 
                />
              </div>

              {role === 'CANDIDATE' && !getProfileId(profile) && (
                <div className="space-y-2 p-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-[24px]">
                  <label className="text-xs font-bold text-blue-700 dark:text-blue-400 ml-1 uppercase tracking-wider flex items-center">
                    <FileText className="w-3.5 h-3.5 mr-1.5" /> Upload Resume (PDF or DOCX)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition-all cursor-pointer"
                    onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                    required
                  />
                  <p className="text-[10px] text-blue-600/60 font-medium ml-1">Maximum file size: 5MB</p>
                </div>
              )}

              {role === 'RECRUITER' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider flex items-center">
                      <Building2 className="w-3.5 h-3.5 mr-1.5" /> Company Name
                    </label>
                    <input className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none" value={form.companyName} onChange={onChange('companyName')} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider flex items-center">
                      <Globe className="w-3.5 h-3.5 mr-1.5" /> Website
                    </label>
                    <input className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none" value={form.website} onChange={onChange('website')} placeholder="https://example.com" />
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                {profile && (
                  <button 
                    type="button" 
                    className="w-full sm:w-auto px-8 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all" 
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </button>
                )}
                <button 
                  type="submit" 
                  className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-70 group" 
                  disabled={saving}
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span>Save Profile</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Account Security Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-8 shadow-sm space-y-8 animate-in slide-in-from-bottom-6 duration-700">
            <div className="flex items-center space-x-3 text-red-600">
              <Shield className="w-6 h-6" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Account Security</h3>
            </div>
            
            <div className="p-6 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-[24px]">
              {emailStep === 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-widest">Sign-in Email</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{user?.email}</p>
                  </div>
                  <button 
                    onClick={() => setEmailStep(1)}
                    className="flex items-center justify-center space-x-2 px-6 py-3 bg-white dark:bg-slate-900 text-red-600 font-bold rounded-2xl shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-all border border-red-200 dark:border-red-800"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Change Email</span>
                  </button>
                </div>
              )}

              {emailStep === 1 && (
                <form onSubmit={handleRequestEmailChange} className="space-y-6 animate-in fade-in duration-300">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-red-700 dark:text-red-400 ml-1 uppercase tracking-wider">New Email Address</label>
                    <input 
                      type="email" 
                      className="w-full px-5 py-3.5 bg-white dark:bg-slate-950 border border-red-200 dark:border-red-800 rounded-2xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all dark:text-white"
                      value={newEmail} 
                      onChange={(e) => setNewEmail(e.target.value)} 
                      required 
                      placeholder="new@example.com"
                    />
                  </div>
                  <div className="flex items-center space-x-3">
                    <button type="submit" className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-lg shadow-red-600/20 transition-all disabled:opacity-70" disabled={emailLoading}>
                      {emailLoading ? 'Sending...' : 'Send OTP'}
                    </button>
                    <button type="button" className="px-6 py-3 text-red-600 font-bold hover:underline transition-all" onClick={() => setEmailStep(0)}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {emailStep === 2 && (
                <form onSubmit={handleVerifyEmailChange} className="space-y-6 animate-in fade-in duration-300">
                  <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-red-100 dark:border-red-800">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      We've sent a 6-digit verification code to <span className="font-bold text-red-600">{newEmail}</span>. Please enter it below.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-red-700 dark:text-red-400 ml-1 uppercase tracking-wider flex items-center">
                      <Lock className="w-3.5 h-3.5 mr-1.5" /> Verification Code
                    </label>
                    <input 
                      type="text" 
                      className="w-full px-5 py-4 bg-white dark:bg-slate-950 border border-red-200 dark:border-red-800 rounded-2xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all dark:text-white text-center text-2xl font-bold tracking-[0.5em]"
                      value={emailOtp} 
                      onChange={(e) => setEmailOtp(e.target.value)} 
                      required 
                      maxLength={6}
                    />
                  </div>
                  <div className="flex items-center space-x-3">
                    <button type="submit" className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-lg shadow-red-600/20 transition-all disabled:opacity-70" disabled={emailLoading}>
                      {emailLoading ? 'Verifying...' : 'Verify & Update Email'}
                    </button>
                    <button type="button" className="px-6 py-3 text-red-600 font-bold hover:underline transition-all" onClick={() => setEmailStep(1)}>
                      Back
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
