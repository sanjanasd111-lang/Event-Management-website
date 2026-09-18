import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712] text-slate-800 dark:text-slate-200">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Link to="/" className="text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline mb-8 inline-block">
            ← Back to Codesky
          </Link>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2">Privacy Policy</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-10">Last updated: June 28, 2026</p>

          <div className="space-y-8 text-slate-600 dark:text-slate-300 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">1. Information We Collect</h2>
              <p>We collect information you provide when registering, booking tickets, subscribing to our newsletter, or applying for organizer access — including name, email, payment details, and event preferences.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">2. How We Use Your Data</h2>
              <p>Your data is used to process bookings, send event confirmations, improve our platform, and communicate updates about events you follow. We never sell your personal information to third parties.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">3. Cookies & Analytics</h2>
              <p>We use cookies and similar technologies to remember preferences, analyze traffic, and personalize content. You can control cookies through your browser settings.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">4. Data Security</h2>
              <p>We implement industry-standard encryption and access controls to protect your data. Payment processing is handled through secure, PCI-compliant providers.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">5. Your Rights</h2>
              <p>You may request access, correction, or deletion of your personal data by contacting us at privacy@codesky.com. EU residents have additional rights under GDPR.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">6. Contact</h2>
              <p>Questions about this policy? Email <a href="mailto:privacy@codesky.com" className="text-purple-600 dark:text-purple-400 font-semibold">privacy@codesky.com</a></p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
