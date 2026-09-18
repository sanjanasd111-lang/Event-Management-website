import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowRight, Calendar, MapPin, Sparkles, Trophy, Gift, 
  MessageCircle, CreditCard, Clock, Star, Share2, Compass, 
  Download, Play, Pause, RefreshCw, Send, CheckCircle2, Award 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import EventBanner from '../components/EventBanner';

const categories = [
  { icon: '🎸', name: 'Music' },
  { icon: '💼', name: 'Business' },
  { icon: '🎨', name: 'Arts & Culture' },
  { icon: '🍔', name: 'Food & Drink' },
  { icon: '🏃', name: 'Sports' },
  { icon: '💻', name: 'Technology' },
  { icon: '🎭', name: 'Theater' },
  { icon: '🌿', name: 'Health' },
];

const presetCheers = [
  "Can't wait for the next Tech Summit! 🚀",
  "Codesky events are always next-level! 🎉",
  "Just booked my VIP pass! 🎟️",
  "Best event management platform out there! ⚡",
  "The digital wallet integration is so smooth. 💳",
  "Looking forward to the Music Festival next month! 🎸",
  "Got my verified attendance certificate instantly! 🎓",
];

const Landing = () => {
  const { user, token, updateUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const forceGuest = searchParams.get('guest') === 'true';

  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [footerEmail, setFooterEmail] = useState('');
  const [footerSubStatus, setFooterSubStatus] = useState('idle');
  const [footerErrorMsg, setFooterErrorMsg] = useState('');

  const [heroMediaType, setHeroMediaType] = useState('video');
  const [heroMediaUrl, setHeroMediaUrl] = useState('');
  const [heroTitle, setHeroTitle] = useState('Experience events worth showing up for.');
  const [heroSubtitle, setHeroSubtitle] = useState('Discover concerts, conferences, and workshops hand-picked by our curators. Register securely with your wallet, earn credits, and download verified attendance certificates.');
  const [heroBannerMode, setHeroBannerMode] = useState('custom');
  const [currentSlideshowIndex, setCurrentSlideshowIndex] = useState(0);

  // Video control
  const [isPlayingVideo, setIsPlayingVideo] = useState(true);
  const videoRef = useRef(null);

  // Vibe Features States
  const [showWelcome, setShowWelcome] = useState(false);
  const [bookedEvents, setBookedEvents] = useState([]);
  const [nextEvent, setNextEvent] = useState(null);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [quickDepositAmt, setQuickDepositAmt] = useState(500);
  const [isProcessingDeposit, setIsProcessingDeposit] = useState(false);
  
  // AI Matchmaker
  const [matchInterest, setMatchInterest] = useState('');
  const [matchedEvents, setMatchedEvents] = useState([]);
  const [isMatching, setIsMatching] = useState(false);
  const [matchReasoning, setMatchReasoning] = useState('');

  // Cheer Wall
  const [cheers, setCheers] = useState(presetCheers);
  const [newCheer, setNewCheer] = useState('');

  // Mystery reward wheel / box
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rewardResult, setRewardResult] = useState('');

  // Achievements
  const [achievements, setAchievements] = useState([
    { id: 'first_login', name: 'Onboarded', desc: 'Successfully logged into Codesky', icon: '🚀', unlocked: true },
    { id: 'wallet_load', name: 'Investor', desc: 'Loaded funds into digital wallet', icon: '💰', unlocked: false },
    { id: 'first_booking', name: 'Attendee', desc: 'Booked your first event ticket', icon: '🎟️', unlocked: false },
    { id: 'rating_expert', name: 'Critic', desc: 'Submitted a helpdesk review rating', icon: '⭐', unlocked: false },
  ]);

  useEffect(() => {
    fetch('/api/events')
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setFeaturedEvents(list.slice(0, 8));
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.heroMediaType) {
          setHeroMediaType(data.heroMediaType);
          setHeroMediaUrl(data.heroMediaUrl);
        }
        if (data.heroTitle) setHeroTitle(data.heroTitle);
        if (data.heroSubtitle) setHeroSubtitle(data.heroSubtitle);
        if (data.heroBannerMode) setHeroBannerMode(data.heroBannerMode);
      })
      .catch(err => console.error(err));

    // Fetch user registrations if logged in
    if (user && token) {
      fetch('/api/registrations', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const activeBookings = data.filter(r => r.status !== 'cancelled');
          setBookedEvents(activeBookings);
          
          // Find next upcoming event
          const upcoming = activeBookings
            .map(r => r.eventDetails)
            .filter(e => new Date(e.date) > new Date())
            .sort((a, b) => new Date(a.date) - new Date(b.date));
          
          if (upcoming.length > 0) {
            setNextEvent(upcoming[0]);
          }

          // Unlock achievement if booked
          if (activeBookings.length > 0) {
            setAchievements(prev => prev.map(a => a.id === 'first_booking' ? { ...a, unlocked: true } : a));
          }
        }
      })
      .catch(err => console.error(err));

      // Trigger one-time welcome pop-up per login session
      const welcomed = sessionStorage.getItem('codesky_welcomed_session');
      if (!welcomed) {
        setShowWelcome(true);
        sessionStorage.setItem('codesky_welcomed_session', 'true');
      }

      if (Number(user.credits) > 50) {
        setAchievements(prev => prev.map(a => a.id === 'wallet_load' ? { ...a, unlocked: true } : a));
      }
    }
  }, [user, token]);

  // Slideshow cycle effect for upcoming events
  useEffect(() => {
    if (heroBannerMode !== 'upcoming' || featuredEvents.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlideshowIndex((prev) => (prev + 1) % featuredEvents.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [heroBannerMode, featuredEvents]);

  // Countdown timer effect
  useEffect(() => {
    if (!nextEvent) return;
    const interval = setInterval(() => {
      const diff = new Date(nextEvent.date) - new Date();
      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(interval);
      } else {
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const m = Math.floor((diff / 1000 / 60) % 60);
        const s = Math.floor((diff / 1000) % 60);
        setCountdown({ days: d, hours: h, minutes: m, seconds: s });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [nextEvent]);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/events?q=${encodeURIComponent(searchQuery)}&loc=${encodeURIComponent(searchLocation)}`);
  };

  const togglePlayVideo = () => {
    if (!videoRef.current) return;
    if (isPlayingVideo) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlayingVideo(!isPlayingVideo);
  };

  const handleFooterNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!footerEmail) return;
    setFooterSubStatus('submitting');
    setFooterErrorMsg('');

    try {
      const res = await fetch('/api/settings/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: footerEmail })
      });
      const data = await res.json();
      if (res.ok) {
        setFooterSubStatus('success');
        setFooterEmail('');
        setTimeout(() => setFooterSubStatus('idle'), 5000);
      } else {
        setFooterSubStatus('error');
        setFooterErrorMsg(data.message || 'Subscription failed.');
      }
    } catch {
      setFooterSubStatus('error');
      setFooterErrorMsg('Network error occurred.');
    }
  };

  // Vibe Feature 1: Quick Wallet Deposit
  const handleQuickDeposit = async () => {
    setIsProcessingDeposit(true);
    try {
      const res = await fetch('/api/payments/verify-razorpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          razorpay_order_id: 'quick_order_' + Date.now(),
          razorpay_payment_id: 'quick_pay_' + Date.now(),
          amount: quickDepositAmt,
          isMock: true
        })
      });
      const data = await res.json();
      if (data.success) {
        updateUser({ ...user, credits: data.credits });
        setAchievements(prev => prev.map(a => a.id === 'wallet_load' ? { ...a, unlocked: true } : a));
        alert(`🎉 ₹${quickDepositAmt} loaded into your wallet successfully!`);
      } else {
        alert('Deposit failed');
      }
    } catch {
      alert('Network error');
    } finally {
      setIsProcessingDeposit(false);
    }
  };

  // Vibe Feature 2: AI Matchmaker
  const handleAIMatch = () => {
    if (!matchInterest.trim()) return;
    setIsMatching(true);
    setMatchedEvents([]);
    setMatchReasoning('');
    
    setTimeout(() => {
      const interest = matchInterest.trim().toLowerCase();
      const matches = featuredEvents.filter(e => 
        e.title.toLowerCase().includes(interest) || 
        e.description.toLowerCase().includes(interest) ||
        e.tags?.some(t => t.toLowerCase().includes(interest))
      );

      let reasoning = '';
      if (matches.length > 0) {
        reasoning = `🤖 Codesky Matchmaker AI: "I analyzed your interest in '${matchInterest}' and successfully matched you with ${matches.length} experience(s). `;
        if (interest.includes('tech') || interest.includes('code') || interest.includes('dev') || interest.includes('web')) {
          reasoning += `These selections feature immersive hands-on coding labs, tech workshops, and networking sessions. You'll gain practical insights and connect with industry innovators!"`;
        } else if (interest.includes('music') || interest.includes('concert') || interest.includes('rock') || interest.includes('dj')) {
          reasoning += `Prepare for stellar sound design, live performances, and incredible crowd energy. Perfect for discovering new rhythms and expanding your social circle!"`;
        } else if (interest.includes('business') || interest.includes('conference') || interest.includes('lead')) {
          reasoning += `Highly recommended for career acceleration! These events offer expert panels, strategy keynotes, and premium business networking."`;
        } else {
          reasoning += `These events are great because they offer interactive group sessions, immersive environments, and high-impact learning opportunities aligned with your goals!"`;
        }
      } else {
        const randomEvent = featuredEvents[Math.floor(Math.random() * featuredEvents.length)];
        if (randomEvent) {
          matches.push(randomEvent);
          reasoning = `🤖 Codesky Matchmaker AI: "I couldn't find a direct match for '${matchInterest}', but here is a creative recommendation! I've matched you with '${randomEvent.title}' because it fosters adaptability, creative thinking, and cross-disciplinary networking which aligns perfectly with your exploratory mindset!"`;
        } else {
          reasoning = `🤖 Codesky Matchmaker AI: "Our calendar is currently being updated. I recommend subscribing to our newsletter to receive instant alerts when experiences in '${matchInterest}' are announced!"`;
        }
      }

      setMatchedEvents(matches);
      setMatchReasoning(reasoning);
      setIsMatching(false);
    }, 1500);
  };

  // Vibe Feature 3: Cheer Wall
  const handlePostCheer = (e) => {
    e.preventDefault();
    if (!newCheer.trim()) return;
    setCheers(prev => [newCheer, ...prev]);
    setNewCheer('');
  };

  // Vibe Feature 4: Daily Reward Wheel
  const handleSpinWheel = () => {
    if (rewardClaimed) return;
    setIsSpinning(true);
    setTimeout(async () => {
      const rewards = [
        { type: 'coupon', label: 'WELCOME100 Coupon Code!', val: 0 },
        { type: 'credits', label: '₹10 Wallet Bonus!', val: 10 },
        { type: 'credits', label: '₹20 Wallet Bonus!', val: 20 },
        { type: 'coupon', label: 'CODESKY50 Coupon Code!', val: 0 },
      ];
      const win = rewards[Math.floor(Math.random() * rewards.length)];
      setRewardResult(win.label);
      setRewardClaimed(true);
      setIsSpinning(false);

      if (win.type === 'credits') {
        try {
          const res = await fetch('/api/payments/verify-razorpay', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              razorpay_order_id: 'reward_order_' + Date.now(),
              razorpay_payment_id: 'reward_pay_' + Date.now(),
              amount: win.val,
              isMock: true
            })
          });
          const data = await res.json();
          if (res.ok) {
            updateUser({ ...user, credits: data.credits });
          }
        } catch (err) {
          console.error(err);
        }
      }
    }, 2000);
  };

  // Vibe Feature 5: Calendar Exporter (.ics file)
  const handleExportCalendar = () => {
    if (bookedEvents.length === 0) {
      alert('You have no booked events to export!');
      return;
    }
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Codesky Events//NONSGML v1.0//EN\n";
    bookedEvents.forEach(ticket => {
      const event = ticket.eventDetails;
      const dateStr = event.date.replace(/[-:]/g, '').split('.')[0] + 'Z';
      icsContent += `BEGIN:VEVENT\nUID:${ticket._id}\nDTSTART:${dateStr}\nDTEND:${dateStr}\nSUMMARY:${event.title}\nDESCRIPTION:${event.description.replace(/\n/g, ' ')}\nLOCATION:${event.location}\nEND:VEVENT\n`;
    });
    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'Codesky_Booked_Events.ics';
    link.click();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white transition-colors duration-300 relative overflow-hidden font-sans">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-[120px] pointer-events-none dark:bg-primary-500/5"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none dark:bg-purple-500/5"></div>

      {/* RENDER VIEW ACCORDING TO LOGIN STATUS */}
      {!user || forceGuest ? (
        /* ==================== GUEST (LOGGED OUT) VIEW ==================== */
        <>
          {/* Hero Section with video background option */}
          <section className="relative overflow-hidden pt-12 pb-24 lg:pt-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="grid items-center gap-16 lg:grid-cols-2">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-200/60 bg-primary-50/50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary-600 dark:border-primary-500/30 dark:bg-primary-500/10 dark:text-primary-400">
                    <Sparkles className="h-3.5 w-3.5 text-primary-500" />
                    Next-Gen Event OS & Discovery
                  </div>

                  <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white">
                    {heroTitle}
                  </h1>

                  <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-400 font-medium">
                    {heroSubtitle}
                  </p>

                  {/* Stats Counters */}
                  <div className="mt-8 grid grid-cols-3 gap-4 border-y border-slate-200/50 dark:border-slate-800/50 py-6 text-center sm:text-left">
                    <div>
                      <h3 className="text-3xl font-black text-slate-950 dark:text-white">12,000+</h3>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Verified Guests</p>
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-slate-950 dark:text-white">₹50</h3>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Welcome Credits</p>
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-slate-950 dark:text-white">4.9 ★</h3>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">CSAT Rating</p>
                    </div>
                  </div>

                  <form onSubmit={handleSearch} className="mt-8 bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-850 p-2 rounded-2xl shadow-xl backdrop-blur-md">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <div className="flex flex-1 items-center gap-3 rounded-xl bg-slate-100/70 dark:bg-slate-950/40 px-4 py-3">
                        <span className="text-slate-400">🔍</span>
                        <input
                          type="text"
                          placeholder="Search events or tags..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-transparent text-sm font-semibold outline-none text-slate-900 dark:text-white placeholder-slate-400"
                        />
                      </div>
                      <div className="flex flex-1 items-center gap-3 rounded-xl bg-slate-100/70 dark:bg-slate-950/40 px-4 py-3">
                        <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Location..."
                          value={searchLocation}
                          onChange={(e) => setSearchLocation(e.target.value)}
                          className="w-full bg-transparent text-sm font-semibold outline-none text-slate-900 dark:text-white placeholder-slate-400"
                        />
                      </div>
                      <button
                        type="submit"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-purple-650 px-6 py-3.5 text-sm font-bold text-white shadow-lg hover:shadow-primary-500/20 transition-all hover:scale-[1.02] active:scale-100"
                      >
                        Find events
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </form>
                </motion.div>

                {/* Interactive Video Banner Hero */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                  className="relative hidden lg:block"
                >
                  <div className="absolute -right-8 -top-8 h-80 w-80 rounded-full bg-primary-500/20 blur-[100px] pointer-events-none" />
                  <div className="absolute -bottom-8 -left-8 h-80 w-80 rounded-full bg-purple-500/20 blur-[100px] pointer-events-none" />
                  <div className="bg-gradient-to-tr from-slate-250 to-white dark:from-slate-800 dark:to-slate-900/40 p-2.5 rounded-[2.5rem] border border-slate-200/80 dark:border-slate-800 shadow-2xl relative overflow-hidden group">
                    <div className="aspect-[4/3] overflow-hidden rounded-[2rem] bg-slate-950 relative">
                      {heroBannerMode === 'upcoming' && featuredEvents.length > 0 && featuredEvents[currentSlideshowIndex] ? (
                        <Link 
                          to={`/events/${featuredEvents[currentSlideshowIndex]._id || featuredEvents[currentSlideshowIndex].uuid}`} 
                          className="block w-full h-full"
                        >
                          <EventBanner event={featuredEvents[currentSlideshowIndex]} />
                        </Link>
                      ) : heroMediaUrl ? (
                        heroMediaType === 'video' ? (
                          <video
                            ref={videoRef}
                            src={heroMediaUrl}
                            autoPlay
                            muted
                            loop
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src={heroMediaUrl}
                            alt="Custom brand banner"
                            className="w-full h-full object-cover"
                          />
                        )
                      ) : (
                        <video
                          ref={videoRef}
                          src="https://assets.mixkit.co/videos/preview/mixkit-audience-raising-hands-at-a-music-festival-42295-large.mp4"
                          autoPlay
                          muted
                          loop
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                      
                      {heroBannerMode === 'upcoming' && featuredEvents.length > 1 && (
                        <div className="absolute top-4 left-4 flex gap-1 z-10 bg-black/45 backdrop-blur px-2.5 py-1.5 rounded-full">
                          {featuredEvents.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setCurrentSlideshowIndex(idx);
                              }}
                              className={`h-1.5 rounded-full transition-all ${
                                idx === currentSlideshowIndex ? 'bg-primary-500 w-3.5' : 'bg-white/40 hover:bg-white/80 w-1.5'
                              }`}
                            />
                          ))}
                        </div>
                      )}

                      {heroBannerMode === 'custom' && (!heroMediaUrl || heroMediaType === 'video') && (
                        <button
                          onClick={togglePlayVideo}
                          className="absolute bottom-4 right-4 h-10 w-10 rounded-full bg-black/60 backdrop-blur border border-white/20 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                        >
                          {isPlayingVideo ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-white" />}
                        </button>
                      )}
                    </div>
                    <div className="absolute bottom-6 left-6 right-6 rounded-2xl bg-slate-950/85 p-5 border border-white/10 backdrop-blur-md">
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary-400">
                        {heroBannerMode === 'upcoming' && featuredEvents[currentSlideshowIndex] ? 'Upcoming Featured Event' : 'Live Experience'}
                      </span>
                      <p className="mt-1.5 text-lg font-bold text-white line-clamp-1">
                        {heroBannerMode === 'upcoming' && featuredEvents[currentSlideshowIndex] 
                          ? featuredEvents[currentSlideshowIndex].title 
                          : 'Host or discover premium video-verified events'}
                      </p>
                      {heroBannerMode === 'upcoming' && featuredEvents[currentSlideshowIndex] && (
                        <div className="mt-1.5 flex justify-between items-center text-[10px] font-bold text-slate-400">
                          <span>🎙️ {featuredEvents[currentSlideshowIndex].speaker || 'Special Guest'}</span>
                          <span>📅 {new Date(featuredEvents[currentSlideshowIndex].date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Events Grid Section */}
          <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 relative z-10">
            <div className="mb-12 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  Upcoming Events Lineup
                </h2>
                <p className="mt-2 text-slate-500 dark:text-slate-400 font-medium">
                  Click details to check map location coordinates, ratings, and choose ticket tiers.
                </p>
              </div>
              <Link
                to="/events"
                className="inline-flex items-center gap-2 text-sm font-bold text-primary-500 hover:text-primary-600 dark:text-primary-400"
              >
                Explore all events <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-96 animate-pulse rounded-[2rem] bg-slate-200 dark:bg-slate-900 border border-slate-200 dark:border-slate-800" />
                ))}
              </div>
            ) : featuredEvents.length === 0 ? (
              <div className="bg-white/40 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] px-8 py-20 text-center backdrop-blur shadow-sm">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 text-3xl dark:bg-primary-500/10">
                  📅
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">No active listings</h3>
                <p className="mx-auto mt-3 max-w-md text-slate-500 dark:text-slate-400 font-medium">
                  We are currently finalizing dates for the next event calendar. Check back shortly.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {featuredEvents.map((event, i) => (
                  <motion.div
                    key={event._id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: Math.min(i * 0.05, 0.3) }}
                  >
                    <Link to={`/events/${event._id}`} className="group block h-full">
                      <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-900 dark:bg-slate-900/50 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group">
                        <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-950">
                          <EventBanner event={event} isMini />
                          <div className="absolute left-3 top-3 rounded-lg bg-white/90 dark:bg-slate-900/90 px-2.5 py-1 text-xs font-bold text-slate-800 dark:text-white backdrop-blur border border-slate-200/50 dark:border-slate-800">
                            {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                        <div className="flex flex-1 flex-col p-5">
                          <div className="mb-3 flex flex-wrap gap-1.5">
                            {event.tags?.slice(0, 2).map(tag => (
                              <span key={tag} className="rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-primary-500/10 text-primary-600 dark:text-primary-400">
                                {tag}
                              </span>
                            ))}
                          </div>
                          <h3 className="line-clamp-2 text-base font-bold text-slate-900 group-hover:text-primary-500 dark:text-white dark:group-hover:text-primary-400 transition-colors">
                            {event.title}
                          </h3>
                          <p className="mt-2 line-clamp-1 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                            📍 {event.location}
                          </p>
                          <div className="mt-auto flex items-center justify-between border-t border-slate-100 dark:border-slate-850 pt-4 mt-4">
                            <span className="text-base font-black text-slate-900 dark:text-white">
                              {event.price === 0 ? 'Free' : `₹${event.price}`}
                            </span>
                            <span className="text-xs font-bold text-primary-500 group-hover:underline">Join Event →</span>
                          </div>
                        </div>
                      </article>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          {/* Categories Grid */}
          <section className="border-y border-slate-200/60 bg-white/40 py-20 dark:border-slate-850 dark:bg-slate-900/20 backdrop-blur-sm relative z-10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <h2 className="text-center text-3xl font-black text-slate-950 dark:text-white">Browse Curated Categories</h2>
              <p className="mx-auto mt-3 max-w-lg text-center text-slate-500 dark:text-slate-400 font-medium">
                Filter our premium event database by category tags.
              </p>
              <div className="mt-12 flex flex-wrap justify-center gap-4">
                {categories.map((cat) => (
                  <Link
                    key={cat.name}
                    to={`/events?category=${encodeURIComponent(cat.name)}`}
                    className="flex min-w-[7.5rem] flex-col items-center rounded-2xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900/60 px-6 py-5 transition-all hover:-translate-y-1 hover:border-primary-400 hover:shadow-lg dark:hover:border-primary-500/40"
                  >
                    <span className="text-3xl">{cat.icon}</span>
                    <span className="mt-2.5 text-xs font-bold tracking-wide text-slate-700 dark:text-slate-300">{cat.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </>
      ) : (
        /* ==================== MEMBER (LOGGED IN) VIEW ==================== */
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-10 z-10 relative">
          
          {/* Personalized Member Header */}
          <section className="glassmorphism p-6 sm:p-8 rounded-[2rem] border border-white/40 dark:border-slate-800 shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-primary-500 via-teal-500 to-purple-600" />
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-r from-primary-400 to-purple-500 flex items-center justify-center text-2xl font-black text-white shadow shadow-primary-500/30 overflow-hidden">
                <img src={user?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary-500">Attendee Workspace</p>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white mt-0.5">Welcome Back, {user.name}!</h2>
                <p className="text-xs text-slate-500 dark:text-slate-450 font-medium">Coordinate bookings, track achievements, and explore live schedules.</p>
              </div>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-2xl text-center min-w-[120px] shadow-inner">
                <span className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">Digital Wallet</span>
                <p className="text-lg font-mono font-black text-primary-500 mt-0.5">₹{Number(user.credits || 0).toFixed(2)}</p>
              </div>
              <button
                onClick={handleExportCalendar}
                className="px-4 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs rounded-2xl shadow hover:opacity-95 transition-all flex items-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" /> Export Calendar (.ics)
              </button>
            </div>
          </section>

          {/* Double Column Vibe Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left/Middle Column - Main Attendee Controls */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Feature 1: Live Event Countdown Ticker */}
              {nextEvent ? (
                <section className="bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-850 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4 mb-4">
                    <div>
                      <span className="px-2.5 py-0.5 bg-primary-500/20 text-primary-400 border border-primary-500/30 rounded text-[9px] font-black uppercase tracking-wider">Your Next Booking</span>
                      <h3 className="font-bold text-base sm:text-lg mt-1 text-white truncate max-w-sm sm:max-w-md">{nextEvent.title}</h3>
                    </div>
                    <Link
                      to={`/events/${nextEvent._id}`}
                      className="text-xs text-primary-400 font-bold hover:underline shrink-0"
                    >
                      View Ticket QR →
                    </Link>
                  </div>

                  <div className="grid grid-cols-4 gap-2 sm:gap-4 text-center max-w-sm">
                    <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
                      <span className="text-xl sm:text-2xl font-mono font-black">{countdown.days}</span>
                      <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">Days</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
                      <span className="text-xl sm:text-2xl font-mono font-black">{countdown.hours}</span>
                      <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">Hours</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
                      <span className="text-xl sm:text-2xl font-mono font-black">{countdown.minutes}</span>
                      <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">Mins</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
                      <span className="text-xl sm:text-2xl font-mono font-black">{countdown.seconds}</span>
                      <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">Secs</p>
                    </div>
                  </div>
                </section>
              ) : (
                <section className="bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl text-center text-slate-500">
                  <span className="text-3xl block mb-2">🎟️</span>
                  <p className="text-sm font-semibold">No upcoming booked events scheduled.</p>
                  <p className="text-xs text-slate-400 mt-1 mb-4">Book a ticket to activate your live event countdown ticker!</p>
                  <Link to="/events" className="px-4 py-2 bg-primary-500 text-white text-xs font-bold rounded-xl shadow hover:bg-primary-600 transition-colors">Browse Catalog</Link>
                </section>
              )}

              {/* Feature 2: Interactive Wallet Slider Deposit */}
              <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-black text-lg text-slate-800 dark:text-white">💰 Wallet Quick Top-Up Slider</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-450 mt-0.5">Slide to select amount and click to add simulated credits instantly.</p>
                  </div>
                  <CreditCard className="h-5 w-5 text-teal-500 shrink-0" />
                </div>

                <div className="space-y-3 pt-2">
                  <input
                    type="range"
                    min="100"
                    max="5000"
                    step="100"
                    value={quickDepositAmt}
                    onChange={(e) => setQuickDepositAmt(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
                  />
                  <div className="flex justify-between text-xs text-slate-400 font-bold font-mono">
                    <span>₹100</span>
                    <span className="text-primary-500 text-lg font-black">₹{quickDepositAmt}</span>
                    <span>₹5,000</span>
                  </div>
                </div>

                <button
                  onClick={handleQuickDeposit}
                  disabled={isProcessingDeposit}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-750 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  {isProcessingDeposit ? 'Processing...' : `⚡ Load ₹${quickDepositAmt} to Wallet`}
                </button>
              </section>

              {/* Feature 3: AI Event Matchmaker */}
              <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-black text-lg text-slate-800 dark:text-white">🤖 AI Event Matchmaker</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-450 mt-0.5">Enter your interests to find matched events immediately.</p>
                  </div>
                  <Compass className="h-5 w-5 text-primary-500 shrink-0" />
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Technology, Music, Food..."
                    value={matchInterest}
                    onChange={(e) => setMatchInterest(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-xs font-semibold outline-none text-slate-900 dark:text-white"
                  />
                  <button
                    onClick={handleAIMatch}
                    className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Match
                  </button>
                </div>

                {isMatching ? (
                  <p className="text-xs text-center text-primary-500 font-bold animate-pulse">Running semantic matching algorithm...</p>
                ) : matchedEvents.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {matchedEvents.map(e => (
                      <Link
                        key={e._id}
                        to={`/events/${e._id}`}
                        className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex flex-col gap-1 transition-colors"
                      >
                        <span className="font-bold text-xs truncate text-slate-800 dark:text-white">{e.title}</span>
                        <span className="text-[10px] text-slate-400">📍 {e.location}</span>
                      </Link>
                    ))}
                  </div>
                ) : matchInterest && (
                  <p className="text-xs text-slate-400 text-center py-2">No direct matches found. Try another keyword!</p>
                )}

                {matchReasoning && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 bg-primary-500/5 border border-primary-500/10 rounded-2xl text-[11px] leading-relaxed text-slate-700 dark:text-slate-350 font-medium"
                  >
                    {matchReasoning}
                  </motion.div>
                )}
              </section>

            </div>

            {/* Right Column - Sideline Widgets */}
            <div className="space-y-8">
              
              {/* Feature 4: Mystery Reward Box */}
              <section className="bg-gradient-to-br from-purple-900/40 via-indigo-900/40 to-slate-900 border border-purple-500/30 p-6 rounded-3xl text-white shadow-xl space-y-4 text-center">
                <div className="flex justify-between items-center text-left">
                  <div>
                    <h4 className="font-bold text-sm text-purple-300 uppercase tracking-wider">Daily Spin & Claim</h4>
                    <h3 className="font-black text-lg text-white">🎁 Daily Mystery Chest</h3>
                  </div>
                  <Gift className="h-5 w-5 text-purple-400 shrink-0" />
                </div>

                <div className="py-4 flex flex-col items-center justify-center min-h-[120px]">
                  {rewardResult ? (
                    <div className="animate-bounce">
                      <span className="text-4xl">🎉</span>
                      <p className="font-black text-base text-yellow-400 mt-2">{rewardResult}</p>
                      <p className="text-[10px] text-slate-350 mt-1">Claimed & credited successfully!</p>
                    </div>
                  ) : isSpinning ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-10 w-10 border-4 border-purple-500 border-t-transparent animate-spin rounded-full" />
                      <p className="text-xs text-purple-300 font-bold animate-pulse">Unlocking mystery chest...</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <span className="text-5xl block animate-pulse">🎁</span>
                      <p className="text-xs text-slate-300">Open your once-a-day chest to win coupons or wallet balance.</p>
                    </div>
                  )}
                </div>

                <button
                  disabled={rewardClaimed || isSpinning}
                  onClick={handleSpinWheel}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-indigo-650 disabled:opacity-50 font-black rounded-xl text-xs hover:opacity-95 transition-all shadow shadow-purple-500/25"
                >
                  {rewardClaimed ? 'Already Claimed Today' : '🎁 Open Mystery Box'}
                </button>
              </section>

              {/* Feature 5: Achievements Badges */}
              <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-lg text-slate-800 dark:text-white">🏆 Achievements & Badges</h3>
                  <Trophy className="h-5 w-5 text-amber-500 shrink-0" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {achievements.map(a => (
                    <div
                      key={a.id}
                      className={`p-3 rounded-2xl border transition-all text-center flex flex-col items-center justify-center gap-1 ${
                        a.unlocked
                          ? 'bg-amber-500/5 border-amber-500/20 text-slate-800 dark:text-white'
                          : 'bg-slate-100/50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60'
                      }`}
                    >
                      <span className="text-2xl">{a.icon}</span>
                      <span className="font-black text-xs block leading-tight">{a.name}</span>
                      <span className="text-[9px] text-slate-400 leading-tight mt-0.5">{a.desc}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Feature 6: Cheer Wall */}
              <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-lg text-slate-800 dark:text-white">💬 Attendee Cheer Wall</h3>
                  <MessageCircle className="h-5 w-5 text-primary-500 shrink-0" />
                </div>

                {/* Scrolling Cheers */}
                <div className="h-28 overflow-hidden relative border border-slate-100 dark:border-slate-850 rounded-xl p-2 bg-slate-50/50 dark:bg-slate-950/20">
                  <div className="space-y-2 animate-scrollUp">
                    {cheers.map((c, idx) => (
                      <div key={idx} className="p-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg text-[10px] font-semibold text-slate-600 dark:text-slate-300 truncate">
                        👤 {c}
                      </div>
                    ))}
                  </div>
                </div>

                <form onSubmit={handlePostCheer} className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Spread the cheer..."
                    value={newCheer}
                    onChange={(e) => setNewCheer(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-xs font-semibold outline-none text-slate-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    className="px-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs flex items-center justify-center shadow"
                  >
                    <Send className="h-3 w-3" />
                  </button>
                </form>
              </section>

            </div>

          </div>

          {/* Explore Listings Header */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-10">
            <div className="flex justify-between items-end mb-8 gap-4">
              <div>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white">🔥 Live Recommendations for You</h3>
                <p className="text-xs text-slate-500 mt-1">Recommended based on popular choices and your selected categories.</p>
              </div>
              <Link to="/events" className="text-xs font-bold text-primary-500 hover:underline flex items-center gap-1">Browse All →</Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-72 animate-pulse rounded-3xl bg-slate-200 dark:bg-slate-900" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {featuredEvents.map(event => (
                  <Link key={event._id} to={`/events/${event._id}`} className="group block">
                    <div className="rounded-3xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900/40 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col h-full">
                      <div className="h-36 overflow-hidden bg-slate-100 dark:bg-slate-950">
                        <EventBanner event={event} isMini />
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        <h4 className="font-bold text-sm text-slate-800 dark:text-white group-hover:text-primary-500 transition-colors line-clamp-1">{event.title}</h4>
                        <span className="text-[10px] text-slate-400 mt-1 block font-semibold">📍 {event.location}</span>
                        <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-850 pt-3 mt-3">
                          <span className="text-xs font-black text-slate-950 dark:text-white">{event.price === 0 ? 'Free' : `₹${event.price}`}</span>
                          <span className="text-[10px] text-primary-500 font-bold">Book Now</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white dark:border-slate-900 dark:bg-slate-950 transition-colors duration-300">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-16 sm:grid-cols-2 md:grid-cols-4 lg:px-8">
          <div>
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/images/codesky.png" alt="Codesky" className="h-9 w-9 rounded-xl object-cover" />
              <span className="text-xl font-black text-slate-900 dark:text-white">Codesky</span>
            </Link>
            <p className="mt-4 text-xs leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
              A premium event operations framework. We orchestrate ticket sales, wallet claims, certificates, and check-in audits.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Discover</h4>
            <ul className="mt-4 space-y-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <li><Link to="/events" className="hover:text-primary-500 transition-colors">All events</Link></li>
              <li><Link to="/features" className="hover:text-primary-500 transition-colors">Platform features</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Legal & Admin</h4>
            <ul className="mt-4 space-y-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <li><Link to="/privacy" className="hover:text-primary-500 transition-colors">Privacy policy</Link></li>
              <li><Link to="/terms" className="hover:text-primary-500 transition-colors">Terms of service</Link></li>
              <li><Link to="/login?admin=true" className="hover:text-primary-500 transition-colors">Admin Portal</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Newsletter</h4>
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 font-medium">Get notified when new events go live.</p>
            <form onSubmit={handleFooterNewsletterSubmit} className="mt-4 space-y-2">
              <input
                type="email"
                required
                value={footerEmail}
                onChange={(e) => setFooterEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
              <button
                type="submit"
                disabled={footerSubStatus === 'submitting'}
                className="w-full rounded-xl bg-gradient-to-r from-primary-500 to-purple-650 py-2.5 text-[10px] font-black uppercase tracking-wider text-white transition hover:opacity-95 disabled:opacity-70"
              >
                {footerSubStatus === 'submitting' ? 'Subscribing…' : 'Subscribe'}
              </button>
              {footerSubStatus === 'success' && <p className="text-[10px] font-bold text-emerald-500 mt-1">Subscribed successfully.</p>}
              {footerSubStatus === 'error' && <p className="text-[10px] font-bold text-red-500 mt-1">{footerErrorMsg}</p>}
            </form>
          </div>
        </div>
        <div className="border-t border-slate-200 dark:border-slate-900 py-6 text-center text-xs font-medium text-slate-500">
          © {new Date().getFullYear()} Codesky Events. Powered by React, Node, and MySQL.
        </div>
      </footer>

      {/* ONE-TIME WELCOME CONFETTI POPUP MODAL */}
      <AnimatePresence>
        {showWelcome && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            {/* Confetti Particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 30 }).map((_, i) => {
                const colors = ['#f43f5e', '#3b82f6', '#10b981', '#fbbf24', '#a855f7'];
                const randomColor = colors[Math.floor(Math.random() * colors.length)];
                const delay = Math.random() * 2;
                return (
                  <motion.div
                    key={i}
                    initial={{ y: -50, x: Math.random() * window.innerWidth, opacity: 1, rotate: 0 }}
                    animate={{ 
                      y: window.innerHeight + 50, 
                      x: `calc(${Math.random() * 200 - 100}px + 50vw)`,
                      opacity: 0,
                      rotate: 360
                    }}
                    transition={{ duration: 3, delay, ease: 'easeOut', repeat: Infinity }}
                    style={{
                      position: 'absolute',
                      width: Math.random() * 12 + 6,
                      height: Math.random() * 12 + 6,
                      borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                      backgroundColor: randomColor,
                    }}
                  />
                );
              })}
            </div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative text-center"
            >
              <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-primary-500 to-purple-500 flex items-center justify-center mx-auto mb-4 text-3xl">
                ✨
              </div>

              <h3 className="text-2xl font-black mb-2">Welcome to Codesky!</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-6">
                Your next-generation event workspace is loaded and ready. Let's find your next experience!
              </p>

              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 mb-6 text-left space-y-2 text-xs">
                <p className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  ₹50 Welcome Wallet Credit Active
                </p>
                <p className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  Verified Onboarding Wizard Unlocked
                </p>
                <p className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  Real-Time AI Matchmaker Enabled
                </p>
              </div>

              <button
                onClick={() => setShowWelcome(false)}
                className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-purple-650 text-white font-black rounded-xl text-xs hover:opacity-95 transition-all shadow-lg shadow-primary-500/20"
              >
                🚀 Let's Go!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Landing;
