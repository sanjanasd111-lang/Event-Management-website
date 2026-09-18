import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import AdminApplyModal from '../components/AdminApplyModal';
import GoogleSignModal from '../components/GoogleSignModal';

const Login = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const isAdminLogin = queryParams.get('admin') === 'true';
  const applyAdmin = queryParams.get('applyAdmin') === 'true';

  const [email, setEmail] = useState(isAdminLogin ? 'admin@codesky.com' : '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notFoundPrompt, setNotFoundPrompt] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { login, token, user } = useAuth();
  const [showApplyModal, setShowApplyModal] = useState(Boolean(applyAdmin && token && user));
  const [applyMessage, setApplyMessage] = useState(
    applyAdmin && (!token || !user)
      ? 'Please sign in with your user account first, then open the admin portal again to apply.'
      : ''
  );
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError('');
    setNotFoundPrompt(false);
    setSubmitting(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        if (res.isFirstUser) {
          localStorage.setItem('firstUserOnboarding', 'true');
        }
        setShowSuccessPopup(true);
        setTimeout(() => {
          if (res.role === 'admin') navigate('/admin');
          else navigate('/dashboard');
        }, 1500);
      } else {
        setError(res.message || 'Failed to authenticate');
        if (res.notFound) {
          setNotFoundPrompt(true);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const openApplyModal = () => {
    setApplyMessage('');
    if (!token || !user) {
      setApplyMessage('Please sign in with your user account first, then open the admin portal again to apply.');
      return;
    }
    setShowApplyModal(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors duration-300 relative overflow-hidden p-4">
      {showSuccessPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 border-2 border-emerald-500 rounded-3xl p-8 shadow-2xl text-center max-w-sm w-full"
          >
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 text-4xl mb-4 shadow-inner border border-emerald-300">
              🎉
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Signed In Successfully!</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Redirecting to your workspace...</p>
          </motion.div>
        </div>
      )}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="absolute -top-20 -left-20 w-72 h-72 bg-primary-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-blob"></div>
      <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-blob animation-delay-2000"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="z-10 w-full max-w-md p-6 sm:p-8 glassmorphism rounded-2xl shadow-2xl relative"
      >
        <h2 className="text-3xl font-bold text-center mb-6 text-slate-800 dark:text-white">
          {isAdminLogin ? 'Admin Portal' : 'Welcome Back'}
        </h2>

        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm font-bold">{error}</div>}
        {notFoundPrompt && (
          <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 rounded-xl text-amber-900 dark:text-amber-200 text-sm text-center font-semibold shadow-sm animate-bounce">
            <p className="mb-2">Account does not exist with this email.</p>
            <Link to="/signup" className="inline-block px-4 py-2 rounded-lg bg-amber-600 text-white font-bold hover:bg-amber-700 transition-colors shadow">
              👉 Sign Up Instead
            </Link>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          {isAdminLogin && (
            <div className="rounded-xl border border-primary-200 bg-primary-50/50 p-3">
              <p className="text-sm font-semibold text-primary-700">Want to become an admin?</p>
              <p className="text-xs text-primary-600 mt-1">
                Submit your reason here. After approval, your username and temporary password will be emailed automatically.
              </p>
              <button
                type="button"
                onClick={openApplyModal}
                className="mt-3 w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                Apply for Admin Access
              </button>
              {applyMessage && (
                <p className="mt-2 text-xs font-medium text-amber-700">{applyMessage}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all"
              placeholder="Password"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-primary-500 to-purple-600 text-white font-semibold hover:shadow-lg hover:from-primary-600 hover:to-purple-700 transition-all transform hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-70 disabled:transform-none"
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-700"></div></div>
          <span className="relative bg-white/80 dark:bg-slate-900 px-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Or continue with</span>
        </div>

        <button
          type="button"
          onClick={() => setShowGoogleModal(true)}
          className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-inner border border-slate-100 font-black text-blue-600 text-sm">G</span>
          Continue with Google
        </button>

        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="text-primary-500 hover:text-primary-600 font-bold underline">
            Sign up
          </Link>
        </p>
      </motion.div>

      {showApplyModal && (
        <AdminApplyModal
          token={token}
          onClose={() => setShowApplyModal(false)}
          onApplied={() => {
            setShowApplyModal(false);
            setApplyMessage('Application sent. An admin will verify it and email credentials after approval.');
          }}
        />
      )}

      <GoogleSignModal isOpen={showGoogleModal} onClose={() => setShowGoogleModal(false)} />
    </div>
  );
};

export default Login;
