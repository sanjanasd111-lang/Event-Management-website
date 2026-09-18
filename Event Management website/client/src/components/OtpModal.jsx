import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const OtpModal = ({ isOpen, onClose, email, onVerifySuccess, onResend, devOtp }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    let interval = null;
    if (isOpen && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, timer]);

  useEffect(() => {
    if (isOpen) {
      setOtp(['', '', '', '', '', '']);
      setError('');
      setSuccess(false);
      setTimer(60);
      setTimeout(() => inputRefs.current[0]?.focus(), 200);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    // Take the last character typed
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Move focus to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').slice(0, 6).split('');
    if (pasteData.every((char) => !isNaN(char))) {
      const newOtp = [...otp];
      pasteData.forEach((char, i) => {
        if (i < 6) newOtp[i] = char;
      });
      setOtp(newOtp);
      inputRefs.current[Math.min(pasteData.length, 5)]?.focus();
    }
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpCode })
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          onVerifySuccess(data);
        }, 1200);
      } else {
        setError(data.message || 'Invalid OTP verification code');
      }
    } catch (err) {
      setError('Verification failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendClick = async () => {
    if (timer > 0) return;
    setTimer(60);
    setError('');
    if (onResend) await onResend();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 25 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          className="relative w-full max-w-md overflow-hidden rounded-[32px] bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 p-8 shadow-[0_0_60px_rgba(99,102,241,0.3)] border border-slate-700/80 text-white"
        >
          {/* Ambient Glows */}
          <div className="absolute -top-20 -left-20 h-40 w-40 rounded-full bg-blue-600/30 blur-3xl pointer-events-none animate-pulse"></div>
          <div className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-purple-600/30 blur-3xl pointer-events-none animate-pulse"></div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-6 top-6 flex h-9 w-9 items-center justify-center rounded-full bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white transition-all border border-slate-700/50"
          >
            ✕
          </button>

          <AnimatePresence>
            {success ? (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="py-12 text-center space-y-4"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-5xl shadow-[0_0_40px_rgba(16,185,129,0.5)] border-2 border-white/20"
                >
                  🎉
                </motion.div>
                <h3 className="text-2xl font-black text-white">Identity Verified!</h3>
                <p className="text-sm text-emerald-400 font-semibold uppercase tracking-wider">Accessing Codesky OS...</p>
              </motion.div>
            ) : (
              <div>
                {/* Header */}
                <div className="text-center mb-6">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-3xl shadow-xl border border-blue-400/30 mb-4 animate-bounce-short">
                    🔐
                  </div>
                  <h3 className="text-2xl font-black tracking-tight text-white">Two-Factor OTP Verification</h3>
                  <p className="text-xs text-slate-400 mt-2 font-medium leading-relaxed">
                    We sent a secure 6-digit verification code to <br />
                    <span className="font-bold text-blue-400 underline">{email}</span>
                  </p>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-semibold text-center flex items-center justify-center gap-2"
                  >
                    <span>⚠️</span> {error}
                  </motion.div>
                )}

                {/* OTP Form */}
                <form onSubmit={handleVerify} className="space-y-8">
                  <div className="flex justify-between gap-2" onPaste={handlePaste}>
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => (inputRefs.current[i] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleChange(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        disabled={loading}
                        className="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-black rounded-2xl bg-slate-800/80 border-2 border-slate-700 text-white focus:border-blue-500 focus:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all shadow-inner"
                      />
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otp.join('').length < 6}
                    className="w-full group relative overflow-hidden rounded-2xl p-[2px] font-bold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_35px_rgba(79,70,229,0.4)] disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 animate-gradient-xy"></span>
                    <span className="relative flex items-center justify-center gap-2 px-6 py-4 rounded-[14px] bg-slate-900 text-white transition-colors duration-300 group-hover:bg-transparent font-extrabold tracking-wide">
                      {loading ? 'Verifying OTP Code...' : 'Verify & Enter Portal &rarr;'}
                    </span>
                  </button>
                </form>

                {/* Footer Resend */}
                <div className="mt-8 pt-6 border-t border-slate-800 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                  <span>Didn&apos;t receive the security code?</span>
                  <button
                    type="button"
                    onClick={handleResendClick}
                    disabled={timer > 0}
                    className="font-bold text-blue-400 hover:text-blue-300 disabled:text-slate-600 underline transition-colors"
                  >
                    {timer > 0 ? `Resend code in ${timer}s` : 'Resend Verification Code Now'}
                  </button>
                </div>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default OtpModal;
