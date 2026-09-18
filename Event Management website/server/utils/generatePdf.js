import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

export const generateTicketPdf = (eventDetails, registration, userName) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Premium border and background accent
      doc.rect(20, 20, 555, 800).stroke('#0f172a');
      doc.rect(30, 30, 535, 780).stroke('#cbd5e1');
      doc.rect(40, 40, 515, 760).stroke('#fbbf24');

      // Try to include a logo if present (search server and client locations)
      const logoCandidates = [
        path.join(projectRoot, 'server', 'public', 'logo.png'),
        path.join(projectRoot, 'client', 'public', 'logo.png'),
        path.join(projectRoot, 'client', 'images', 'codesky.png'),
      ];
      const signatureCandidates = [
        path.join(projectRoot, 'client', 'images', 'signature.png'),
        path.join(projectRoot, 'client', 'public', 'signature.png'),
      ];
      let usedLogo = null;
      let usedSignature = null;
      for (const p of logoCandidates) {
        if (fs.existsSync(p)) { usedLogo = p; break; }
      }
      for (const p of signatureCandidates) {
        if (fs.existsSync(p)) { usedSignature = p; break; }
      }

      // Header strip
      doc.roundedRect(50, 50, 490, 120, 16).fillAndStroke('#f8fafc', '#e2e8f0');
      if (usedLogo) {
        try {
          doc.image(usedLogo, 72, 70, { width: 70 });
        } catch (e) {
          // ignore image errors
        }
      }
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#f59e0b').text('PREMIUM ACCESS • VERIFIED EXPERIENCE', 160, 70);
      doc.font('Helvetica-Bold').fontSize(20).fillColor('#0f172a').text('CODESKY RECEIPT', 160, 90);
      doc.font('Helvetica').fontSize(10).fillColor('#64748b').text('Luxury event access • seamless entry • trusted by organizers', 160, 116);
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#0f172a').text('Official Entry Pass', 160, 132);

      // Main event section
      doc.roundedRect(50, 190, 490, 120, 16).fillAndStroke('#ffffff', '#e2e8f0');
      doc.moveTo(50, 222).lineTo(540, 222).stroke('#e2e8f0');
      doc.font('Helvetica-Bold').fontSize(16).fillColor('#111827').text(eventDetails.title, 72, 208);
      doc.font('Helvetica').fontSize(10).fillColor('#64748b').text(`Date: ${new Date(eventDetails.date).toLocaleDateString()}`, 72, 238);
      doc.text(`Location: ${eventDetails.location}`, 72, 255);
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#0f172a').text('Status: Confirmed', 380, 238);
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#d97706').text('Entry Verified', 380, 255);

      // Attendee detail box
      doc.roundedRect(50, 330, 490, 170, 16).fillAndStroke('#f8fafc', '#e2e8f0');
      doc.rect(72, 352, 150, 24).fillAndStroke('#0f172a', '#0f172a');
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff').text('ATTENDEE DETAILS', 86, 359);

      doc.font('Helvetica').fontSize(11).fillColor('#64748b').text('Full Name', 72, 390);
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#0f172a').text(userName, 72, 408);
      doc.font('Helvetica').fontSize(11).fillColor('#64748b').text('Ticket ID', 260, 390);
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#0f172a').text(registration._id.toUpperCase(), 260, 408);
      doc.font('Helvetica').fontSize(11).fillColor('#64748b').text('Payment', 72, 430);
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#0f172a').text(registration.paymentStatus.toUpperCase(), 72, 448);
      doc.font('Helvetica').fontSize(11).fillColor('#64748b').text('Amount', 260, 430);
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#0f172a').text(eventDetails.price === 0 ? 'FREE' : `₹${eventDetails.price}`, 260, 448);

      // Footer
      const footerY = 525;
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#0f172a').text('Please present this ticket at the entrance.', 50, footerY, { align: 'center' });
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#d97706').text('Verified by Team Codesky', 50, footerY + 20, { align: 'center' });
      doc.font('Helvetica').fontSize(10).fillColor('#64748b').text(`Official Codesky E-Ticket • Generated on ${new Date().toLocaleDateString()}`, 50, footerY + 42, { align: 'center' });

      if (usedLogo) {
        try {
          doc.image(usedLogo, doc.page.width / 2 - 25, footerY + 58, { width: 50 });
        } catch (e) {}
      }

      if (usedSignature) {
        try {
          doc.image(usedSignature, doc.page.width / 2 - 70, footerY + 112, { width: 140 });
        } catch (e) {}
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
