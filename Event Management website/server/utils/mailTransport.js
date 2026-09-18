import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const senderEmail = process.env.GMAIL_USER || 'codesky2006@gmail.com';
const senderPass = process.env.GMAIL_PASS || 'cgsxrroeylmribpd';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

export const createMailTransport = () => nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: senderEmail,
    pass: senderPass,
  },
  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 20000,
});

export const getMailSender = () => senderEmail;

export const getLogoAttachment = () => {
  const candidates = [
    path.join(projectRoot, 'server', 'public', 'logo.png'),
    path.join(projectRoot, 'client', 'public', 'logo.png'),
    path.join(projectRoot, 'client', 'images', 'codesky.png'),
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return [{ filename: path.basename(p), path: p, cid: 'codesky-logo' }];
    }
  }

  return [];
};
