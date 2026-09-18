import express from 'express';
import nodemailer from 'nodemailer';
import {
  findUserById,
  findUserByEmail,
  createUser,
  listUsers,
  updateUserProfile,
  setUserStatus,
  deleteUser,
  listAdminApplications,
  createAdminApplication,
  addNewsletterSubscriber,
} from '../utils/mysql.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { sendNewsletterEmail } from '../utils/sendNewsletterEmail.js';
import { createMailTransport, getMailSender, getLogoAttachment } from '../utils/mailTransport.js';

const router = express.Router();

// @desc    Get user profile
router.get('/profile', protect, async (req, res) => {
  const user = await findUserById(req.user._id);
  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      credits: user.credits,
      referrals: user.referrals || 0,
      bio: user.bio,
      profilePicture: user.profilePicture || null,
      bookmarks: user.bookmarks || []
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

// @desc    Update user profile
router.put('/profile', protect, async (req, res) => {
  const user = await updateUserProfile(req.user._id, {
    name: req.body.name,
    email: req.body.email,
    bio: req.body.bio,
    profilePicture: req.body.profilePicture,
    password: req.body.password,
  });

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      bio: user.bio,
      profilePicture: user.profilePicture || null,
      role: user.role,
      status: user.status,
      credits: user.credits,
      referrals: user.referrals || 0,
      bookmarks: user.bookmarks || []
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

// @desc    Get all users
router.get('/', protect, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(401).json({ message: 'Not authorized' });
  const users = await listUsers();
  res.json(users.map((u) => ({
    _id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.status,
    createdAt: u.createdAt,
    credits: u.credits,
  })));
});

router.put('/:id/status', protect, admin, async (req, res) => {
  const { status } = req.body;
  const user = await setUserStatus(req.params.id, status);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ message: `User ${status} successfully`, user: { _id: user._id, name: user.name, status: user.status } });
});

// @desc    Delete user (Main Admin only)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    if (req.user.email !== 'admin@codesky.com') {
      return res.status(403).json({ message: 'Only the main admin can delete users' });
    }
    if (req.params.id === req.user._id) {
      return res.status(400).json({ message: 'You cannot delete yourself!' });
    }
    const success = await deleteUser(req.params.id);
    if (success) {
      res.json({ message: 'User deleted successfully' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Toggle Bookmark
router.post('/bookmarks/:eventId', protect, async (req, res) => {
  const user = await findUserById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const bookmarks = Array.isArray(user.bookmarks) ? [...user.bookmarks] : [];
  const index = bookmarks.indexOf(req.params.eventId);
  if (index === -1) {
    bookmarks.push(req.params.eventId);
  } else {
    bookmarks.splice(index, 1);
  }

  const updated = await updateUserProfile(req.user._id, { bookmarks });
  res.json({ bookmarks: updated?.bookmarks || bookmarks });
});

/**
 * Apply to become an administrator (public, auth required)
 * This route is intentionally in userRoutes.js to reuse protect middleware pattern.
 */
router.post('/admin/apply', protect, async (req, res) => {
  try {
    const { reason } = req.body;
    const applicant = await findUserById(req.user._id);
    if (!applicant) return res.status(404).json({ message: 'User not found' });

    // Prevent duplicate pending applications
    const apps = await listAdminApplications();
    const alreadyPending = apps.find((a) => String(a.userId) === String(applicant._id) && a.status === 'pending');
    if (alreadyPending) return res.status(400).json({ message: 'Application already pending' });

    const application = await createAdminApplication({
      userId: applicant._id,
      name: applicant.name,
      email: applicant.email,
      reason: reason || '',
    });

    res.status(201).json({ message: 'Admin application submitted', application });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Configure mock email transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: 'dudley.pfeffer92@ethereal.email', // Replace with real Ethereal creds or env vars in prod
    pass: 'hQk82fF4Wzv7gKZbP3' // Mock credentials
  }
});

// @desc    Process a referral submission
// @route   POST /api/users/referral
// @access  Public
router.post('/referral', async (req, res) => {
  try {
    const { email, referrerId } = req.body;

    if (!email || !referrerId) {
      return res.status(400).json({ message: 'Email and Referrer ID are required' });
    }

    // Find the referrer
    const referrer = await findUserById(referrerId);
    if (!referrer) {
      return res.status(404).json({ message: 'Referrer not found' });
    }

    // Check if the referred user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'This email is already registered! Please log in instead.' });
    }

    // Create a new user with a generated password
    const tempPassword = 'Codesky@' + Math.floor(1000 + Math.random() * 9000);
    const newUser = await createUser({
      name: email.split('@')[0],
      email,
      password: tempPassword,
      role: 'user',
      status: 'active'
    });

    if (!newUser) {
      return res.status(500).json({ message: 'Failed to create user account' });
    }

    // Reward the referrer
    const newCredits = Number(referrer.credits || 0) + 50;
    const newReferrals = Number(referrer.referrals || 0) + 1;
    await updateUserProfile(referrer._id, { credits: newCredits, referrals: newReferrals });

    // Automatically subscribe them to the newsletter
    await addNewsletterSubscriber(email);
    sendNewsletterEmail(email).catch(() => {});

    // Send automated email to the new user with their temporary login credentials
    const mailTransporter = createMailTransport();
    const sender = getMailSender();
    const attachments = getLogoAttachment();
    const websiteOrigin = req.headers.referer || 'http://localhost:5173';

    const referralHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body { font-family: 'Inter', Arial, sans-serif; background: #f3f7ff; margin: 0; padding: 0; }
          .wrapper { padding: 32px 16px; }
          .card { max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 22px; overflow: hidden; box-shadow: 0 18px 45px rgba(15, 23, 42, 0.12); }
          .hero { background: linear-gradient(135deg, #8b5cf6, #ec4899); padding: 40px 24px; text-align: center; color: white; }
          .hero h1 { margin: 0; font-size: 28px; }
          .hero p { margin: 8px 0 0; opacity: 0.95; }
          .content { padding: 32px 28px; color: #334155; line-height: 1.7; }
          .content h2 { margin-top: 0; color: #0f172a; font-size: 24px; }
          .credentials { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 18px 20px; margin: 24px 0; }
          .credentials-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
          .credentials-row:last-child { border-bottom: none; }
          .credentials-label { font-weight: bold; color: #64748b; }
          .credentials-value { font-family: monospace; font-size: 15px; color: #0f172a; font-weight: bold; }
          .button { display: inline-block; background: linear-gradient(135deg, #8b5cf6, #ec4899); color: white; text-decoration: none; padding: 14px 28px; border-radius: 999px; font-weight: 700; text-align: center; margin: 10px 0; }
          .footer { background: #0f172a; padding: 22px; text-align: center; color: #94a3b8; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="card">
            <div class="hero">
              <img src="cid:codesky-logo" alt="Codesky" style="width:72px;height:72px;border-radius:12px;margin-bottom:12px;display:block;margin-left:auto;margin-right:auto;" />
              <h1>You've Been Referred! 🎉</h1>
              <p>Your friend ${referrer.name} invited you to Codesky Events.</p>
            </div>
            <div class="content">
              <h2>Welcome to Codesky,</h2>
              <p>Your friend <strong>${referrer.name}</strong> (${referrer.email}) has invited you to join the premier event management and discovery platform. We have automatically created an active user account for you, and subscribed you to our newsletter updates!</p>
              
              <div class="credentials">
                <div style="font-weight: 800; color: #0f172a; margin-bottom: 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Your Account Login Credentials</div>
                <div class="credentials-row">
                  <span class="credentials-label">Login Email:</span>
                  <span class="credentials-value">${email}</span>
                </div>
                <div class="credentials-row">
                  <span class="credentials-label">Temporary Password:</span>
                  <span class="credentials-value">${tempPassword}</span>
                </div>
              </div>

              <p style="margin-bottom: 24px;">Please use these credentials to log in, explore upcoming events, and update your password under profile settings.</p>
              
              <div style="text-align: center;">
                <a href="${websiteOrigin}/login" class="button">Log In to Codesky Dashboard</a>
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Codesky Events. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await mailTransporter.sendMail({
      from: `"Codesky Events" <${sender}>`,
      to: email,
      subject: `You've been referred to Codesky Events by ${referrer.name}! 🎉`,
      html: referralHtml,
      attachments
    });

    res.json({ 
      success: true, 
      message: 'Referral processed, account created and welcome email sent!' 
    });

  } catch (error) {
    console.error('Error processing referral:', error);
    res.status(500).json({ message: error.message || 'Failed to process referral' });
  }
});

// @desc    Add badge sharing reward credits
// @route   POST /api/users/badge-reward
router.post('/badge-reward', protect, async (req, res) => {
  try {
    const user = await findUserById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const newCredits = Number(user.credits || 0) + 50;
    const updated = await updateUserProfile(req.user._id, { credits: newCredits });
    res.json({ success: true, credits: updated?.credits ?? newCredits, message: '₹50 sharing reward credited successfully!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
