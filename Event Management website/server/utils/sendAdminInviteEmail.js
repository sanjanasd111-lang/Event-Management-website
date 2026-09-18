import { createMailTransport, getMailSender, getLogoAttachment } from './mailTransport.js';

export const sendAdminInviteEmail = async ({ toEmail, toName, adminEmail, adminPassword }) => {
  try {
    const transporter = createMailTransport();
    const sender = getMailSender();
    const firstName = toName?.split(' ')?.[0] || 'there';

    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body { font-family: 'Inter', Arial, sans-serif; background: #f3f7ff; margin: 0; padding: 0; }
          .wrapper { padding: 32px 16px; }
          .card { max-width: 720px; margin: 0 auto; background: #ffffff; border-radius: 22px; overflow: hidden; box-shadow: 0 18px 45px rgba(15, 23, 42, 0.12); }
          .hero { background: linear-gradient(135deg, #7c3aed, #2563eb); padding: 40px 24px; text-align: center; color: white; }
          .hero h1 { margin: 0; font-size: 30px; }
          .content { padding: 32px 28px; color: #334155; line-height: 1.7; }
          .content h2 { margin-top: 0; color: #0f172a; font-size: 22px; }
          .pill { display: inline-block; background: #eff6ff; color: #1d4ed8; padding: 10px 14px; border-radius: 999px; font-weight: 700; margin: 10px 0 20px; }
          .credentials { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 18px 20px; margin-top: 14px; }
          .row { display: flex; justify-content: space-between; gap: 16px; margin-top: 10px; }
          .label { font-size: 12px; color: #64748b; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
          .value { font-size: 14px; color: #0f172a; font-weight: 900; word-break: break-word; text-align: right; }
          .btn { display: inline-block; margin-top: 18px; background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; text-decoration: none; padding: 14px 24px; border-radius: 999px; font-weight: 800; }
          .footer { background: #0f172a; padding: 22px; text-align: center; color: #94a3b8; font-size: 12px; }
          @media (max-width: 520px) { .row { display: block; } .value { margin-top: 4px; text-align: left; } }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="card">
            <div class="hero">
              <img src="cid:codesky-logo" alt="Codesky" style="width:72px;height:72px;border-radius:12px;margin-bottom:12px;display:block;margin-left:auto;margin-right:auto;" />
              <h1>Admin Access Granted</h1>
              <p style="margin: 8px 0 0; opacity: .95;">Your Codesky admin credentials are ready.</p>
            </div>

            <div class="content">
              <h2>Hi ${firstName},</h2>
              <p>Good news! You have been approved to become an administrator on Codesky.</p>

              <div class="pill">Login details included below</div>

              <div class="credentials">
                <div class="row">
                  <div class="label">Admin Email</div>
                  <div class="value">${adminEmail}</div>
                </div>
                <div class="row">
                  <div class="label">Temporary Password</div>
                  <div class="value">${adminPassword}</div>
                </div>
              </div>

              <a class="btn" href="http://localhost:5173/login?admin=true">Go to Admin Login</a>

              <p style="margin-top:16px;color:#64748b;font-size:13px;">
                For security, please change your password after first login.
              </p>
            </div>

            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Codesky Events. All rights reserved.</p>
              <p>This is an automated message. Please do not reply.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const attachments = getLogoAttachment();
    await transporter.sendMail({
      from: `"Codesky Events" <${sender}>`,
      to: toEmail,
      subject: 'Codesky Admin Access - Credentials inside',
      html: htmlTemplate,
      attachments,
    });

    return true;
  } catch (err) {
    console.error('sendAdminInviteEmail failed:', err);
    return false;
  }
};
