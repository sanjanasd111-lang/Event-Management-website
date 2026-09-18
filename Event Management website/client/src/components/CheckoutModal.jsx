import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const CheckoutModal = ({ event, onClose }) => {
  const [promo, setPromo] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [agree, setAgree] = useState(false);
  
  const [status, setStatus] = useState('idle'); // idle, processing, success, error
  const [errorMsg, setErrorMsg] = useState('');
  const { token, user, updateUser } = useAuth();
  const navigate = useNavigate();

  const subtotal = event.price * quantity;
  const discount = promoApplied ? subtotal * 0.2 : 0; // 20% discount
  const taxableAmount = subtotal - discount;
  const tax = taxableAmount > 0 ? taxableAmount * 0.05 : 0; // 5% tax
  const finalPrice = taxableAmount + tax;
  const walletBalance = Number(user?.credits || 0);

  const handleApplyPromo = (e) => {
    e.preventDefault();
    if (promo.toUpperCase() === 'CODESKY50') {
      setPromoApplied(true);
      setErrorMsg('');
    } else {
      setErrorMsg('Invalid promo code. Try CODESKY50');
    }
  };

  const handlePayWithWallet = async () => {
    if (!agree) return setErrorMsg('You must agree to the Refund Policy before proceeding.');
    setErrorMsg('');

    if (walletBalance < finalPrice) {
      return setErrorMsg(`Insufficient wallet balance (₹${walletBalance.toFixed(2)}). Please top up your wallet in your profile or use Razorpay below.`);
    }

    setStatus('processing');
    try {
      const res = await fetch('/api/payments/pay-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: finalPrice, eventId: event._id })
      });
      const data = await res.json();
      if (res.ok) {
        if (updateUser) updateUser({ credits: data.credits });
        completeRegistration(data.transactionId);
      } else {
        setStatus('error');
        setErrorMsg(data.message || 'Failed to deduct wallet balance');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMsg('Network error occurred during wallet transaction.');
    }
  };

  const completeRegistration = async (txnId) => {
    try {
      const regRes = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ eventId: event._id, paymentStatus: 'paid', transactionId: txnId, quantity })
      });
      const regData = await regRes.json();

      if (regRes.ok) {
        setStatus('success');
        setTimeout(() => navigate('/dashboard'), 2000);
      } else {
        setStatus('error');
        setErrorMsg(regData.message || 'Registration failed after payment');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMsg('Network error occurred during registration.');
    }
  };

  const handlePayWithRazorpay = async (e) => {
    e.preventDefault();
    if (!agree) return setErrorMsg('You must agree to the Refund Policy before proceeding.');
    setErrorMsg('');

    if (finalPrice === 0) {
      setStatus('processing');
      completeRegistration('free_claim_' + Date.now());
      return;
    }

    if (!window.Razorpay) {
      return setErrorMsg('Razorpay SDK not loaded. Please verify your internet connection.');
    }

    setStatus('processing');

    const options = {
      key: "rzp_test_T6jHuiCoIBCbLJ",
      amount: Math.round(finalPrice * 100), // Amount in paise
      currency: "INR",
      name: "Codesky Official",
      description: `Ticket Registration: ${event.title} (x${quantity})`,
      image: "/images/codesky.png",
      handler: async function (response) {
        try {
          await fetch('/api/payments/verify-razorpay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              razorpayPaymentId: response.razorpay_payment_id,
              amount: finalPrice,
              eventId: event._id
            })
          });
        } catch {}

        completeRegistration(response.razorpay_payment_id);
      },
      prefill: {
        name: user?.name || "Codesky Attendee",
        email: user?.email || "attendee@codesky.com",
        contact: user?.phone || "9876543210"
      },
      notes: {
        eventId: event._id,
        quantity: quantity
      },
      theme: {
        color: "#8b5cf6"
      },
      modal: {
        ondismiss: function () {
          setStatus('idle');
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (resp) {
      setStatus('error');
      setErrorMsg(resp.error?.description || 'Payment Failed or Cancelled');
    });
    rzp.open();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 relative flex flex-col max-h-[90vh]"
      >
        {/* Glow Header Background */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-primary-600 via-purple-600 to-indigo-600 opacity-90 -z-10" />

        <div className="p-6 text-white relative shrink-0">
          <button 
            onClick={onClose} 
            className="absolute right-4 top-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-all duration-200"
          >
            ✕
          </button>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-400 text-slate-950 shadow-sm animate-pulse">
              Live Test Gateway
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Express Checkout</h2>
          <p className="text-purple-100 text-xs mt-0.5">Instant confirmation powered by Razorpay Sandbox</p>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-white dark:bg-slate-900 rounded-t-3xl -mt-4 shadow-inner space-y-6">
          {/* Order Summary Card */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 space-y-3">
            <div className="flex justify-between items-start">
              <div className="pr-2">
                <h3 className="font-bold text-slate-800 dark:text-white text-base leading-snug">{event.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">📅 {event.date || 'Upcoming Event'}</p>
              </div>
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <span className="text-xs font-semibold text-slate-500">Qty:</span>
                <select 
                  value={quantity} 
                  onChange={e => setQuantity(Number(e.target.value))} 
                  className="bg-transparent font-bold text-sm text-primary-600 dark:text-primary-400 outline-none cursor-pointer"
                >
                  {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{n}</option>)}
                </select>
              </div>
            </div>

            <div className="border-t border-slate-200/60 dark:border-slate-700/60 pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal ({quantity} {quantity > 1 ? 'tickets' : 'ticket'})</span>
                <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
              </div>
              {promoApplied && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Promo Applied (CODESKY50)</span>
                  <span>-₹{discount.toFixed(2)}</span>
                </div>
              )}
              {finalPrice > 0 && (
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Taxes & Platform Fees (5%)</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700 text-base font-black text-slate-900 dark:text-white">
                <span>Total Amount</span>
                <span className="text-xl text-primary-600 dark:text-primary-400">{finalPrice === 0 ? 'FREE' : `₹${finalPrice.toFixed(2)}`}</span>
              </div>
            </div>
          </div>

          {/* Status Indicators */}
          {status === 'success' ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800">
              <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center text-3xl mx-auto mb-3 shadow-lg shadow-emerald-500/30">✓</div>
              <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-200">Payment Successful!</h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">Your VIP ticket is confirmed. Redirecting to dashboard...</p>
            </motion.div>
          ) : (
            <form onSubmit={handlePayWithRazorpay} className="space-y-5">
              {errorMsg && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <span>⚠️</span> {errorMsg}
                </motion.div>
              )}
              
              {event.price > 0 && !promoApplied && (
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Enter Promo Code (Try CODESKY50)" 
                    value={promo} 
                    onChange={e=>setPromo(e.target.value)} 
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-primary-500" 
                  />
                  <button 
                    onClick={handleApplyPromo} 
                    type="button" 
                    className="px-5 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors"
                  >
                    Apply
                  </button>
                </div>
              )}

              {/* Payment Info Box */}
              {finalPrice > 0 && (
                <div className="p-3.5 bg-purple-50 dark:bg-purple-950/20 rounded-xl border border-purple-100 dark:border-purple-900/30 flex items-center gap-3">
                  <div className="text-2xl">⚡</div>
                  <div className="text-xs text-purple-900 dark:text-purple-200">
                    <p className="font-bold">Digital Wallet Balance: ₹{walletBalance.toFixed(2)}</p>
                    <p className="opacity-80">Pay instantly from your wallet balance or proceed with Razorpay Gateway below.</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2.5 pt-1">
                <input 
                  type="checkbox" 
                  id="refund" 
                  checked={agree} 
                  onChange={e=>setAgree(e.target.checked)} 
                  className="mt-0.5 w-4 h-4 accent-primary-600 rounded cursor-pointer" 
                />
                <label htmlFor="refund" className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none leading-relaxed">
                  I agree to Codesky's <span className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">Terms & Conditions</span> and understand this transaction is securely processed.
                </label>
              </div>

              {finalPrice > 0 && (
                <button 
                  type="button" 
                  onClick={handlePayWithWallet}
                  disabled={status === 'processing'}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 text-white font-black text-sm shadow-lg shadow-teal-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex justify-center items-center gap-2 border border-teal-400/30"
                >
                  <span>⚡ Pay ₹{finalPrice.toFixed(2)} from Digital Wallet (Bal: ₹{walletBalance.toFixed(2)})</span>
                </button>
              )}

              <button 
                type="submit" 
                disabled={status === 'processing'}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary-600 via-purple-600 to-indigo-600 text-white font-black text-base shadow-xl shadow-primary-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex justify-center items-center gap-2"
              >
                {status === 'processing' ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Processing Transaction...</span>
                  </>
                ) : (
                  <>
                    <span>💳 {finalPrice === 0 ? `Claim ${quantity} Free Ticket(s)` : `Pay ₹${finalPrice.toFixed(2)} via Razorpay`}</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default CheckoutModal;
