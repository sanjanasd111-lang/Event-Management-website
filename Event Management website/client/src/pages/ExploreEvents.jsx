import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, MapPin, Calendar, Compass, Star, ChevronDown, Check } from 'lucide-react';
import EventBanner from '../components/EventBanner';

const categories = ['All', 'Technology', 'Music', 'Business', 'Sports', 'Art', 'Inaugural'];

const ExploreEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [maxPrice, setMaxPrice] = useState(25000);
  const [dateFilter, setDateFilter] = useState('any');
  const [sortBy, setSortBy] = useState('newest');
  const [onlyVirtual, setOnlyVirtual] = useState(false);

  useEffect(() => {
    document.title = 'Explore Curated Events | Codesky';
    fetch('/api/events')
      .then(res => res.json())
      .then(data => {
        setEvents(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredEvents = events.filter(e => {
    const matchesSearch = 
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.description?.toLowerCase().includes(search.toLowerCase()) ||
      e.location?.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = 
      category === 'All' || 
      (e.tags && e.tags.some(t => t.toLowerCase().includes(category.toLowerCase())));
    
    const matchesPrice = e.price <= maxPrice;

    let matchesDate = true;
    if (dateFilter !== 'any') {
      const diffDays = Math.ceil((new Date(e.date) - new Date()) / (1000 * 60 * 60 * 24));
      if (dateFilter === 'week') matchesDate = diffDays <= 7 && diffDays >= 0;
      if (dateFilter === 'month') matchesDate = diffDays <= 30 && diffDays >= 0;
    }

    const matchesVirtual = !onlyVirtual || e.location?.toLowerCase().includes('zoom') || e.location?.toLowerCase().includes('virtual') || e.location?.toLowerCase().includes('online');

    return matchesSearch && matchesCategory && matchesPrice && matchesDate && matchesVirtual;
  }).sort((a, b) => {
    if (sortBy === 'newest') return new Date(a.date) - new Date(b.date);
    if (sortBy === 'priceAsc') return a.price - b.price;
    if (sortBy === 'priceDesc') return b.price - a.price;
    if (sortBy === 'capacity') return b.capacity - a.capacity;
    return 0;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white transition-colors duration-300 relative overflow-hidden font-sans pb-20">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 relative z-10">
        <header className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary-200/60 bg-primary-50/50 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-primary-600 dark:border-primary-500/20 dark:bg-primary-500/10 dark:text-primary-400 mb-3">
            <Compass className="h-3.5 w-3.5" /> Explorer Panel
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
            Find Your Next Experience
          </h1>
          <p className="mt-2.5 max-w-2xl text-slate-500 dark:text-slate-400 font-medium">
            Filter our secure event catalog by location coordinates, price categories, tag listings, and dates.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Advanced Multi-Filter Sidebar */}
          <aside className="lg:col-span-1 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-850 p-6 rounded-[2rem] shadow-xl backdrop-blur-xl h-fit sticky top-24 space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="font-black text-sm flex items-center gap-1.5"><SlidersHorizontal className="h-4 w-4 text-primary-500" /> Filter parameters</span>
              <button 
                onClick={() => {
                  setSearch('');
                  setCategory('All');
                  setMaxPrice(25000);
                  setDateFilter('any');
                  setSortBy('newest');
                  setOnlyVirtual(false);
                }}
                className="text-[10px] font-bold text-slate-400 hover:text-primary-500 hover:underline"
              >
                Reset All
              </button>
            </div>

            {/* Keyword search */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Search keywords</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Title, venue, host..."
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 py-2.5 pl-9 pr-3 text-xs font-semibold outline-none focus:border-primary-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Categories Selection */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Category tags</label>
              <div className="flex flex-wrap gap-1.5">
                {categories.map(c => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide border transition-all ${
                      category === c
                        ? 'bg-primary-500 border-primary-500 text-white'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Price slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-400">
                <span>Max ticket price</span>
                <span className="text-primary-500 font-bold text-xs">₹{maxPrice}</span>
              </div>
              <input
                type="range"
                min="0"
                max="25000"
                step="250"
                value={maxPrice}
                onChange={e => setMaxPrice(Number(e.target.value))}
                className="w-full accent-primary-500"
              />
            </div>

            {/* Time filters */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Time window</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:border-primary-500 text-slate-900 dark:text-white"
              >
                <option value="any">Any date calendar</option>
                <option value="week">Next 7 days</option>
                <option value="month">Next 30 days</option>
              </select>
            </div>

            {/* Sort options */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Sort criteria</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:border-primary-500 text-slate-900 dark:text-white"
              >
                <option value="newest">Soonest first</option>
                <option value="priceAsc">Price: low to high</option>
                <option value="priceDesc">Price: high to low</option>
                <option value="capacity">Capacity seats</option>
              </select>
            </div>

            {/* Virtual filter checkbox */}
            <label className="flex items-center gap-2 cursor-pointer pt-2 border-t border-slate-100 dark:border-slate-800">
              <input
                type="checkbox"
                checked={onlyVirtual}
                onChange={e => setOnlyVirtual(e.target.checked)}
                className="rounded border-slate-300 text-primary-500 focus:ring-primary-500"
              />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Only Virtual / Online</span>
            </label>
          </aside>

          {/* Results Grid */}
          <div className="lg:col-span-3">
            <div className="mb-6 flex justify-between items-center text-xs font-bold text-slate-400">
              <span>{filteredEvents.length} active listings match filters</span>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-80 animate-pulse rounded-3xl bg-slate-200 dark:bg-slate-900 border border-slate-200 dark:border-slate-800" />
                ))}
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="bg-white/40 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-850 rounded-[2rem] px-8 py-20 text-center backdrop-blur shadow-sm">
                <p className="text-5xl">📭</p>
                <h2 className="mt-4 text-xl font-bold text-slate-800 dark:text-white">No matching events</h2>
                <p className="mx-auto mt-2 max-w-sm text-slate-500 dark:text-slate-400 text-xs font-medium leading-relaxed">
                  Try relaxing your filter parameters, increasing the price range limits, or changing search terms.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredEvents.map((event, i) => (
                  <motion.div
                    key={event._id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.04, 0.25) }}
                  >
                    <Link to={`/events/${event._id}`} className="group block h-full">
                      <article className="flex h-full flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white dark:border-slate-900 dark:bg-slate-900/40 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group">
                        <div className="relative h-44 bg-slate-100 dark:bg-slate-950 overflow-hidden">
                          <EventBanner event={event} isMini />
                          <div className="absolute left-3 top-3 rounded-lg bg-white/95 dark:bg-slate-900/95 px-2.5 py-1 text-[10px] font-black text-slate-950 dark:text-white border border-slate-200/50 dark:border-slate-800 backdrop-blur">
                            {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                        <div className="flex flex-1 flex-col p-5">
                          <div className="mb-2.5 flex flex-wrap gap-1">
                            {event.tags?.slice(0, 2).map(tag => (
                              <span key={tag} className="rounded px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-primary-500/10 text-primary-600 dark:text-primary-400">
                                {tag}
                              </span>
                            ))}
                          </div>
                          <h3 className="line-clamp-2 text-base font-bold text-slate-900 group-hover:text-primary-500 dark:text-white dark:group-hover:text-primary-400 transition-colors">
                            {event.title}
                          </h3>
                          <p className="mt-2 line-clamp-1 text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                            📍 {event.location}
                          </p>
                          <div className="mt-auto flex items-center justify-between border-t border-slate-100 dark:border-slate-850 pt-4 mt-4">
                            <span className="text-base font-black text-slate-950 dark:text-white">
                              {event.price === 0 ? 'Free' : `₹${event.price}`}
                            </span>
                            <span className="text-xs font-bold text-primary-500 group-hover:underline">Details →</span>
                          </div>
                        </div>
                      </article>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExploreEvents;
