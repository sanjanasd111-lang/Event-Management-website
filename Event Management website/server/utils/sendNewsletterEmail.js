import { createMailTransport, getMailSender, getLogoAttachment } from './mailTransport.js';

export const sendNewsletterEmail = async (subscriberEmail) => {
  try {
    const transporter = createMailTransport();
    const sender = getMailSender();
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body { font-family: 'Inter', Arial, sans-serif; background: #f3f7ff; margin: 0; padding: 0; }
          .wrapper { padding: 32px 16px; }
          .card { max-width: 700px; margin: 0 auto; background: #ffffff; border-radius: 22px; overflow: hidden; box-shadow: 0 18px 45px rgba(15, 23, 42, 0.12); }
          .hero { background: linear-gradient(135deg, #2563eb, #8b5cf6); padding: 40px 24px; text-align: center; color: white; }
          .hero h1 { margin: 0; font-size: 30px; }
          .hero p { margin: 8px 0 0; opacity: 0.92; }
          .content { padding: 32px 28px; color: #334155; line-height: 1.7; }
          .content h2 { margin-top: 0; color: #0f172a; font-size: 24px; }
          .bullet { display: flex; align-items: flex-start; gap: 12px; margin: 16px 0; }
          .bullet strong { display: block; margin-bottom: 4px; }
          .button { display: inline-block; margin: 16px 0 24px; background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; text-decoration: none; padding: 14px 24px; border-radius: 999px; font-weight: 700; }
          .footer { background: #0f172a; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="card">
            <div class="hero">
              <img src="cid:codesky-logo" alt="Codesky" style="width:72px;height:72px;border-radius:12px;margin-bottom:12px;display:block;margin-left:auto;margin-right:auto;" />
              <h1>You're In!</h1>
              <p>Welcome to the Codesky newsletter family.</p>
            </div>
            <div class="content">
              <h2>Hello there,</h2>
              <p>Thank you for subscribing to event updates, exclusive offers, and premium planning guides. We will only send the best curated content straight to your inbox.</p>
              <div class="bullet">
                <div>✅</div>
                <div><strong>Early access to hot events</strong> Stay ahead of the crowd with new launches.</div>
              </div>
              <div class="bullet">
                <div>✅</div>
                <div><strong>Instant ticket alerts</strong> Get notified when popular events open bookings.</div>
              </div>
              <div class="bullet">
                <div>✅</div>
                <div><strong>Insider planning tips</strong> Learn how to host polished events and maximize attendance.</div>
              </div>
              <a href="http://localhost:5173/" class="button">Browse Latest Events</a>
              <p>If you ever want to stop receiving newsletters, just reply or update your preferences from your Codesky account.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Codesky Events. Crafted for modern event creators.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const attachments = getLogoAttachment();
    await transporter.sendMail({
      from: `"Codesky News" <${sender}>`,
      to: subscriberEmail,
      subject: 'Thanks for subscribing to Codesky updates! 🎉',
      html: htmlTemplate,
      attachments,
    });

    console.log('📩 Newsletter signup email sent to', subscriberEmail);
    return true;
  } catch (error) {
    console.error('Newsletter email failed:', error);
    return false;
  }
};

export const sendNewsletterBroadcast = async (subscriberEmail, eventDetails, customMessage = '') => {
  try {
    const transporter = createMailTransport();
    const sender = getMailSender();
    const title = eventDetails?.title || 'New Event Announcement!';
    const desc = eventDetails?.description || customMessage || 'Check out our latest updates on Codesky!';
    const date = eventDetails?.date || 'Coming soon';
    const location = eventDetails?.location || 'Online / TBA';

    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: 'Inter', Arial, sans-serif; background: #f3f7ff; margin: 0; padding: 0; }
          .wrapper { padding: 32px 16px; }
          .card { max-width: 700px; margin: 0 auto; background: #ffffff; border-radius: 22px; overflow: hidden; box-shadow: 0 18px 45px rgba(15, 23, 42, 0.12); }
          .hero { background: linear-gradient(135deg, #10b981, #3b82f6); padding: 40px 24px; text-align: center; color: white; }
          .hero h1 { margin: 0; font-size: 28px; }
          .content { padding: 32px 28px; color: #334155; line-height: 1.7; }
          .box { background: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0; border-radius: 8px; }
          .button { display: inline-block; margin: 20px 0; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; text-decoration: none; padding: 14px 28px; border-radius: 999px; font-weight: 700; }
          .footer { background: #0f172a; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="card">
            <div class="hero">
              <img src="cid:codesky-logo" alt="Codesky" style="width:72px;height:72px;border-radius:12px;margin-bottom:12px;display:block;margin-left:auto;margin-right:auto;" />
              <h1>📢 Exciting New Event!</h1>
            </div>
            <div class="content">
              <h2>${title}</h2>
              <p>${desc}</p>
              ${customMessage ? `<p><strong>Admin Note:</strong> ${customMessage}</p>` : ''}
              <div class="box">
                <p style="margin:4px 0;">📅 <strong>Date:</strong> ${date}</p>
                <p style="margin:4px 0;">📍 <strong>Location:</strong> ${location}</p>
              </div>
              <a href="http://localhost:5173/events" class="button">Book Your Tickets Now</a>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Codesky Events. You received this because you subscribed to our newsletter.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const attachments = getLogoAttachment();
    await transporter.sendMail({
      from: `"Codesky Events" <${sender}>`,
      to: subscriberEmail,
      subject: `🎉 Announcement: ${title}`,
      html: htmlTemplate,
      attachments,
    });

    console.log('📩 Newsletter broadcast sent to', subscriberEmail);
    return true;
  } catch (error) {
    console.error('Newsletter broadcast failed:', error);
    return false;
  }
};
