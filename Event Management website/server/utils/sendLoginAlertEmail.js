import { createMailTransport, getMailSender, getLogoAttachment } from './mailTransport.js';

export const sendLoginAlertEmail = async (userEmail, userName) => {
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
          .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 22px; overflow: hidden; box-shadow: 0 18px 45px rgba(15, 23, 42, 0.12); }
          .hero { background: linear-gradient(135deg, #0f172a, #334155); padding: 40px 24px; text-align: center; color: white; }
          .hero h1 { margin: 0; font-size: 24px; }
          .hero p { margin: 8px 0 0; opacity: 0.9; }
          .content { padding: 32px 28px; color: #334155; line-height: 1.7; }
          .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; }
          .alert-details { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 18px 20px; margin: 20px 0; }
          .alert-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
          .alert-row:last-child { border-bottom: none; }
          .alert-label { font-weight: bold; color: #64748b; }
          .alert-value { color: #0f172a; font-weight: 600; }
          .footer { background: #0f172a; padding: 22px; text-align: center; color: #94a3b8; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="card">
            <div class="hero">
              <img src="cid:codesky-logo" alt="Codesky" style="width:72px;height:72px;border-radius:12px;margin-bottom:12px;display:block;margin-left:auto;margin-right:auto;" />
              <h1>Security Alert: New Sign-in</h1>
              <p>Your Codesky account was recently accessed.</p>
            </div>
            <div class="content">
              <h2>Hello ${firstName},</h2>
              <p>We detected a successful login to your Codesky Events account. If this was you, no action is required.</p>
              
              <div class="alert-details">
                <div class="alert-row">
                  <span class="alert-label">Account Email:</span>
                  <span class="alert-value">${userEmail}</span>
                </div>
                <div class="alert-row">
                  <span class="alert-label">Time:</span>
                  <span class="alert-value">${new Date().toLocaleString()}</span>
                </div>
                <div class="alert-row">
                  <span class="alert-label">Status:</span>
                  <span class="alert-value" style="color:#10b981;">Authorized</span>
                </div>
              </div>

              <p>If you do not recognize this activity, please reset your password immediately in your account settings or contact support.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Codesky Events. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const attachments = getLogoAttachment();
    await transporter.sendMail({
      from: `"Codesky Security" <${sender}>`,
      to: userEmail,
      subject: 'Security Alert: New sign-in detected for Codesky Events 🔐',
      html: htmlTemplate,
      attachments
    });

    console.log('📩 Login alert email sent successfully to', userEmail);
    return true;
  } catch (error) {
    console.error('Login alert email failed:', error);
    return false;
  }
};
