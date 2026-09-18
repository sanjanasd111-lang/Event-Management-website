import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Search, SlidersHorizontal } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { featureGroups, platformFeatures } from '../data/platformFeatures';

const launchChecklist = [
  'Create event page',
  'Set ticket tiers',
  'Invite staff',
  'Publish reminders',
  'Enable check-in',
  'Review analytics'
];

const Features = () => {
  const [activeGroup, setActiveGroup] = useState('All');
  const [query, setQuery] = useState('');
  const [attendees, setAttendees] = useState(250);
  const [ticketPrice, setTicketPrice] = useState(1200);
  const [checkedItems, setCheckedItems] = useState(() => new Set(['Create event page', 'Set ticket tiers']));

  const filteredFeatures = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return platformFeatures.filter((feature) => {
      const matchesGroup = activeGroup === 'All' || feature.group === activeGroup;
      const matchesQuery = !normalizedQuery ||
        feature.title.toLowerCase().includes(normalizedQuery) ||
        feature.impact.toLowerCase().includes(normalizedQuery);
      return matchesGroup && matchesQuery;
    });
  }, [activeGroup, query]);

  const grossRevenue = attendees * ticketPrice;
  const platformFee = Math.round(grossRevenue * 0.05);
  const expectedPayout = grossRevenue - platformFee;
  const checklistProgress = Math.round((checkedItems.size / launchChecklist.length) * 100);

  const toggleChecklistItem = (item) => {
    setCheckedItems((current) => {
      const next = new Set(current);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-900 dark:text-white">
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/85 px-4 py-4 backdrop-blur dark:border-slate-700 dark:bg-slate-900/85">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400">
            <ArrowLeft className="h-4 w-4" />
            Back to Codesky
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/events" className="hidden rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-primary-300 hover:text-primary-600 dark:border-slate-700 dark:text-slate-300 sm:inline-flex">
              Explore Events
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-primary-500">{platformFeatures.length}+ next-gen platform features</p>
            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-normal text-slate-950 dark:text-white sm:text-5xl">
              A stronger event operating system for organizers and attendees.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
              Codesky now has an extensive feature library spanning AI planning, web3 ticketing, operations, viral marketing, and live analytics.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/events" className="rounded-xl bg-primary-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary-500/20 transition-colors hover:bg-primary-600">
                Browse Events
              </Link>
              <a href="#feature-grid" className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 transition-colors hover:border-primary-400 hover:text-primary-600 dark:border-slate-700 dark:text-slate-200">
                View All {platformFeatures.length}
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 dark:border-slate-700 dark:bg-slate-800 dark:shadow-black/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Launch readiness</p>
                <h2 className="mt-1 text-2xl font-bold">Event setup checklist</h2>
              </div>
              <div className="rounded-2xl bg-primary-50 px-4 py-2 text-xl font-black text-primary-600 dark:bg-primary-500/10 dark:text-primary-300">
                {checklistProgress}%
              </div>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
              <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-emerald-500 transition-all" style={{ width: `${checklistProgress}%` }} />
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {launchChecklist.map((item) => {
                const active = checkedItems.has(item);
                return (
                  <button
                    key={item}
                    onClick={() => toggleChecklistItem(item)}
                    className={`flex min-h-[52px] items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition-colors ${
                      active
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-primary-300 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300'
                    }`}
                  >
                    <CheckCircle2 className={`h-5 w-5 shrink-0 ${active ? 'text-emerald-500' : 'text-slate-400'}`} />
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800 lg:col-span-2">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary-500">
              <SlidersHorizontal className="h-4 w-4" />
              Revenue estimator
            </div>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Expected attendees</span>
                <input type="range" min="25" max="2000" step="25" value={attendees} onChange={(event) => setAttendees(Number(event.target.value))} className="mt-4 w-full accent-primary-500" />
                <span className="mt-2 block text-2xl font-black">{attendees.toLocaleString('en-IN')}</span>
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Average ticket price</span>
                <input type="range" min="0" max="10000" step="100" value={ticketPrice} onChange={(event) => setTicketPrice(Number(event.target.value))} className="mt-4 w-full accent-primary-500" />
                <span className="mt-2 block text-2xl font-black">Rs. {ticketPrice.toLocaleString('en-IN')}</span>
              </label>
            </div>
          </div>
          <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl shadow-slate-300/40 dark:shadow-black/30">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Estimated payout</p>
            <p className="mt-3 text-4xl font-black">Rs. {expectedPayout.toLocaleString('en-IN')}</p>
            <div className="mt-5 space-y-3 text-sm text-slate-300">
              <div className="flex justify-between"><span>Gross sales</span><span>Rs. {grossRevenue.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between"><span>Platform fee</span><span>Rs. {platformFee.toLocaleString('en-IN')}</span></div>
            </div>
          </div>
        </section>

        <section id="feature-grid" className="mt-14">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-3xl font-black text-slate-950 dark:text-white">Feature Library</h2>
              <p className="mt-2 text-slate-600 dark:text-slate-400">{filteredFeatures.length} of {platformFeatures.length} features shown</p>
            </div>
            <div className="relative w-full lg:max-w-sm">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search capabilities"
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-slate-900 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-primary-500/20"
              />
            </div>
          </div>

          <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
            {featureGroups.map((group) => (
              <button
                key={group}
                onClick={() => setActiveGroup(group)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                  activeGroup === group
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-primary-300 hover:text-primary-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {group}
              </button>
            ))}
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.article
                  key={feature.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: Math.min(index * 0.025, 0.25) }}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-primary-300 hover:shadow-xl dark:border-slate-700 dark:bg-slate-800"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="mb-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                        {feature.group}
                      </div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">{feature.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{feature.impact}</p>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Features;
