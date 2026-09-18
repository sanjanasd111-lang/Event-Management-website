import { createMailTransport, getMailSender, getLogoAttachment } from './mailTransport.js';

export const sendCancellationEmail = async (userEmail, userName, eventDetails, cancelledByAdmin = false) => {
  try {
    const transporter = createMailTransport();
    const sender = getMailSender();
    const firstName = userName?.split(' ')[0] || 'there';
    const headerText = cancelledByAdmin ? 'Event cancelled by organizer' : 'Booking cancelled';
    const headerColor = cancelledByAdmin ? 'linear-gradient(135deg, #ef4444, #991b1b)' : 'linear-gradient(135deg, #64748b, #334155)';

    const message = cancelledByAdmin
      ? `<p>We regret to inform you that the organizer has cancelled <strong>${eventDetails?.title || 'the event'}</strong>. If applicable, refunds will be processed according to the booking policy.</p>`
      : `<p>Your registration for <strong>${eventDetails?.title || 'the event'}</strong> has been cancelled successfully. We hope to welcome you again at a future event.</p>`;

    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body { font-family: 'Inter', Arial, sans-serif; background: #f8fafc; margin: 0; padding: 0; }
          .wrapper { padding: 24px 16px; }
          .card { max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 16px 40px rgba(15, 23, 42, 0.10); }
          .hero { background: ${headerColor}; padding: 32px 24px; color: white; text-align: center; }
          .hero h1 { margin: 0; font-size: 24px; text-transform: capitalize; }
          .content { padding: 30px 28px; color: #334155; line-height: 1.7; }
          .box { background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px 18px; border-radius: 12px; margin-top: 16px; }
          .footer { background: #0f172a; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="card">
            <div class="hero">
              <img src="cid:codesky-logo" alt="Codesky" style="width:56px;height:56px;border-radius:12px;margin-bottom:10px;display:block;margin-left:auto;margin-right:auto;" />
              <h1>${headerText}</h1>
            </div>
            <div class="content">
              <h2>Hi ${firstName},</h2>
              ${message}
              <div class="box">If you need assistance or would like help with another event, our support team is ready to help.</div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Codesky Events. Thank you for your understanding.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const attachments = getLogoAttachment();
    await transporter.sendMail({
      from: `"Codesky Updates" <${sender}>`,
      to: userEmail,
      subject: `Update regarding ${eventDetails?.title || 'your booking'}`,
      html: htmlTemplate,
      attachments,
    });
    console.log('🚫 Cancellation email sent to', userEmail);
  } catch (err) {
    console.error('Cancellation email failed:', err);
  }
};
