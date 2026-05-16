import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { notificationAPI } from '../api';
import { 
  Menu, 
  X, 
  Bell, 
  Sun, 
  Moon, 
  User, 
  LogOut, 
  LayoutDashboard, 
  Briefcase, 
  Settings,
  CreditCard,
  ChevronDown
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, isLoggedIn } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

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
    setMenuOpen(false);
    setDropdownOpen(false);
  };

  const isActive = (path) => location.pathname.startsWith(path);

  const navLinks = [
    { name: 'Browse Jobs', path: '/jobs', icon: Briefcase },
    ...(isLoggedIn ? [{ name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }] : []),
    ...(isLoggedIn && user?.role === 'RECRUITER' ? [{ name: 'Recruiter', path: '/recruiter', icon: Settings }] : []),
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled || location.pathname !== '/'
        ? 'bg-white/90 dark:bg-slate-950/90 backdrop-blur-md shadow-lg border-b border-slate-200 dark:border-slate-800 py-3' 
        : 'bg-transparent py-5'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group flex-shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform">
              HC
            </div>
            <span className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white truncate max-w-[120px] sm:max-w-none">
              HireConnect
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-10 lg:gap-14">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-semibold transition-colors flex-shrink-0 ${
                  isActive(link.path) 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {isLoggedIn ? (
              <div className="flex items-center space-x-2 sm:space-x-4">
                <Link
                  to="/notifications"
                  className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unread > 0 && (
                    <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-950">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </Link>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center space-x-2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-violet-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base border-2 border-white dark:border-slate-800 shadow-sm">
                      {(() => {
                        const name = user?.fullName || localStorage.getItem('hc_fullName');
                        if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                        return user?.email?.[0]?.toUpperCase() || 'U';
                      })()}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {dropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)}></div>
                      <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {user?.fullName || user?.name || user?.email?.split('@')[0]}
                          </p>
                          <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email}</p>
                          <div className="mt-3">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                              user?.role === 'RECRUITER' 
                                ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' 
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            }`}>
                              {user?.role?.replace('ROLE_', '')}
                            </span>
                          </div>
                        </div>
                        <div className="p-2">
                          <Link
                            to="/profile"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <User className="w-4 h-4" />
                            <span>My Profile</span>
                          </Link>
                          {user?.role === 'RECRUITER' && (
                            <Link
                              to="/subscription"
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <CreditCard className="w-4 h-4" />
                              <span>Subscription</span>
                            </Link>
                          )}
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Link to="/login" className="px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-colors">
                  Sign In
                </Link>
                <Link to="/register" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all">
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex-shrink-0"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden" onClick={() => setMenuOpen(false)}></div>
          <div className="absolute top-full left-0 right-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-6 space-y-4 md:hidden z-50 animate-in slide-in-from-top-4 duration-200">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMenuOpen(false)}
                className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <link.icon className="w-5 h-5 text-slate-400" />
                <span className="font-bold text-slate-900 dark:text-white">{link.name}</span>
              </Link>
            ))}
            {!isLoggedIn && (
              <div className="grid grid-cols-2 gap-4 pt-4">
                <Link to="/login" onClick={() => setMenuOpen(false)} className="px-4 py-3 text-center text-sm font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl">
                  Sign In
                </Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="px-4 py-3 text-center text-sm font-bold text-white bg-blue-600 rounded-xl">
                  Get Started
                </Link>
              </div>
            )}
            {isLoggedIn && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800">
                  <User className="w-5 h-5 text-slate-400" />
                  <span className="font-bold text-slate-900 dark:text-white">Profile</span>
                </Link>
                <button onClick={handleLogout} className="w-full flex items-center space-x-3 p-3 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10">
                  <LogOut className="w-5 h-5" />
                  <span className="font-bold">Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </nav>
  );
}