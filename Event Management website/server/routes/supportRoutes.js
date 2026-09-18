import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  createSupportRequest,
  listSupportRequests,
  resolveSupportRequest,
  submitSupportReview,
  findSupportRequestById
} from '../utils/mysql.js';
import { createMailTransport, getMailSender, getLogoAttachment } from '../utils/mailTransport.js';

const router = express.Router();

// @desc    Submit a support request (when user wants to connect with team)
// @route   POST /api/support/request
router.post('/request', async (req, res) => {
  try {
    const { userEmail, userPhone, conversation } = req.body;
    if (!userEmail || !userPhone) {
      return res.status(400).json({ message: 'Email and phone number are required.' });
    }

    const request = await createSupportRequest({
      userEmail,
      userPhone,
      conversation: conversation || []
    });

    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Resolve a support request manually
// @route   PUT /api/support/request/:id/resolve
router.put('/request/:id/resolve', async (req, res) => {
  try {
    const updated = await resolveSupportRequest(req.params.id);
    if (!updated) {
      return res.status(404).json({ message: 'Support request not found' });
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Submit user review / feedback rating for support request
// @route   POST /api/support/request/:id/review
router.post('/request/:id/review', async (req, res) => {
  try {
    const { rating, reviewComment, conversation } = req.body;
    if (rating === undefined) {
      return res.status(400).json({ message: 'Rating is required' });
    }

    const updated = await submitSupportReview(req.params.id, {
      rating: Number(rating),
      reviewComment: reviewComment || '',
      conversation
    });

    if (!updated) {
      return res.status(404).json({ message: 'Support request not found' });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Get all support requests & transcripts (for Admin panel)
// @route   GET /api/support/requests
router.get('/requests', protect, admin, async (req, res) => {
  try {
    const requests = await listSupportRequests();
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Email / Connect user from support request
// @route   POST /api/support/request/:id/email
router.post('/request/:id/email', protect, admin, async (req, res) => {
  try {
    const { subject, body } = req.body;
    if (!subject || !body) {
      return res.status(400).json({ message: 'Subject and body are required' });
    }

    const request = await findSupportRequestById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Support request not found' });
    }

    const transporter = createMailTransport();
    const sender = getMailSender();
    const logoAttachment = getLogoAttachment();

    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: 'Inter', Arial, sans-serif; background: #f3f7ff; margin: 0; padding: 0; }
          .wrapper { padding: 32px 16px; }
          .card { max-width: 700px; margin: 0 auto; background: #ffffff; border-radius: 22px; overflow: hidden; box-shadow: 0 18px 45px rgba(15, 23, 42, 0.12); }
          .hero { background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 40px 24px; text-align: center; color: white; }
          .hero h1 { margin: 0; font-size: 26px; }
          .content { padding: 32px 28px; color: #334155; line-height: 1.7; font-size: 14px; }
          .content p { white-space: pre-line; }
          .footer { background: #0f172a; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="card">
            <div class="hero">
              <img src="cid:codesky-logo" alt="Codesky" style="width:64px;height:64px;border-radius:12px;margin-bottom:12px;display:block;margin-left:auto;margin-right:auto;" />
              <h1>Codesky Helpdesk Response</h1>
            </div>
            <div class="content">
              <p>${body}</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Codesky Events. Support ticket ID: ${request._id}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Codesky Support" <${sender}>`,
      to: request.userEmail,
      subject: subject,
      html: htmlTemplate,
      attachments: logoAttachment
    });

    console.log(`✉️ Support Response Email sent to ${request.userEmail} for ticket ${request._id}`);

    res.json({ message: 'Email sent to user successfully!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
