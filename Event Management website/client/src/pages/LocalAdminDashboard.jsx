import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import EventBanner from '../components/EventBanner';

const countries = ['India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Singapore', 'United Arab Emirates', 'Germany', 'France', 'Japan', 'Other'];
const indianCities = ['Bengaluru', 'Mumbai', 'Delhi', 'Kolkata', 'Chennai', 'Hyderabad', 'Pune', 'Ahmedabad', 'Surat', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Varanasi', 'Srinagar', 'Aurangabad', 'Amritsar', 'Navi Mumbai', 'Allahabad', 'Howrah', 'Gwalior', 'Jabalpur', 'Coimbatore', 'Vijayawada', 'Jodhpur', 'Madurai', 'Raipur', 'Kota', 'Chandigarh', 'Guwahati', 'Solapur', 'Mysore', 'Dehradun', 'Gurugram', 'Noida', 'Bhubaneswar', 'Kochi', 'Panaji'].sort();

const statusColors = {
  approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  pending: 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/40',
};

const LocalAdminDashboard = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [activeTab, setActiveTab] = useState('events');
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState('India');
  const [selectedCity, setSelectedCity] = useState('Mumbai');
  const [customCity, setCustomCity] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [newEvent, setNewEvent] = useState({ title: '', description: '', date: '', price: 0, capacity: 100, tags: '', speaker: '', bannerType: 'image', bannerMedia: '' });
  const [attendeeSearch, setAttendeeSearch] = useState('');
  const [attendeeFilter, setAttendeeFilter] = useState('all');
  const [celebrate, setCelebrate] = useState(false);

  const fetchData = async () => {
    try {
      const res1 = await fetch('/api/events?all=true', { headers: { Authorization: `Bearer ${token}` } });
      const data1 = await res1.json();
      const myEvents = data1.filter((e) => e.organizer === user?._id);
      const newlyApproved = myEvents.some((e) => e.status === 'approved' && !events.find((old) => old._id === e._id && old.status === 'approved'));
      if (newlyApproved && events.length > 0) setCelebrate(true);
      setEvents(myEvents);

      const res2 = await fetch('/api/registrations/all', { headers: { Authorization: `Bearer ${token}` } });
      if (res2.ok) {
        const data2 = await res2.json();
        setRegistrations(data2.filter((r) => r.eventDetails?.organizer === user?._id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [token, user?._id]);

  const handleMediaUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    Promise.all(files.map((file) => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(file);
    }))).then((base64s) => {
      if (newEvent.bannerType === 'slideshow') {
        const current = newEvent.bannerMedia ? newEvent.bannerMedia.split(',').map((s) => s.trim()).filter(Boolean) : [];
        setNewEvent((prev) => ({ ...prev, bannerMedia: [...current, ...base64s].join(',') }));
      } else {
        setNewEvent((prev) => ({ ...prev, bannerMedia: base64s[0] }));
      }
    });
  };

  const parseLocation = (locationStr) => {
    if (!locationStr) return { country: 'India', city: 'Mumbai', venue: '' };
    const parts = locationStr.split(',').map((p) => p.trim());
    if (parts.length === 1) return { country: 'India', city: parts[0], venue: '' };
    if (parts.length === 2) return { country: parts[1], city: parts[0], venue: '' };
    return { country: parts[parts.length - 1], city: parts[parts.length - 2], venue: parts.slice(0, parts.length - 2).join(', ') };
  };

  const resetForm = () => {
    setNewEvent({ title: '', description: '', date: '', price: 0, capacity: 100, tags: '', speaker: '', bannerType: 'image', bannerMedia: '' });
    setSelectedCountry('India');
    setSelectedCity('Mumbai');
    setCustomCity('');
    setVenueAddress('');
    setEditingEvent(null);
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    const finalCity = selectedCountry === 'India' ? selectedCity : (customCity || 'Mumbai');
    const location = `${venueAddress ? venueAddress + ', ' : ''}${finalCity}, ${selectedCountry}`;
    const formattedEvent = {
      ...newEvent,
      location,
      tags: typeof newEvent.tags === 'string' ? newEvent.tags.split(',').map((t) => t.trim()) : newEvent.tags,
      price: Number(newEvent.price),
      capacity: Number(newEvent.capacity),
    };
    const url = editingEvent ? `/api/events/${editingEvent._id}` : '/api/events';
    const method = editingEvent ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(formattedEvent),
    });
    if (res.ok) {
      setShowModal(false);
      resetForm();
      fetchData();
      alert(editingEvent ? 'Event updated! Pending main admin approval if changed.' : 'Event submitted! It will appear on the website after main admin approval.');
    } else {
      const errData = await res.json();
      alert(errData.message || 'Failed to save event');
    }
  };

  const openEditModal = (evt) => {
    setEditingEvent(evt);
    const loc = parseLocation(evt.location);
    setSelectedCountry(countries.includes(loc.country) ? loc.country : 'Other');
    setSelectedCity(loc.country === 'India' && indianCities.includes(loc.city) ? loc.city : 'Mumbai');
    if (loc.country !== 'India') setCustomCity(loc.city);
    setVenueAddress(loc.venue);
    setNewEvent({
      title: evt.title, description: evt.description, date: evt.date.split('T')[0],
      price: evt.price, capacity: evt.capacity, tags: evt.tags?.join(', ') || '',
      speaker: evt.speaker || '', bannerType: evt.bannerType || 'image', bannerMedia: evt.bannerMedia || '',
    });
    setShowModal(true);
  };

  const deleteEvent = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    const res = await fetch(`/api/events/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setEvents(events.filter((e) => e._id !== id));
  };

  const toggleAttendance = async (regId) => {
    const res = await fetch(`/api/registrations/${regId}/attend`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) fetchData();
  };

  const adminCancelTicket = async (regId) => {
    if (!window.confirm('Cancel this ticket?')) return;
    const res = await fetch(`/api/registrations/admin/${regId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { fetchData(); alert('Ticket cancelled.'); }
  };

  const filteredRegistrations = registrations.filter((r) => {
    const q = attendeeSearch.toLowerCase();
    const matchesSearch = r.user?.name?.toLowerCase().includes(q) || r.user?.email?.toLowerCase().includes(q);
    const matchesFilter = attendeeFilter === 'all' || (attendeeFilter === 'confirmed' && r.status !== 'cancelled') || (attendeeFilter === 'cancelled' && r.status === 'cancelled');
    return matchesSearch && matchesFilter;
  });

  const totalRevenue = events.reduce((sum, ev) => {
    const regCount = registrations.filter((r) => r.event === ev._id && r.status !== 'cancelled').length;
    return sum + regCount * ev.price;
  }, 0);

  const capacityStats = events.slice(0, 3).map((e) => {
    const filled = registrations.filter((r) => r.event === e._id && r.status !== 'cancelled').length;
    return { title: e.title, percentage: e.capacity > 0 ? Math.round((filled / e.capacity) * 100) : 0 };
  });

  const tabs = [
    { id: 'events', label: 'My Events', icon: '🎟️' },
    { id: 'registrations', label: 'Attendees', icon: '👥' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white overflow-hidden relative">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-fuchsia-500/5 rounded-full blur-[100px] animate-float" />
      </div>

      {/* Celebration overlay */}
      <AnimatePresence>
        {celebrate && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setCelebrate(false)}
          >
            <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="text-center p-8 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 shadow-2xl">
              <div className="text-6xl mb-4 animate-bounce">🎉</div>
              <h3 className="text-2xl font-black">Event Approved!</h3>
              <p className="text-emerald-100 mt-2">Your event is now live on the website.</p>
              <button className="mt-4 px-6 py-2 bg-white text-emerald-700 font-bold rounded-xl" onClick={() => setCelebrate(false)}>Awesome!</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <motion.header initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <motion.h1 className="text-3xl font-black bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              Organizer Studio
            </motion.h1>
            <p className="text-slate-400 text-sm mt-1">Welcome back, {user?.name} — craft unforgettable events</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button onClick={() => { logout(); navigate('/'); }} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-semibold transition-all">Logout</button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center font-bold ring-2 ring-cyan-400/30">
              {user?.name?.charAt(0)}
            </div>
          </div>
        </motion.header>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'My Events', val: events.length, icon: '🗓️', grad: 'from-cyan-500 to-blue-600' },
            { label: 'Bookings', val: registrations.filter((r) => r.status !== 'cancelled').length, icon: '🎟️', grad: 'from-violet-500 to-purple-600' },
            { label: 'Revenue', val: `₹${totalRevenue.toFixed(0)}`, icon: '💎', grad: 'from-fuchsia-500 to-pink-600' },
            { label: 'Pending Review', val: events.filter((e) => e.status === 'pending').length, icon: '⏳', grad: 'from-amber-500 to-orange-600' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="relative p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm overflow-hidden group hover:border-white/20 transition-all"
            >
              <div className={`absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-gradient-to-br ${s.grad} opacity-20 blur-xl group-hover:opacity-40 transition-opacity`} />
              <div className="flex justify-between items-start">
                <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">{s.label}</p>
                <span className="text-xl">{s.icon}</span>
              </div>
              <p className="text-2xl font-black mt-2">{s.val}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === tab.id ? 'bg-gradient-to-r from-cyan-500 to-violet-600 text-white shadow-lg shadow-cyan-500/25' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}
            >
              {tab.icon} {tab.label}
            </motion.button>
          ))}
          {activeTab === 'events' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => { resetForm(); setShowModal(true); }}
              className="ml-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 font-bold text-sm shadow-lg shadow-emerald-500/25"
            >
              ✨ Create Event
            </motion.button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'events' && (
            <motion.div key="events" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="grid gap-4">
              {events.length === 0 && (
                <div className="text-center py-16 text-slate-400">
                  <p className="text-4xl mb-3">🎪</p>
                  <p>No events yet. Create your first event!</p>
                </div>
              )}
              {events.map((event, i) => (
                <motion.div
                  key={event._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex flex-col md:flex-row gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-all"
                >
                  <div className="w-full md:w-48 h-32 rounded-xl overflow-hidden shrink-0">
                    <EventBanner event={event} isMini />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg">{event.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${statusColors[event.status] || statusColors.pending}`}>
                        {event.status || 'pending'}
                      </span>
                      {event.bannerType === 'video' && <span className="text-xs text-cyan-400">📹 Video</span>}
                    </div>
                    <p className="text-slate-400 text-sm line-clamp-2">{event.description}</p>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
                      <span>📅 {new Date(event.date).toLocaleDateString()}</span>
                      <span>📍 {event.location}</span>
                      <span>₹{event.price}</span>
                    </div>
                    {event.status === 'pending' && (
                      <p className="text-amber-400 text-xs mt-2 font-semibold">⏳ Awaiting main admin approval to appear on website</p>
                    )}
                  </div>
                  <div className="flex md:flex-col gap-2 shrink-0">
                    <button onClick={() => openEditModal(event)} className="px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 text-sm font-bold hover:bg-cyan-500/30">Edit</button>
                    <button onClick={() => deleteEvent(event._id)} className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm font-bold hover:bg-red-500/30">Delete</button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === 'registrations' && (
            <motion.div key="regs" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
              <div className="p-4 border-b border-white/10 flex flex-wrap gap-3">
                <input type="text" placeholder="Search attendee..." value={attendeeSearch} onChange={(e) => setAttendeeSearch(e.target.value)} className="px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm outline-none focus:ring-1 focus:ring-cyan-500" />
                <select value={attendeeFilter} onChange={(e) => setAttendeeFilter(e.target.value)} className="px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm outline-none">
                  <option value="all">All</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="divide-y divide-white/5">
                {filteredRegistrations.map((reg) => (
                  <div key={reg._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/5">
                    <div>
                      <p className="font-semibold">{reg.user?.name}</p>
                      <p className="text-sm text-slate-400">{reg.user?.email} · {reg.eventDetails?.title}</p>
                    </div>
                    <div className="flex gap-2">
                      {reg.status !== 'cancelled' && (
                        <>
                          <button onClick={() => toggleAttendance(reg._id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${reg.attended ? 'bg-cyan-500 text-white' : 'bg-white/10'}`}>
                            {reg.attended ? '✓ Attended' : 'Mark Attended'}
                          </button>
                          <button onClick={() => adminCancelTicket(reg._id)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/20 text-red-400">Cancel</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {filteredRegistrations.length === 0 && <p className="p-8 text-center text-slate-500">No attendees found.</p>}
              </div>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div key="analytics" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="font-bold mb-4">Capacity Fill Rate</h3>
                {capacityStats.map((stat, i) => (
                  <div key={i} className="mb-4">
                    <div className="flex justify-between text-sm mb-1"><span className="text-slate-400 truncate">{stat.title}</span><span>{stat.percentage}%</span></div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(stat.percentage, 100)}%` }} className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-600/20 to-cyan-600/20 border border-white/10">
                <h3 className="font-bold mb-4">Earnings Summary</h3>
                <p className="text-3xl font-black text-cyan-400">₹{(totalRevenue * 0.95).toFixed(2)}</p>
                <p className="text-slate-400 text-sm mt-1">Net after 5% platform fee</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }} className="bg-[#12121f] border border-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
              <h2 className="text-xl font-black mb-4">{editingEvent ? 'Edit Event' : 'Create New Event'}</h2>
              <form onSubmit={handleCreateEvent} className="space-y-3">
                <input required placeholder="Event Title" className="w-full p-3 rounded-xl bg-black/40 border border-white/10 outline-none focus:ring-1 focus:ring-cyan-500" value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} />
                <textarea required placeholder="Description" rows={3} className="w-full p-3 rounded-xl bg-black/40 border border-white/10 outline-none focus:ring-1 focus:ring-cyan-500" value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <input required type="date" className="p-3 rounded-xl bg-black/40 border border-white/10 outline-none" value={newEvent.date} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} />
                  <input required placeholder="Speaker" className="p-3 rounded-xl bg-black/40 border border-white/10 outline-none" value={newEvent.speaker} onChange={(e) => setNewEvent({ ...newEvent, speaker: e.target.value })} />
                </div>
                <select className="w-full p-3 rounded-xl bg-black/40 border border-white/10 outline-none" value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)}>
                  {countries.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {selectedCountry === 'India' ? (
                  <select className="w-full p-3 rounded-xl bg-black/40 border border-white/10 outline-none" value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
                    {indianCities.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                ) : (
                  <input required placeholder="City" className="w-full p-3 rounded-xl bg-black/40 border border-white/10 outline-none" value={customCity} onChange={(e) => setCustomCity(e.target.value)} />
                )}
                <input required placeholder="Venue / Virtual link" className="w-full p-3 rounded-xl bg-black/40 border border-white/10 outline-none" value={venueAddress} onChange={(e) => setVenueAddress(e.target.value)} />
                <div className="grid grid-cols-2 gap-3">
                  <input required type="number" min="0" placeholder="Price ₹" className="p-3 rounded-xl bg-black/40 border border-white/10 outline-none" value={newEvent.price} onChange={(e) => setNewEvent({ ...newEvent, price: e.target.value })} />
                  <input required type="number" min="1" placeholder="Capacity" className="p-3 rounded-xl bg-black/40 border border-white/10 outline-none" value={newEvent.capacity} onChange={(e) => setNewEvent({ ...newEvent, capacity: e.target.value })} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {['image', 'video', 'slideshow'].map((t) => (
                    <button key={t} type="button" onClick={() => setNewEvent({ ...newEvent, bannerType: t })} className={`py-2 rounded-lg text-xs font-bold border ${newEvent.bannerType === t ? 'bg-cyan-500 border-cyan-500' : 'border-white/10 bg-black/30'}`}>
                      {t === 'image' ? '🖼️ Photo' : t === 'video' ? '📹 Video' : '🎠 Slides'}
                    </button>
                  ))}
                </div>
                <input type="text" placeholder="Banner URL or upload below" className="w-full p-3 rounded-xl bg-black/40 border border-white/10 outline-none text-sm" value={newEvent.bannerMedia?.startsWith('data:') ? 'File uploaded ✓' : newEvent.bannerMedia} onChange={(e) => setNewEvent({ ...newEvent, bannerMedia: e.target.value })} />
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-400 text-sm font-bold">
                  📤 Upload Media
                  <input type="file" accept={newEvent.bannerType === 'video' ? 'video/*' : 'image/*'} multiple={newEvent.bannerType === 'slideshow'} className="hidden" onChange={handleMediaUpload} />
                </label>
                <input required placeholder="Tags (comma separated)" className="w-full p-3 rounded-xl bg-black/40 border border-white/10 outline-none" value={newEvent.tags} onChange={(e) => setNewEvent({ ...newEvent, tags: e.target.value })} />
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="px-4 py-2 rounded-xl text-slate-400">Cancel</button>
                  <button type="submit" className="px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 font-bold">{editingEvent ? 'Save' : 'Submit for Review'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LocalAdminDashboard;
