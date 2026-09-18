import express from 'express';
import jwt from 'jsonwebtoken';
import { protect, admin } from '../middleware/authMiddleware.js';
import { sendReminderEmail } from '../utils/sendReminderEmail.js';
import {
  listEvents,
  createEvent,
  deleteEvent,
  updateEvent,
  listRegistrations,
  findUserById,
  getNewsletterSubscribers,
  setEventStatus,
  deriveThumbnailFromMedia,
} from '../utils/mysql.js';
import { sendNewsletterBroadcast } from '../utils/sendNewsletterEmail.js';

const router = express.Router();

const isMainAdmin = (user) => user?.email === 'admin@codesky.com';

const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return next();
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretcodeskyjwtkey2026');
    const user = await findUserById(decoded.id);
    if (user) {
      req.user = { _id: user._id, role: user.role, name: user.name, email: user.email, status: user.status };
    }
  } catch {
    // ignore invalid token for public reads
  }
  next();
};

// @desc    Get events (public: approved only; admin with ?all=true sees all)
router.get('/', optionalAuth, async (req, res) => {
  const { search, isFree, all } = req.query;
  const includeAll = all === 'true' && req.user?.role === 'admin';
  const events = await listEvents({ search, isFree, includeAll });
  res.json(events);
});

// @desc    Create an event
router.post('/', protect, admin, async (req, res) => {
  const { title, description, date, location, price, capacity, tags, speaker, thumbnail, bannerType, bannerMedia, latitude, longitude, ticketTiers, mapLink } = req.body;
  const autoApproved = isMainAdmin(req.user);
  const derivedThumb = thumbnail || deriveThumbnailFromMedia(bannerType, bannerMedia);

  const event = await createEvent({
    title,
    description,
    date,
    location,
    price,
    capacity,
    organizer: req.user._id,
    tags,
    speaker,
    thumbnail: derivedThumb,
    bannerType,
    bannerMedia,
    latitude,
    longitude,
    ticketTiers,
    mapLink,
    status: autoApproved ? 'approved' : 'pending',
  });

  getNewsletterSubscribers().then((subscribers) => {
    if (event.status === 'approved') {
      subscribers.forEach((email) => {
        sendNewsletterBroadcast(email, event).catch(() => {});
      });
    }
  }).catch(() => {});

  res.status(201).json(event);
});

// @desc    Approve pending event (main admin only)
router.put('/:id/approve', protect, admin, async (req, res) => {
  if (!isMainAdmin(req.user)) {
    return res.status(403).json({ message: 'Only the main admin can approve events' });
  }
  const event = await setEventStatus(req.params.id, 'approved');
  if (!event) return res.status(404).json({ message: 'Event not found' });
  res.json({ message: 'Event approved and now visible on the website', event });
});

// @desc    Reject pending event (main admin only)
router.put('/:id/reject', protect, admin, async (req, res) => {
  if (!isMainAdmin(req.user)) {
    return res.status(403).json({ message: 'Only the main admin can reject events' });
  }
  const event = await setEventStatus(req.params.id, 'rejected');
  if (!event) return res.status(404).json({ message: 'Event not found' });
  res.json({ message: 'Event rejected', event });
});

// @desc    Delete an event
router.delete('/:id', protect, admin, async (req, res) => {
  const removed = await deleteEvent(req.params.id);
  if (removed) {
    res.json({ message: 'Event removed' });
  } else {
    res.status(404).json({ message: 'Event not found' });
  }
});

// @desc    Update an event
router.put('/:id', protect, admin, async (req, res) => {
  const updates = { ...req.body };
  if (updates.bannerMedia || updates.bannerType) {
    const thumb = deriveThumbnailFromMedia(
      updates.bannerType || req.body.bannerType,
      updates.bannerMedia || req.body.bannerMedia
    );
    if (thumb) updates.thumbnail = thumb;
  }
  if (!isMainAdmin(req.user)) {
    updates.status = 'pending';
  }
  const event = await updateEvent(req.params.id, updates);
  if (event) {
    res.json(event);
  } else {
    res.status(404).json({ message: 'Event not found' });
  }
});

// @desc    Email All Attendees (Admin Mass Action)
router.post('/remind-all', protect, admin, async (req, res) => {
  const { message } = req.body;

  const attendees = await listRegistrations();
  const nonCancelled = attendees.filter((r) => r.status !== 'cancelled');
  const uniqueUserIds = [...new Set(nonCancelled.map((a) => a.user))];

  for (const userId of uniqueUserIds) {
    const user = await findUserById(userId);
    if (user) {
      sendReminderEmail(user.email, user.name, { title: 'All Upcoming Codesky Events' }, message);
    }
  }

  res.json({ message: `Reminder sent to ${uniqueUserIds.length} unique attendees` });
});

export default router;
