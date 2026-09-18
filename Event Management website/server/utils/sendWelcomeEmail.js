import { createMailTransport, getMailSender, getLogoAttachment } from './mailTransport.js';

export const sendWelcomeEmail = async (userEmail, userName) => {
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
          body { font-family: 'Inter', Arial, sans-serif; background: #f3f7ff; margin: 0; padding: 0; }
          .wrapper { padding: 32px 16px; }
          .card { max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 22px; overflow: hidden; box-shadow: 0 18px 45px rgba(15, 23, 42, 0.12); }
          .hero { background: linear-gradient(135deg, #2563eb, #8b5cf6); padding: 40px 24px; text-align: center; color: white; }
          .hero h1 { margin: 0; font-size: 30px; }
          .hero p { margin: 8px 0 0; opacity: 0.95; }
          .content { padding: 32px 28px; color: #334155; line-height: 1.7; }
          .content h2 { margin-top: 0; color: #0f172a; font-size: 24px; }
          .pill { display: inline-block; background: #eff6ff; color: #1d4ed8; padding: 10px 14px; border-radius: 999px; font-weight: 700; margin: 10px 0 20px; }
          .button { display: inline-block; margin: 16px 0 24px; background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; text-decoration: none; padding: 14px 24px; border-radius: 999px; font-weight: 700; }
          .panel { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 18px 20px; margin-top: 18px; }
          .features-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 14px; }
          .feature-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 12px; font-size: 13px; color: #475569; display:flex; gap:10px; align-items:center; }
          .feature-card img { width:36px; height:36px; object-fit:cover; border-radius:8px; }
          .feature-card strong { display: block; color: #111827; margin-bottom: 3px; }
          .footer { background: #0f172a; padding: 22px; text-align: center; color: #94a3b8; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="card">
            <div class="hero">
              <img src="cid:codesky-logo" alt="Codesky" style="width:72px;height:72px;border-radius:12px;margin-bottom:12px;display:block;margin-left:auto;margin-right:auto;" />
              <h1>Welcome to Codesky</h1>
              <p>Your next unforgettable event experience starts here.</p>
            </div>
            <div class="content">
              <h2>Hi ${firstName},</h2>
              <p>Welcome aboard. Your Codesky account is now live, and you’re ready to experience a more intelligent, seamless way to discover, attend, and manage outstanding events.</p>
              <div class="pill">✨ Your premium event journey starts here</div>
              <a href="http://localhost:5173/dashboard" class="button">Open your dashboard</a>
              <div class="panel">
                <strong>What you can enjoy right away:</strong>
                <div class="features-grid">
                  <div class="feature-card"><img src="cid:codesky-logo" alt="logo" /><div><strong>Smart discovery</strong>Find curated events that match your interests.</div></div>
                  <div class="feature-card"><img src="cid:codesky-logo" alt="logo" /><div><strong>Fast booking</strong>Reserve your place in just a few clicks.</div></div>
                  <div class="feature-card"><img src="cid:codesky-logo" alt="logo" /><div><strong>Secure payments</strong>Enjoy a safe and reliable checkout experience.</div></div>
                  <div class="feature-card"><img src="cid:codesky-logo" alt="logo" /><div><strong>Digital tickets</strong>Access your entry pass instantly on your device.</div></div>
                  <div class="feature-card"><img src="cid:codesky-logo" alt="logo" /><div><strong>Personal dashboard</strong>Track bookings, favorites, and updates in one place.</div></div>
                  <div class="feature-card"><img src="cid:codesky-logo" alt="logo" /><div><strong>Event reminders</strong>Stay informed with timely and helpful nudges.</div></div>
                  <div class="feature-card"><img src="cid:codesky-logo" alt="logo" /><div><strong>Organizer access</strong>Manage your hosted events with confidence.</div></div>
                  <div class="feature-card"><img src="cid:codesky-logo" alt="logo" /><div><strong>Live updates</strong>Receive real-time changes and announcements.</div></div>
                  <div class="feature-card"><img src="cid:codesky-logo" alt="logo" /><div><strong>Priority support</strong>Get assistance when you need it most.</div></div>
                  <div class="feature-card"><img src="cid:codesky-logo" alt="logo" /><div><strong>Community rewards</strong>Unlock benefits as you continue engaging with the platform.</div></div>
                </div>
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Codesky Events. All rights reserved.</p>
              <p>This is an automated message. Please do not reply.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const attachments = getLogoAttachment();
    const info = await transporter.sendMail({
      from: `"Codesky Events" <${sender}>`,
      to: userEmail,
      subject: `Welcome to Codesky, ${firstName}! 🎉`,
      html: htmlTemplate,
      attachments,
    });

    console.log('-----------------------------------------');
    console.log('✉️  WELCOME EMAIL SENT SUCCESSFULLY');
    console.log('To:', userEmail);
    console.log('Message ID:', info.messageId);
    console.log('-----------------------------------------');

    return true;
  } catch (error) {
    console.error('Welcome email sending failed:', error);
    return false;
  }
};
