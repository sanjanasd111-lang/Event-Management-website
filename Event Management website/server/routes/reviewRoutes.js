import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import { createReview, listReviewsByEvent, replyToReview } from '../utils/mysql.js';

const router = express.Router();

// @desc    Get all reviews/Q&As for a specific event
// @route   GET /api/reviews/:eventId
router.get('/:eventId', async (req, res) => {
  try {
    const reviews = await listReviewsByEvent(req.params.eventId);
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Post a new review/Q&A for an event
// @route   POST /api/reviews
router.post('/', protect, async (req, res) => {
  try {
    const { eventId, rating, comment } = req.body;
    if (!eventId || !rating) {
      return res.status(400).json({ message: 'Event ID and rating are required' });
    }

    const review = await createReview({
      eventId,
      userId: req.user._id,
      userName: req.user.name,
      rating: Number(rating),
      comment: comment || '',
    });

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Organizer reply to a review/Q&A
// @route   PUT /api/reviews/:id/reply
router.put('/:id/reply', protect, admin, async (req, res) => {
  try {
    const { reply } = req.body;
    if (!reply) {
      return res.status(400).json({ message: 'Reply content is required' });
    }

    const updated = await replyToReview(req.params.id, reply);
    if (!updated) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
