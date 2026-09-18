import express from 'express';
import fs from 'fs';
import path from 'path';
import { protect, admin } from '../middleware/authMiddleware.js';
import { addNewsletterSubscriber, getNewsletterSubscribers, getSetting, listEvents, listUsers, listRegistrations, setSetting, isDatabaseReady } from '../utils/mysql.js';
import { mockDb } from '../data/mockDb.js';
import { sendNewsletterEmail, sendNewsletterBroadcast } from '../utils/sendNewsletterEmail.js';

const router = express.Router();

// @desc    Get public settings
router.get('/', async (req, res) => {
  const banner = await getSetting('globalBanner', '');
  const heroMediaType = await getSetting('heroMediaType', 'video');
  const heroMediaUrl = await getSetting('heroMediaUrl', '');
  const heroTitle = await getSetting('heroTitle', 'Experience events worth showing up for.');
  const heroSubtitle = await getSetting('heroSubtitle', 'Discover concerts, conferences, and workshops hand-picked by our curators. Register securely with your wallet, earn credits, and download verified attendance certificates.');
  const heroBannerMode = await getSetting('heroBannerMode', 'custom');
  const newsletter = await getNewsletterSubscribers();
  res.json({ globalBanner: banner, heroMediaType, heroMediaUrl, heroTitle, heroSubtitle, heroBannerMode, newsletter });
});

// @desc    Get detailed settings (Admin only)
router.get('/detailed', protect, admin, async (req, res) => {
  const platformFee = await getSetting('platformFee', '5');
  const minWithdrawal = await getSetting('minWithdrawal', '105');
  const globalBanner = await getSetting('globalBanner', '');
  const heroMediaType = await getSetting('heroMediaType', 'video');
  const heroMediaUrl = await getSetting('heroMediaUrl', '');
  const heroTitle = await getSetting('heroTitle', 'Experience events worth showing up for.');
  const heroSubtitle = await getSetting('heroSubtitle', 'Discover concerts, conferences, and workshops hand-picked by our curators. Register securely with your wallet, earn credits, and download verified attendance certificates.');
  const heroBannerMode = await getSetting('heroBannerMode', 'custom');
  res.json({ platformFee: Number(platformFee), minWithdrawal: Number(minWithdrawal), globalBanner, heroMediaType, heroMediaUrl, heroTitle, heroSubtitle, heroBannerMode });
});

// @desc    Update detailed settings (Admin only)
router.put('/detailed', protect, admin, async (req, res) => {
  const { platformFee, minWithdrawal, globalBanner, heroMediaType, heroMediaUrl, heroTitle, heroSubtitle, heroBannerMode } = req.body;
  if (platformFee !== undefined) await setSetting('platformFee', String(platformFee));
  if (minWithdrawal !== undefined) await setSetting('minWithdrawal', String(minWithdrawal));
  if (heroMediaType !== undefined) await setSetting('heroMediaType', String(heroMediaType));
  if (heroMediaUrl !== undefined) await setSetting('heroMediaUrl', String(heroMediaUrl));
  if (heroTitle !== undefined) await setSetting('heroTitle', String(heroTitle));
  if (heroSubtitle !== undefined) await setSetting('heroSubtitle', String(heroSubtitle));
  if (heroBannerMode !== undefined) await setSetting('heroBannerMode', String(heroBannerMode));
  if (globalBanner !== undefined) {
    await setSetting('globalBanner', globalBanner || '');
    if (globalBanner) {
      const subscribers = await getNewsletterSubscribers();
      for (const email of subscribers) {
        sendNewsletterBroadcast(email, { title: '📢 New Codesky Announcement' }, globalBanner).catch(() => {});
      }
    }
  }
  res.json({ message: 'Settings updated successfully' });
});

// @desc    Update global banner (Admin)
router.put('/banner', protect, admin, async (req, res) => {
  const { banner } = req.body;
  await setSetting('globalBanner', banner || '');

  if (banner) {
    const subscribers = await getNewsletterSubscribers();
    for (const email of subscribers) {
      sendNewsletterBroadcast(email, { title: '📢 New Codesky Announcement' }, banner).catch(() => {});
    }
  }

  res.json({ message: 'Banner updated successfully', banner: banner || '' });
});

// @desc    Retrieve storage status for the admin panel
router.get('/storage', protect, admin, async (req, res) => {
  try {
    const users = await listUsers();
    const events = await listEvents({});
    const registrations = await listRegistrations();
    const subscribers = await getNewsletterSubscribers();

    const dbPath = path.resolve('data/appDatabase.json');
    let lastModified = 'N/A';
    if (fs.existsSync(dbPath)) {
      lastModified = fs.statSync(dbPath).mtime.toLocaleString();
    }

    res.json({
      backend: isDatabaseReady() ? 'MySQL Database' : 'JSON file store',
      file: 'server/data/appDatabase.json',
      absolutePath: dbPath,
      lastModified,
      users: users.length,
      events: events.length,
      registrations: registrations.length,
      newsletterSubscribers: subscribers.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Retrieve raw JSON store data (Admin)
router.get('/storage/raw', protect, admin, async (req, res) => {
  try {
    const dbPath = path.resolve('data/appDatabase.json');
    if (fs.existsSync(dbPath)) {
      const content = fs.readFileSync(dbPath, 'utf8');
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="appDatabase.json"');
      return res.send(content);
    }
    res.json(mockDb);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Generate Security Audit CSV
router.get('/audit', protect, admin, async (req, res) => {
  try {
    const users = await listUsers();
    const events = await listEvents({});
    const registrations = await listRegistrations();

    let csv = 'Timestamp,Type,Detail,User\n';
    users.forEach((u) => {
      csv += `N/A,User_Created,${u.email},${u.name}\n`;
    });
    events.forEach((e) => {
      csv += `${e.date},Event_Created,${e.title},Admin\n`;
    });
    registrations.forEach((r) => {
      csv += `${r.createdAt || new Date().toISOString()},Registration,${r.eventDetails?.title || r.event},${r.user?.email || r.user}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="security_audit.csv"');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Subscribe to Newsletter
router.post('/newsletter', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email required' });

  const exists = (await getNewsletterSubscribers()).includes(email);
  if (exists) {
    return res.status(400).json({ message: 'Already subscribed' });
  }

  await addNewsletterSubscriber(email);
  sendNewsletterEmail(email).catch(() => {});
  res.json({ message: 'Subscribed successfully! A welcome email has been sent.' });
});

// @desc    Broadcast to newsletter subscribers (Admin)
router.post('/newsletter/broadcast', protect, admin, async (req, res) => {
  const { title, message } = req.body;
  const subscribers = await getNewsletterSubscribers();
  if (!subscribers || !subscribers.length) {
    return res.status(400).json({ message: 'No newsletter subscribers found.' });
  }

  for (const email of subscribers) {
    sendNewsletterBroadcast(email, { title: title || 'Codesky Newsletter Update' }, message).catch(() => {});
  }

  res.json({ message: `Broadcast sent to ${subscribers.length} newsletter subscribers!` });
});

export default router;
