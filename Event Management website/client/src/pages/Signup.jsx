import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import GoogleSignModal from '../components/GoogleSignModal';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [existsPrompt, setExistsPrompt] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!name || !email || !password || !phone) return setError("Please fill name, email, password, and phone number fields");
    if (getPasswordStrength(password) < 2) return setError("Password is too weak");
    
    setError(''); setMsg(''); setExistsPrompt(false);
    setSubmitting(true);
    try {
      const result = await register(name, email, password, { phone, bio, profilePicture });
      if (result.success) {
        if (result.isFirstUser) {
          localStorage.setItem('firstUserOnboarding', 'true');
        }
        setShowSuccessPopup(true);
        setTimeout(() => {
          if (result.isFirstUser) navigate('/admin');
          else navigate('/dashboard');
        }, 1500);
      } else {
        setError(result.message || 'Failed to register');
        if (result.exists) {
          setExistsPrompt(true);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getPasswordStrength = (pw) => {
    let score = 0;
    if (pw.length > 5) score += 1;
    if (pw.length > 8) score += 1;
    if (/[A-Z]/.test(pw)) score += 1;
    if (/[0-9]/.test(pw)) score += 1;
    if (/[^A-Za-z0-9]/.test(pw)) score += 1;
    return Math.min(score, 4);
  };

  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-emerald-500'];
  const strengthLabels = ['Too Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  
  const strengthScore = getPasswordStrength(password);


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
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Account Created Successfully!</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Redirecting to your dashboard...</p>
          </motion.div>
        </div>
      )}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-blob"></div>
      <div className="absolute -top-20 -right-20 w-72 h-72 bg-primary-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-blob animation-delay-2000"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="z-10 w-full max-w-md p-6 sm:p-8 glassmorphism rounded-2xl shadow-2xl relative"
      >
        <h2 className="text-3xl font-bold text-center mb-6 text-slate-800 dark:text-white">Create Account</h2>
        
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm font-bold">{error}</div>}
        {msg && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm font-bold">{msg}</div>}
        {existsPrompt && (
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950/50 border border-blue-300 dark:border-blue-700 rounded-xl text-blue-900 dark:text-blue-200 text-sm text-center font-semibold shadow-sm animate-bounce">
            <p className="mb-2">An account already exists with this email!</p>
            <Link to="/login" className="inline-block px-4 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow">
              👉 Log In Instead
            </Link>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-2 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all" placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-2 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required className="w-full px-4 py-2 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all" placeholder="+91 98765 43210" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Short Bio (Optional)</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows="2" className="w-full px-4 py-2 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all resize-none" placeholder="Tell us about yourself..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Profile Photo URL (Optional)</label>
            <input type="url" value={profilePicture} onChange={(e) => setProfilePicture(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all" placeholder="https://example.com/avatar.jpg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-2 pr-10 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all" placeholder="••••••••" />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                aria-label="Toggle password visibility"
              >
                {showPassword ? '👁️' : '🔒'}
              </button>
            </div>
            {password && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < strengthScore ? strengthColors[strengthScore] : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                  ))}
                </div>
                <div className="text-xs text-right font-medium" style={{color: strengthScore > 0 ? strengthColors[strengthScore].replace('bg-', 'text-') : 'inherit'}}>{strengthLabels[strengthScore]}</div>
              </div>
            )}
          </div>
          
          <button 
            type="submit"
            disabled={submitting}
            className="w-full py-3 mt-4 rounded-lg bg-gradient-to-r from-primary-500 to-purple-600 text-white font-semibold hover:shadow-lg hover:from-primary-600 hover:to-purple-700 transition-all transform hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-70 disabled:transform-none"
          >
            {submitting ? 'Creating account...' : 'Create Account'}
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
          Already have an account?{' '}
          <Link to="/login" className="text-primary-500 hover:text-primary-600 font-bold underline">
            Log in
          </Link>
        </p>
      </motion.div>

      <GoogleSignModal isOpen={showGoogleModal} onClose={() => setShowGoogleModal(false)} />
    </div>
  );
};

export default Signup;
