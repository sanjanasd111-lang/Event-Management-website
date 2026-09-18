import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Calendar, MapPin, Share2, Clock, Sparkles, Tag, Star, MessageSquare, ShieldAlert, Award } from 'lucide-react';
import EventBanner from '../components/EventBanner';
import { useAuth } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token, updateUser } = useAuth();

  const [event, setEvent] = useState(null);
  const [similarEvents, setSimilarEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState('');
  const [copied, setCopied] = useState(false);

  // Reviews Board States
  const [reviews, setReviews] = useState([]);
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [replyInputs, setReplyInputs] = useState({});

  // Checkout Modal States
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [paymentStatusMsg, setPaymentStatusMsg] = useState('');
  const [isProcessingBooking, setIsProcessingBooking] = useState(false);

  // Razorpay Top-Up simulation state
  const [showTopUpSimulation, setShowTopUpSimulation] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('500');
  const [isToppingUp, setIsToppingUp] = useState(false);

  // Direct checkout payment options
  const [paymentMethod, setPaymentMethod] = useState('wallet'); // 'wallet' | 'razorpay'
  const [showRazorpayMockModal, setShowRazorpayMockModal] = useState(false);
  const [mockOrderData, setMockOrderData] = useState(null);

  useEffect(() => {
    if (showCheckoutModal && selectedTier) {
      const finalPrice = Math.max(0, selectedTier.price - couponDiscount);
      if (Number(user?.credits) < finalPrice) {
        setPaymentMethod('razorpay');
      } else {
        setPaymentMethod('wallet');
      }
    }
  }, [showCheckoutModal, selectedTier, couponDiscount, user?.credits]);

  useEffect(() => {
    fetch('/api/events')
      .then(res => res.json())
      .then(data => {
        const found = data.find(e => e._id === id);
        setEvent(found);
        if (found) {
          document.title = `${found.title} | Codesky Events`;
          // Initialize selected tier
          const tiers = found.ticketTiers || [];
          if (tiers.length > 0) {
            setSelectedTier(tiers[0]);
          } else {
            setSelectedTier({ name: 'General Admission', price: found.price, perks: 'Standard entrance pass' });
          }

          const similar = data
            .filter(e => e._id !== found._id && e.tags?.some(t => found.tags?.includes(t)))
            .slice(0, 3);
          setSimilarEvents(similar);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Fetch reviews
    fetch(`/api/reviews/${id}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setReviews(data);
      })
      .catch(err => console.error(err));
  }, [id]);

  useEffect(() => {
    if (!event) return;
    const timer = setInterval(() => {
      const diff = new Date(event.date) - new Date();
      if (diff <= 0) {
        setTimeLeft('Event has started');
        clearInterval(timer);
      } else {
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const m = Math.floor((diff / 1000 / 60) % 60);
        setTimeLeft(`${d}d ${h}h ${m}m`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [event]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddToCalendar = () => {
    const start = new Date(event.date).toISOString().replace(/-|:|\.\d+/g, '');
    const end = new Date(new Date(event.date).getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/-|:|\.\d+/g, '');
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${start}/${end}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}`;
    window.open(url, '_blank');
  };

  // Review handlers
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      alert('Please log in to submit a review or question.');
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          eventId: event._id,
          rating: ratingInput,
          comment: commentInput
        })
      });
      if (res.ok) {
        const newReview = await res.json();
        setReviews(prev => [newReview, ...prev]);
        setCommentInput('');
        alert('Review/Q&A posted successfully!');
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to post review');
      }
    } catch {
      alert('Network error posting review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleReplySubmit = async (reviewId) => {
    const replyText = replyInputs[reviewId];
    if (!replyText || !replyText.trim()) return;

    try {
      const res = await fetch(`/api/reviews/${reviewId}/reply`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reply: replyText })
      });
      if (res.ok) {
        const updatedReview = await res.json();
        setReviews(prev => prev.map(r => r._id === reviewId ? updatedReview : r));
        setReplyInputs(prev => ({ ...prev, [reviewId]: '' }));
      } else {
        alert('Failed to post reply.');
      }
    } catch {
      alert('Network error replying.');
    }
  };

  // Coupon Engine Validation
  const handleApplyCoupon = () => {
    setCouponError('');
    setCouponSuccess('');
    const code = couponCode.trim().toUpperCase();
    if (code === 'WELCOME100') {
      setCouponDiscount(100);
      setCouponSuccess('Promo Applied: ₹100 Discount credited!');
    } else if (code === 'CODESKY50') {
      setCouponDiscount(50);
      setCouponSuccess('Promo Applied: ₹50 Discount credited!');
    } else if (code) {
      setCouponError('Invalid discount coupon code.');
      setCouponDiscount(0);
    }
  };

  // Top Up Balance Simulation
  const handleTopUpSim = async (e) => {
    e.preventDefault();
    const amountVal = Number(topUpAmount);
    if (!amountVal || amountVal <= 0) return;
    setIsToppingUp(true);

    try {
      const res = await fetch('/api/payments/verify-razorpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          razorpay_order_id: 'order_' + Date.now(),
          razorpay_payment_id: 'pay_' + Date.now(),
          amount: amountVal,
          isMock: true
        })
      });
      const data = await res.json();
      if (data.success) {
        // Update user in context
        updateUser({ ...user, credits: data.credits });
        alert(`₹${amountVal} added to your digital wallet via Razorpay simulator!`);
        setShowTopUpSimulation(false);
      } else {
        alert('Failed to process simulation.');
      }
    } catch {
      alert('Simulation error.');
    } finally {
      setIsToppingUp(false);
    }
  };

  // Helper to load Razorpay SDK dynamically
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const completeBookingAfterPayment = async (finalPrice) => {
    try {
      setPaymentStatusMsg('Generating secure event ticket...');
      const regRes = await fetch('/api/registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          eventId: event._id,
          paymentStatus: finalPrice === 0 ? 'paid' : 'paid',
          ticketTier: selectedTier.name
        })
      });
      const regData = await regRes.json();
      if (regRes.ok) {
        setPaymentStatusMsg('🎉 Booking Confirmed! Email ticket dispatched.');
        setTimeout(() => {
          setShowCheckoutModal(false);
          setShowRazorpayMockModal(false);
          navigate('/dashboard');
        }, 1500);
      } else {
        setPaymentStatusMsg(regData.message || 'Failed to complete registration.');
      }
    } catch (err) {
      console.error(err);
      setPaymentStatusMsg('Network checkout transaction failure.');
    } finally {
      setIsProcessingBooking(false);
    }
  };

  // Complete Payment & Registration
  const handleCompleteBooking = async () => {
    if (!selectedTier) return;
    const basePrice = selectedTier.price;
    const finalPrice = Math.max(0, basePrice - couponDiscount);

    setIsProcessingBooking(true);

    if (finalPrice === 0 || paymentMethod === 'wallet') {
      setPaymentStatusMsg('Verifying wallet funds...');
      try {
        if (finalPrice > 0) {
          if (Number(user.credits) < finalPrice) {
            setPaymentStatusMsg('Insufficient credits. Top-up required.');
            setIsProcessingBooking(false);
            return;
          }

          const payRes = await fetch('/api/payments/pay-wallet', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ amount: finalPrice, eventId: event._id })
          });
          const payData = await payRes.json();
          if (!payRes.ok) {
            setPaymentStatusMsg(payData.message || 'Payment failed.');
            setIsProcessingBooking(false);
            return;
          }
          updateUser({ ...user, credits: payData.credits });
        }
        await completeBookingAfterPayment(finalPrice);
      } catch (err) {
        setPaymentStatusMsg('Wallet payment transaction failure.');
        setIsProcessingBooking(false);
      }
    } else {
      // Razorpay direct payment flow
      setPaymentStatusMsg('Initiating Razorpay gateway...');
      try {
        const orderRes = await fetch('/api/payments/create-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ amount: finalPrice })
        });
        const orderData = await orderRes.json();
        if (!orderData.success) {
          setPaymentStatusMsg('Failed to initiate payment.');
          setIsProcessingBooking(false);
          return;
        }

        if (orderData.mock) {
          // Open custom Mock overlay
          setMockOrderData({ ...orderData, finalPrice });
          setShowRazorpayMockModal(true);
        } else {
          // Open official Razorpay checkout
          const scriptLoaded = await loadRazorpayScript();
          if (!scriptLoaded) {
            setPaymentStatusMsg('Failed to load Razorpay SDK.');
            setIsProcessingBooking(false);
            return;
          }

          const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_T6jHuiCoIBCbLJ',
            amount: orderData.amount,
            currency: orderData.currency || 'INR',
            name: 'Codesky Events',
            description: `Payment for ${event.title}`,
            order_id: orderData.id,
            handler: async function (response) {
              setPaymentStatusMsg('Verifying transaction...');
              const verifyRes = await fetch('/api/payments/verify-razorpay', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                  amount: finalPrice,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  isMock: false
                })
              });
              const verifyData = await verifyRes.json();
              if (verifyRes.ok && verifyData.success) {
                updateUser({ ...user, credits: verifyData.credits });
                
                // Automatically deduct the newly added credits to pay for booking
                const payRes = await fetch('/api/payments/pay-wallet', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                  },
                  body: JSON.stringify({ amount: finalPrice, eventId: event._id })
                });
                const payData = await payRes.json();
                if (payRes.ok) {
                  updateUser({ ...user, credits: payData.credits });
                  await completeBookingAfterPayment(finalPrice);
                } else {
                  setPaymentStatusMsg('Wallet allocation failed post-deposit.');
                  setIsProcessingBooking(false);
                }
              } else {
                setPaymentStatusMsg('Transaction verification failed.');
                setIsProcessingBooking(false);
              }
            },
            prefill: {
              name: user?.name || '',
              email: user?.email || ''
            },
            theme: { color: '#6366f1' }
          };
          const rzp = new window.Razorpay(options);
          rzp.open();
        }
      } catch (err) {
        console.error(err);
        setPaymentStatusMsg('Payment gateway connection error.');
        setIsProcessingBooking(false);
      }
    }
  };

  const handleSimulateMockSuccess = async () => {
    if (!mockOrderData) return;
    setIsProcessingBooking(true);
    setPaymentStatusMsg('Simulating transaction verification...');
    try {
      const verifyRes = await fetch('/api/payments/verify-razorpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: mockOrderData.finalPrice,
          razorpay_payment_id: 'mock_pay_' + Date.now(),
          razorpay_order_id: mockOrderData.id,
          razorpay_signature: 'mock_sig_123',
          isMock: true
        })
      });
      const verifyData = await verifyRes.json();
      if (verifyRes.ok && verifyData.success) {
        updateUser({ ...user, credits: verifyData.credits });
        
        // Auto pay from wallet
        const payRes = await fetch('/api/payments/pay-wallet', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ amount: mockOrderData.finalPrice, eventId: event._id })
        });
        const payData = await payRes.json();
        if (payRes.ok) {
          updateUser({ ...user, credits: payData.credits });
          await completeBookingAfterPayment(mockOrderData.finalPrice);
        } else {
          setPaymentStatusMsg('Wallet deduction failed post-simulation.');
          setIsProcessingBooking(false);
        }
      } else {
        setPaymentStatusMsg('Simulation verification failed.');
        setIsProcessingBooking(false);
      }
    } catch {
      setPaymentStatusMsg('Network simulation error.');
      setIsProcessingBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-slate-900">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center text-white bg-slate-950 min-h-screen">
        <p className="text-5xl">🔍</p>
        <h1 className="mt-4 text-2xl font-bold">Event not found</h1>
        <Link to="/events" className="mt-6 inline-flex items-center gap-2 text-primary-400 font-semibold">
          <ArrowLeft className="h-4 w-4" /> Back to events
        </Link>
      </div>
    );
  }

  const isPast = new Date(event.date) < new Date();
  const tiers = event.ticketTiers || [];

  return (
    <div className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white min-h-screen pb-20 font-sans relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 relative z-10">
        <Link to="/events" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-primary-500 dark:text-slate-400">
          <ArrowLeft className="h-4 w-4" /> All events
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-[2.5rem] border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900/60 shadow-2xl backdrop-blur-xl"
        >
          {/* Cover Banner */}
          <div className="relative h-[22rem] sm:h-[30rem] bg-slate-950">
            <EventBanner event={event} />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
              <div className="mb-3 flex flex-wrap gap-1.5">
                {event.tags?.map(tag => (
                  <span key={tag} className="rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs font-black uppercase tracking-wide text-white backdrop-blur-sm">
                    {tag}
                  </span>
                ))}
              </div>
              <h1 className="text-3xl font-black text-white sm:text-5xl leading-tight">{event.title}</h1>
            </div>
            <div className="absolute right-4 top-4 flex gap-2">
              <button onClick={handleShare} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur border border-white/20 transition hover:bg-white/20" title="Copy link">
                {copied ? '✓' : <Share2 className="h-4 w-4" />}
              </button>
              <button onClick={handleAddToCalendar} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur border border-white/20 transition hover:bg-white/20" title="Add to calendar">
                <Calendar className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Grid details */}
          <div className="grid gap-10 p-6 sm:p-10 lg:grid-cols-3">
            <div className="space-y-8 lg:col-span-2">
              <section className="space-y-4">
                <h2 className="text-2xl font-black flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary-500" /> About Event</h2>
                <p className="text-base leading-relaxed text-slate-600 dark:text-slate-400 font-medium whitespace-pre-line">{event.description}</p>
              </section>

              {event.speaker && (
                <section className="space-y-4">
                  <h2 className="text-xl font-bold">Speaker & Host</h2>
                  <div className="flex items-center gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 text-lg font-black text-white">
                      {event.speaker.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white">{event.speaker}</p>
                      <p className="text-xs text-slate-500">Keynote Event Coordinator</p>
                    </div>
                  </div>
                </section>
              )}

              {/* Leaflet Map coordinates */}
              <section className="space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">📍 Event Venue Map Location</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Interactive navigation map powered by Leaflet GPS. Venue address: {event.location}</p>
                
                <div className="h-72 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 relative z-0">
                  {event.latitude && event.longitude ? (
                    <MapContainer
                      center={[event.latitude, event.longitude]}
                      zoom={13}
                      scrollWheelZoom={false}
                      className="h-full w-full"
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      <Marker position={[event.latitude, event.longitude]}>
                        <Popup>
                          <strong>{event.title}</strong><br />
                          {event.location}
                        </Popup>
                      </Marker>
                    </MapContainer>
                  ) : (
                    <div className="h-full w-full bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-center gap-2">
                      <MapPin className="h-10 w-10 text-slate-400" />
                      <p className="text-xs text-slate-500">Coordinate map not set for virtual listings</p>
                    </div>
                  )}
                </div>
                {event.mapLink && (
                  <div className="flex justify-start">
                    <a
                      href={event.mapLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-500 hover:to-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all transform hover:-translate-y-0.5"
                    >
                      🗺️ Open Venue in Google Maps
                    </a>
                  </div>
                )}
              </section>

              {/* Review & Q&A Board */}
              <section className="space-y-6 border-t border-slate-200 dark:border-slate-850 pt-8">
                <h2 className="text-2xl font-black flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary-500" /> Q&A Board & Reviews</h2>

                {/* Submit review */}
                {user ? (
                  <form onSubmit={handleReviewSubmit} className="bg-slate-100/50 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-850 space-y-4">
                    <h4 className="text-sm font-bold">Leave a Review or Ask a Question</h4>
                    
                    <div className="flex gap-4 items-center">
                      <label className="text-xs font-bold text-slate-500">Rating Stars:</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRatingInput(star)}
                            className="text-amber-400 hover:scale-110 transition-transform"
                          >
                            <Star className={`h-5 w-5 ${ratingInput >= star ? 'fill-amber-400' : ''}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <textarea
                      required
                      rows={3}
                      value={commentInput}
                      onChange={e => setCommentInput(e.target.value)}
                      placeholder="Ask a question to the host, or write a guest review..."
                      className="w-full p-3 text-xs rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white outline-none focus:border-primary-500"
                    />

                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                    >
                      {submittingReview ? 'Submitting...' : 'Post Message'}
                    </button>
                  </form>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    You must be <Link to="/login" className="text-primary-500 hover:underline">logged in</Link> to post reviews or questions.
                  </p>
                )}

                {/* Review logs */}
                <div className="space-y-4">
                  {reviews.map(rev => (
                    <div key={rev._id} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm text-slate-800 dark:text-white">{rev.userName}</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star key={star} className={`h-3 w-3 ${Number(rev.rating) >= star ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-700'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{rev.comment}</p>
                      
                      {/* Host replies */}
                      {rev.reply ? (
                        <div className="pl-4 border-l-2 border-primary-500 mt-2 bg-primary-500/5 p-2 rounded-r-xl">
                          <p className="text-[10px] font-black text-primary-500 flex items-center gap-1"><Award className="h-3 w-3" /> Host Response</p>
                          <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed mt-1">{rev.reply}</p>
                        </div>
                      ) : (
                        user?.role === 'admin' && (
                          <div className="mt-3 flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-850">
                            <input
                              type="text"
                              placeholder="Type official host answer..."
                              value={replyInputs[rev._id] || ''}
                              onChange={e => setReplyInputs({ ...replyInputs, [rev._id]: e.target.value })}
                              className="flex-1 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs outline-none"
                            />
                            <button
                              onClick={() => handleReplySubmit(rev._id)}
                              className="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-xs font-bold"
                            >
                              Reply
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  ))}
                  {reviews.length === 0 && (
                    <p className="text-xs text-slate-500 text-center py-6">No reviews or questions posted for this event yet.</p>
                  )}
                </div>
              </section>
            </div>

            {/* Sidebar Booking Box */}
            <aside>
              <div className="sticky top-24 space-y-4 rounded-3xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-900/30 p-6 backdrop-blur-md">
                {!isPast && (
                  <div className="rounded-2xl bg-primary-500/10 p-4 text-center border border-primary-500/20">
                    <p className="text-[10px] font-black uppercase tracking-wider text-primary-500">Starts in</p>
                    <p className="mt-1 font-mono text-2xl font-black text-slate-950 dark:text-white">{timeLeft}</p>
                  </div>
                )}

                <div className="space-y-3.5 text-xs font-semibold">
                  <div className="flex items-start gap-3 text-slate-700 dark:text-slate-350">
                    <Calendar className="mt-0.5 h-4.5 w-4.5 text-primary-500 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-slate-700 dark:text-slate-350">
                    <MapPin className="mt-0.5 h-4.5 w-4.5 text-primary-500 shrink-0" />
                    <p className="leading-relaxed">{event.location}</p>
                  </div>
                  <div className="flex items-start gap-3 text-slate-700 dark:text-slate-350">
                    <Clock className="mt-0.5 h-4.5 w-4.5 text-primary-500 shrink-0" />
                    <p>{event.capacity} seats available</p>
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Standard Price</p>
                  <p className="mt-1 text-4xl font-black text-slate-950 dark:text-white">
                    {event.price === 0 ? 'Free' : `₹${event.price}`}
                  </p>
                </div>

                {isPast ? (
                  <button disabled className="w-full rounded-2xl bg-slate-200 py-4 font-bold text-slate-500 dark:bg-slate-800">
                    Event Ended
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (!user) {
                        navigate('/login');
                      } else {
                        setShowCheckoutModal(true);
                      }
                    }}
                    className="w-full rounded-2xl bg-gradient-to-r from-primary-500 to-purple-650 py-4 text-center font-bold text-white shadow-xl shadow-primary-500/20 hover:opacity-95 transition hover:scale-[1.02] active:scale-100"
                  >
                    {event.price === 0 ? 'Book Free Spot' : 'Book Tickets Now'}
                  </button>
                )}

                <p className="text-center text-[10px] text-slate-400 font-medium">
                  Verified platform transaction. Instant ticket dispatch.
                </p>
              </div>
            </aside>
          </div>
        </motion.div>

        {/* Similar Events */}
        {similarEvents.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-black text-slate-950 dark:text-white mb-6">Similar Event Experiences</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {similarEvents.map(sim => (
                <Link key={sim._id} to={`/events/${sim._id}`} className="group overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900/60 shadow-md hover:shadow-xl transition-all">
                  <div className="h-36 overflow-hidden bg-slate-100 dark:bg-slate-950">
                    <EventBanner event={sim} isMini />
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-slate-900 line-clamp-1 group-hover:text-primary-500 dark:text-white dark:group-hover:text-primary-400 transition-colors">{sim.title}</h3>
                    <p className="mt-1.5 text-xs text-slate-400 font-semibold">{new Date(sim.date).toLocaleDateString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Checkout Modal */}
      <AnimatePresence>
        {showCheckoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative text-slate-900 dark:text-white max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => {
                  setShowCheckoutModal(false);
                  setPaymentStatusMsg('');
                  setCouponDiscount(0);
                  setCouponCode('');
                  setCouponSuccess('');
                  setCouponError('');
                }}
                className="absolute right-4 top-4 h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400"
              >
                ✕
              </button>

              <h3 className="text-2xl font-black flex items-center gap-2 mb-1"><Sparkles className="h-5.5 w-5.5 text-primary-500" /> Event Ticket Checkout</h3>
              <p className="text-xs text-slate-400 font-semibold mb-6">Select your ticket tier, apply coupons, and checkout securely.</p>

              {/* Step 1: Choose Ticket Tier */}
              <div className="space-y-3 mb-6">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Choose Ticket Tier</label>
                <div className="grid grid-cols-1 gap-2">
                  {tiers.length === 0 ? (
                    <button
                      className="p-4 rounded-2xl border-2 border-primary-500 bg-primary-500/5 text-left flex justify-between items-center"
                    >
                      <div>
                        <p className="font-bold text-sm">General Admission</p>
                        <p className="text-[10px] text-slate-400">Standard seat entry pass</p>
                      </div>
                      <span className="font-black text-base">₹{event.price}</span>
                    </button>
                  ) : (
                    tiers.map(tier => (
                      <button
                        key={tier.name}
                        onClick={() => setSelectedTier(tier)}
                        className={`p-4 rounded-2xl border-2 text-left flex justify-between items-center transition-all ${
                          selectedTier?.name === tier.name
                            ? 'border-primary-500 bg-primary-500/5'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-sm">{tier.name}</p>
                          <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{tier.perks}</p>
                        </div>
                        <span className="font-black text-base shrink-0 ml-4">₹{tier.price}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Step 2: Coupon Engine */}
              <div className="space-y-2 mb-6">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Apply Promo Coupon Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code e.g. WELCOME100"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold outline-none text-slate-900 dark:text-white"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    className="px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-xl hover:opacity-90 transition-opacity"
                  >
                    Apply
                </button>
              </div>
              {couponSuccess && <p className="text-[10px] text-emerald-500 font-bold">{couponSuccess}</p>}
              {couponError && <p className="text-[10px] text-red-500 font-bold">{couponError}</p>}
            </div>

            {/* Step 3: Payment Method Selector */}
            {Math.max(0, (selectedTier?.price || 0) - couponDiscount) > 0 && (
              <div className="space-y-3 mb-6">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Select Payment Method</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={Number(user?.credits) < Math.max(0, (selectedTier?.price || 0) - couponDiscount)}
                    onClick={() => setPaymentMethod('wallet')}
                    className={`p-3.5 rounded-2xl border-2 text-left flex flex-col gap-1 transition-all ${
                      paymentMethod === 'wallet'
                        ? 'border-primary-500 bg-primary-500/5 ring-1 ring-primary-500'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/40 disabled:opacity-40 disabled:cursor-not-allowed'
                    }`}
                  >
                    <span className="font-bold text-xs sm:text-sm flex items-center gap-1.5">💰 Wallet Balance</span>
                    <span className="text-[10px] text-slate-400">Available: ₹{Number(user?.credits).toFixed(2)}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('razorpay')}
                    className={`p-3.5 rounded-2xl border-2 text-left flex flex-col gap-1 transition-all ${
                      paymentMethod === 'razorpay'
                        ? 'border-primary-500 bg-primary-500/5 ring-1 ring-primary-500'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <span className="font-bold text-xs sm:text-sm flex items-center gap-1.5">💳 Razorpay Gateway</span>
                    <span className="text-[10px] text-slate-400">Pay directly via Card/UPI</span>
                  </button>
                </div>
              </div>
            )}

              {/* Step 4: Payment Summary */}
              <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-850/60 mb-6 space-y-2.5 text-xs font-semibold text-slate-600 dark:text-slate-350">
                <div className="flex justify-between">
                  <span>Base Ticket Price ({selectedTier?.name}):</span>
                  <span className="text-slate-800 dark:text-white">₹{selectedTier?.price || 0}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-500 font-bold">
                    <span>Discount:</span>
                    <span>-₹{couponDiscount}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-2 text-sm font-bold text-slate-800 dark:text-white">
                  <span>Final Cost:</span>
                  <span className="text-primary-500 font-black">₹{Math.max(0, (selectedTier?.price || 0) - couponDiscount)}</span>
                </div>
              </div>

              {paymentStatusMsg && (
                <p className="text-xs text-center font-bold text-primary-500 mb-4 animate-pulse">{paymentStatusMsg}</p>
              )}

              <button
                onClick={handleCompleteBooking}
                disabled={isProcessingBooking}
                className="w-full py-4 bg-gradient-to-r from-primary-500 to-purple-650 text-white rounded-2xl font-bold shadow-lg shadow-primary-500/20 disabled:opacity-40 transition hover:scale-[1.01]"
              >
                {isProcessingBooking 
                  ? 'Processing checkout...' 
                  : paymentMethod === 'wallet' 
                  ? 'Deduct Wallet & Confirm Booking' 
                  : 'Proceed to Pay via Razorpay'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Razorpay Mock Payment Gateway Modal Overlay */}
      <AnimatePresence>
        {showRazorpayMockModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-950 border border-slate-800 text-white rounded-3xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-primary-600" />
              
              <button
                onClick={() => {
                  setShowRazorpayMockModal(false);
                  setIsProcessingBooking(false);
                  setPaymentStatusMsg('Payment cancelled by user');
                }}
                className="absolute right-4 top-4 text-slate-400 hover:text-white"
              >
                ✕
              </button>

              <div className="flex items-center gap-2 mb-4">
                <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center font-black text-xs text-white">R</div>
                <div>
                  <h4 className="text-sm font-bold tracking-wide">Razorpay Secure Checkout</h4>
                  <p className="text-[10px] text-slate-400">Codesky Events Merchant</p>
                </div>
              </div>

              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-850 mb-6 flex justify-between items-center">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500">Amount to Pay</p>
                  <p className="text-xl font-mono font-black text-white">₹{mockOrderData?.finalPrice || '0.00'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-slate-500">Order ID</p>
                  <p className="text-xs font-mono text-slate-450">{mockOrderData?.id?.substring(0, 18)}...</p>
                </div>
              </div>

              <div className="space-y-3.5">
                <div className="text-center py-2">
                  <p className="text-xs text-slate-400 font-semibold mb-4">Select Simulated Sandbox Response:</p>
                  
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleSimulateMockSuccess}
                      disabled={isProcessingBooking && paymentStatusMsg.includes('Simulating')}
                      className="w-full py-3 bg-gradient-to-r from-emerald-550 to-teal-550 text-slate-950 font-bold rounded-xl text-xs hover:opacity-95 shadow-md shadow-emerald-500/10 transition-all flex items-center justify-center gap-1.5"
                    >
                      ✅ Simulate Successful Payment
                    </button>

                    <button
                      onClick={() => {
                        setShowRazorpayMockModal(false);
                        setIsProcessingBooking(false);
                        setPaymentStatusMsg('⚠️ Simulated Payment Failed or Dismissed.');
                      }}
                      disabled={isProcessingBooking && paymentStatusMsg.includes('Simulating')}
                      className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-red-400 border border-slate-750 font-bold rounded-xl text-xs transition-all"
                    >
                      ❌ Simulate Failed Payment
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-[9px] text-slate-500 text-center mt-6">
                This is a secure simulated sandbox environment bypass. Genuine currency is not transferred.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Razorpay Top-up Simulation Modal */}
      <AnimatePresence>
        {showTopUpSimulation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 max-w-sm w-full shadow-2xl relative"
            >
              <button
                onClick={() => setShowTopUpSimulation(false)}
                className="absolute right-4 top-4 text-slate-400"
              >
                ✕
              </button>

              <h4 className="text-lg font-black flex items-center gap-2 mb-2">💳 Razorpay Simulator</h4>
              <p className="text-xs text-slate-400 mb-6">Simulated secure checkout window to add funds directly to your wallet credits.</p>

              <form onSubmit={handleTopUpSim} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Enter Top-Up Amount (₹)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={topUpAmount}
                    onChange={e => setTopUpAmount(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-850 text-sm font-semibold outline-none text-white focus:border-primary-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isToppingUp}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold rounded-xl text-xs hover:opacity-95 shadow-md shadow-emerald-500/10"
                >
                  {isToppingUp ? 'Securing simulation...' : 'Pay Simulating Razorpay'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EventDetails;
