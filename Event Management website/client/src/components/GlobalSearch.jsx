import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const GlobalSearch = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAction = (path) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-start justify-center pt-[10vh] px-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: -20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: -20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center p-4 border-b border-slate-100 dark:border-slate-800">
                <span className="text-2xl mr-3">🔍</span>
                <input 
                  type="text" autoFocus placeholder="Search events, organizers, or settings... (Mock AI Search)"
                  value={query} onChange={e=>setQuery(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-xl text-slate-800 dark:text-white"
                />
                <button className="px-2 py-1 text-xs font-bold bg-slate-100 dark:bg-slate-800 rounded text-slate-500 ml-2">ESC</button>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 max-h-[60vh] overflow-y-auto">
                <div className="mb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Links</div>
                <div className="space-y-2">
                  <button onClick={() => handleAction('/events')} className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl hover:bg-primary-50 dark:hover:bg-slate-700 transition-colors text-left group border border-slate-100 dark:border-slate-700">
                    <span className="font-semibold text-slate-800 dark:text-white">Explore All Events</span>
                    <span className="text-primary-500 opacity-0 group-hover:opacity-100">Jump →</span>
                  </button>
                  <button onClick={() => handleAction('/admin/login')} className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl hover:bg-primary-50 dark:hover:bg-slate-700 transition-colors text-left group border border-slate-100 dark:border-slate-700">
                    <span className="font-semibold text-slate-800 dark:text-white">Admin portal</span>
                    <span className="text-primary-500 opacity-0 group-hover:opacity-100">Jump →</span>
                  </button>
                </div>

                <div className="mt-6 mb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">AI Suggested Events</div>
                <div className="space-y-2">
                  <button onClick={() => handleAction('/events')} className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl hover:bg-primary-50 dark:hover:bg-slate-700 transition-colors text-left group border border-slate-100 dark:border-slate-700">
                    <span className="font-semibold text-slate-800 dark:text-white">Web3 Builders Hackathon (Matching your profile)</span>
                    <span className="text-primary-500 opacity-0 group-hover:opacity-100">View →</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GlobalSearch;
