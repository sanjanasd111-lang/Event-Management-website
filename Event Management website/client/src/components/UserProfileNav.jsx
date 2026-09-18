import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const UserProfileNav = ({ className = '' }) => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Link to="/login" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-primary-500 hover:text-primary-600 dark:border-slate-700 dark:text-slate-200">
          Sign in
        </Link>
        <Link to="/signup" className="rounded-full bg-gradient-to-r from-primary-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-90">
          Join now
        </Link>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-primary-500 hover:text-primary-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200"
      >
        {user.profilePicture ? (
          <img src={user.profilePicture} alt={user.name} className="h-8 w-8 rounded-full object-cover border border-primary-500" />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-purple-600 font-bold text-white">
            {user.name?.charAt(0).toUpperCase()}
          </span>
        )}
        <span className="hidden sm:inline">{user.name}</span>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-2 border-b border-slate-200 pb-2 dark:border-slate-700">
            <p className="font-semibold text-slate-900 dark:text-white">{user.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
          </div>
          <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
            <Link to="/dashboard" className="block rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setOpen(false)}>
              My Dashboard
            </Link>
            <Link to="/events" className="block rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setOpen(false)}>
              Browse Events
            </Link>
            {user.role === 'admin' && (
              <Link to="/admin" className="block rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setOpen(false)}>
                Admin Panel
              </Link>
            )}
            <button
              onClick={() => {
                logout();
                setOpen(false);
                navigate('/');
              }}
              className="block w-full rounded-lg px-3 py-2 text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileNav;
