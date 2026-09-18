import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712] text-slate-800 dark:text-slate-200">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Link to="/" className="text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline mb-8 inline-block">
            ← Back to Codesky
          </Link>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2">Terms of Service</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-10">Last updated: June 28, 2026</p>

          <div className="space-y-8 text-slate-600 dark:text-slate-300 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">1. Acceptance of Terms</h2>
              <p>By accessing Codesky Events, you agree to these Terms of Service. If you do not agree, please do not use our platform.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">2. Event Bookings & Tickets</h2>
              <p>Ticket purchases are binding once confirmed. Refund policies vary by event and are set by the event organizer. Codesky facilitates transactions but is not responsible for event cancellations unless stated otherwise.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">3. Organizer Responsibilities</h2>
              <p>Event organizers must provide accurate event information, honor ticket sales, and comply with local laws. Codesky may remove events that violate our community guidelines.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">4. Prohibited Conduct</h2>
              <p>Users may not use the platform for fraud, harassment, spam, or illegal activities. Violations may result in account suspension or permanent ban.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">5. Limitation of Liability</h2>
              <p>Codesky is provided &quot;as is.&quot; We are not liable for indirect damages arising from use of the platform, event attendance, or third-party services.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">6. Changes & Contact</h2>
              <p>We may update these terms at any time. Continued use constitutes acceptance. Contact <a href="mailto:legal@codesky.com" className="text-purple-600 dark:text-purple-400 font-semibold">legal@codesky.com</a> for questions.</p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsOfService;
