import { useState, useEffect, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LocalAdminDashboard from './LocalAdminDashboard';

const countries = [
  "India",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Singapore",
  "United Arab Emirates",
  "Germany",
  "France",
  "Japan",
  "Other"
];

const indianCities = [
  "Bengaluru",
  "Mumbai",
  "Delhi",
  "Kolkata",
  "Chennai",
  "Hyderabad",
  "Pune",
  "Ahmedabad",
  "Surat",
  "Jaipur",
  "Lucknow",
  "Kanpur",
  "Nagpur",
  "Indore",
  "Thane",
  "Bhopal",
  "Visakhapatnam",
  "Vadodara",
  "Ghaziabad",
  "Ludhiana",
  "Agra",
  "Nashik",
  "Faridabad",
  "Meerut",
  "Rajkot",
  "Varanasi",
  "Srinagar",
  "Aurangabad",
  "Amritsar",
  "Navi Mumbai",
  "Allahabad",
  "Howrah",
  "Gwalior",
  "Jabalpur",
  "Coimbatore",
  "Vijayawada",
  "Jodhpur",
  "Madurai",
  "Raipur",
  "Kota",
  "Chandigarh",
  "Guwahati",
  "Solapur",
  "Mysore",
  "Dehradun",
  "Gurugram",
  "Noida",
  "Bhubaneswar",
  "Kochi",
  "Panaji"
].sort();

const AdminDashboard = () => {
  const { user, logout, token } = useAuth();

  // Redirect to LocalAdminDashboard if logged-in user is not the main admin or first superuser
  if (user && (user.email || '').toLowerCase().trim() !== 'admin@codesky.com' && !user.isFirstUser) {
    return <LocalAdminDashboard />;
  }

  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [users, setUsers] = useState([]);
  const [adminApplications, setAdminApplications] = useState([]);
  const [newsletterSubscribers, setNewsletterSubscribers] = useState([]);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastStatus, setBroadcastStatus] = useState('');
  const [usersCount, setUsersCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);
  const [storageInfo, setStorageInfo] = useState({ backend: 'JSON file store', file: 'server/data/appDatabase.json' });
  const [editingEvent, setEditingEvent] = useState(null);
  const [activeTab, setActiveTab] = useState('events');
  const [supportRequests, setSupportRequests] = useState([]);
  const [selectedSupportRequest, setSelectedSupportRequest] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('Response to your Codesky Support request');
  const [emailBody, setEmailBody] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const handleOpenEmailModal = (req) => {
    setEmailSubject('Response to your Codesky Support request');
    setEmailBody(`Hi,

Thank you for connecting with Codesky support. We received your request regarding:
"${req.conversation?.filter(m => m.sender === 'user').slice(-1)[0]?.text || 'your callback request'}"

We would love to help you. [Type your custom response here...]

Best regards,
Codesky Admin Team`);
    setShowEmailModal(true);
  };

  const handleSendSupportEmail = async () => {
    if (!selectedSupportRequest) return;
    setIsSendingEmail(true);
    try {
      const res = await fetch(`/api/support/request/${selectedSupportRequest._id}/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ subject: emailSubject, body: emailBody })
      });
      if (res.ok) {
        alert('Support response email sent successfully!');
        setShowEmailModal(false);
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to send email');
      }
    } catch {
      alert('Network error sending email');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const [showOnboarding, setShowOnboarding] = useState(localStorage.getItem('firstUserOnboarding') === 'true');
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [onboardingConfig, setOnboardingConfig] = useState({
    platformFee: 5,
    minWithdrawal: 100,
    globalBanner: 'Welcome to Codesky Events! Platform successfully initialized.',
    firstEventTitle: 'Codesky Inaugural Tech Summit 2026',
    firstEventPrice: 500,
    firstEventCapacity: 200,
    firstEventLat: 12.9716,
    firstEventLng: 77.5946,
    firstEventVenue: 'Hall A, Nesco Center, Mumbai',
    heroMediaType: 'video',
    heroMediaUrl: '',
    heroTitle: 'Experience events worth showing up for.',
    heroSubtitle: 'Discover concerts, conferences, and workshops hand-picked by our curators. Register securely with your wallet, earn credits, and download verified attendance certificates.',
    heroBannerMode: 'custom'
  });

  // Location selectors form state
  const [selectedCountry, setSelectedCountry] = useState('India');
  const [selectedCity, setSelectedCity] = useState('Mumbai');
  const [customCity, setCustomCity] = useState('');
  const [venueAddress, setVenueAddress] = useState('');

  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    price: 0,
    capacity: 100,
    tags: '',
    speaker: '',
    bannerType: 'image',
    bannerMedia: '',
    latitude: '',
    longitude: '',
    mapLink: ''
  });
  const [attendeeSearch, setAttendeeSearch] = useState('');
  const [attendeeFilter, setAttendeeFilter] = useState('all'); // all, confirmed, cancelled
  const [payoutStatus, setPayoutStatus] = useState('idle'); // idle, processing, complete
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
    if (token) {
      fetch('/api/settings/detailed', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.platformFee !== undefined) {
          setOnboardingConfig(prev => ({
            ...prev,
            platformFee: data.platformFee,
            minWithdrawal: data.minWithdrawal,
            globalBanner: data.globalBanner,
            heroMediaType: data.heroMediaType || 'video',
            heroMediaUrl: data.heroMediaUrl || '',
            heroTitle: data.heroTitle || 'Experience events worth showing up for.',
            heroSubtitle: data.heroSubtitle || 'Discover concerts, conferences, and workshops hand-picked by our curators. Register securely with your wallet, earn credits, and download verified attendance certificates.',
            heroBannerMode: data.heroBannerMode || 'custom'
          }));
        }
      })
      .catch(err => console.error(err));
    }
  }, []);

  const handleHeroMediaUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setOnboardingConfig(prev => ({ ...prev, heroMediaUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSettingsConfig = async () => {
    try {
      const res = await fetch('/api/settings/detailed', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          platformFee: onboardingConfig.platformFee,
          minWithdrawal: onboardingConfig.minWithdrawal,
          globalBanner: onboardingConfig.globalBanner,
          heroMediaType: onboardingConfig.heroMediaType,
          heroMediaUrl: onboardingConfig.heroMediaUrl,
          heroTitle: onboardingConfig.heroTitle,
          heroSubtitle: onboardingConfig.heroSubtitle,
          heroBannerMode: onboardingConfig.heroBannerMode
        })
      });
      if (res.ok) {
        alert('Platform configurations saved successfully!');
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to save settings');
      }
    } catch {
      alert('Network error saving settings');
    }
  };

  const handleOnboardingSubmit = async () => {
    try {
      await fetch('/api/settings/detailed', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          platformFee: onboardingConfig.platformFee,
          minWithdrawal: onboardingConfig.minWithdrawal,
          globalBanner: onboardingConfig.globalBanner
        })
      });

      const finalLocation = `${onboardingConfig.firstEventVenue}, Mumbai, India`;
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: onboardingConfig.firstEventTitle,
          description: 'Welcome to the inaugural Codesky Tech Summit! Join us for a full day of developer conferences, interactive workshops, networking breaks, and keynotes.',
          date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          location: finalLocation,
          price: onboardingConfig.firstEventPrice,
          capacity: onboardingConfig.firstEventCapacity,
          tags: ['Technology', 'Inaugural', 'Summit'],
          speaker: 'Codesky Core Team',
          bannerType: 'image',
          bannerMedia: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop',
          latitude: onboardingConfig.firstEventLat,
          longitude: onboardingConfig.firstEventLng,
          ticketTiers: [
            { name: 'General Admission', price: onboardingConfig.firstEventPrice, capacity: onboardingConfig.firstEventCapacity - 20, perks: 'Base seat, entrance' },
            { name: 'VIP Pass', price: onboardingConfig.firstEventPrice * 1.3, capacity: 15, perks: 'Front row seats, free meals' },
            { name: 'VVIP Backstage', price: onboardingConfig.firstEventPrice * 1.8, capacity: 5, perks: 'Meet the team, backstage access' }
          ]
        })
      });

      localStorage.removeItem('firstUserOnboarding');
      setShowOnboarding(false);
      fetchData();
      alert('🎉 Codesky Event Platform successfully initialized!');
    } catch (err) {
      console.error(err);
      alert('Error initializing platform.');
    }
  };

  const handleDeleteAdmin = async (email) => {
    if (!window.confirm(`Permanently delete the approved admin user account ${email}? All their created data will be deleted.`)) return;
    try {
      const res = await fetch(`/api/applications/delete-admin/${encodeURIComponent(email)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        await fetchData();
        alert(data.message);
      } else {
        alert(data.message || 'Failed to delete admin');
      }
    } catch {
      alert('Network error');
    }
  };

  const fetchData = async () => {
    try {
      const res1 = await fetch('/api/events?all=true', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data1 = await res1.json();
      setEvents(data1);

      const res2 = await fetch('/api/registrations/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if(res2.ok) {
        const data2 = await res2.json();
        setRegistrations(data2);
      }

      const res3 = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if(res3.ok) {
        const data3 = await res3.json();
        setUsers(data3);
        setUsersCount(data3.length);
      }

      const res4 = await fetch('/api/settings/storage', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res4.ok) {
        const data4 = await res4.json();
        setStorageInfo(data4);
      }

      const res5 = await fetch('/api/applications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res5.ok) {
        const data5 = await res5.json();
        setAdminApplications(data5);
      }

      const res6 = await fetch('/api/settings');
      if (res6.ok) {
        const data6 = await res6.json();
        setNewsletterSubscribers(data6.newsletter || []);
      }

      if (token) {
        const res7 = await fetch('/api/support/requests', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res7.ok) {
          const data7 = await res7.json();
          setSupportRequests(data7);
          setSelectedSupportRequest(prev => {
            if (!prev) return null;
            return data7.find(r => r._id === prev._id) || prev;
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveSupportRequest = async (requestId) => {
    try {
      const res = await fetch(`/api/support/request/${requestId}/resolve`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        alert('Support request marked as resolved.');
        fetchData();
      } else {
        alert('Failed to resolve support request');
      }
    } catch {
      alert('Network error');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const parseLocation = (locationStr) => {
    if (!locationStr) return { country: 'India', city: 'Mumbai', venue: '' };
    const parts = locationStr.split(',').map(p => p.trim());
    if (parts.length === 1) {
      return { country: 'India', city: parts[0], venue: '' };
    }
    if (parts.length === 2) {
      return { country: parts[1], city: parts[0], venue: '' };
    }
    const country = parts[parts.length - 1];
    const city = parts[parts.length - 2];
    const venue = parts.slice(0, parts.length - 2).join(', ');
    return { country, city, venue };
  };

  const handleMediaUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const promises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then(base64s => {
      if (newEvent.bannerType === 'slideshow') {
        const delimiter = newEvent.bannerMedia?.includes('||') ? '||' : (newEvent.bannerMedia?.includes(',') ? ',' : '||');
        const currentUrls = newEvent.bannerMedia ? newEvent.bannerMedia.split(delimiter).map(s=>s.trim()).filter(Boolean) : [];
        const updated = [...currentUrls, ...base64s];
        setNewEvent(prev => ({ ...prev, bannerMedia: updated.join('||') }));
      } else {
        setNewEvent(prev => ({ ...prev, bannerMedia: base64s[0] }));
      }
    });
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    const finalCity = selectedCountry === 'India' ? selectedCity : (customCity || 'Mumbai');
    const location = `${venueAddress ? venueAddress + ', ' : ''}${finalCity}, ${selectedCountry}`;

    const formattedEvent = {
      ...newEvent,
      location,
      tags: typeof newEvent.tags === 'string' ? newEvent.tags.split(',').map(t => t.trim()) : newEvent.tags,
      price: Number(newEvent.price),
      capacity: Number(newEvent.capacity)
    };

    const isEditing = !!editingEvent;
    const url = isEditing ? `/api/events/${editingEvent._id}` : '/api/events';
    const method = isEditing ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(formattedEvent)
    });
    
    if (res.ok) {
      setShowModal(false);
      setEditingEvent(null);
      setNewEvent({
        title: '',
        description: '',
        date: '',
        price: 0,
        capacity: 100,
        tags: '',
        speaker: '',
        bannerType: 'image',
        bannerMedia: '',
        latitude: '',
        longitude: '',
        mapLink: ''
      });
      setSelectedCountry('India');
      setSelectedCity('Mumbai');
      setCustomCity('');
      setVenueAddress('');
      fetchData();
    } else {
      const errData = await res.json();
      alert(errData.message || 'Failed to save event');
    }
  };

  const openEditModal = (evt) => {
    setEditingEvent(evt);
    
    // Parse location
    const loc = parseLocation(evt.location);
    setSelectedCountry(countries.includes(loc.country) ? loc.country : 'Other');
    if (loc.country === 'India') {
      setSelectedCity(indianCities.includes(loc.city) ? loc.city : 'Mumbai');
    } else {
      setCustomCity(loc.city);
    }
    setVenueAddress(loc.venue);

    setNewEvent({
      title: evt.title,
      description: evt.description,
      date: evt.date.split('T')[0],
      price: evt.price,
      capacity: evt.capacity,
      tags: evt.tags ? evt.tags.join(', ') : '',
      speaker: evt.speaker || '',
      bannerType: evt.bannerType || 'image',
      bannerMedia: evt.bannerMedia || '',
      latitude: evt.latitude || '',
      longitude: evt.longitude || '',
      mapLink: evt.mapLink || ''
    });
    setShowModal(true);
  };

  const toggleAttendance = async (regId) => {
    const res = await fetch(`/api/registrations/${regId}/attend`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      fetchData();
    }
  };

  const adminCancelTicket = async (regId) => {
    if (!window.confirm("Are you sure you want to cancel this ticket? The seat will be released and the user will be notified.")) return;
    const res = await fetch(`/api/registrations/admin/${regId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      fetchData();
      alert("Ticket cancelled and user notified via email.");
    } else {
      alert("Failed to cancel ticket.");
    }
  };

  const deleteEvent = async (id) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      const res = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setEvents(events.filter(e => e._id !== id));
      }
    }
  };

  const totalRevenue = events.reduce((sum, ev) => {
    const regCount = registrations.filter(r => r.event === ev._id && r.status !== 'cancelled').length;
    return sum + (regCount * ev.price);
  }, 0);

  // Analytics Calculations
  const last7DaysSales = Array(7).fill(0);
  const now = new Date();
  registrations.forEach(r => {
    if (r.status !== 'cancelled') {
      const regDate = new Date(r.createdAt || Date.now());
      const diffTime = Math.abs(now - regDate);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 7) {
        last7DaysSales[6 - diffDays]++;
      }
    }
  });

  const capacityStats = events.slice(0, 3).map(e => {
    const filled = registrations.filter(r => r.event === e._id && r.status !== 'cancelled').length;
    const percentage = e.capacity > 0 ? Math.round((filled / e.capacity) * 100) : 0;
    return { title: e.title, percentage };
  });

  const exportCSV = () => {
    let csv = "User,Email,Event,Status,Attended\n";
    registrations.forEach(r => {
      csv += `${r.user?.name},${r.user?.email},${r.eventDetails?.title},${r.status},${r.attended}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'registrations.csv';
    a.click();
  };

  const handleScanMock = () => {
    const id = prompt("Enter Ticket ID to scan:");
    if (id) {
      alert(`Scanning Mock Ticket ID: ${id}... Success! Ticket validated.`);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('ID copied to clipboard!');
  };

  const duplicateEvent = async (event) => {
    const duplicated = { ...event, title: `${event.title} (Copy)`, _id: undefined };
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(duplicated)
    });
    if (res.ok) fetchData();
  };

  const filteredRegistrations = registrations.filter(r => {
    const matchesSearch = r.user?.name?.toLowerCase().includes(attendeeSearch.toLowerCase()) || r.user?.email?.toLowerCase().includes(attendeeSearch.toLowerCase());
    const matchesFilter = attendeeFilter === 'all' || (attendeeFilter === 'confirmed' && r.status !== 'cancelled') || (attendeeFilter === 'cancelled' && r.status === 'cancelled');
    return matchesSearch && matchesFilter;
  });

  const handleMassEmail = async () => {
    try {
      const res = await fetch('/api/events/remind-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: 'Friendly reminder from the Codesky Organizer!' })
      });
      const data = await res.json();
      if (res.ok) alert(data.message);
      else alert('Failed to send mass email');
    } catch (e) {
      alert('Error sending emails');
    }
  };

  const handleGlobalBanner = async () => {
    const bannerText = prompt("Enter the new global announcement (leave blank to clear):");
    if (bannerText !== null) {
      try {
        const res = await fetch('/api/settings/banner', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ banner: bannerText })
        });
        const data = await res.json();
        if (res.ok) alert(data.message);
        else alert('Failed to update banner');
      } catch (e) {
        alert('Network error');
      }
    }
  };

  const handleSecurityAudit = async () => {
    try {
      const res = await fetch('/api/settings/audit', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch audit');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'security_audit.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert('Error downloading security audit');
    }
  };

  const handleDownloadDatabase = async () => {
    try {
      const res = await fetch('/api/settings/storage/raw', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to download database');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'appDatabase.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert('Error downloading JSON database');
    }
  };

  const handlePayout = () => {
    if (totalRevenue === 0) return alert('No funds to payout');
    setPayoutStatus('processing');
    setTimeout(() => {
      setPayoutStatus('complete');
      setTimeout(() => setPayoutStatus('idle'), 3000);
    }, 2000);
  };

  const handleUserStatusChange = async (userId, status) => {
    try {
      const res = await fetch(`/api/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchData();
        alert(`User ${status} successfully.`);
      } else {
        alert('Failed to update user status');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to permanently delete this user account? All of their registered tickets and details will be deleted permanently.")) return;
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        fetchData();
        alert("User account deleted successfully.");
      } else {
        const data = await res.json();
        alert(data.message || "Failed to delete user.");
      }
    } catch (err) {
      alert("Network error.");
    }
  };

  const handleAdminApplicationDecision = async (applicationId, decision) => {
    const action = decision === 'approve' ? 'approve' : 'reject';
    const confirmed = window.confirm(
      action === 'approve'
        ? 'Approve this admin request? A temporary password will be emailed automatically.'
        : 'Reject this admin request?'
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/applications/${applicationId}/${action}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ adminEmail: user?.email })
      });
      const data = await res.json();
      if (res.ok) {
        await fetchData();
        alert(data.message);
      } else {
        alert(data.message || 'Failed to update application');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastMessage) return alert('Please enter a message to broadcast.');
    setBroadcastStatus('Sending...');
    try {
      const res = await fetch('/api/settings/newsletter/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title: broadcastTitle, message: broadcastMessage })
      });
      const data = await res.json();
      if (res.ok) {
        setBroadcastStatus('Broadcast sent successfully! 🚀');
        setBroadcastTitle('');
        setBroadcastMessage('');
        setTimeout(() => setBroadcastStatus(''), 4000);
      } else {
        setBroadcastStatus(data.message || 'Failed to send broadcast');
      }
    } catch {
      setBroadcastStatus('Error sending broadcast');
    }
  };

  const pendingAdminApplications = adminApplications.filter((app) => app.status === 'pending');
  const pendingEvents = events.filter((e) => e.status === 'pending');

  const handleEventApproval = async (eventId, action) => {
    const confirmed = window.confirm(action === 'approve' ? 'Approve this event? It will appear on the public website.' : 'Reject this event?');
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/events/${eventId}/${action}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        await fetchData();
        alert(data.message);
      } else {
        alert(data.message || 'Failed to update event');
      }
    } catch {
      alert('Network error');
    }
  };

  const handleRevokeAdmin = async (email) => {
    if (!window.confirm(`Block and revoke admin access for ${email}? They will no longer be able to manage events.`)) return;
    try {
      const res = await fetch(`/api/applications/revoke/${encodeURIComponent(email)}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        await fetchData();
        alert(data.message);
      } else {
        alert(data.message || 'Failed to revoke admin');
      }
    } catch {
      alert('Network error');
    }
  };

  const handleDeleteApplication = async (applicationId) => {
    if (!window.confirm('Permanently delete this application record?')) return;
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        await fetchData();
        alert(data.message);
      } else {
        alert(data.message || 'Failed to delete');
      }
    } catch {
      alert('Network error');
    }
  };

  const pendingSupportCount = supportRequests.filter((r) => r.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Top navigation is provided globally by EventAppLayout */}
      <div className="p-6 max-w-7xl mx-auto -mt-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-purple-500">
              Codesky Admin
            </h1>
            <span className="inline-flex mt-2 px-2 py-1 bg-red-100 text-red-600 rounded text-xs font-bold uppercase tracking-wider">
              Superuser
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-white/70 hover:bg-white dark:bg-slate-800/70 dark:hover:bg-slate-800"
            >
              Logout
            </button>
            <button
              onClick={() => setProfilePanelOpen(open => !open)}
              className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold ring-2 ring-purple-400/30 hover:scale-105 transition-transform"
            >
              {user?.name?.charAt(0)}
            </button>
          </div>
        </div>
      </div>

      {/* Profile panel */}
      {profilePanelOpen && (
        <div className="fixed top-20 right-6 z-50 w-72 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-purple-500 text-white flex items-center justify-center text-lg font-bold">{user?.name?.charAt(0)}</div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Admin profile</p>
              <p className="font-semibold text-slate-900 dark:text-white">{user?.name || 'Admin'}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
            </div>
          </div>
          <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <p><span className="font-semibold">Role:</span> Superuser</p>
            <p><span className="font-semibold">Bookings:</span> {registrations.filter(r => r.status !== 'cancelled').length}</p>
            <p><span className="font-semibold">Revenue:</span> ₹{totalRevenue.toFixed(2)}</p>
          </div>
          <button onClick={() => setProfilePanelOpen(false)} className="mt-4 w-full px-4 py-2 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold">Close</button>
        </div>
      )}

      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
        <header className="flex flex-col lg:flex-row justify-between lg:items-center gap-6 glassmorphism p-6 rounded-3xl border border-white/40 dark:border-slate-700/60 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-primary-500 via-purple-500 to-pink-500" />
          <div className="w-full lg:w-auto pl-3">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
              <span className="text-xs font-black uppercase tracking-widest text-primary-500 dark:text-primary-400">Live System Active</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white tracking-tight mt-1">Admin Command Center</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Orchestrate events, review administrator requests, and monitor financial analytics.</p>
          </div>
          <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center">
            <div className="flex flex-wrap gap-1.5 bg-slate-200/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl p-1.5 border border-slate-300/50 dark:border-slate-700/50">
              {[
                { id: 'events', label: '🎟️ Events', badge: pendingEvents.length },
                { id: 'registrations', label: '👥 Attendees' },
                { id: 'users', label: '👤 Users' },
                { id: 'applications', label: '⚡ Requests', badge: pendingAdminApplications.length },
                { id: 'newsletter', label: '📰 Newsletter', badge: newsletterSubscribers.length },
                { id: 'support', label: '💬 Support Chats', badge: pendingSupportCount },
                { id: 'analytics', label: '📊 Analytics' },
                { id: 'financials', label: '💰 Financials' },
                { id: 'settings-config', label: '⚙️ Platform Config' },
                { id: 'tools', label: '🛠️ Tools & Logs' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 flex items-center gap-1.5 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-primary-500 to-purple-600 text-white shadow-lg shadow-primary-500/25 scale-105'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.badge > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] bg-red-500 text-white rounded-full font-black animate-bounce">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
            {activeTab === 'events' && (
              <button onClick={() => setShowModal(true)} className="w-full lg:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-black shadow-lg shadow-emerald-500/25 hover:scale-105 transition-all flex items-center justify-center gap-2">
                <span>✨</span> Create Event
              </button>
            )}
            {activeTab === 'registrations' && (
              <button onClick={exportCSV} className="w-full lg:w-auto px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black shadow-lg hover:opacity-90 transition-all">
                📥 Export CSV
              </button>
            )}
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-6">
          {[
            { label: 'Total Events', val: events.length, trend: 'Active Portfolio', icon: '🗓️', color: 'from-blue-500 to-indigo-600' },
            { label: 'Total Users', val: usersCount, trend: 'Registered Members', icon: '👥', color: 'from-purple-500 to-pink-600' },
            { label: 'Admin Requests', val: pendingAdminApplications.length, trend: pendingAdminApplications.length > 0 ? 'Action Required!' : 'All Cleared', icon: '🛡️', color: 'from-amber-500 to-orange-600' },
            { label: 'Active Bookings', val: registrations.filter(r=>r.status!=='cancelled').length, trend: 'Verified Tickets', icon: '🎟️', color: 'from-emerald-500 to-teal-600' },
            { label: 'Total Revenue', val: `₹${totalRevenue.toFixed(2)}`, trend: 'Gross Earnings', icon: '💎', color: 'from-primary-500 to-violet-600' }
          ].map((stat, i) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="p-6 rounded-3xl glassmorphism card-hover-effect border border-white/40 dark:border-slate-700/60 shadow-xl relative overflow-hidden flex flex-col justify-between"
            >
              <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-gradient-to-br ${stat.color} opacity-15 blur-xl`} />
              
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{stat.label}</h3>
                <span className="text-2xl p-2 rounded-2xl bg-slate-100 dark:bg-slate-800 shadow-inner">{stat.icon}</span>
              </div>
              
              <div className="mt-4">
                <p className="text-3xl font-black tracking-tight text-slate-800 dark:text-white">{stat.val}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{stat.trend}</p>
                </div>
              </div>
              
              {stat.label === 'Total Revenue' && (
                <div className="mt-4 h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 w-[85%] animate-pulse"></div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-500">Live data store</p>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Database storage & visibility status</h3>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleDownloadDatabase} className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm shadow hover:opacity-90 flex items-center gap-2">
                <span>📥</span> Export Database JSON
              </button>
              <div className="rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                {storageInfo.backend}
              </div>
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-5">
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/50 col-span-2">
              <p className="text-xs uppercase tracking-wider text-slate-400">Storage File Path</p>
              <p className="mt-2 font-semibold text-slate-800 dark:text-white truncate text-sm">{storageInfo.absolutePath || storageInfo.file}</p>
              <p className="text-xs text-slate-400 mt-1">Updated: {storageInfo.lastModified || 'Active'}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/50">
              <p className="text-xs uppercase tracking-wider text-slate-400">Users</p>
              <p className="mt-2 font-semibold text-slate-800 dark:text-white text-xl">{storageInfo.users}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/50">
              <p className="text-xs uppercase tracking-wider text-slate-400">Events</p>
              <p className="mt-2 font-semibold text-slate-800 dark:text-white text-xl">{storageInfo.events}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/50">
              <p className="text-xs uppercase tracking-wider text-slate-400">Bookings</p>
              <p className="mt-2 font-semibold text-slate-800 dark:text-white text-xl">{storageInfo.registrations}</p>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        {activeTab === 'events' && (
          <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Manage Events</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-sm uppercase tracking-wider">
                  <tr>
                    <th className="p-4 font-semibold">Title</th>
                    <th className="p-4 font-semibold">Date</th>
                    <th className="p-4 font-semibold">Price</th>
                    <th className="p-4 font-semibold">Capacity</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-800 dark:text-slate-200">
                  {events.map(event => (
                    <Fragment key={event._id}>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="p-4 font-medium">
                        {event.title}
                        <div className="text-xs text-slate-400 mt-1 cursor-pointer hover:text-primary-500" onClick={() => copyToClipboard(event._id)}>ID: {event._id.substring(0,8)}... (Copy)</div>
                      </td>
                      <td className="p-4">{new Date(event.date).toLocaleDateString()}</td>
                      <td className="p-4">₹{event.price}</td>
                      <td className="p-4">
                        <span className={event.capacity < 10 ? 'text-red-500 font-bold' : ''}>
                          {event.capacity} {event.capacity < 10 && '(Low)'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                          event.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                          event.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {event.status || 'approved'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {event.status === 'pending' && (
                          <>
                            <button onClick={() => handleEventApproval(event._id, 'approve')} className="text-emerald-600 hover:underline text-sm font-bold">Approve</button>
                            <button onClick={() => handleEventApproval(event._id, 'reject')} className="text-red-500 hover:underline text-sm font-bold">Reject</button>
                          </>
                        )}
                        <button onClick={() => openEditModal(event)} className="text-blue-500 hover:underline text-sm font-medium">Edit</button>
                        <button onClick={() => duplicateEvent(event)} className="text-purple-500 hover:underline text-sm font-medium">Duplicate</button>
                        <button onClick={() => deleteEvent(event._id)} className="text-red-500 hover:underline text-sm font-medium">Delete</button>
                      </td>
                    </tr>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                      <td colSpan="6" className="p-2 px-4">
                        <input type="text" placeholder="Add private admin notes for this event..." className="w-full text-xs p-2 bg-transparent border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-400 focus:outline-none focus:border-primary-500" />
                      </td>
                    </tr>
                    </Fragment>
                  ))}
                </tbody>
              </table>
              {events.length === 0 && <div className="p-8 text-center text-slate-500">No events found.</div>}
            </div>
          </section>
        )}

        {activeTab === 'registrations' && (
          <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Manage Attendees</h3>
              <div className="flex gap-2 w-full md:w-auto flex-wrap">
                <input type="text" placeholder="Search by name or email..." value={attendeeSearch} onChange={e=>setAttendeeSearch(e.target.value)} className="px-3 py-1.5 text-sm rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" />
                <select value={attendeeFilter} onChange={e=>setAttendeeFilter(e.target.value)} className="px-3 py-1.5 text-sm rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                  <option value="all">All Status</option>
                  <option value="confirmed">Confirmed Only</option>
                  <option value="cancelled">Cancelled Only</option>
                </select>
                <button onClick={exportCSV} className="px-4 py-1.5 bg-green-500 text-white font-bold rounded shadow-sm hover:bg-green-600 transition-colors text-sm flex items-center gap-2">
                  <span>📥</span> Export CSV
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-sm uppercase tracking-wider">
                  <tr>
                    <th className="p-4 font-semibold">User</th>
                    <th className="p-4 font-semibold">Event</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold text-right">Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-800 dark:text-slate-200">
                  {filteredRegistrations.map(reg => (
                    <tr key={reg._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="p-4">
                        <div className="font-medium">{reg.user?.name || 'Unknown'}</div>
                        <div className="text-xs text-slate-500 cursor-pointer hover:text-primary-500" onClick={() => copyToClipboard(reg.user?._id)}>ID: {reg.user?._id?.substring(0,8)}... (Copy)</div>
                      </td>
                      <td className="p-4 font-medium">{reg.eventDetails?.title || 'Unknown Event'}</td>
                      <td className="p-4">
                        {reg.status === 'cancelled' ? (
                          <span className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs font-bold uppercase">Cancelled</span>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 text-green-600 rounded text-xs font-bold uppercase">Confirmed</span>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {reg.status !== 'cancelled' && (
                          <>
                            <button onClick={() => toggleAttendance(reg._id)} className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors border ${reg.attended ? 'bg-primary-500 border-primary-500 text-white' : 'bg-transparent border-slate-300 text-slate-500 hover:border-primary-500 hover:text-primary-500'}`}>
                              {reg.attended ? '✓ Attended' : 'Mark Attended'}
                            </button>
                            <button onClick={() => adminCancelTicket(reg._id)} className="px-3 py-1.5 rounded-full text-sm font-bold border border-red-300 text-red-500 hover:bg-red-50 transition-colors">
                              Cancel Ticket
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {registrations.length === 0 && <div className="p-8 text-center text-slate-500">No attendees found.</div>}
            </div>
          </section>
        )}

        {activeTab === 'users' && (
          <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Member Control Center</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Every signup now appears here automatically. Activate, suspend, or block users instantly.</p>
              </div>
              <div className="px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold">{usersCount} total accounts</div>
            </div>
            <div className="p-6 grid gap-4">
              {users.map(user => (
                <div key={user._id} className="rounded-2xl border border-slate-200 dark:border-slate-700 p-5 bg-slate-50/70 dark:bg-slate-900/40">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 text-white font-bold flex items-center justify-center">
                          {user.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-white">{user.name}</div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">{user.email}</div>
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                        Joined {new Date(user.createdAt || Date.now()).toLocaleDateString()} • Role: {user.role}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${user.status === 'active' ? 'bg-emerald-100 text-emerald-700' : user.status === 'suspended' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {user.status || 'active'}
                      </span>
                      <button onClick={() => handleUserStatusChange(user._id, 'active')} className="px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-600 text-sm font-semibold hover:bg-emerald-50">Activate</button>
                      <button onClick={() => handleUserStatusChange(user._id, 'suspended')} className="px-3 py-1.5 rounded-lg border border-amber-200 text-amber-600 text-sm font-semibold hover:bg-amber-50">Suspend</button>
                      <button onClick={() => handleUserStatusChange(user._id, 'blocked')} className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50">Block</button>
                      {(user.email || '').toLowerCase().trim() !== 'admin@codesky.com' && (
                        <button onClick={() => handleDeleteUser(user._id)} className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700">Delete</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {users.length === 0 && <div className="p-8 text-center text-slate-500">No users have signed up yet.</div>}
            </div>
          </section>
        )}

        {activeTab === 'applications' && (
          <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Admin Access Requests</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Verify applications, approve access, and send credentials automatically.</p>
              </div>
              <div className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-sm font-semibold">
                {pendingAdminApplications.length} pending
              </div>
            </div>
            <div className="p-4 sm:p-6 grid gap-4">
              {adminApplications.map((application) => (
                <div key={application._id} className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 bg-slate-50/70 dark:bg-slate-900/40">
                  <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold text-slate-800 dark:text-white">{application.name}</h4>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                          application.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-700'
                            : application.status === 'rejected'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                        }`}>
                          {application.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 break-all">{application.email}</p>
                      <p className="mt-3 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        {application.reason || 'No reason provided.'}
                      </p>
                      <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                        Sent {new Date(application.createdAt || Date.now()).toLocaleString()}
                        {application.adminEmail ? ` by ${application.adminEmail}` : ''}
                      </div>
                    </div>

                    {application.status === 'pending' ? (
                      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row xl:justify-end">
                        <button
                          onClick={() => handleAdminApplicationDecision(application._id, 'approve')}
                          className="w-full sm:w-auto px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600"
                        >
                          Approve & Email
                        </button>
                        <button
                          onClick={() => handleAdminApplicationDecision(application._id, 'reject')}
                          className="w-full sm:w-auto px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                          Decided {application.decidedAt ? new Date(application.decidedAt).toLocaleString() : 'recently'}
                        </div>
                        {application.status === 'approved' && (application.email || '').toLowerCase().trim() !== 'admin@codesky.com' && (
                          <>
                            <button
                              onClick={() => handleRevokeAdmin(application.email)}
                              className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-705 transition-colors"
                            >
                              Block & Revoke Admin
                            </button>
                            <button
                              onClick={() => handleDeleteAdmin(application.email)}
                              className="px-3 py-1.5 rounded-lg bg-red-800 text-white text-xs font-bold hover:bg-red-900 transition-colors ml-2"
                            >
                              Delete Admin User Account
                            </button>
                            <button
                              onClick={() => handleDeleteApplication(application._id)}
                              className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 ml-2"
                            >
                              Delete Record
                            </button>
                          </>
                        )}
                        {application.status === 'rejected' && (
                          <button
                            onClick={() => handleDeleteApplication(application._id)}
                            className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-xs font-bold hover:bg-slate-100"
                          >
                            Delete Record
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {adminApplications.length === 0 && (
                <div className="p-8 text-center text-slate-500">No admin applications yet.</div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'newsletter' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <section className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">📰 Newsletter Subscribers</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Users who signed up for newsletter updates via the footer or registration.
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 max-h-96 overflow-y-auto space-y-2">
                {newsletterSubscribers.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">No subscribers found yet.</p>
                ) : (
                  newsletterSubscribers.map((subEmail, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate pr-2">{subEmail}</span>
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-bold">Active</span>
                    </div>
                  ))
                )}
              </div>
              <div className="text-xs text-slate-400 text-center">
                Total Subscribers: <strong className="text-slate-700 dark:text-slate-200">{newsletterSubscribers.length}</strong>
              </div>
            </section>

            <section className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">🚀 Broadcast Email to Subscribers</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Send an official announcement or upcoming event promotion directly to all {newsletterSubscribers.length} newsletter subscribers.
                </p>
              </div>

              <form onSubmit={handleSendBroadcast} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Subject / Announcement Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 🎟️ New VIP Tickets Available for Codesky DevCon!"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Message Content</label>
                  <textarea
                    rows={5}
                    required
                    placeholder="Write your email announcement or special offer details here..."
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={broadcastStatus === 'Sending...' || newsletterSubscribers.length === 0}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-purple-600 text-white font-bold shadow-lg hover:opacity-95 disabled:opacity-50 transition-all"
                >
                  {broadcastStatus === 'Sending...' ? 'Broadcasting Email...' : `Send Broadcast to ${newsletterSubscribers.length} Subscribers`}
                </button>
                {broadcastStatus && (
                  <p className={`text-sm font-semibold mt-2 ${broadcastStatus.includes('success') ? 'text-green-600 dark:text-green-400' : 'text-primary-500'}`}>
                    {broadcastStatus}
                  </p>
                )}
              </form>
            </section>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Ticket Sales Velocity (Last 7 Days)</h3>
              <div className="h-64 flex items-end justify-between gap-2 border-b border-l border-slate-200 dark:border-slate-700 pb-2 pl-2">
                {last7DaysSales.map((h, i) => (
                  <motion.div key={i} initial={{ height: 0 }} animate={{ height: Math.max(h * 20, 5) }} className="w-1/6 bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-sm relative group cursor-pointer flex-1 mx-1">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">{h} tickets</div>
                  </motion.div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-2">
                <span>-6d</span><span>-5d</span><span>-4d</span><span>-3d</span><span>-2d</span><span>-1d</span><span>Today</span>
              </div>
            </section>
            <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Event Capacity Status</h3>
              <div className="flex flex-col gap-6">
                {capacityStats.map((stat, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1"><span className="text-slate-600 dark:text-slate-300 truncate pr-4">{stat.title}</span><span className="font-bold">{stat.percentage}% Full</span></div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-1000 ${stat.percentage > 90 ? 'bg-red-500' : stat.percentage > 70 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{width: `${Math.min(stat.percentage, 100)}%`}}></div>
                    </div>
                  </div>
                ))}
                {capacityStats.length === 0 && <p className="text-slate-500 text-sm">No events created yet.</p>}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'financials' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-slate-900 rounded-3xl text-white shadow-xl">
                <h4 className="text-slate-400 font-bold mb-2 uppercase tracking-wider text-sm">Gross Volume</h4>
                <div className="text-4xl font-black mb-1">${totalRevenue.toFixed(2)}</div>
                <p className="text-sm text-green-400">+12% vs last month</p>
              </div>
              <div className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl">
                <h4 className="text-slate-500 dark:text-slate-400 font-bold mb-2 uppercase tracking-wider text-sm">Platform Fees (5%)</h4>
                <div className="text-4xl font-black text-slate-800 dark:text-white mb-1">${(totalRevenue * 0.05).toFixed(2)}</div>
                <p className="text-sm text-slate-400">Automatically deducted</p>
              </div>
              <div className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl relative overflow-hidden">
                <h4 className="text-slate-500 dark:text-slate-400 font-bold mb-2 uppercase tracking-wider text-sm">Pending Payout</h4>
                <div className="text-4xl font-black text-primary-500 mb-1">${(totalRevenue * 0.95).toFixed(2)}</div>
                
                {payoutStatus === 'idle' && (
                  <button onClick={handlePayout} className="mt-4 px-4 py-2 w-full bg-primary-100 text-primary-700 font-bold rounded-lg hover:bg-primary-200 transition-colors">Initiate Payout</button>
                )}
                {payoutStatus === 'processing' && (
                  <button disabled className="mt-4 px-4 py-2 w-full bg-slate-100 text-slate-500 font-bold rounded-lg flex justify-center items-center gap-2">
                    <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></span> Processing...
                  </button>
                )}
                {payoutStatus === 'complete' && (
                  <button disabled className="mt-4 px-4 py-2 w-full bg-green-100 text-green-700 font-bold rounded-lg flex justify-center items-center gap-2">
                    <span>✅</span> Funds Transferred
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tools' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Venue Scanner Mock</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">Simulate scanning a user's QR ticket at the door to instantly mark them as attended.</p>
              <button onClick={handleScanMock} className="w-full py-4 border-2 border-dashed border-primary-500 text-primary-500 rounded-xl font-bold hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
                📱 Tap to Scan QR
              </button>
            </section>
            
            <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Activity Log</h3>
              <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                {registrations.slice(0, 5).map(reg => (
                  <div key={reg._id} className="flex gap-3 text-sm border-b border-slate-100 dark:border-slate-700 pb-3">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-primary-500 shrink-0"></div>
                    <div>
                      <span className="font-bold text-slate-800 dark:text-white">{reg.user?.name || 'A user'}</span> registered for <span className="font-bold text-slate-800 dark:text-white">{reg.eventDetails?.title}</span>
                      <div className="text-xs text-slate-400 mt-0.5">{new Date(reg.createdAt || Date.now()).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
                {events.slice(events.length - 2).map(ev => (
                  <div key={ev._id} className="flex gap-3 text-sm border-b border-slate-100 dark:border-slate-700 pb-3">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-green-500 shrink-0"></div>
                    <div>
                      Admin created event <span className="font-bold text-slate-800 dark:text-white">{ev.title}</span>
                      <div className="text-xs text-slate-400 mt-0.5">Recently</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 md:col-span-2">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Global Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button onClick={handleGlobalBanner} className="p-4 border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors flex flex-col items-center justify-center gap-2">
                  <span className="text-2xl">📢</span> Deploy Global Banner
                </button>
                <button onClick={handleMassEmail} className="p-4 border border-purple-200 dark:border-purple-900 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl font-bold hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors flex flex-col items-center justify-center gap-2">
                  <span className="text-2xl">📧</span> Email All Attendees
                </button>
                <button onClick={handleSecurityAudit} className="p-4 border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex flex-col items-center justify-center gap-2">
                  <span className="text-2xl">🛡️</span> Run Security Audit
                </button>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'settings-config' && (
          <div className="max-w-4xl mx-auto space-y-8">
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  ⚙️ Platform Settings & Configurations
                </h3>
                <p className="text-xs text-slate-500 mt-1">Configure global transaction fees, announcement banners, and homepage hero headers.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Platform Ticket Fee (%)</label>
                  <input
                    type="number"
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold outline-none text-slate-900 dark:text-white focus:border-primary-500"
                    value={onboardingConfig.platformFee}
                    onChange={e => setOnboardingConfig({ ...onboardingConfig, platformFee: Number(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Min. Withdrawal Threshold (₹)</label>
                  <input
                    type="number"
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold outline-none text-slate-900 dark:text-white focus:border-primary-500"
                    value={onboardingConfig.minWithdrawal}
                    onChange={e => setOnboardingConfig({ ...onboardingConfig, minWithdrawal: Number(e.target.value) })}
                  />
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Global Announcement Banner Text</label>
                  <textarea
                    rows={2}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold outline-none text-slate-900 dark:text-white focus:border-primary-500"
                    placeholder="Enter announcement text to display on top of all pages..."
                    value={onboardingConfig.globalBanner}
                    onChange={e => setOnboardingConfig({ ...onboardingConfig, globalBanner: e.target.value })}
                  />
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Hero Section Main Header Text</label>
                  <input
                    type="text"
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold outline-none text-slate-900 dark:text-white focus:border-primary-500"
                    placeholder="e.g. Experience events worth showing up for."
                    value={onboardingConfig.heroTitle}
                    onChange={e => setOnboardingConfig({ ...onboardingConfig, heroTitle: e.target.value })}
                  />
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Hero Section Subtitle Description</label>
                  <textarea
                    rows={3}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold outline-none text-slate-900 dark:text-white focus:border-primary-500"
                    placeholder="Enter hero section subtitle description..."
                    value={onboardingConfig.heroSubtitle}
                    onChange={e => setOnboardingConfig({ ...onboardingConfig, heroSubtitle: e.target.value })}
                  />
                </div>
              </div>

              {/* Homepage Hero Custom Photo/Video Media Section */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    🏠 Homepage Hero Banner Mode & Media
                  </h4>
                  <p className="text-[11px] text-slate-450 mt-0.5">Toggle what displays in the hero banner on the main landing page, and configure custom media.</p>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-450">Hero Banner Mode</label>
                  <div className="flex gap-2 max-w-md">
                    {[
                      { id: 'custom', label: 'Uploaded Custom Photo/Video' },
                      { id: 'upcoming', label: 'Upcoming Event Carousel Slideshow' }
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setOnboardingConfig(prev => ({ ...prev, heroBannerMode: mode.id }))}
                        className={`flex-1 py-2.5 px-4 rounded-xl border text-xs font-bold transition-all ${
                          onboardingConfig.heroBannerMode === mode.id
                            ? 'bg-primary-500 text-white border-primary-500 shadow-md'
                            : 'bg-slate-100 dark:bg-slate-950 text-slate-650 dark:text-slate-450 border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                {onboardingConfig.heroBannerMode === 'custom' ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-450">Media Header Type</label>
                        <div className="flex gap-2">
                          {['image', 'video'].map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setOnboardingConfig(prev => ({ ...prev, heroMediaType: t }))}
                              className={`flex-1 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${
                                onboardingConfig.heroMediaType === t
                                  ? 'bg-primary-500 text-white border-primary-500'
                                  : 'bg-slate-100 dark:bg-slate-950 text-slate-650 dark:text-slate-455 border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800'
                              }`}
                            >
                              {t === 'image' ? '🖼️ Photo' : '📹 Video'}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-455">Upload Custom Media File</label>
                        <div className="flex items-center gap-3">
                          <label className="cursor-pointer text-xs font-bold text-primary-500 bg-primary-50 dark:bg-primary-950/40 px-4 py-2.5 rounded-xl border border-primary-200 dark:border-primary-900 hover:bg-primary-100 flex items-center gap-1.5 transition-colors">
                            <span>📤</span> Select File from Computer
                            <input
                              type="file"
                              accept={onboardingConfig.heroMediaType === 'video' ? 'video/mp4,video/*' : 'image/*'}
                              className="hidden"
                              onChange={handleHeroMediaUpload}
                            />
                          </label>
                          {onboardingConfig.heroMediaUrl && (
                            <button
                              type="button"
                              onClick={() => setOnboardingConfig(prev => ({ ...prev, heroMediaUrl: '' }))}
                              className="text-xs text-red-500 font-bold hover:underline"
                            >
                              Clear Media
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {onboardingConfig.heroMediaUrl && (
                      <div className="aspect-[16/9] w-full max-w-lg rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 relative">
                        {onboardingConfig.heroMediaType === 'video' ? (
                          <video
                            src={onboardingConfig.heroMediaUrl}
                            controls
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src={onboardingConfig.heroMediaUrl}
                            alt="Hero preview"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl text-xs text-slate-550 dark:text-slate-400">
                    ℹ️ The hero banner will dynamically rotate and display your upcoming active events automatically.
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={handleSaveSettingsConfig}
                  className="px-6 py-3 bg-gradient-to-r from-primary-500 to-purple-650 text-white rounded-xl font-bold text-xs shadow-md hover:scale-[1.01] transition-all"
                >
                  💾 Save Configuration Changes
                </button>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'support' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">💬 Support Requests & Chat Logs</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">View live helpdesk chats, phone callback requests, and user satisfaction ratings.</p>
              </div>
              <button 
                onClick={fetchData} 
                className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl transition-colors"
              >
                🔄 Refresh Logs
              </button>
            </div>

            {supportRequests.length === 0 ? (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                <p className="text-lg font-semibold">No support requests yet</p>
                <p className="text-sm mt-1">Chatbot callback requests and reviews will appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Requests List */}
                <div className="xl:col-span-1 border border-slate-100 dark:border-slate-700 rounded-2xl divide-y divide-slate-100 dark:divide-slate-700 max-h-[600px] overflow-y-auto bg-slate-50/50 dark:bg-slate-900/20">
                  {supportRequests.map((req) => {
                    const isPending = req.status === 'pending';
                    const isSelected = selectedSupportRequest?._id === req._id;
                    return (
                      <button
                        key={req._id}
                        onClick={() => setSelectedSupportRequest(req)}
                        className={`w-full text-left p-4 transition-all flex flex-col gap-2 hover:bg-white dark:hover:bg-slate-800 ${
                          isSelected ? 'bg-white dark:bg-slate-800 ring-2 ring-primary-500/50 z-10' : ''
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            isPending ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          }`}>
                            {req.status}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(req.createdAt).toLocaleString()}
                          </span>
                        </div>

                        <div className="font-bold text-sm text-slate-800 dark:text-white truncate">
                          ✉️ {req.userEmail}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
                          📞 {req.userPhone}
                        </div>

                        {req.rating !== null && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">CSAT:</span>
                            <div className="flex text-amber-500 text-xs">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <span key={i}>{i < req.rating ? '★' : '☆'}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Transcript / Conversation Viewer */}
                <div className="xl:col-span-2 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 bg-slate-50/20 dark:bg-slate-900/10 min-h-[400px] flex flex-col justify-between">
                  {selectedSupportRequest ? (
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 dark:border-slate-700 pb-4 gap-4">
                        <div>
                          <h4 className="font-black text-lg text-slate-800 dark:text-white">Support Callback Details</h4>
                          <p className="text-xs text-slate-500 mt-0.5">ID: {selectedSupportRequest._id}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenEmailModal(selectedSupportRequest)}
                            className="px-4 py-2 text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow transition-colors"
                          >
                            📧 Email Attendee
                          </button>
                          {selectedSupportRequest.status === 'pending' && (
                            <button
                              onClick={() => handleResolveSupportRequest(selectedSupportRequest._id)}
                              className="px-4 py-2 text-xs font-bold bg-green-500 text-white rounded-xl shadow hover:bg-green-600 transition-colors"
                            >
                              ✓ Mark Resolved
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl text-sm">
                        <div>
                          <span className="text-slate-500 font-bold block text-xs uppercase tracking-wider mb-1">Email Contact</span>
                          <span className="font-semibold text-slate-800 dark:text-white">{selectedSupportRequest.userEmail}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 font-bold block text-xs uppercase tracking-wider mb-1">Phone Number</span>
                          <span className="font-semibold text-slate-800 dark:text-white">{selectedSupportRequest.userPhone}</span>
                        </div>
                        {selectedSupportRequest.rating !== null && (
                          <div className="sm:col-span-2 border-t border-slate-200 dark:border-slate-700 pt-3 mt-1">
                            <span className="text-slate-500 font-bold block text-xs uppercase tracking-wider mb-1">User Review</span>
                            <div className="flex items-center gap-2 mb-1">
                              <div className="flex text-amber-500">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <span key={i} className="text-sm">{i < selectedSupportRequest.rating ? '★' : '☆'}</span>
                                ))}
                              </div>
                              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">({selectedSupportRequest.rating}/5 Rating)</span>
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 italic font-medium">
                              "{selectedSupportRequest.reviewComment || 'No feedback comments left.'}"
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Transcript */}
                      <div>
                        <h5 className="font-bold text-sm text-slate-500 uppercase tracking-wider mb-3">Conversation Transcript</h5>
                        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-900 max-h-[300px] overflow-y-auto space-y-3 font-sans">
                          {Array.isArray(selectedSupportRequest.conversation) && selectedSupportRequest.conversation.map((msg, index) => (
                            <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[85%] rounded-xl p-2.5 text-xs leading-relaxed ${
                                msg.sender === 'user'
                                  ? 'bg-primary-600 text-white rounded-tr-none'
                                  : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700/50'
                              }`}>
                                <div className="font-black text-[9px] uppercase tracking-wider opacity-70 mb-0.5">
                                  {msg.sender === 'user' ? 'Attendee' : 'AI Helpdesk'}
                                </div>
                                <div>{msg.text}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="m-auto text-center text-slate-400">
                      <span className="text-4xl block mb-2">💬</span>
                      Select a support request from the list to view callback details and chat logs.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Create Event Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-white">{editingEvent ? 'Edit Event' : 'Create New Event'}</h2>
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Event Title</label>
                  <input required type="text" placeholder="Event Title" className="w-full p-2.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-primary-500" value={newEvent.title} onChange={e=>setNewEvent({...newEvent, title: e.target.value})} />
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Description</label>
                  <textarea required placeholder="Description" className="w-full p-2.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white min-h-[100px] outline-none focus:ring-1 focus:ring-primary-500" value={newEvent.description} onChange={e=>setNewEvent({...newEvent, description: e.target.value})} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Event Date</label>
                    <input required type="date" className="w-full p-2.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-primary-500" value={newEvent.date} onChange={e=>setNewEvent({...newEvent, date: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Speaker / Host Name</label>
                    <input required type="text" placeholder="Speaker / Host Name" className="w-full p-2.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-primary-500" value={newEvent.speaker} onChange={e=>setNewEvent({...newEvent, speaker: e.target.value})} />
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Location Configuration</span>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Country</label>
                      <select
                        className="w-full p-2.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                        value={selectedCountry}
                        onChange={e => {
                          setSelectedCountry(e.target.value);
                          if (e.target.value !== 'India') {
                            setSelectedCity('');
                          } else {
                            setSelectedCity('Mumbai');
                          }
                        }}
                      >
                        {countries.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">City</label>
                      {selectedCountry === 'India' ? (
                        <select
                          className="w-full p-2.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                          value={selectedCity}
                          onChange={e => setSelectedCity(e.target.value)}
                        >
                          {indianCities.map(city => <option key={city} value={city}>{city}</option>)}
                        </select>
                      ) : (
                        <input
                          required
                          type="text"
                          placeholder="Enter city name"
                          className="w-full p-2.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                          value={customCity}
                          onChange={e => setCustomCity(e.target.value)}
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Venue Address / Link (Virtual)</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Hall 1, Nesco Center or Zoom Link"
                      className="w-full p-2.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                      value={venueAddress}
                      onChange={e => setVenueAddress(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">GPS Latitude (Optional)</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="e.g. 19.0760"
                        className="w-full p-2.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                        value={newEvent.latitude || ''}
                        onChange={e => setNewEvent({...newEvent, latitude: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">GPS Longitude (Optional)</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="e.g. 72.8777"
                        className="w-full p-2.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                        value={newEvent.longitude || ''}
                        onChange={e => setNewEvent({...newEvent, longitude: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Google Maps Location Link (Optional)</label>
                    <input
                      type="url"
                      placeholder="e.g. https://maps.google.com/?q=..."
                      className="w-full p-2.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                      value={newEvent.mapLink || ''}
                      onChange={e => setNewEvent({...newEvent, mapLink: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Price (₹)</label>
                    <input required type="number" placeholder="Price (₹)" min="0" className="w-full p-2.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none" value={newEvent.price} onChange={e=>setNewEvent({...newEvent, price: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Capacity</label>
                    <input required type="number" placeholder="Capacity" min="1" className="w-full p-2.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none" value={newEvent.capacity} onChange={e=>setNewEvent({...newEvent, capacity: e.target.value})} />
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-3">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">Banner & Media Config</span>
                  <div className="grid grid-cols-3 gap-2">
                    {['image', 'video', 'slideshow'].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setNewEvent({ ...newEvent, bannerType: t })}
                        className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                          newEvent.bannerType === t
                            ? 'bg-primary-500 text-white border-primary-500'
                            : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {t === 'image' ? '🖼️ Photo' : t === 'video' ? '📹 Video' : '🎠 Slideshow'}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {newEvent.bannerType === 'image'
                        ? 'Image Banner URL'
                        : newEvent.bannerType === 'video'
                        ? 'Video (.mp4) Banner URL'
                        : 'Image Banner URLs (comma-separated for slides)'}
                    </label>
                    <input
                      type="text"
                      placeholder={
                        newEvent.bannerType === 'image'
                          ? 'e.g. https://images.unsplash.com/photo...'
                          : newEvent.bannerType === 'video'
                          ? 'e.g. https://example.com/live.mp4'
                          : 'e.g. url1, url2, url3'
                      }
                      className="w-full p-2.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                      value={newEvent.bannerMedia?.startsWith('data:') ? 'Local file uploaded from computer' : newEvent.bannerMedia}
                      onChange={e => setNewEvent({ ...newEvent, bannerMedia: e.target.value })}
                    />
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer text-xs font-bold text-primary-500 bg-primary-50 dark:bg-primary-950/40 px-3 py-2 rounded-xl border border-primary-200 dark:border-primary-900 hover:bg-primary-100 flex items-center gap-1.5 transition-colors">
                        <span>📤</span> Upload from Computer
                        <input
                          type="file"
                          accept={newEvent.bannerType === 'video' ? 'video/mp4,video/*' : 'image/*'}
                          multiple={newEvent.bannerType === 'slideshow'}
                          className="hidden"
                          onChange={handleMediaUpload}
                        />
                      </label>
                      {newEvent.bannerMedia && (
                        <button
                          type="button"
                          onClick={() => setNewEvent(prev => ({ ...prev, bannerMedia: '' }))}
                          className="text-xs text-red-550 hover:underline"
                        >
                          Clear media
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Tags (comma separated)</label>
                  <input required type="text" placeholder="Tags (comma separated)" className="w-full p-2.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-primary-500" value={newEvent.tags} onChange={e=>setNewEvent({...newEvent, tags: e.target.value})} />
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <button type="button" onClick={() => { 
                    setShowModal(false); 
                    setEditingEvent(null); 
                    setNewEvent({ title: '', description: '', date: '', price: '', capacity: '', tags: '', speaker: '', bannerType: 'image', bannerMedia: '', latitude: '', longitude: '', mapLink: '' }); 
                    setSelectedCountry('India');
                    setSelectedCity('Mumbai');
                    setCustomCity('');
                    setVenueAddress('');
                  }} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors font-semibold">Cancel</button>
                  <button type="submit" className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-colors">{editingEvent ? 'Save Changes' : 'Create'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEmailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative text-slate-900 dark:text-white"
            >
              <button
                onClick={() => setShowEmailModal(false)}
                className="absolute right-4 top-4 h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400"
              >
                ✕
              </button>

              <h3 className="text-xl font-bold flex items-center gap-2 mb-1">📧 Send Response Email</h3>
              <p className="text-xs text-slate-400 font-semibold mb-6">Compose a custom response email to connect with the attendee.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Recipient Email</label>
                  <input
                    type="text"
                    disabled
                    className="w-full p-2.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 cursor-not-allowed font-semibold text-sm"
                    value={selectedSupportRequest?.userEmail || ''}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Email Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="Subject line"
                    className="w-full p-2.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-primary-500 text-sm font-semibold"
                    value={emailSubject}
                    onChange={e => setEmailSubject(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Message Body</label>
                  <textarea
                    required
                    rows={8}
                    placeholder="Type your message body..."
                    className="w-full p-2.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-primary-500 text-xs leading-relaxed font-medium"
                    value={emailBody}
                    onChange={e => setEmailBody(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEmailModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-650 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendSupportEmail}
                    disabled={isSendingEmail}
                    className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                  >
                    {isSendingEmail ? 'Sending...' : 'Send Response'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
