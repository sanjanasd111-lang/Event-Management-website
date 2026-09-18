import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { listNotifications, markNotificationRead } from '../utils/mysql.js';

const router = express.Router();

// @desc    Get all notifications for the logged in user
// @route   GET /api/notifications
router.get('/', protect, async (req, res) => {
  try {
    const notifications = await listNotifications(req.user._id);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
router.put('/:id/read', protect, async (req, res) => {
  try {
    await markNotificationRead(req.params.id);
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
