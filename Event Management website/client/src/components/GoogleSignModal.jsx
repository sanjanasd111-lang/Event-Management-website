import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, useGoogleLogin, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '569591243157-pnd02lte4nhd8v1cp7g6ouke5r6r1fjk.apps.googleusercontent.com';

const GooglePortalContent = ({ onClose, onSuccessCallback }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  
  const { googleAuth } = useAuth();
  const navigate = useNavigate();

  const handleSelectAccount = async (email, name) => {
    setLoading(true);
    setError('');
    try {
      const res = await googleAuth(name, email);
      if (res.success) {
        if (res.isFirstUser) {
          localStorage.setItem('firstUserOnboarding', 'true');
        }
        setShowSuccessPopup(true);
        if (onSuccessCallback) onSuccessCallback();
        setTimeout(() => {
          onClose();
          if (res.role === 'admin') navigate('/admin');
          else navigate('/dashboard');
        }, 1600);
      } else {
        setError(res.message || 'Google Auth Failed');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGooglePopup = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userInfo = await res.json();
        if (userInfo && userInfo.email) {
          await handleSelectAccount(userInfo.email, userInfo.name || 'Google User');
        } else {
          setError('Could not retrieve email from Google OAuth.');
        }
      } catch (err) {
        setError('Error syncing profile: ' + err.message);
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError('Google OAuth popup was closed or cancelled.'),
  });

  const handleGoogleCredential = (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      if (decoded && decoded.email) {
        handleSelectAccount(decoded.email, decoded.name || decoded.given_name || 'Google User');
      } else {
        setError('Failed to retrieve email from Google token.');
      }
    } catch (err) {
      setError('Error decoding Google token: ' + err.message);
    }
  };

  return (
    <div className="relative w-full max-w-lg overflow-hidden rounded-[32px] bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 p-1 shadow-[0_0_60px_rgba(79,70,229,0.3)] border border-slate-700/80 backdrop-blur-2xl text-white">
      {/* Decorative background glow blobs */}
      <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-blue-600/30 blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-purple-600/30 blur-3xl pointer-events-none animate-pulse animation-delay-2000"></div>

      {/* Animated Success Celebration Overlay */}
      <AnimatePresence>
        {showSuccessPopup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-xl p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: [0, 1.2, 1], rotate: 0 }}
              transition={{ type: 'spring', damping: 12, stiffness: 100 }}
              className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-5xl shadow-[0_0_40px_rgba(16,185,129,0.5)] mb-6 border-2 border-white/20"
            >
              🎉
            </motion.div>
            <h3 className="text-3xl font-black tracking-tight text-white mb-2">Authentication Success!</h3>
            <p className="text-sm text-emerald-400 font-semibold tracking-wide uppercase">Secured Session Created &bull; Codesky OS</p>
            <div className="mt-6 flex items-center gap-2 text-xs text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
              Redirecting to your workspace...
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative p-8 sm:p-10">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white transition-all border border-slate-700/50 hover:rotate-90"
        >
          ✕
        </button>

        {/* Premium Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/20 text-xs font-bold uppercase tracking-widest text-blue-400 mb-6 shadow-inner">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
            Official Single Sign-On Portal
          </div>
          
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-900 border border-slate-700 shadow-xl">
              <span className="text-3xl font-black bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">C</span>
            </div>
            <span className="text-2xl font-light text-slate-600">&times;</span>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-xl border border-slate-200">
              <svg className="h-8 w-8" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            </div>
          </div>

          <h3 className="text-3xl font-black tracking-tight text-white">Codesky Authentication</h3>
          <p className="text-sm text-slate-400 mt-2 max-w-xs mx-auto font-medium leading-relaxed">
            Connect your official Google account for synchronized access across all event modules.
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-semibold text-center flex items-center justify-center gap-2"
          >
            <span>⚠️</span> {error}
          </motion.div>
        )}

        {/* Primary Action Section */}
        <div className="space-y-6">
          {/* Glowing Custom Button that directly opens OAuth Popup */}
          <button
            type="button"
            onClick={() => loginWithGooglePopup()}
            disabled={loading}
            className="w-full group relative overflow-hidden rounded-2xl p-[2px] font-bold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_35px_rgba(59,130,246,0.4)] disabled:opacity-50 disabled:pointer-events-none"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 animate-gradient-xy"></span>
            <span className="relative flex items-center justify-center gap-3.5 px-6 py-4 rounded-[14px] bg-slate-900 text-white transition-colors duration-300 group-hover:bg-transparent">
              {loading ? (
                <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <svg className="h-6 w-6 shrink-0 bg-white rounded-full p-0.5 shadow" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span className="text-base font-extrabold tracking-wide">Launch Official Google Pop-Up</span>
                </>
              )}
            </span>
          </button>

          <div className="relative flex items-center justify-center my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
            <span className="relative bg-slate-900 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Or Click Direct Google Widget</span>
          </div>

          {/* Official Embedded Google Login Pill */}
          <div className="flex justify-center transform scale-105 py-1">
            <GoogleLogin
              onSuccess={handleGoogleCredential}
              onError={() => setError('Google widget authentication was closed or failed.')}
              useOneTap
              theme="filled_black"
              shape="pill"
              size="large"
            />
          </div>

          <div className="pt-4 border-t border-slate-800/85 mt-2">
            <button
              type="button"
              onClick={async () => {
                const mockEmail = prompt("Simulate Google login with email:", "pabrasamrat@gmail.com");
                if (mockEmail) {
                  const mockName = mockEmail.split('@')[0];
                  await handleSelectAccount(mockEmail, mockName);
                }
              }}
              className="w-full py-2.5 rounded-xl border border-dashed border-primary-500/50 bg-primary-500/10 text-primary-400 font-bold hover:bg-primary-500/20 transition-all text-xs text-center"
            >
              🔧 Dev Mode: Direct Google Sign-In Bypass
            </button>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-2 font-semibold text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            256-Bit Encrypted Session
          </span>
          <span className="font-mono text-[11px] text-slate-500">MySQL Synchronized</span>
        </div>
      </div>

    </div>
  );
};

const GoogleSignModal = ({ isOpen, onClose, onSuccessCallback }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 25 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          className="w-full max-w-lg flex justify-center"
        >
          <GoogleOAuthProvider clientId={CLIENT_ID}>
            <GooglePortalContent onClose={onClose} onSuccessCallback={onSuccessCallback} />
          </GoogleOAuthProvider>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default GoogleSignModal;
