import { createMailTransport, getMailSender, getLogoAttachment } from './mailTransport.js';

export const sendCertificateEmail = async (userEmail, userName, eventTitle, pdfBase64Data) => {
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
          .card { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 22px; overflow: hidden; box-shadow: 0 18px 45px rgba(15, 23, 42, 0.12); }
          .hero { background: linear-gradient(135deg, #f59e0b, #d97706); padding: 36px 24px; text-align: center; color: white; }
          .hero h1 { margin: 0; font-size: 30px; }
          .content { padding: 32px 28px; color: #334155; line-height: 1.7; }
          .content h2 { margin-top: 0; color: #111827; font-size: 24px; }
          .notice { background: #fffbeb; border-left: 5px solid #f59e0b; padding: 18px 20px; border-radius: 12px; margin: 20px 0; }
          .highlight { color: #b45309; font-weight: 700; }
          .footer { background: #0f172a; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="card">
            <div class="hero">
              <img src="cid:codesky-logo" alt="Codesky" style="width:72px;height:72px;border-radius:12px;margin-bottom:12px;display:block;margin-left:auto;margin-right:auto;" />
              <h1>🏅 Certificate Ready</h1>
            </div>
            <div class="content">
              <h2>Congratulations, ${firstName}!</h2>
              <p>We are proud to celebrate your participation in <span class="highlight">${eventTitle}</span>.</p>
              <div class="notice">
                <p style="margin: 0 0 8px; font-weight: 700;">Your official certificate of attendance is attached below.</p>
                <p style="margin: 0;">This recognition reflects your commitment and the energy you brought to the event.</p>
              </div>
              <p>Keep building, learning, and shining. We’re excited to see what you do next.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Codesky Events. Celebrating excellence.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const base64Data = pdfBase64Data?.split('base64,')[1] || pdfBase64Data;
    const pdfBuffer = Buffer.from(base64Data, 'base64');

    const logoAttach = getLogoAttachment();
    const attachments = [
      ...(logoAttach || []),
      {
        filename: `Certificate_${userName?.replace(/\s+/g, '_') || 'participant'}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ];

    const info = await transporter.sendMail({
      from: `"Codesky Events" <${sender}>`,
      to: userEmail,
      subject: `🏆 Your Certificate for ${eventTitle}`,
      html: htmlTemplate,
      attachments,
    });

    console.log('-----------------------------------------');
    console.log('🎓 CERTIFICATE EMAIL SENT');
    console.log('To:', userEmail);
    console.log('Message ID:', info.messageId);
    console.log('-----------------------------------------');

    return true;
  } catch (error) {
    console.error('Certificate email sending failed:', error);
    return false;
  }
};
