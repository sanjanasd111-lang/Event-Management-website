import { createMailTransport, getMailSender } from './utils/mailTransport.js';

async function test() {
  try {
    const transporter = createMailTransport();
    const sender = getMailSender();

    const info = await transporter.sendMail({
      from: `"Codesky Events" <${sender}>`,
      to: 'codesky2006@gmail.com',
      subject: 'Codesky mail test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 24px auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 18px; background: linear-gradient(135deg, #f8fbff, #f3f4f6); box-shadow: 0 10px 28px rgba(15,23,42,0.08);">
          <h2 style="margin-top: 0; color: #111827;">Professional mail delivery test</h2>
          <p style="margin-bottom: 12px; color: #334155; line-height: 1.6;">This message confirms that your Gmail delivery setup is functioning smoothly and that your email experience is now aligned with a more polished, professional standard.</p>
          <div style="display: inline-block; padding: 8px 12px; border-radius: 999px; background: #dbeafe; color: #1d4ed8; font-weight: 700;">Status: Ready for production</div>
        </div>
      `,
    });

    console.log('SUCCESS!', info.messageId);
  } catch (err) {
    console.error('FAILED!', err);
  }
}

test();
