import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { sendTicketEmail } from '../utils/sendTicketEmail.js';
import { sendCancellationEmail } from '../utils/sendCancellationEmail.js';
import { sendCertificateEmail } from '../utils/sendCertificateEmail.js';
import {
  createRegistration,
  findEventById,
  findRegistrationById,
  findRegistrationsByUser,
  listRegistrations,
  findUserById,
  updateRegistrationStatus,
} from '../utils/mysql.js';

const router = express.Router();

// @desc    Book ticket for event
router.post('/', protect, async (req, res) => {
  const { eventId, paymentStatus, ticketTier } = req.body;
  const event = await findEventById(eventId);

  if (!event) return res.status(404).json({ message: 'Event not found' });

  const registration = await createRegistration({
    userId: req.user._id,
    eventId,
    paymentStatus: paymentStatus || (event.price === 0 ? 'paid' : 'unpaid'),
    ticketTier: ticketTier || 'general',
  });

  if (registration?.error) {
    return res.status(400).json({ message: registration.error });
  }

  const user = await findUserById(req.user._id);
  if (user) {
    await sendTicketEmail(user.email, user.name, event, registration);
  }

  res.status(201).json(registration);
});

// @desc    Get my tickets
router.get('/my-tickets', protect, async (req, res) => {
  const myRegs = await findRegistrationsByUser(req.user._id);
  const populated = myRegs.filter((r) => r.eventDetails);
  res.json(populated);
});

// @desc    Cancel registration
router.delete('/:id', protect, async (req, res) => {
  const reg = await findRegistrationById(req.params.id);
  if (reg && reg.user === req.user._id) {
    await updateRegistrationStatus(req.params.id, { status: 'cancelled' });

    const user = await findUserById(req.user._id);
    const event = await findEventById(reg.event);
    if (user && event) {
      await sendCancellationEmail(user.email, user.name, event, false);
    }

    res.json({ message: 'Registration cancelled' });
  } else {
    res.status(404).json({ message: 'Registration not found' });
  }
});

// @desc    Email ticket to user (Manual from Dashboard)
router.post('/:id/email-ticket', protect, async (req, res) => {
  try {
    const reg = await findRegistrationById(req.params.id);
    if (!reg || reg.user !== req.user._id) return res.status(404).json({ message: 'Registration not found' });

    const user = await findUserById(req.user._id);
    const event = await findEventById(reg.event);

    if (user && event) {
      const success = await sendTicketEmail(user.email, user.name, event, reg);
      if (success) {
        return res.json({ message: 'Ticket sent to your email successfully!' });
      } else {
        return res.json({ message: 'Ticket generated! (Email dispatch skipped due to offline/network status)' });
      }
    } else {
      res.status(404).json({ message: 'User or Event not found' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Email certificate to user
router.post('/:id/email-certificate', protect, async (req, res) => {
  try {
    const { pdfBase64Data, certName } = req.body;

    if (!pdfBase64Data) return res.status(400).json({ message: 'No PDF data provided' });

    const reg = await findRegistrationById(req.params.id);
    if (!reg || reg.user !== req.user._id) return res.status(404).json({ message: 'Registration not found' });

    const user = await findUserById(req.user._id);
    const event = await findEventById(reg.event);

    if (user && event) {
      const success = await sendCertificateEmail(user.email, certName || user.name, event.title, pdfBase64Data);
      if (success) {
        return res.json({ message: 'Certificate sent to your email successfully!' });
      } else {
        return res.json({ message: 'Certificate generated! (Email dispatch skipped due to offline/network status)' });
      }
    } else {
      res.status(404).json({ message: 'User or Event not found' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Get all registrations (Admin)
router.get('/all', protect, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(401).json({ message: 'Not authorized' });

  const populated = await listRegistrations();
  res.json(populated);
});

// @desc    Mark attendance (Admin)
router.put('/:id/attend', protect, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(401).json({ message: 'Not authorized' });
  const reg = await findRegistrationById(req.params.id);
  if (reg) {
    const updated = await updateRegistrationStatus(req.params.id, { attended: !reg.attended });
    res.json(updated);
  } else {
    res.status(404).json({ message: 'Registration not found' });
  }
});

// @desc    Cancel registration (Admin)
router.delete('/admin/:id', protect, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(401).json({ message: 'Not authorized' });
  const reg = await findRegistrationById(req.params.id);
  if (reg) {
    await updateRegistrationStatus(req.params.id, { status: 'cancelled' });

    const user = await findUserById(reg.user);
    const event = await findEventById(reg.event);
    if (user && event) {
      await sendCancellationEmail(user.email, user.name, event, true);
    }

    res.json({ message: 'Registration cancelled by Admin' });
  } else {
    res.status(404).json({ message: 'Registration not found' });
  }
});

export default router;
