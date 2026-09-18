import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const GlobalBanner = () => {
  const [bannerText, setBannerText] = useState('');
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const fetchSettings = () => {
      fetch('/api/settings')
        .then(res => res.json())
        .then(data => {
          if (data.globalBanner) {
            setBannerText(data.globalBanner);
          } else {
            setBannerText('');
          }
        })
        .catch(err => console.error('Failed to fetch settings', err));
    };

    fetchSettings();
    const interval = setInterval(fetchSettings, 8000);
    return () => clearInterval(interval);
  }, []);

  if (!bannerText || !isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className="bg-gradient-to-r from-blue-600 to-primary-600 text-white px-4 py-3 flex justify-between items-center shadow-md relative z-50"
      >
        <div className="flex-1 text-center font-bold text-sm md:text-base flex items-center justify-center gap-2">
          <span>📢</span> {bannerText}
        </div>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-white hover:text-blue-200 transition-colors p-1"
          aria-label="Close banner"
        >
          ✕
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default GlobalBanner;
