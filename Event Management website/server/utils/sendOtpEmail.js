import { createMailTransport, getMailSender, getLogoAttachment } from './mailTransport.js';

export const sendOtpEmail = async (toEmail, name, otpCode) => {
  try {
    const transport = createMailTransport();
    const sender = getMailSender();
    const attachments = getLogoAttachment();

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 40px; border-radius: 20px; border: 1px solid #334155;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #6366f1; font-size: 28px; margin: 0;">Codesky OS</h1>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 5px;">Secure Two-Factor Verification</p>
        </div>
        <div style="background: #1e293b; padding: 30px; border-radius: 16px; text-align: center; border: 1px solid #475569;">
          <p style="font-size: 16px; color: #e2e8f0; margin-bottom: 20px;">Hello <b>${name || 'User'}</b>,</p>
          <p style="font-size: 14px; color: #cbd5e1; margin-bottom: 25px;">Use the verification code below to complete your authentication into Codesky Events. This code expires in 10 minutes.</p>
          <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #38bdf8; background: #0f172a; padding: 15px 30px; border-radius: 12px; display: inline-block; border: 2px dashed #38bdf8;">
            ${otpCode}
          </div>
          <p style="font-size: 12px; color: #64748b; margin-top: 25px;">If you didn't request this code, please ignore this email.</p>
        </div>
        <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #64748b;">
          &copy; ${new Date().getFullYear()} Codesky Events Operating System. All rights reserved.
        </div>
      </div>
    `;

    await transport.sendMail({
      from: `"Codesky OS" <${sender}>`,
      to: toEmail,
      subject: `🔐 ${otpCode} is your Codesky Verification Code`,
      html: htmlContent,
      attachments
    });
    console.log(`✅ [OTP SENT SUCCESSFULLY] Code ${otpCode} delivered to ${toEmail}`);
    return true;
  } catch (err) {
    console.error('❌ [OTP SEND ERROR]:', err);
    return false;
  }
};
