import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  listAdminApplications,
  setAdminApplicationDecision,
  createAdminUserForEmail,
  revokeAdminAccess,
  deleteAdminApplication,
  findUserByEmail,
  deleteUser,
} from '../utils/mysql.js';
import { sendAdminInviteEmail } from '../utils/sendAdminInviteEmail.js';
import crypto from 'node:crypto';

const router = express.Router();

const isMainAdmin = (req) => req.user?.email === 'admin@codesky.com';

// Admin: list applications
router.get('/applications', protect, admin, async (req, res) => {
  try {
    const applications = await listAdminApplications();
    res.json(applications);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Admin: approve application -> create admin user + email temp password
router.put('/applications/:id/approve', protect, admin, async (req, res) => {
  try {
    const applicationId = req.params.id;
    const adminEmail = req.body?.adminEmail || req.user?.email;

    const updated = await setAdminApplicationDecision({
      applicationId,
      status: 'approved',
      adminEmail,
    });

    if (!updated) return res.status(404).json({ message: 'Application not found' });

    const tempPassword = `Temp${crypto.randomBytes(3).toString('hex')}`;
    await createAdminUserForEmail({
      adminEmail: updated.email,
      tempPassword,
    });

    const sent = await sendAdminInviteEmail({
      toEmail: updated.email,
      toName: updated.name,
      adminEmail: updated.email,
      adminPassword: tempPassword,
    });

    if (!sent) {
      return res.json({
        message: `Application approved! (Credentials email skipped — offline. Temp password for ${updated.email}: ${tempPassword})`,
      });
    }

    res.json({ message: 'Application approved and email sent' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Admin: reject application
router.put('/applications/:id/reject', protect, admin, async (req, res) => {
  try {
    const applicationId = req.params.id;
    const adminEmail = req.body?.adminEmail || req.user?.email;

    const updated = await setAdminApplicationDecision({
      applicationId,
      status: 'rejected',
      adminEmail,
    });

    if (!updated) return res.status(404).json({ message: 'Application not found' });

    res.json({ message: 'Application rejected' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Main admin: delete application record
router.delete('/applications/:id', protect, admin, async (req, res) => {
  try {
    if (!isMainAdmin(req)) {
      return res.status(403).json({ message: 'Only the main admin can delete applications' });
    }
    const deleted = await deleteAdminApplication(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Application not found' });
    res.json({ message: 'Application deleted' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Main admin: revoke local admin access (block + demote to user)
router.put('/applications/revoke/:email', protect, admin, async (req, res) => {
  try {
    if (!isMainAdmin(req)) {
      return res.status(403).json({ message: 'Only the main admin can revoke admin access' });
    }
    const user = await findUserByEmail(req.params.email);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.email === 'admin@codesky.com') {
      return res.status(400).json({ message: 'Cannot revoke main admin' });
    }
    await revokeAdminAccess(user._id);
    res.json({ message: `${user.email} has been blocked and admin access revoked` });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Main admin: delete local admin user completely
router.delete('/applications/delete-admin/:email', protect, admin, async (req, res) => {
  try {
    if (!isMainAdmin(req)) {
      return res.status(403).json({ message: 'Only the main admin can delete admin accounts' });
    }
    const user = await findUserByEmail(req.params.email);
    if (!user) return res.status(404).json({ message: 'Admin user not found' });
    if (user.email === 'admin@codesky.com') {
      return res.status(400).json({ message: 'Cannot delete main admin' });
    }
    await deleteUser(user._id);
    res.json({ message: `${user.email} admin account and all registrations have been permanently deleted` });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
