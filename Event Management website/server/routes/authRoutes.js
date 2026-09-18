import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { createUser, findUserByEmail, findUserById, addNewsletterSubscriber } from '../utils/mysql.js';
import { sendWelcomeEmail } from '../utils/sendWelcomeEmail.js';
import { sendOtpEmail } from '../utils/sendOtpEmail.js';
import { sendLoginAlertEmail } from '../utils/sendLoginAlertEmail.js';
import { sendNewsletterEmail } from '../utils/sendNewsletterEmail.js';

const router = express.Router();
const otpStore = new Map(); // email -> { code, expires, authData }

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretcodeskyjwtkey2026', { expiresIn: '30d' });
};

// @desc    Send OTP verification code
router.post('/send-otp', async (req, res) => {
  try {
    const { email, name, purpose, authData } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const cleanEmail = email.toLowerCase().trim();

    if (purpose === 'login') {
      const user = await findUserByEmail(cleanEmail);
      if (!user) {
        return res.status(404).json({ message: 'Account not found with this email. Would you like to Sign Up instead?', notFound: true });
      }
      if (user.status === 'suspended' || user.status === 'blocked') {
        return res.status(403).json({ message: 'This account has been suspended. Please contact support.' });
      }
      if (authData?.password && !(await bcrypt.compare(authData.password, user.password))) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
    } else if (purpose === 'register') {
      const userExists = await findUserByEmail(cleanEmail);
      if (userExists) {
        return res.status(400).json({ message: 'User email already exists! Please Log In instead.', exists: true });
      }
    }

    const existing = otpStore.get(cleanEmail);
    let code;
    if (existing && existing.expires > Date.now() && (existing.expires - Date.now() > 8 * 60 * 1000)) {
      code = existing.code;
      existing.authData = authData;
    } else {
      code = Math.floor(100000 + Math.random() * 900000).toString();
      otpStore.set(cleanEmail, {
        code,
        expires: Date.now() + 10 * 60 * 1000, // 10 minutes
        authData
      });
    }

    // Send email synchronously to guarantee delivery
    const sent = await sendOtpEmail(cleanEmail, name || authData?.name || cleanEmail.split('@')[0], code);

    if (!sent) {
      console.warn(`⚠️ Failed to send OTP email to ${cleanEmail}. Check SMTP settings or Gmail limits.`);
    }

    res.json({ 
      success: true, 
      message: sent ? 'Verification code sent to your email!' : 'Code generated (Email delivery delayed)', 
      devOtp: code 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Verify OTP code and issue session token
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and verification code are required' });

    const cleanEmail = email.toLowerCase().trim();
    const record = otpStore.get(cleanEmail);
    const receivedCode = String(otp).trim();

    console.log(`[OTP VERIFY ATTEMPT] Email: ${cleanEmail} | Expected: ${record?.code} | Received: ${receivedCode}`);

    if (!record || record.code !== receivedCode) {
      return res.status(400).json({ message: 'Invalid verification code! Please double-check the 6-digit code sent to your email.' });
    }
    if (Date.now() > record.expires) {
      otpStore.delete(cleanEmail);
      return res.status(400).json({ message: 'Verification code has expired. Please click resend code.' });
    }

    const authData = record.authData || {};
    otpStore.delete(cleanEmail);

    if (authData.action === 'register') {
      const user = await createUser({ name: authData.name, email: cleanEmail, password: authData.password, role: 'user', status: 'active' });
      if (user) {
        setTimeout(() => sendWelcomeEmail(user.email, user.name), 10);
        try {
          await addNewsletterSubscriber(user.email);
          setTimeout(() => sendNewsletterEmail(user.email), 20);
        } catch (nsErr) {
          console.error('Failed to auto-subscribe user to newsletter:', nsErr);
        }
      }
      return res.status(201).json({
        _id: user._id, name: user.name, email: user.email, role: user.role, status: user.status, isFirstUser: user.isFirstUser, token: generateToken(user._id)
      });
    } else if (authData.action === 'google') {
      let user = await findUserByEmail(cleanEmail);
      if (!user) {
        user = await createUser({ name: authData.name || cleanEmail.split('@')[0], email: cleanEmail, password: Math.random().toString(36).slice(-12) + 'GAuth!', role: 'user', status: 'active' });
        if (user) setTimeout(() => sendWelcomeEmail(user.email, user.name), 10);
      }
      return res.json({
        _id: user._id, name: user.name, email: user.email, role: user.role, status: user.status, isFirstUser: user.isFirstUser, token: generateToken(user._id)
      });
    } else {
      // login
      const user = await findUserByEmail(cleanEmail);
      if (!user) return res.status(404).json({ message: 'User record not found' });
      return res.json({
        _id: user._id, name: user.name, email: user.email, role: user.role, status: user.status, isFirstUser: user.isFirstUser, token: generateToken(user._id)
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Register a new user directly (fallback)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, bio, profilePicture } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email, and password are required' });

    const userExists = await findUserByEmail(email);
    if (userExists) return res.status(400).json({ message: 'User email already exists! Please Log In instead.', exists: true });

    const user = await createUser({ name, email, password, role: 'user', status: 'active', phone, bio, profilePicture });
    if (user) {
      setTimeout(() => sendWelcomeEmail(user.email, user.name), 10);
      try {
        await addNewsletterSubscriber(user.email);
        setTimeout(() => sendNewsletterEmail(user.email), 20);
      } catch (nsErr) {
        console.error('Failed to auto-subscribe user to newsletter:', nsErr);
      }
    }

    res.status(201).json({
      _id: user._id, name: user.name, email: user.email, role: user.role, status: user.status, isFirstUser: user.isFirstUser, token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Auth user & get token directly (fallback)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await findUserByEmail(email);

    if (!user) return res.status(404).json({ message: 'Account not found with this email. Would you like to Sign Up instead?', notFound: true });
    if (user.status === 'suspended' || user.status === 'blocked') return res.status(403).json({ message: 'This account has been suspended.' });

    if (await bcrypt.compare(password, user.password)) {
      setTimeout(() => sendLoginAlertEmail(user.email, user.name), 10);
      res.json({
        _id: user._id, name: user.name, email: user.email, role: user.role, status: user.status, isFirstUser: user.isFirstUser, token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Google OAuth Auth directly (fallback)
router.post('/google', async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!email) return res.status(400).json({ message: 'Google email is required' });

    let user = await findUserByEmail(email);
    if (!user) {
      user = await createUser({ name: name || email.split('@')[0], email, password: Math.random().toString(36).slice(-12) + 'GAuth!', role: 'user', status: 'active' });
      if (user) {
        setTimeout(() => sendWelcomeEmail(user.email, user.name), 10);
        try {
          await addNewsletterSubscriber(user.email);
          setTimeout(() => sendNewsletterEmail(user.email), 20);
        } catch (nsErr) {
          console.error('Failed to auto-subscribe user to newsletter:', nsErr);
        }
      }
    } else {
      setTimeout(() => sendLoginAlertEmail(user.email, user.name), 10);
    }

    if (user.status === 'suspended' || user.status === 'blocked') return res.status(403).json({ message: 'This account has been suspended.' });

    res.json({
      _id: user._id, name: user.name, email: user.email, role: user.role, status: user.status, isFirstUser: user.isFirstUser, token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretcodeskyjwtkey2026');
    const user = await findUserById(decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

export default router;
