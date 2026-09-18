import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import UserProfileNav from '../components/UserProfileNav';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';


const Dashboard = () => {
  const { user, token, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('tickets');
  const [tickets, setTickets] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [password, setPassword] = useState('');

  useEffect(() => {
    fetch('/api/events')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAllEvents(data);
      })
      .catch(err => console.error(err));
  }, []);
  const [avatarPreview, setAvatarPreview] = useState(user?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`);
  const [saveStatus, setSaveStatus] = useState('');
  const [visibleTicketsCount, setVisibleTicketsCount] = useState(3);
  const [ratings, setRatings] = useState({});
  const [walletBalance, setWalletBalance] = useState(Number(user?.credits || 0));
  const [emailingTicketId, setEmailingTicketId] = useState(null);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('500');
  const [walletTransactions, setWalletTransactions] = useState([
    { id: 1, title: 'Initial Account Setup Credit', date: 'System', type: 'credit', amount: Number(user?.credits || 0) }
  ]);
  const [ticketStyle, setTicketStyle] = useState('modern');
  const [npsScore, setNpsScore] = useState(10);
  const [npsSubmitted, setNpsSubmitted] = useState(false);
  const [orgVerified, setOrgVerified] = useState(false);
  const [referralCopied, setReferralCopied] = useState(false);

  // Attendee Badge States
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [activeBadgeEvent, setActiveBadgeEvent] = useState(null);
  const [badgeClaimedEvents, setBadgeClaimedEvents] = useState([]);
  const canvasRef = useRef(null);

  useEffect(() => {
    setWalletBalance(Number(user?.credits || 0));
  }, [user?.credits]);

  useEffect(() => {
    fetch('/api/registrations/my-tickets', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => { setTickets(data); setLoading(false); })
    .catch(err => { console.error(err); setLoading(false); });
  }, [token]);

  const handleGenerateBadge = (eventDetails) => {
    setActiveBadgeEvent(eventDetails);
    setShowBadgeModal(true);
    setTimeout(() => {
      if (canvasRef.current) {
        drawBadge(canvasRef.current, eventDetails.title, user.name);
      }
    }, 200);
  };

  const drawBadge = (canvas, eventTitle, userName) => {
    const ctx = canvas.getContext('2d');
    
    // Draw background gradient
    const grad = ctx.createLinearGradient(0, 0, 600, 400);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#1e1b4b');
    grad.addColorStop(1, '#311042');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 400);

    // Draw borders & frame
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 15;
    ctx.strokeRect(20, 20, 560, 360);

    ctx.strokeStyle = '#14b8a6';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, 540, 340);

    // Draw branding header
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('OFFICIAL ATTENDEE BADGE', 300, 70);

    ctx.fillStyle = '#14b8a6';
    ctx.font = '900 28px sans-serif';
    ctx.fillText('Codesky Events', 300, 110);

    // Draw user name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText(userName.toUpperCase(), 300, 200);

    // Draw divider
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(150, 230);
    ctx.lineTo(450, 230);
    ctx.stroke();

    // Draw event title
    ctx.fillStyle = '#c084fc';
    ctx.font = 'italic 18px sans-serif';
    ctx.fillText(eventTitle, 300, 275);

    // Draw footer
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('SHARE ON SOCIALS TO CLAIM ₹50 REWARD', 300, 340);
  };

  const handleClaimReward = async () => {
    if (!activeBadgeEvent) return;
    if (badgeClaimedEvents.includes(activeBadgeEvent._id)) {
      alert('Reward already claimed for this event badge!');
      return;
    }

    try {
      const res = await fetch('/api/users/badge-reward', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setWalletBalance(data.credits);
        updateUser({ ...user, credits: data.credits });
        setBadgeClaimedEvents(prev => [...prev, activeBadgeEvent._id]);
        alert('🎉 ₹50 sharing bonus added to your digital wallet!');
      } else {
        alert(data.message || 'Failed to claim reward');
      }
    } catch {
      alert('Network error claiming reward');
    }
  };

  const handleDownloadBadge = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `Attendee_Badge_${activeBadgeEvent.title.replace(/\s+/g, '_')}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaveStatus('Saving...');
    const res = await fetch('/api/users/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, email, bio, profilePicture: avatarPreview, password: password || undefined })
    });
    if (res.ok) {
      const data = await res.json();
      updateUser(data);
      setSaveStatus('Profile updated successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Img = reader.result;
        setAvatarPreview(base64Img);
        setSaveStatus('Saving photo...');
        const res = await fetch('/api/users/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ profilePicture: base64Img })
        });
        if (res.ok) {
          const data = await res.json();
          updateUser(data);
          setSaveStatus('Profile picture updated!');
          setTimeout(() => setSaveStatus(''), 3000);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const cancelTicket = async (id) => {
    if (window.confirm('Are you sure you want to cancel this ticket?')) {
      const res = await fetch(`/api/registrations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setTickets(tickets.map(t => t._id === id ? { ...t, status: 'cancelled' } : t));
      }
    }
  };

  const generateCertificate = async (eventTitle, ticketId) => {
    const certName = prompt('Enter the name you want printed on your certificate:', user?.name || '');
    if (!certName) return;

    const element = document.createElement('div');
    element.innerHTML = `
      <div style="width: 1000px; height: 700px; padding: 40px; background: white; font-family: sans-serif;">
        <div style="border: 10px solid #0f172a; height: 100%; box-sizing: border-box; padding: 40px; text-align: center; position: relative;">
          <div style="position: absolute; top: 20px; right: 40px;"><img src='/images/codesky.png' alt='Codesky' style='width:90px;height:90px;object-fit:cover;border-radius:12px;'/></div>
          <h1 style="color: #0f172a; font-size: 50px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">Certificate</h1>
          <p style="color: #64748b; font-size: 20px; text-transform: uppercase; letter-spacing: 4px; margin-bottom: 40px;">of Outstanding Attendance</p>
          <p style="color: #475569; font-size: 18px; margin-bottom: 20px;">This is to proudly certify that</p>
          <h2 style="color: #14b8a6; font-size: 40px; margin: 20px 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; display: inline-block;">${certName}</h2>
          <p style="color: #475569; font-size: 18px; margin-top: 20px;">has successfully attended and participated in the events held at</p>
          <h3 style="color: #334155; font-size: 30px; margin: 30px 0;">${eventTitle}</h3>
          
          <div style="position: absolute; bottom: 40px; left: 0; right: 0; display: flex; justify-content: space-around; align-items: flex-end;">
            <div>
              <div style="border-top: 1px solid #cbd5e1; width: 200px; padding-top: 10px; color: #64748b; font-style: italic;">Authorized Signature</div>
            </div>
            <div style="width: 100px; height: 100px; background: linear-gradient(135deg, #fbbf24, #d97706); border-radius: 50%; border: 4px dashed white; box-shadow: 0 0 0 6px #d97706; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px; transform: rotate(-15deg);">
              OFFICIAL<br>VERIFIED
            </div>
            <div>
              <div style="color: #94a3b8; font-size: 14px; font-weight: bold;">Issued by Codesky Events<br>${new Date().toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </div>
    `;

    const opt = {
      margin:       0,
      filename:     `Certificate_${certName.replace(/\s+/g, '_')}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'landscape' }
    };

    if (window.confirm('Would you also like to email this certificate to your registered email address?')) {
      // Send Email & Save
      setEmailingTicketId(ticketId); // reuse loading state
      try {
        const pdfBase64Data = await window.html2pdf().set(opt).from(element).outputPdf('datauristring');
        
        const res = await fetch(`/api/registrations/${ticketId}/email-certificate`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({ pdfBase64Data, certName })
        });
        
        const data = await res.json();
        if (res.ok) {
          alert('Certificate downloaded and sent to your email successfully!');
        } else {
          alert(data.message || 'Failed to send email');
        }
      } catch (err) {
        console.error(err);
        alert('Failed to email certificate, downloading locally instead.');
      } finally {
        setEmailingTicketId(null);
        window.html2pdf().set(opt).from(element).save();
      }
    } else {
      // Just Save
      window.html2pdf().set(opt).from(element).save();
    }
  };

  const generateInvoice = (ticket) => {
    const element = document.createElement('div');
    element.innerHTML = `
      <div style="font-family: sans-serif; padding: 40px; color: #1e293b; background: white; width: 600px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px;">
          <div style="display:flex; align-items:center; gap:12px;"><img src="/images/codesky.png" alt="Codesky" style="width:56px;height:56px;border-radius:8px;object-fit:cover;" /><h1 style="font-size: 28px; font-weight: 900; color: #14b8a6; margin: 0;">CODESKY</h1></div>
          <div style="text-align: right;">
            <div style="font-size: 12px; color: #64748b; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">Ticket ID</div>
            <div style="font-size: 16px; font-weight: bold; font-family: monospace;">${ticket._id.substring(0,12).toUpperCase()}</div>
          </div>
        </div>
        
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
          <h2 style="font-size: 24px; font-weight: 800; margin: 0 0 8px 0;">${ticket.eventDetails.title}</h2>
          <p style="color: #64748b; margin: 0 0 16px 0; font-size: 14px;">${ticket.eventDetails.location}</p>
          
          <div style="display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 16px;">
            <div>
              <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: bold;">Date</div>
              <div style="font-size: 14px; font-weight: bold;">${new Date(ticket.eventDetails.date).toLocaleDateString()}</div>
            </div>
            <div>
              <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: bold;">Attendee</div>
              <div style="font-size: 14px; font-weight: bold;">${user?.name || 'Guest'}</div>
            </div>
          </div>
        </div>

        <div style="text-align: center; border-top: 2px dashed #cbd5e1; padding-top: 30px; margin-top: 30px;">
          <div style="margin-bottom: 10px;">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${ticket._id}" alt="QR" style="width: 150px; height: 150px; border-radius: 8px;" />
          </div>
          <div style="font-size: 12px; color: #64748b;">Scan at the venue for entry</div>
        </div>
      </div>
    `;

    const opt = {
      margin: 0,
      filename: `Codesky_Ticket_${ticket.eventDetails.title.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    window.html2pdf().set(opt).from(element).save();
  };

  const emailTicketPDF = async (ticketId) => {
    setEmailingTicketId(ticketId);
    try {
      const res = await fetch(`/api/registrations/${ticketId}/email-ticket`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        alert('Ticket sent to your email successfully!');
      } else {
        alert(data.message || 'Failed to send email');
      }
    } catch (err) {
      alert('Network error occurred.');
    } finally {
      setEmailingTicketId(null);
    }
  };

  const addToCalendar = (event, type = 'google') => {
    const dates = `${event.date.replace(/[-:]/g,'').split('.')[0]}Z/${event.date.replace(/[-:]/g,'').split('.')[0]}Z`;
    let url = '';
    
    if (type === 'google') {
      url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${dates}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}`;
      window.open(url, '_blank');
    } else if (type === 'outlook') {
      url = `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${encodeURIComponent(event.title)}&startdt=${dates.split('/')[0]}&enddt=${dates.split('/')[1]}&body=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}`;
      window.open(url, '_blank');
    } else if (type === 'ics') {
      const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nURL:${window.location.origin}/events/${event._id}\nDTSTART:${dates.split('/')[0]}\nDTEND:${dates.split('/')[1]}\nSUMMARY:${event.title}\nDESCRIPTION:${event.description}\nLOCATION:${event.location}\nEND:VEVENT\nEND:VCALENDAR`;
      const blob = new Blob([ics], { type: 'text/calendar' });
      const a = document.createElement('a');
      a.href = window.URL.createObjectURL(blob);
      a.download = 'event.ics';
      a.click();
    }
  };

  const handleTopUp = async (amountToLoad) => {
    const amt = Number(amountToLoad || topUpAmount);
    if (!amt || amt <= 0) return alert('Please enter a valid amount');

    try {
      // 1. Create order from backend
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: amt })
      });
      const orderData = await orderRes.json();
      
      if (!orderData.success) {
        return alert('Failed to create Razorpay order');
      }

      if (!window.Razorpay) {
        completeTopUp('sandbox_rzp_' + Date.now(), amt, orderData.id, true);
        return;
      }

      const options = {
        key: "rzp_test_T6jHuiCoIBCbLJ",
        amount: Math.round(amt * 100),
        currency: "INR",
        name: "Codesky Digital Wallet",
        description: `Add ₹${amt} to Wallet Balance`,
        image: "/images/codesky.png",
        handler: async function (response) {
          completeTopUp(
            response.razorpay_payment_id || ('mock_pay_' + Date.now()), 
            amt, 
            response.razorpay_order_id || orderData.id, 
            orderData.mock || false, 
            response.razorpay_signature || ''
          );
        },
        prefill: {
          name: user?.name || "Codesky Attendee",
          email: user?.email || "attendee@codesky.com"
        },
        theme: { color: "#14b8a6" }
      };

      // Only pass order_id if it's a real order from Razorpay, else widget fails
      if (!orderData.mock && orderData.id) {
        options.order_id = orderData.id;
      }

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
        alert("Payment Error: " + (response.error.description || "Unknown error"));
      });
      rzp.open();
    } catch(e) {
      console.error(e);
      alert('Error initiating payment');
    }
  };

  const completeTopUp = async (paymentId, amt, orderId, isMock = false, signature = '') => {
    try {
      const res = await fetch('/api/payments/verify-razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          amount: amt, 
          razorpay_payment_id: paymentId,
          razorpay_order_id: orderId,
          razorpay_signature: signature,
          isMock
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setWalletBalance(data.credits);
        updateUser({ credits: data.credits });
        setWalletTransactions(prev => [
          { id: Date.now(), title: `Wallet Top-Up (${paymentId.slice(0, 10)}...)`, date: new Date().toLocaleDateString(), type: 'credit', amount: amt },
          ...prev
        ]);
        setShowTopUpModal(false);
        alert(`🎉 Successfully loaded ₹${amt} to your digital wallet!`);
      } else {
        alert(data.message || 'Failed to verify payment');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while verifying wallet payment.');
    }
  };

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(`${window.location.origin}/?ref=${user?._id || 'vip'}`);
    setReferralCopied(true);
    setTimeout(() => setReferralCopied(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Top navigation is provided globally by EventAppLayout */}
      <nav className="hidden">

        <Link to="/" className="flex items-center gap-3">
          <img src="/images/codesky.png" alt="Codesky" className="w-10 h-10 rounded-md object-cover shadow-md" />
          <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-purple-500">Codesky</span>
        </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link to="/events" className="text-sm font-semibold text-primary-500 hover:text-primary-600">Explore Events</Link>
            {/* Profile bar (UserProfileNav) is handled inside page layouts */}
            <button onClick={handleLogout} className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border-l border-slate-300 pl-4">
              Logout
            </button>
          </div>

      </nav>

      <main className="p-8 max-w-6xl mx-auto space-y-8">

        <section className="rounded-[2rem] border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 p-6 sm:p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-primary-400 to-purple-500 flex items-center justify-center text-3xl font-bold text-white shadow-inner overflow-hidden relative group">
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  <span className="text-xs font-bold uppercase tracking-wider">Change</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-500">Member dashboard</p>
                <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Welcome back, {user?.name?.split(' ')[0] || 'User'}!</h2>
                <p className="text-slate-600 dark:text-slate-400 mt-1">Manage your tickets, profile, and event experience from one polished workspace.</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-3 min-w-[280px]">
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/70 p-3 text-center border border-slate-200 dark:border-slate-700">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Tickets</p>
                <p className="text-xl font-semibold text-slate-800 dark:text-white">{tickets.length}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/70 p-3 text-center border border-slate-200 dark:border-slate-700">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Wallet</p>
                <p className="text-xl font-semibold text-primary-500 font-mono">₹{walletBalance.toFixed(2)}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/70 p-3 text-center border border-slate-200 dark:border-slate-700">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Status</p>
                <p className="text-xl font-semibold text-emerald-500">Verified</p>
              </div>
            </div>
          </div>
        </section>

        <div className="flex gap-4 border-b border-slate-200 dark:border-slate-700 pb-px overflow-x-auto whitespace-nowrap">
          <button onClick={() => setActiveTab('tickets')} className={`px-4 py-2 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'tickets' ? 'border-primary-500 text-primary-500' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-white'}`}>
            🎫 Ticket Vault
          </button>
          <button onClick={() => setActiveTab('calendar')} className={`px-4 py-2 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'calendar' ? 'border-primary-500 text-primary-500' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-white'}`}>
            📅 Booked Calendar
          </button>
          <button onClick={() => setActiveTab('wallet')} className={`px-4 py-2 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'wallet' ? 'border-primary-500 text-primary-500' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-white'}`}>
            💰 Digital Wallet
          </button>
          <button onClick={() => setActiveTab('profile')} className={`px-4 py-2 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'profile' ? 'border-primary-500 text-primary-500' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-white'}`}>
            👤 Profile & Photo
          </button>
          <button onClick={() => setActiveTab('settings')} className={`px-4 py-2 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'settings' ? 'border-primary-500 text-primary-500' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-white'}`}>
            ⚙️ Preferences & Security
          </button>
        </div>

        {activeTab === 'tickets' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">My Tickets</h2>
            {tickets.length === 0 ? (
              <div className="p-12 glassmorphism rounded-2xl text-center border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center">
                <div className="w-48 h-48 mb-6 opacity-80">
                  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#14b8a6" d="M45.7,-76.1C58.9,-69.3,69.1,-55.3,77.2,-40.8C85.3,-26.3,91.3,-11.3,90.4,3.3C89.5,17.9,81.7,32.1,71.2,43.2C60.7,54.3,47.5,62.3,33.5,69.5C19.5,76.7,4.7,83.1,-9.8,81.6C-24.3,80.1,-38.3,70.7,-49.6,60.1C-60.9,49.5,-69.5,37.7,-75.6,24.3C-81.7,10.9,-85.3,-4.1,-82.5,-18C-79.7,-31.9,-70.5,-44.7,-58.5,-53C-46.5,-61.3,-31.7,-65.1,-17.5,-69.9C-3.3,-74.7,10.3,-80.5,23.6,-81.9C36.9,-83.3,49.9,-80.3,45.7,-76.1Z" transform="translate(100 100) scale(0.9)" />
                    <text x="100" y="110" fontFamily="sans-serif" fontSize="40" textAnchor="middle" fill="white">🎟️</text>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No tickets yet</h3>
                <p className="text-slate-500 mb-6 max-w-md">You haven't purchased any tickets. Explore upcoming events to find something amazing.</p>
                <Link to="/events" className="px-6 py-3 bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-xl font-bold shadow hover:opacity-90">Explore Events</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.slice(0, visibleTicketsCount).map((ticket, i) => {
                  const event = ticket.eventDetails;
                  const isPast = new Date(event.date) < new Date();

                  return (
                    <motion.div key={ticket._id} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.1 }} className="flex flex-col md:flex-row gap-6 p-6 glassmorphism rounded-2xl border border-slate-200 dark:border-slate-700 items-center shadow-sm">
                      <div className="w-24 h-24 bg-white rounded-xl flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-600 p-1">
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${ticket._id}`} alt="QR Code" className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                          <h3 className="text-xl font-bold text-slate-800 dark:text-white">{event.title}</h3>
                          {ticket.status === 'cancelled' ? (
                            <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded uppercase">Cancelled</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-green-100 text-green-600 text-xs font-bold rounded uppercase">Confirmed</span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{new Date(event.date).toLocaleDateString()} • {event.location}</p>
                        <p className="text-xs font-mono text-slate-400 mb-2">Ticket ID: {ticket._id}</p>
                        
                        {ticket.status !== 'cancelled' && (
                          <div className="flex gap-2 justify-center md:justify-start flex-wrap mt-2">
                            <select onChange={(e) => { if(e.target.value) addToCalendar(event, e.target.value); e.target.value=''; }} className="text-xs bg-slate-100 dark:bg-slate-800 text-primary-500 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 outline-none cursor-pointer">
                              <option value="">+ Add to Calendar</option>
                              <option value="google">Google Calendar</option>
                              <option value="outlook">Outlook</option>
                              <option value="ics">Apple Calendar (.ics)</option>
                            </select>
                            <span className="text-slate-300 dark:text-slate-600 mt-1">•</span>
                            <button onClick={() => generateInvoice(ticket)} className="text-xs text-primary-500 hover:underline mt-1">View Invoice</button>
                            <span className="text-slate-300 dark:text-slate-600 mt-1">•</span>
                            <button disabled={emailingTicketId === ticket._id} onClick={() => emailTicketPDF(ticket._id)} className="text-xs text-primary-500 hover:underline mt-1 disabled:opacity-50">
                              {emailingTicketId === ticket._id ? 'Sending...' : 'Email PDF'}
                            </button>
                            <span className="text-slate-300 dark:text-slate-600 mt-1">•</span>
                            <button onClick={() => handleGenerateBadge(event)} className="text-xs text-primary-500 hover:underline mt-1 font-bold">
                              Claim Social Share Badge (₹50)
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 w-full md:w-auto">
                        {ticket.attended && ticket.status !== 'cancelled' && (
                          <button onClick={() => generateCertificate(event.title, ticket._id)} className="px-6 py-2 bg-gradient-to-r from-yellow-400 to-amber-600 text-white font-bold rounded-lg hover:opacity-90 shadow transition-opacity flex items-center justify-center gap-2">
                            ★ Get Certificate
                          </button>
                        )}
                        
                        {ticket.attended && ticket.status !== 'cancelled' && (
                          <div className="flex items-center justify-center gap-1 mt-2">
                            <span className="text-xs text-slate-500 mr-2 font-bold uppercase">Rate:</span>
                            {[1,2,3,4,5].map(star => (
                              <button key={star} onClick={() => setRatings({...ratings, [ticket._id]: star})} className={`text-lg transition-colors ${ratings[ticket._id] >= star ? 'text-yellow-400' : 'text-slate-300 dark:text-slate-600 hover:text-yellow-200'}`}>★</button>
                            ))}
                          </div>
                        )}

                        {!ticket.attended && ticket.status !== 'cancelled' && isPast && (
                          <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg text-sm text-center border border-slate-200 dark:border-slate-700">
                            Waiting for Admin Approval
                          </div>
                        )}
                        {!ticket.attended && ticket.status !== 'cancelled' && !isPast && (
                          <button onClick={() => cancelTicket(ticket._id)} className="px-6 py-2 border border-red-200 dark:border-red-900/50 text-red-500 font-semibold rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                            Cancel Ticket
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
                {visibleTicketsCount < tickets.length && (
                  <div className="text-center mt-8">
                    <button onClick={() => setVisibleTicketsCount(v => v + 3)} className="px-8 py-3 bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-full font-bold shadow hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                      Load More Tickets
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'calendar' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Interactive Booking Calendar</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">Explore your booked schedule and discover new upcoming events.</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold">
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-emerald-500" /> Booked</span>
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-purple-500" /> Available</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl shadow-sm flex justify-center">
                <Calendar
                  value={selectedCalendarDate}
                  onClickDay={(date) => setSelectedCalendarDate(date)}
                  tileClassName={({ date, view }) => {
                    if (view === 'month') {
                      const isBooked = tickets.some(t => {
                        if (t.status === 'cancelled') return false;
                        const eventDate = new Date(t.eventDetails.date);
                        return eventDate.getDate() === date.getDate() &&
                               eventDate.getMonth() === date.getMonth() &&
                               eventDate.getFullYear() === date.getFullYear();
                      });
                      if (isBooked) {
                        return 'bg-emerald-500/20 text-emerald-600 font-black border border-emerald-500/50 rounded-xl';
                      }

                      const hasUnbookedEvent = allEvents.some(e => {
                        const eventDate = new Date(e.date);
                        return eventDate.getDate() === date.getDate() &&
                               eventDate.getMonth() === date.getMonth() &&
                               eventDate.getFullYear() === date.getFullYear();
                      });
                      if (hasUnbookedEvent) {
                        return 'bg-purple-500/20 text-purple-600 font-black border border-purple-500/50 rounded-xl';
                      }
                    }
                    return '';
                  }}
                  className="rounded-2xl border-none font-semibold text-slate-800 dark:text-white bg-transparent dark:bg-slate-900"
                />
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-200 dark:border-slate-850 space-y-4">
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400 font-sans">
                  Schedule on {selectedCalendarDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </h3>
                
                <div className="space-y-3">
                  {(() => {
                    const selectedDateEvents = allEvents.filter(e => {
                      const eventDate = new Date(e.date);
                      return eventDate.getDate() === selectedCalendarDate.getDate() &&
                             eventDate.getMonth() === selectedCalendarDate.getMonth() &&
                             eventDate.getFullYear() === selectedCalendarDate.getFullYear();
                    });

                    if (selectedDateEvents.length === 0) {
                      return <p className="text-xs text-slate-500 text-center py-8">No events scheduled on this day.</p>;
                    }

                    return selectedDateEvents.map(e => {
                      const booking = tickets.find(t => t.status !== 'cancelled' && t.eventDetails._id === e._id);
                      return (
                        <div key={e._id} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-3 shadow-sm">
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                              <h4 className="font-bold text-xs text-slate-800 dark:text-white truncate">{e.title}</h4>
                              <p className="text-[10px] text-slate-450 mt-0.5 truncate">📍 {e.location}</p>
                            </div>
                            <span className="text-xs font-black text-slate-900 dark:text-white shrink-0">
                              {e.price === 0 ? 'Free' : `₹${e.price}`}
                            </span>
                          </div>

                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            {booking ? (
                              <>
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500">
                                  ✅ Booked ({booking.ticketTier || 'General'})
                                </span>
                                <button
                                  onClick={() => setActiveTab('tickets')}
                                  className="text-[10px] font-bold text-primary-500 hover:underline"
                                >
                                  View Ticket
                                </button>
                              </>
                            ) : (
                              <>
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-500">
                                  🎟️ Available
                                </span>
                                <Link
                                  to={`/events/${e._id}`}
                                  className="px-3 py-1 bg-primary-500 hover:bg-primary-600 text-white font-bold text-[10px] rounded-lg transition-colors"
                                >
                                  Book Ticket
                                </Link>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'profile' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl">
            <form onSubmit={handleUpdateProfile} className="space-y-6 glassmorphism p-8 rounded-3xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Profile Management</h3>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase">Verified User</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Manage your public persona, avatar, and core details.</p>
              
              {saveStatus && <div className="p-4 bg-green-50 text-green-600 rounded-xl border border-green-200 font-medium text-sm">{saveStatus}</div>}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">Full Name</label>
                  <input type="text" value={name} onChange={e=>setName(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">Email Address</label>
                  <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 cursor-not-allowed transition-all shadow-sm" disabled title="Contact support to change email" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">Short Bio</label>
                <textarea rows="4" value={bio} onChange={e=>setBio(e.target.value)} placeholder="Tell organizers a bit about yourself..." className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all shadow-sm resize-none"></textarea>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">New Password</label>
                <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Leave blank to keep current password" className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all shadow-sm" />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <button type="submit" className="px-8 py-3 bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-xl font-bold hover:shadow-[0_0_20px_rgba(20,184,166,0.4)] transition-all transform hover:-translate-y-1">
                  Save All Changes
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {activeTab === 'wallet' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Digital Wallet & Ledger</h2>
              <button onClick={() => setShowTopUpModal(true)} className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-all flex items-center gap-2">
                <span>+ Top Up Wallet</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 rounded-3xl text-white shadow-xl relative overflow-hidden border border-slate-700">
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                <h4 className="text-teal-400 font-bold mb-2 uppercase tracking-wider text-xs flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping"></span> Available Balance
                </h4>
                <div className="text-5xl font-black mb-6 font-mono text-white">₹{walletBalance.toFixed(2)}</div>
                <button onClick={() => setShowTopUpModal(true)} className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 rounded-xl font-bold transition-all shadow-md">
                  ⚡ Add Money via Razorpay
                </button>
              </div>
              <div className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl col-span-2 shadow-sm">
                <h4 className="text-slate-800 dark:text-white font-bold mb-4 flex items-center justify-between">
                  <span>Recent Ledger Activity</span>
                  <span className="text-xs text-slate-400 font-normal">Real-time sync</span>
                </h4>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {walletTransactions.map(t => (
                    <div key={t.id} className="flex justify-between items-center p-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors border border-slate-100 dark:border-slate-700/50">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${t.type === 'credit' ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600' : 'bg-red-100 dark:bg-red-900/50 text-red-600'}`}>
                          {t.type === 'credit' ? '↓' : '↑'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white text-sm">{t.title}</p>
                          <p className="text-xs text-slate-400">{t.date} • {t.type === 'credit' ? 'Wallet Deposit' : 'Event Booking'}</p>
                        </div>
                      </div>
                      <span className={`font-black font-mono ${t.type === 'credit' ? 'text-emerald-500' : 'text-red-500'}`}>
                        {t.type === 'credit' ? '+' : '-'}₹{Number(t.amount).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Feature: Refer & Earn Cashback */}
            <div className="p-6 bg-gradient-to-r from-purple-900/40 via-indigo-900/40 to-slate-900 rounded-3xl border border-purple-500/30 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
              <div>
                <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold uppercase tracking-widest mb-2 inline-block">Refer & Earn Program</span>
                <h3 className="text-xl font-bold">Invite Friends, Get ₹50 Wallet Credit</h3>
                <p className="text-sm text-slate-300 mt-1 max-w-md">Share your unique VIP referral link. When a friend joins using your link, ₹50 is instantly credited to your wallet balance!</p>
                {user?.referrals !== undefined && (
                  <p className="text-xs text-purple-300 mt-2.5 font-bold flex items-center gap-2">
                    👥 Total Friends Joined: <span className="text-white bg-purple-600 px-2 py-0.5 rounded-full text-xs font-mono">{user.referrals}</span>
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <input readOnly value={`${window.location.origin}/?ref=${user?._id || 'vip'}`} className="bg-slate-950/80 px-4 py-2.5 rounded-xl border border-slate-700 text-xs text-slate-300 font-mono w-64 outline-none" />
                <button onClick={handleCopyReferral} className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-xl font-bold text-xs shrink-0 transition-colors shadow">
                  {referralCopied ? '✓ Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>

            {/* Top-up Modal */}
            {showTopUpModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl relative">
                  <button onClick={() => setShowTopUpModal(false)} className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 hover:text-white">✕</button>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-1">Add Money to Wallet</h3>
                  <p className="text-xs text-slate-500 mb-6">Select or enter amount. Processed securely via Razorpay API.</p>
                  
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {['100', '500', '1000', '2000'].map(amt => (
                      <button key={amt} type="button" onClick={() => setTopUpAmount(amt)} className={`py-2 rounded-xl font-bold text-sm border transition-all ${topUpAmount === amt ? 'bg-primary-500 text-white border-primary-500 shadow' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
                        ₹{amt}
                      </button>
                    ))}
                  </div>

                  <div className="mb-6">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Custom Amount (₹)</label>
                    <input type="number" value={topUpAmount} onChange={e => setTopUpAmount(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xl font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>

                  <button onClick={() => handleTopUp()} className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-500 to-primary-600 text-white font-black text-base shadow-xl hover:opacity-95 transition-all">
                    ⚡ Proceed to Pay ₹{topUpAmount || '0'}
                  </button>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-2xl">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Preferences & Security</h2>
            
            <div className="glassmorphism rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white">Email Notifications</h4>
                  <p className="text-sm text-slate-500">Receive alerts for new events and ticket updates.</p>
                </div>
                <div className="w-12 h-6 bg-primary-500 rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <span>Organizer Verified Badge</span>
                    {orgVerified && <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-[10px] font-black rounded uppercase">Verified</span>}
                  </h4>
                  <p className="text-sm text-slate-500">Display official organizer checkmark next to your profile.</p>
                </div>
                <button onClick={() => { setOrgVerified(!orgVerified); alert(orgVerified ? 'Organizer badge removed' : 'Identity verified! Organizer badge granted.'); }} className={`px-4 py-2 border rounded-lg font-semibold text-xs transition-colors ${orgVerified ? 'bg-teal-500 text-white border-teal-500' : 'border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                  {orgVerified ? 'Verified ✓' : 'Request Verification'}
                </button>
              </div>
              <div className="p-6 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div>
                  <h4 className="font-bold text-red-500">Danger Zone</h4>
                  <p className="text-sm text-slate-500">Permanently delete your account and all data.</p>
                </div>
                <button className="px-4 py-2 bg-red-100 text-red-600 rounded-lg font-semibold hover:bg-red-200">Delete Account</button>
              </div>
            </div>

            {/* Feature: Interactive NPS Feedback Widget */}
            <div className="p-6 glassmorphism rounded-3xl border border-slate-200 dark:border-slate-700 mt-8">
              <h4 className="font-bold text-slate-800 dark:text-white mb-1">💡 Help Us Improve Codesky OS</h4>
              <p className="text-xs text-slate-500 mb-4">How likely are you to recommend Codesky Event Platform to a friend or colleague?</p>
              {npsSubmitted ? (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 rounded-xl text-xs font-bold text-center">
                  🌟 Thank you for rating us {npsScore}/10! ₹25 feedback bonus credited to your wallet!
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between gap-1">
                    {[1,2,3,4,5,6,7,8,9,10].map(n => (
                      <button key={n} onClick={() => setNpsScore(n)} className={`flex-1 py-2 rounded-lg font-bold text-xs border transition-all ${npsScore === n ? 'bg-primary-500 text-white border-primary-500 scale-110 shadow' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => { setNpsSubmitted(true); setWalletBalance(b => b + 25); updateUser({ credits: walletBalance + 25 }); }} className="w-full py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-xs hover:opacity-90 transition-opacity">
                    Submit Feedback (+₹25 Wallet Bonus)
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Social Attendee Badge Modal */}
        <AnimatePresence>
          {showBadgeModal && activeBadgeEvent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative"
              >
                <button
                  onClick={() => {
                    setShowBadgeModal(false);
                    setActiveBadgeEvent(null);
                  }}
                  className="absolute right-4 top-4 text-slate-400 hover:text-white font-bold"
                >
                  ✕
                </button>

                <h3 className="text-xl font-bold flex items-center gap-2 mb-1"><Sparkles className="h-5 w-5 text-primary-400" /> Share Attendee Badge</h3>
                <p className="text-xs text-slate-400 mb-6 font-semibold">Claim ₹50 wallet credits instantly by downloading and sharing your certificate card.</p>

                {/* Display Canvas Card */}
                <div className="flex justify-center mb-6">
                  <canvas
                    ref={canvasRef}
                    width="600"
                    height="400"
                    className="w-full max-w-md rounded-2xl border border-slate-850 shadow-lg bg-slate-950"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleDownloadBadge}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs transition-colors"
                  >
                    📥 Download Badge Card
                  </button>
                  <button
                    onClick={handleClaimReward}
                    disabled={badgeClaimedEvents.includes(activeBadgeEvent._id)}
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 rounded-xl font-bold text-xs transition-all disabled:opacity-40 disabled:scale-100 flex items-center justify-center gap-1.5"
                  >
                    {badgeClaimedEvents.includes(activeBadgeEvent._id) ? '✓ Reward Claimed' : '📢 Share & Claim ₹50 Reward'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
};

export default Dashboard;
