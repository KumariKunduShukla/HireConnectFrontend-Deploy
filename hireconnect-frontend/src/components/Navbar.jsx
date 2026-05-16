import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { notificationAPI } from '../api';
import './Navbar.css';

export default function Navbar() {
  const { user, logout, isLoggedIn } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const idToUse = user?.profileId || user?.userId || user?.id;
    if (idToUse && isLoggedIn) {
      notificationAPI.getUnreadCount(idToUse)
        .then(r => setUnread(r.data))
        .catch(() => {});
    } else {
      setUnread(0);
    }
  }, [user, location, isLoggedIn]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname.startsWith(path) ? 'active' : '';

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-inner">
        <Link to="/" className="nav-logo">
          <span className="logo-icon">HC</span>
          <span className="logo-text">HireConnect</span>
        </Link>

        <div className="nav-links">
          <Link to="/jobs" className={`nav-link ${isActive('/jobs')}`}>Jobs</Link>
          {isLoggedIn && (
            <>
              <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`}>Dashboard</Link>
              {user?.role === 'RECRUITER' && (
                <Link to="/recruiter" className={`nav-link ${isActive('/recruiter')}`}>Recruiter</Link>
              )}
            </>
          )}
        </div>

        <div className="nav-actions">
          <button onClick={toggleTheme} className="nav-icon-btn theme-toggle" title="Toggle Dark Mode">
            {isDarkMode ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="18.36" x2="5.64" y2="16.93"/><line x1="18.36" y1="4.22" x2="19.78" y2="5.64"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
          {isLoggedIn ? (
            <>
              <Link to="/notifications" className="nav-icon-btn" aria-label="Notifications">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                {unread > 0 && <span className="badge-count">{unread}</span>}
              </Link>
              <div className="nav-avatar" onClick={() => setMenuOpen(!menuOpen)}>
                <span>
                  {(() => {
                    const name = user?.fullName || localStorage.getItem('hc_fullName');
                    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                    return user?.email?.[0]?.toUpperCase() || 'U';
                  })()}
                </span>
                {menuOpen && (
                  <div className="dropdown">
                    <div className="dropdown-header">
                      <div className="dropdown-name" style={{ fontWeight: 600, color: 'var(--text)' }}>
                        {(() => {
                           const name = user?.fullName || user?.name || localStorage.getItem('hc_fullName');
                           return (name && name !== user?.email) ? name : user?.email?.split('@')[0];
                        })()}
                      </div>
                      <div className="dropdown-email" style={{ fontSize: '0.8rem', color: 'var(--text3)', marginBottom: '4px' }}>
                        {user?.email}
                      </div>
                      <span className={`badge badge-${user?.role === 'RECRUITER' ? 'purple' : 'blue'}`}>
                        {user?.role?.replace('ROLE_', '')}
                      </span>
                    </div>
                    <Link to="/profile" className="dropdown-item" onClick={() => setMenuOpen(false)}>Profile</Link>
                    {user?.role === 'RECRUITER' && (
                      <Link to="/subscription" className="dropdown-item" onClick={() => setMenuOpen(false)}>Subscription</Link>
                    )}
                    <button className="dropdown-item danger" onClick={handleLogout}>Sign Out</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">Sign In</Link>
              <Link to="/register" className="btn btn-primary">Get Started</Link>
            </>
          )}

          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
            <span /><span /><span />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="mobile-menu">
          <Link to="/jobs" onClick={() => setMenuOpen(false)}>Jobs</Link>
          {isLoggedIn ? (
            <>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <Link to="/profile" onClick={() => setMenuOpen(false)}>Profile</Link>
              <Link to="/notifications" onClick={() => setMenuOpen(false)}>Notifications {unread > 0 && `(${unread})`}</Link>
              {user?.role === 'RECRUITER' && (
                <Link to="/subscription" onClick={() => setMenuOpen(false)}>Subscription</Link>
              )}
              <button onClick={handleLogout}>Sign Out</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)}>Sign In</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)}>Get Started</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}