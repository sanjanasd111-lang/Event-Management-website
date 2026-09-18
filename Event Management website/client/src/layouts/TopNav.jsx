import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import UserProfileNav from '../components/UserProfileNav';
import { useAuth } from '../context/AuthContext';
import { Bell, ShieldAlert, Sparkles, Inbox } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TopNav = () => {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (user && token) {
      fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setNotifications(data);
        }
      })
      .catch(err => console.error('Error fetching notifications:', err));
    }
  }, [user, token, showDropdown]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkRead = async (id) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200/70 bg-white/85 backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/85">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link
          to="/?guest=true"
          className="flex items-center gap-2.5 transition transform hover:scale-105 group"
        >
          <img src="/images/codesky.png" alt="Codesky Logo" className="w-9 h-9 rounded-xl object-cover shadow-sm border border-slate-200/60 dark:border-slate-700/60 group-hover:shadow-md transition-shadow" />
          <span className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary-500 via-teal-500 to-purple-600">
            Codesky
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link
            to="/events"
            className="hidden sm:inline-flex rounded-full px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            Events
          </Link>
          <Link
            to="/features"
            className="hidden sm:inline-flex rounded-full px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            Features
          </Link>

          {/* Live Notification Bell */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(prev => !prev)}
                className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-black text-white flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    className="absolute right-0 mt-3 w-80 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-4 text-slate-900 dark:text-white z-40 max-h-[380px] overflow-y-auto"
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-slate-150 dark:border-slate-800 mb-3">
                      <span className="font-bold text-sm flex items-center gap-1.5"><Inbox className="h-4 w-4" /> Live Notifications</span>
                      <span className="text-[10px] font-bold text-slate-400">{notifications.length} Messages</span>
                    </div>

                    <div className="space-y-2">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-6 font-medium">Your inbox is empty.</p>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n._id}
                            onClick={() => handleMarkRead(n._id)}
                            className={`p-3 rounded-xl border transition-colors cursor-pointer text-left relative ${
                              n.isRead
                                ? 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800/40 text-slate-500'
                                : 'bg-primary-500/10 border-primary-500/20 hover:bg-primary-500/15 text-slate-800 dark:text-slate-200 font-medium'
                            }`}
                          >
                            {!n.isRead && (
                              <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-primary-500"></span>
                            )}
                            <h5 className="text-xs font-black truncate pr-4">{n.title}</h5>
                            <p className="text-[11px] mt-1 leading-relaxed">{n.message}</p>
                            <span className="text-[9px] text-slate-400 block mt-2">
                              {new Date(n.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div className="rounded-full border border-slate-200 bg-white/80 p-1 shrink-0 dark:border-slate-700 dark:bg-slate-800/80">
            <UserProfileNav />
          </div>

          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className="hidden md:inline-flex rounded-full bg-purple-500/10 border border-purple-500/20 px-3.5 py-2 text-sm font-semibold text-purple-700 dark:text-purple-300 hover:bg-purple-500/15"
            >
              Admin
            </Link>
          )}

          <div className="hidden sm:inline-flex">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNav;
