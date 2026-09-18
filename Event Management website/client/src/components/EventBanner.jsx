import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const EventBanner = ({ event, isMini = false }) => {
  const bannerType = event?.bannerType || 'image';
  const rawMedia = event?.bannerMedia || '';
  const thumbnail = event?.thumbnail || '';

  const defaultImage = `https://picsum.photos/seed/${(event?.title || 'event').replace(/ /g, '')}/800/400`;
  const defaultVideo = 'https://assets.mixkit.co/videos/preview/mixkit-audience-raising-hands-at-a-music-festival-42295-large.mp4';

  const [activeIndex, setActiveIndex] = useState(0);
  const [mediaError, setMediaError] = useState(false);

  const getSlideshowUrls = () => {
    if (!rawMedia) return [thumbnail || defaultImage];
    const delimiter = rawMedia.includes('||') ? '||' : ',';
    if (rawMedia.startsWith('data:') && delimiter === ',') {
      return [rawMedia];
    }
    const urls = rawMedia.split(delimiter).map((url) => url.trim()).filter(Boolean);
    return urls.length > 0 ? urls : [thumbnail || defaultImage];
  };

  const getSingleImageSrc = () => {
    if (mediaError) return thumbnail || defaultImage;
    if (!rawMedia) return thumbnail || defaultImage;
    if (rawMedia.startsWith('data:')) return rawMedia;
    const delimiter = rawMedia.includes('||') ? '||' : ',';
    return rawMedia.split(delimiter)[0]?.trim() || rawMedia;
  };

  const slides = getSlideshowUrls();

  useEffect(() => {
    setMediaError(false);
  }, [rawMedia, bannerType]);

  useEffect(() => {
    if (bannerType !== 'slideshow' || slides.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [bannerType, slides.length]);

  if (bannerType === 'video' && rawMedia && !mediaError) {
    const videoUrl = rawMedia || defaultVideo;
    return (
      <div className="relative w-full h-full overflow-hidden bg-slate-900">
        <video
          src={videoUrl}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
          onError={() => setMediaError(true)}
        />
        {isMini && (
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-black text-white uppercase tracking-wider">
            📹 Video
          </div>
        )}
      </div>
    );
  }

  if (bannerType === 'slideshow') {
    return (
      <div className="relative w-full h-full overflow-hidden bg-slate-900">
        <AnimatePresence mode="wait">
          <motion.img
            key={slides[activeIndex]}
            src={slides[activeIndex]}
            alt={event?.title || 'Slideshow image'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => { e.target.src = defaultImage; }}
          />
        </AnimatePresence>
        {isMini && (
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-black text-white uppercase tracking-wider">
            🎠 Slide
          </div>
        )}
      </div>
    );
  }

  const imageUrl = getSingleImageSrc();

  return (
    <div className="w-full h-full overflow-hidden bg-slate-900">
      <img
        src={imageUrl}
        alt={event?.title || 'Event banner'}
        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        loading="lazy"
        onError={(e) => {
          if (!mediaError) {
            setMediaError(true);
            e.target.src = defaultImage;
          }
        }}
      />
    </div>
  );
};

export default EventBanner;
