import { createMailTransport, getMailSender, getLogoAttachment } from './mailTransport.js';
import { generateTicketPdf } from './generatePdf.js';

export const sendTicketEmail = async (userEmail, userName, eventDetails, registration) => {
  try {
    const transporter = createMailTransport();
    const sender = getMailSender();
    const firstName = userName?.split(' ')[0] || 'there';
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${registration._id}`;
    const eventDate = new Date(eventDetails?.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const totalPaid = eventDetails?.price === 0 ? 'FREE' : `₹${eventDetails?.price ?? 0}`;

    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body { font-family: 'Inter', Arial, sans-serif; background: linear-gradient(135deg, #f8fafc, #e2e8f0); margin: 0; padding: 0; }
          .wrapper { padding: 24px 16px; }
          .card { max-width: 700px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18); border: 1px solid #e2e8f0; }
          .hero { background: linear-gradient(135deg, #0f172a, #1d4ed8); padding: 36px 24px; text-align: center; color: white; }
          .hero h1 { margin: 0; font-size: 30px; letter-spacing: 1px; }
          .hero p { margin: 8px 0 0; font-weight: 600; opacity: 0.95; }
          .content { padding: 32px 28px; color: #334155; line-height: 1.7; }
          .content h2 { margin-top: 0; color: #111827; font-size: 24px; }
          .badge { display: inline-block; background: #fef3c7; color: #92400e; padding: 8px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; }
          .qr-card { text-align: center; margin: 24px 0 28px; padding: 24px; background: linear-gradient(135deg, #fff7ed, #fffbeb); border-radius: 18px; border: 1px solid #fde68a; }
          .qr-card img { width: 180px; height: 180px; border-radius: 12px; }
          .details { background: #f8fafc; border-radius: 16px; padding: 18px 20px; margin-top: 10px; border: 1px solid #e2e8f0; }
          .row { display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding: 12px 0; font-size: 15px; }
          .row:last-child { border-bottom: none; font-weight: 700; color: #0f172a; }
          .label { color: #64748b; }
          .footer { background: linear-gradient(135deg, #111827, #0f172a); padding: 20px; text-align: center; color: #cbd5e1; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="card">
            <div class="hero">
              <img src="cid:codesky-logo" alt="Codesky" style="width:72px;height:72px;border-radius:12px;margin-bottom:12px;display:block;margin-left:auto;margin-right:auto;" />
              <h1>🎫 Your Event Ticket</h1>
              <p>Official admission for ${eventDetails?.title || 'your event'}</p>
            </div>
            <div class="content">
              <h2>Hi ${firstName},</h2>
              <div class="badge">Premium admission confirmed</div>
              <p>You’re confirmed for <strong>${eventDetails?.title || 'your selected event'}</strong> and your ticket is ready.</p>
              <div class="qr-card">
                <p style="margin-top: 0; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #9a2c00;">Scan at the entrance</p>
                <img src="${qrCodeUrl}" alt="Ticket QR Code" />
                <p style="margin-bottom: 0; font-weight: 700; color: #111827;">${registration._id?.toUpperCase?.() || registration._id}</p>
              </div>
              <div class="details">
                <div class="row"><span class="label">Event</span><span>${eventDetails?.title || 'N/A'}</span></div>
                <div class="row"><span class="label">Date</span><span>${eventDate}</span></div>
                <div class="row"><span class="label">Location</span><span>${eventDetails?.location || 'TBA'}</span></div>
                <div class="row"><span class="label">Status</span><span>${registration?.paymentStatus || 'Confirmed'}</span></div>
                <div class="row"><span class="label">Amount</span><span>${totalPaid}</span></div>
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Codesky Events. Keep this ticket handy.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

      try {
      const pdfBuffer = await generateTicketPdf(eventDetails, registration, userName);
      const logoAttach = getLogoAttachment();
      const attachments = [
        ...(logoAttach || []),
        {
          filename: `Ticket_${registration._id}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ];

      const info = await transporter.sendMail({
        from: `"Codesky Events" <${sender}>`,
        to: userEmail,
        subject: `Your Ticket: ${eventDetails?.title || 'Codesky Event'}`,
        html: htmlTemplate,
        attachments,
      });

      console.log('-----------------------------------------');
      console.log('🎟️  TICKET EMAIL SENT WITH PDF ATTACHMENT');
      console.log('To:', userEmail);
      console.log('Message ID:', info.messageId);
      console.log('-----------------------------------------');

      return true;
    } catch (pdfErr) {
      console.error('PDF generation failed, sending without attachment...', pdfErr);
      const info = await transporter.sendMail({
        from: `"Codesky Events" <${sender}>`,
        to: userEmail,
        subject: `Your Ticket: ${eventDetails?.title || 'Codesky Event'}`,
        html: htmlTemplate,
      });
      console.log('🎟️  TICKET EMAIL SENT (No PDF)');
      console.log('Message ID:', info.messageId);
      return true;
    }
  } catch (error) {
    console.error('Ticket email sending failed:', error);
    return false;
  }
};
