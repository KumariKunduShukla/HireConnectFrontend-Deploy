import React, { useState, useEffect } from 'react';
import { notificationAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { 
  Bell, 
  CheckCircle2, 
  X, 
  Trash2, 
  MessageSquare, 
  Calendar, 
  PartyPopper, 
  Briefcase, 
  Clock, 
  ArrowRight,
  Inbox
} from 'lucide-react';

const NOTIF_ICONS = {
  'Job Alert': Briefcase,
  'Application Update': Clock,
  'Interview': Calendar,
  'Offer': PartyPopper,
  'Message': MessageSquare,
};

const NOTIF_COLORS = {
  'Job Alert': 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
  'Application Update': 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
  'Interview': 'text-violet-600 bg-violet-50 dark:bg-violet-900/20',
  'Offer': 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
  'Message': 'text-pink-600 bg-pink-50 dark:bg-pink-900/20',
};

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = user?.profileId || user?.userId || user?.id;

  useEffect(() => {
    const notifIds = [...new Set([user?.profileId, user?.userId, user?.id].filter(id => id != null))];
    if (notifIds.length === 0) {
      setLoading(false);
      return;
    }

    Promise.all(notifIds.map(id => notificationAPI.getByUser(id).catch(() => ({ data: [] }))))
      .then(responses => {
        const merged = new Map();
        responses.forEach(r => {
          if (Array.isArray(r.data)) {
            r.data.forEach(n => merged.set(n.id || n.notificationId, n));
          }
        });
        const arr = [...merged.values()];
        arr.sort((a, b) => (b.id || b.notificationId) - (a.id || a.notificationId));
        setNotifications(arr);
      })
      .catch(() => toast.error('Failed to load notifications'))
      .finally(() => setLoading(false));
  }, [user]);

  const markRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications(prev => prev.map(n => (n.id === id || n.notificationId === id) ? { ...n, read: true, isRead: true } : n));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await notificationAPI.markAllRead(userId);
      setNotifications(prev => prev.map(n => ({ ...n, read: true, isRead: true })));
      toast.success('All caught up!');
    } catch {}
  };

  const deleteNotif = async (id) => {
    try {
      await notificationAPI.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id && n.notificationId !== id));
    } catch {}
  };

  const unreadCount = notifications.filter(n => !(n.read === true || n.isRead === true)).length;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        <div className="h-10 w-48 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"></div>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-24 bg-slate-50 dark:bg-slate-900 rounded-3xl animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 lg:py-12 space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Bell className="w-8 h-8 text-blue-600" /> Notifications
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            {unreadCount > 0 ? `You have ${unreadCount} unread updates.` : "You're all caught up with your updates."}
          </p>
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={markAllRead}
            className="flex items-center space-x-2 px-6 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-all text-sm"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[40px] p-20 text-center space-y-6 shadow-sm">
          <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-[40px] flex items-center justify-center mx-auto text-slate-300">
            <Inbox className="w-12 h-12" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">Your inbox is empty</h3>
            <p className="text-slate-500 font-medium max-w-sm mx-auto">We'll notify you about job alerts, application updates, and interview invites here.</p>
          </div>
          <Link to="/jobs" className="inline-block px-10 py-3 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/20">
            Explore Opportunities
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map(n => {
            const id = n.id || n.notificationId;
            const isRead = n.read === true || n.isRead === true;
            const Icon = NOTIF_ICONS[n.type] || Inbox;
            const colorClass = NOTIF_COLORS[n.type] || 'text-slate-600 bg-slate-100';

            return (
              <div 
                key={id} 
                className={`group relative flex items-start gap-5 p-6 rounded-[32px] border transition-all duration-300 ${
                  !isRead 
                    ? 'bg-white dark:bg-slate-900 border-blue-100 dark:border-blue-900/30 shadow-lg shadow-blue-600/5' 
                    : 'bg-white/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 opacity-60 grayscale hover:grayscale-0 hover:opacity-100'
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${colorClass}`}>
                  <Icon className="w-7 h-7" />
                </div>

                <div className="flex-1 min-w-0 space-y-2" onClick={() => !isRead && markRead(id)}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400">{n.type}</span>
                    <div className="flex items-center space-x-3">
                      {!isRead && <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping"></div>}
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteNotif(id); }}
                        className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className={`text-sm leading-relaxed font-medium transition-colors ${!isRead ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                    {n.message}
                  </p>
                  {!isRead && (
                    <div className="pt-2 flex items-center text-blue-600 font-bold text-xs cursor-pointer group/link">
                      <span>Mark as read</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover/link:translate-x-1 transition-transform" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
