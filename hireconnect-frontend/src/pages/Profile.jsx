import React, { useEffect, useMemo, useState } from 'react';
import { profileAPI, authAPI, getProfileResumeDownloadUrl } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Profile.css';

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
        // A missing profile is expected for first-time users.
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

      // Update global user context so Navbar/Dashboard reflect changes
      if (typeof updateUser === 'function') {
        const updatedUser = {
          ...user,
          fullName: data.fullName || data.name || user?.fullName || user?.name,
          profileId: savedId,
          resumeUrl: data.resumeUrl || user?.resumeUrl
        };
        updateUser(updatedUser);
      }

      toast.success('Profile updated successfully! ✨');
      setIsEditing(false);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (typeof err.response?.data === 'string' ? err.response.data : null) ||
        'Failed to save profile.';
      toast.error(msg);
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
      <div className="profile-page page">
        <div className="container profile-container">
          <div className="profile-card card profile-loading">Loading your profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page page fade-in">
      <div className="container profile-container">
        <div className="profile-header">
          <div>
            <h1 className="section-title">My Profile</h1>
            <p className="section-sub">
              {isEditing ? 'Update your professional information.' : 'Your professional identity on HireConnect.'}
            </p>
          </div>
          {!isEditing && profile && (
            <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
              Edit Profile
            </button>
          )}
        </div>

        {!isEditing && profile ? (
          <div className="profile-card card">
            <div className="view-header">
              <div className="profile-avatar">{getInitials(profile?.fullName || user?.fullName || user?.name || user?.email)}</div>
              <div className="view-info">
                <h1>{profile?.fullName || user?.fullName || user?.name || user?.email}</h1>
                {profile.headline && <p className="headline">{profile.headline}</p>}
                {profile.location && (
                  <p className="location">
                    <span>📍</span> {profile.location}
                  </p>
                )}
              </div>
            </div>

            <div className="view-section">
              <h3>Contact Information</h3>
              <div className="contact-grid">
                <div className="contact-item">
                  <label>Email Address</label>
                  <span>{user?.email}</span>
                </div>
                {profile.phone && (
                  <div className="contact-item">
                    <label>Phone Number</label>
                    <span>{profile.phone}</span>
                  </div>
                )}
                {role === 'RECRUITER' && profile.companyName && (
                  <div className="contact-item">
                    <label>Company</label>
                    <span>{profile.companyName}</span>
                  </div>
                )}
                {role === 'RECRUITER' && profile.website && (
                  <div className="contact-item">
                    <label>Website</label>
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
                      {profile.website}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {profile.bio && (
              <div className="view-section">
                <h3>About Me</h3>
                <p className="bio-text">{profile.bio}</p>
              </div>
            )}

            {profile.skills && profile.skills.length > 0 && (
              <div className="view-section">
                <h3>Skills & Expertise</h3>
                <div className="skills-list">
                  {profile.skills.map((skill, idx) => (
                    <span key={idx} className="badge badge-blue">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {role === 'CANDIDATE' && getProfileId(profile) && (
              <div className="view-section" style={{ borderTop: 'none', marginTop: '2.5rem' }}>
                <a
                  href={getProfileResumeDownloadUrl(getProfileId(profile))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  📄 View Resume (PDF/DOCX)
                </a>
              </div>
            )}
          </div>
        ) : (
          <form className="profile-card card" onSubmit={handleSave}>
            <div className="profile-grid">
              <label className="profile-field">
                <span>Full Name</span>
                <input value={form.fullName} onChange={onChange('fullName')} required />
              </label>

              <label className="profile-field">
                <span>Email</span>
                <input value={user?.email || ''} disabled />
              </label>

              <label className="profile-field">
                <span>Phone</span>
                <input value={form.phone} onChange={onChange('phone')} placeholder="+91 98765 43210" />
              </label>

              <label className="profile-field">
                <span>Location</span>
                <input value={form.location} onChange={onChange('location')} placeholder="City, Country" />
              </label>

              <label className="profile-field profile-field-full">
                <span>Headline</span>
                <input value={form.headline} onChange={onChange('headline')} placeholder="Frontend Engineer | React" />
              </label>

              <label className="profile-field profile-field-full">
                <span>Bio</span>
                <textarea
                  value={form.bio}
                  onChange={onChange('bio')}
                  rows={4}
                  placeholder="Tell recruiters about your background and goals."
                />
              </label>

              <label className="profile-field profile-field-full">
                <span>Skills (comma separated)</span>
                <input
                  value={form.skills}
                  onChange={onChange('skills')}
                  placeholder="React, JavaScript, REST APIs"
                />
              </label>

              {role === 'CANDIDATE' && !getProfileId(profile) && (
                <label className="profile-field profile-field-full">
                  <span>Resume (PDF or DOCX)</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                    required
                  />
                </label>
              )}

              {role === 'RECRUITER' && (
                <>
                  <label className="profile-field">
                    <span>Company Name</span>
                    <input value={form.companyName} onChange={onChange('companyName')} />
                  </label>

                  <label className="profile-field">
                    <span>Company Website</span>
                    <input value={form.website} onChange={onChange('website')} placeholder="https://example.com" />
                  </label>
                </>
              )}
            </div>

            <div className="profile-actions">
              {profile && (
                <button type="button" className="btn btn-ghost" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
              )}
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        )}

        <div className="profile-card card" style={{ marginTop: 20 }}>
          <h2 className="section-title" style={{ fontSize: '1.1rem', marginBottom: 8 }}>
            Account Security
          </h2>
          
          {emailStep === 0 && (
            <div style={{ marginBottom: '16px' }}>
              <p className="section-sub" style={{ marginBottom: 12 }}>
                Current Email: <strong>{user?.email}</strong>
              </p>
              <button type="button" className="btn btn-ghost" onClick={() => setEmailStep(1)}>
                Change Email Address
              </button>
            </div>
          )}

          {emailStep === 1 && (
            <form onSubmit={handleRequestEmailChange} style={{ marginBottom: '16px', maxWidth: '400px' }}>
              <label className="profile-field">
                <span>New Email Address</span>
                <input 
                  type="email" 
                  value={newEmail} 
                  onChange={(e) => setNewEmail(e.target.value)} 
                  required 
                  placeholder="new@example.com"
                />
              </label>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button type="submit" className="btn btn-primary" disabled={emailLoading}>
                  {emailLoading ? 'Sending...' : 'Send OTP'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setEmailStep(0)}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {emailStep === 2 && (
            <form onSubmit={handleVerifyEmailChange} style={{ marginBottom: '16px', maxWidth: '400px' }}>
              <p className="section-sub" style={{ marginBottom: 12 }}>
                Enter the OTP sent to <strong>{newEmail}</strong>
              </p>
              <label className="profile-field">
                <span>Verification Code</span>
                <input 
                  type="text" 
                  value={emailOtp} 
                  onChange={(e) => setEmailOtp(e.target.value)} 
                  required 
                  maxLength={6}
                  style={{ letterSpacing: '0.2em' }}
                />
              </label>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button type="submit" className="btn btn-primary" disabled={emailLoading}>
                  {emailLoading ? 'Verifying...' : 'Verify & Update'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setEmailStep(1)}>
                  Back
                </button>
              </div>
            </form>
          )}
        </div>

        {role === 'CANDIDATE' && getProfileId(profile) && (
          <div className="profile-card card" style={{ marginTop: 20 }}>
            <h2 className="section-title" style={{ fontSize: '1.1rem', marginBottom: 8 }}>
              Resume
            </h2>
            <p className="section-sub" style={{ marginBottom: 12 }}>
              View the file you uploaded when you created your candidate profile (opens on the API server,
              not example.com).
            </p>
            <a
              href={getProfileResumeDownloadUrl(getProfileId(profile))}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              View resume (PDF/DOC)
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
