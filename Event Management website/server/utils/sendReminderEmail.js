import { createMailTransport, getMailSender, getLogoAttachment } from './mailTransport.js';

export const sendReminderEmail = async (userEmail, userName, eventDetails, customMessage) => {
  try {
    const transporter = createMailTransport();
    const sender = getMailSender();
    const firstName = userName?.split(' ')[0] || 'there';

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
          .hero { background: linear-gradient(135deg, #3b82f6, #2563eb); padding: 28px 24px; color: white; }
          .hero h1 { margin: 0; font-size: 24px; }
          .content { padding: 30px 28px; color: #334155; line-height: 1.7; }
          .notice { background: #eff6ff; border-left: 4px solid #2563eb; padding: 16px 18px; border-radius: 12px; margin: 18px 0; }
          .footer { background: #0f172a; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="wrapper">
            <div class="card">
            <div class="hero">
              <img src="cid:codesky-logo" alt="Codesky" style="width:56px;height:56px;border-radius:12px;margin-bottom:10px;display:block;margin-left:auto;margin-right:auto;" />
              <h1>📣 Event Reminder</h1>
            </div>
            <div class="content">
              <h2>Hi ${firstName},</h2>
              <p>This is a friendly reminder about your upcoming event: <strong>${eventDetails?.title || 'your selected event'}</strong>.</p>
              <div class="notice">
                ${customMessage || 'The event is approaching soon. Please make sure you are ready and join us on time.'}
              </div>
              <p>If you have any questions, please reach out to the organizer directly.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Codesky Events. Stay connected.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const attachments = getLogoAttachment();
    await transporter.sendMail({
      from: `"Codesky Organizer" <${sender}>`,
      to: userEmail,
      subject: `Reminder: ${eventDetails?.title || 'Your upcoming event'}`,
      html: htmlTemplate,
      attachments,
    });
    console.log('📢 Reminder email sent to', userEmail);
  } catch (err) {
    console.error('Reminder email failed:', err);
  }
};
