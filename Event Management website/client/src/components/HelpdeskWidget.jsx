import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Sparkles, Star, Phone, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const presetQAs = [
  { keywords: ['wallet', 'money', 'add', 'payout', 'razorpay', 'top up', 'top-up', 'balance', 'credit'], answer: 'To add money to your wallet, go to your member dashboard, select the "Digital Wallet" tab, and click "+ Top Up Wallet". You can pay using our secure simulated Razorpay interface!' },
  { keywords: ['ticket', 'vault', 'booking', 'cancel', 'pdf', 'invoice', 'qr', 'my tickets'], answer: 'All your booked tickets are safely stored in your "Ticket Vault" on the dashboard. You can view QR codes, download PDF invoices, email tickets, or cancel upcoming bookings there.' },
  { keywords: ['admin', 'apply', 'organizer', 'role', 'manager', 'permission', 'host'], answer: 'To request event manager permissions, log in, click the admin option under your profile menu, or toggle admin login parameters to submit an official admin access request.' },
  { keywords: ['coupon', 'discount', 'welcome', 'codesky', 'promo', 'code'], answer: 'We support checkout promo codes! You can try "WELCOME100" (gives ₹100 off) or "CODESKY50" (gives ₹50 off) in the payment window.' },
  { keywords: ['first', 'user', 'bootstrap', 'superadmin'], answer: 'The first user to sign up on Codesky gets auto-promoted to Superadmin, receives ₹50 welcome wallet credit, and unlocks the startup onboarding wizard!' },
  { keywords: ['refund', 'money back', 'cancellation policy'], answer: 'Yes! If you cancel an upcoming event booking in your Ticket Vault, the ticket price will be refunded instantly back to your digital wallet balance.' },
  { keywords: ['attendance', 'qr scan', 'mark attended'], answer: 'When you arrive at the venue, present your ticket QR code from your Ticket Vault. The event organizer will scan it to mark your attendance.' },
  { keywords: ['certificate', 'download certificate', 'provenance'], answer: 'Once you attend an event and the organizer scans your QR code, a "Download Certificate" button will immediately unlock next to that event in your Ticket Vault!' },
  { keywords: ['bookmark', 'favorite', 'heart', 'save'], answer: 'You can save events by clicking the heart icon on any event card. They will be saved under the "Bookmarked Events" tab on your dashboard.' },
  { keywords: ['notification', 'bell', 'alert'], answer: 'Click the bell icon in the navigation bar to see live notifications about event bookings, wallet deposits, and organizer broadcasts.' },
  { keywords: ['newsletter', 'subscribe', 'broadcast'], answer: 'You are automatically subscribed to our newsletter on signup. Admins can broadcast messages to all subscribers from the newsletter admin panel.' },
];

const HelpdeskWidget = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: 'Hi! I am the Codesky AI Assistant. How can I help you with your events, wallet, or tickets today?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Custom Flow States
  // Steps: 'chat' | 'ask-email' | 'ask-phone' | 'submitting-request' | 'ask-rating' | 'ask-comment' | 'submitting-review' | 'finished'
  const [step, setStep] = useState('chat');
  const [tempEmail, setTempEmail] = useState('');
  const [tempPhone, setTempPhone] = useState('');
  const [requestId, setRequestId] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);

  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, step]);

  const handleSend = async () => {
    const userText = inputValue.trim();
    if (!userText && step !== 'ask-comment') return;

    setInputValue('');

    if (step === 'chat') {
      // Regular Q&A
      setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: userText }]);
      setIsTyping(true);

      setTimeout(() => {
        const textLower = userText.toLowerCase();
        let botResponse = 'I am not sure I understand. Try asking about "wallet top-up", "ticket vault", "promo coupons", or "admin applications"! You can also connect with our team by typing "connect".';
        
        // Check if user wants to connect with team
        if (textLower.includes('connect') || textLower.includes('human') || textLower.includes('team') || textLower.includes('phone') || textLower.includes('callback') || textLower.includes('support')) {
          setMessages(prev => [
            ...prev,
            { id: Date.now() + 1, sender: 'bot', text: 'Sure! I can request a callback from our support team for you. First, please confirm or enter your email address:' }
          ]);
          setStep('ask-email');
          if (user?.email) {
            setInputValue(user.email);
          }
          setIsTyping(false);
          return;
        }

        for (const qa of presetQAs) {
          if (qa.keywords.some(kw => textLower.includes(kw))) {
            botResponse = qa.answer;
            break;
          }
        }

        setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: botResponse }]);
        setIsTyping(false);
      }, 800);

    } else if (step === 'ask-email') {
      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userText)) {
        setMessages(prev => [
          ...prev,
          { id: Date.now(), sender: 'user', text: userText },
          { id: Date.now() + 1, sender: 'bot', text: 'Invalid email address. Please enter a valid email:' }
        ]);
        return;
      }
      setTempEmail(userText);
      setMessages(prev => [
        ...prev,
        { id: Date.now(), sender: 'user', text: userText }
      ]);
      setIsTyping(true);

      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          { id: Date.now() + 1, sender: 'bot', text: 'Thank you! Now, please enter your mobile number so we can call you:' }
        ]);
        setStep('ask-phone');
        setIsTyping(false);
      }, 600);

    } else if (step === 'ask-phone') {
      // Validate phone (at least 6 digits)
      if (userText.length < 6 || !/^\+?[0-9\s\-]+$/.test(userText)) {
        setMessages(prev => [
          ...prev,
          { id: Date.now(), sender: 'user', text: userText },
          { id: Date.now() + 1, sender: 'bot', text: 'Please enter a valid mobile number (digits only):' }
        ]);
        return;
      }
      setTempPhone(userText);
      setMessages(prev => [
        ...prev,
        { id: Date.now(), sender: 'user', text: userText }
      ]);
      setStep('submitting-request');
      setIsTyping(true);

      // Submit request to backend
      try {
        const finalConversation = [...messages, { id: Date.now(), sender: 'user', text: userText }];
        const res = await fetch('/api/support/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail: tempEmail,
            userPhone: userText,
            conversation: finalConversation
          })
        });

        if (res.ok) {
          const reqData = await res.json();
          setRequestId(reqData._id);
          
          setMessages(prev => [
            ...prev,
            { id: Date.now() + 1, sender: 'bot', text: '✅ Support request submitted! Our team will reach out to you soon.' },
            { id: Date.now() + 2, sender: 'bot', text: 'This support session is now resolved. Please take a moment to rate your experience with our helpdesk today:' }
          ]);
          setStep('ask-rating');
        } else {
          throw new Error('Failed to create support request');
        }
      } catch (err) {
        setMessages(prev => [
          ...prev,
          { id: Date.now() + 1, sender: 'bot', text: '⚠️ Connection error. We could not submit your callback request. Please try again later.' }
        ]);
        setStep('chat');
      } finally {
        setIsTyping(false);
      }

    } else if (step === 'ask-comment') {
      // Submit review comment to backend
      setMessages(prev => [
        ...prev,
        { id: Date.now(), sender: 'user', text: userText || '(Skipped comment)' }
      ]);
      setStep('submitting-review');
      setIsTyping(true);

      try {
        const finalConversation = [
          ...messages,
          { id: Date.now(), sender: 'user', text: userText || '(Skipped comment)' }
        ];

        const res = await fetch(`/api/support/request/${requestId}/review`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rating,
            reviewComment: userText || '',
            conversation: finalConversation
          })
        });

        if (res.ok) {
          setMessages(prev => [
            ...prev,
            { id: Date.now() + 1, sender: 'bot', text: '💖 Thank you! Your review has been saved in the administration panel. Have a wonderful day!' }
          ]);
          setStep('finished');
        } else {
          throw new Error('Failed to save review');
        }
      } catch (err) {
        setMessages(prev => [
          ...prev,
          { id: Date.now() + 1, sender: 'bot', text: 'We logged your rating but couldn\'t save comments. Thank you anyway!' }
        ]);
        setStep('finished');
      } finally {
        setIsTyping(false);
      }
    }
  };

  const handleQuickQuestion = (question, answerText) => {
    if (step !== 'chat') return;
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: question }]);
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: answerText }]);
      setIsTyping(false);
    }, 600);
  };

  const handleConnectRequest = () => {
    if (step !== 'chat') return;
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: 'Connect with support team' }]);
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { id: Date.now() + 1, sender: 'bot', text: 'Sure! I can request a callback from our support team for you. First, please confirm or enter your email address:' }
      ]);
      setStep('ask-email');
      if (user?.email) {
        setInputValue(user.email);
      }
      setIsTyping(false);
    }, 500);
  };

  const selectRating = (stars) => {
    setRating(stars);
    setStep('ask-comment');
    setMessages(prev => [
      ...prev,
      { id: Date.now(), sender: 'user', text: `${stars} Stars` },
      { id: Date.now() + 1, sender: 'bot', text: `You rated us ${stars} stars. Would you like to leave any additional feedback comments? (Optional)` }
    ]);
  };

  const resetChat = () => {
    setMessages([
      { id: 1, sender: 'bot', text: 'Hi! I am the Codesky AI Assistant. How can I help you with your events, wallet, or tickets today?' }
    ]);
    setInputValue('');
    setStep('chat');
    setTempEmail('');
    setTempPhone('');
    setRequestId(null);
    setRating(0);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, rotate: 45 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 45 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-primary-500 to-purple-600 text-white shadow-[0_8px_30px_rgba(79,70,229,0.4)] border border-white/20"
          >
            <MessageSquare className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="w-[350px] sm:w-[380px] h-[520px] rounded-3xl bg-slate-900/95 border border-slate-700/80 shadow-[0_10px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl flex flex-col text-white overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-slate-950 to-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-primary-500 to-purple-500 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white animate-pulse" />
                </div>
                <div>
                  <h4 className="font-bold text-sm tracking-wide">Codesky Helpdesk</h4>
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span> AI Agent Active
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-3 text-sm leading-relaxed shadow ${
                      msg.sender === 'user'
                        ? 'bg-primary-600 text-white rounded-tr-none'
                        : 'bg-slate-800/80 text-slate-200 border border-slate-700/50 rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl rounded-tl-none p-3 max-w-[80%] text-sm flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-slate-500 animate-bounce"></span>
                    <span className="h-2 w-2 rounded-full bg-slate-500 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="h-2 w-2 rounded-full bg-slate-500 animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}

              {/* Step 1: Clickable FAQ triggers & Callbacks in chat initialization */}
              {step === 'chat' && messages.length === 1 && (
                <div className="space-y-2 pt-2 animate-fadeIn">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Quick Suggestions:</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleQuickQuestion('How to top up wallet?', 'To add money to your wallet, go to your member dashboard, select the "Digital Wallet" tab, and click "+ Top Up Wallet". You can pay using our secure simulated Razorpay interface!')}
                      className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all"
                    >
                      💳 Wallet & Top-Up
                    </button>
                    <button
                      onClick={() => handleQuickQuestion('Where are my tickets?', 'All your booked tickets are safely stored in your "Ticket Vault" on the dashboard. You can view QR codes, download PDF invoices, email tickets, or cancel upcoming bookings there.')}
                      className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all"
                    >
                      🎟️ Ticket Vault
                    </button>
                    <button
                      onClick={() => handleQuickQuestion('Become an organizer?', 'To request event manager permissions, log in, click the admin option under your profile menu, or toggle admin login parameters to submit an official admin access request.')}
                      className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all"
                    >
                      ⚡ Host Events
                    </button>
                    <button
                      onClick={() => handleQuickQuestion('Are there any promo codes?', 'Try the code "WELCOME100" for a ₹100 discount or "CODESKY50" for ₹50 off in the checkout payment window!')}
                      className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all"
                    >
                      🎁 Promo Coupons
                    </button>
                    <button
                      onClick={handleConnectRequest}
                      className="px-3 py-1.5 text-xs bg-primary-600 hover:bg-primary-700 font-bold border border-primary-500 rounded-xl transition-all flex items-center gap-1 shadow-md shadow-primary-600/10"
                    >
                      <Phone className="h-3 w-3" /> Connect with Team
                    </button>
                  </div>
                </div>
              )}

              {/* Rating Interface inside body when requested */}
              {step === 'ask-rating' && (
                <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 text-center space-y-3 animate-fadeIn">
                  <p className="text-xs font-bold text-slate-400">Rate Helpdesk Experience</p>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => selectRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        className="transition-transform hover:scale-125 focus:outline-none"
                      >
                        <Star
                          className={`h-8 w-8 ${
                            star <= (hoveredRating || rating)
                              ? 'text-amber-500 fill-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                              : 'text-slate-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 font-semibold">Select 1-5 Stars to continue</p>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input Footer */}
            <div className="p-3 bg-slate-950/60 border-t border-slate-800/80 flex flex-col gap-2">
              {step === 'finished' ? (
                <button
                  onClick={resetChat}
                  className="w-full py-2.5 bg-gradient-to-r from-primary-500 to-purple-600 hover:opacity-90 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition-all"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Start New Support Chat
                </button>
              ) : (
                <div className="flex gap-2">
                  <input
                    type={step === 'ask-email' ? 'email' : step === 'ask-phone' ? 'tel' : 'text'}
                    placeholder={
                      step === 'chat'
                        ? 'Ask about tickets, wallet, coupons...'
                        : step === 'ask-email'
                        ? 'Confirm / Enter your email'
                        : step === 'ask-phone'
                        ? 'Enter mobile number'
                        : step === 'ask-comment'
                        ? 'Leave additional comments (optional)...'
                        : 'Submitting...'
                    }
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
                    disabled={step === 'submitting-request' || step === 'submitting-review' || step === 'ask-rating'}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:outline-none focus:border-primary-500 text-sm text-white disabled:opacity-50"
                  />
                  <button
                    onClick={handleSend}
                    disabled={step === 'submitting-request' || step === 'submitting-review' || step === 'ask-rating'}
                    className="h-10 w-10 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:opacity-50 flex items-center justify-center text-white shadow shrink-0 transition-colors"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HelpdeskWidget;
