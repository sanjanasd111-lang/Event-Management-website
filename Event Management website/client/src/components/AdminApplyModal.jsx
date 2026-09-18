import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminApplyModal = ({ token, onClose, onApplied }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/users/admin/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });

      const contentType = res.headers.get("content-type");
      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || `Server connection error (${res.status}). Please make sure backend is running.`);
      }
      
      if (!res.ok) throw new Error(data.message || 'Failed to submit');
      onApplied?.(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="bg-white/90 dark:bg-slate-800/90 glassmorphism rounded-3xl p-7 w-full max-w-lg shadow-2xl border border-white/20 dark:border-slate-700/50 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 animate-pulse-glow" />

          <h3 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white mt-1">
            Apply for Admin Leadership ✨
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
            Submit your qualifications or rationale. Upon administrator approval, your username and temporary credentials will be dispatched automatically.
          </p>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 p-4 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-semibold flex items-center gap-2"
            >
              <span>⚠️</span>
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={submit} className="mt-6 space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Why do you want to become an admin?</label>
              <textarea
                required
                className="w-full min-h-[130px] px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all shadow-inner"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Detail your leadership skills, event management experience, or goals..."
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-purple-600 hover:from-primary-600 hover:to-purple-700 text-white font-bold shadow-lg shadow-primary-500/25 transition-all transform hover:-translate-y-0.5 disabled:opacity-60 disabled:transform-none"
              >
                {loading ? 'Submitting Application...' : 'Submit Application 🚀'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AdminApplyModal;

