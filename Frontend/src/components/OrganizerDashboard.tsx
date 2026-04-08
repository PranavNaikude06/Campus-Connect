import { useState, useEffect } from 'react';
import { ProgressBarLoader } from './LoadingScreens';

interface Props { onLogout: () => void; user?: any; }



const TABS = ['Dashboard', 'My Events', 'Analytics', 'Create Event'];
const TAB_ICONS = ['📊', '📋', '📈', '➕'];

const g = {
  page: { minHeight: '100vh', background: 'transparent', display: 'flex', fontFamily: "'Inter','Segoe UI',sans-serif" },
  sidebar: { width: 260, background: 'rgba(20, 20, 30, 0.4)', backdropFilter: 'blur(40px) saturate(200%)', WebkitBackdropFilter: 'blur(40px) saturate(200%)', borderRight: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column' as const, padding: '28px 0', flexShrink: 0, zIndex: 20 },
  grad: { background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
  navItem: (active: boolean) => ({
    padding: '12px 24px', cursor: 'pointer', fontSize: 14, fontWeight: active ? 600 : 500,
    color: active ? '#fff' : '#94a3b8',
    background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
    borderLeft: `3px solid ${active ? '#8b5cf6' : 'transparent'}`,
    transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 12,
  }),
  main: { flex: 1, display: 'flex', flexDirection: 'column' as const, overflow: 'auto', position: 'relative' as const },
  topbar: { padding: '20px 36px', background: 'rgba(20, 20, 30, 0.4)', backdropFilter: 'blur(40px) saturate(200%)', WebkitBackdropFilter: 'blur(40px) saturate(200%)', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky' as const, top: 0, zIndex: 10 },
  content: { padding: '36px', flex: 1 },
  h2: { fontSize: 26, fontWeight: 800, color: '#f0f4ff', marginBottom: 6, letterSpacing: '-0.02em' },
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, marginBottom: 32 },
  statCard: () => ({
    background: 'rgba(25, 25, 35, 0.5)', backdropFilter: 'blur(40px) saturate(200%)', WebkitBackdropFilter: 'blur(40px) saturate(200%)', border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 24, padding: '24px 20px',
    boxShadow: '0 12px 40px rgba(0,0,0,0.15)'
  }),
  btn: (color: string) => ({ padding: '9px 20px', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: `linear-gradient(135deg,${color},${color}bb)`, color: '#fff' }),
  tag: (color: string) => ({ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const, padding: '3px 10px', borderRadius: 999, background: `${color}18`, color, border: `1px solid ${color}30` }),
  input: { width: '100%', padding: '14px 18px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#f0f4ff', fontSize: 14, outline: 'none', marginBottom: 16 },
  glass: { background: 'rgba(25, 25, 35, 0.5)', backdropFilter: 'blur(40px) saturate(200%)', WebkitBackdropFilter: 'blur(40px) saturate(200%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, boxShadow: '0 12px 40px rgba(0,0,0,0.15)' as string },
};

export default function OrganizerDashboard({ onLogout, user }: Props) {
  const [tab, setTab] = useState('Dashboard');
  const [events, setEvents] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', organizer: '', cat: 'Technology', date: '', time: '', venue: '', seats: '' });
  const [isTeam, setIsTeam] = useState(false);
  const [teamSizeMin, setTeamSizeMin] = useState('2');
  const [teamSizeMax, setTeamSizeMax] = useState('4');
  const [isPaid, setIsPaid] = useState(false);
  const [amount, setAmount] = useState('');
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [qrFileName, setQrFileName] = useState('');
  const [whatsappLink, setWhatsappLink] = useState('');
  const [isSetup, setIsSetup] = useState(!user?.is_activated);
  const [setupForm, setSetupForm] = useState({ name: '', year: '', branch: '', committee: '' });
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState('');
  const [orgData, setOrgData] = useState(user || {});
  const [dashLoading, setDashLoading] = useState(true);

  // Dashboard Summary State
  const [myRegistrants, setMyRegistrants] = useState<any[]>([]);

  // Registrants Viewing States
  const [showRegModal, setShowRegModal] = useState(false);
  const [selectedEventName, setSelectedEventName] = useState('');
  const [registrants, setRegistrants] = useState<any[]>([]);
  const [regsLoading, setRegsLoading] = useState(false);
  const [viewingSS, setViewingSS] = useState<string | null>(null);

  const viewRegistrants = async (eventId: number, eventName: string) => {
    setSelectedEventName(eventName);
    setShowRegModal(true);
    setRegsLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/events/${eventId}/registrants`);
      const data = await res.json();
      if (data.success) {
        setRegistrants(data.registrants);
      }
    } catch (err) {
      console.error('Error fetching registrants:', err);
    } finally {
      setRegsLoading(false);
    }
  };

  const updatePaymentStatus = async (regId: number, status: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/registrations/${regId}/payment_status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        setRegistrants(prev => prev.map(r => r.registration_id === regId ? { ...r, payment_status: status } : r));
      }
    } catch (err) {
      console.error('Error updating payment status:', err);
    }
  };

  useEffect(() => {
    setDashLoading(true);
    fetch('http://localhost:5000/api/events')
      .then(res => res.json())
      .then(data => setEvents(data))
      .catch(console.error)
      .finally(() => setDashLoading(false));
  }, []);

  useEffect(() => {
    const orgEvents = events.filter((e: any) => e.organizer === orgData?.committee);
    if (orgEvents.length > 0) {
      Promise.all(orgEvents.map((ev: any) => 
        fetch(`http://localhost:5000/api/events/${ev.id}/registrants`)
          .then(r => r.json())
          .then(d => ({ event: ev.name, registrants: d.registrants || [] }))
      ))
      .then(results => {
         const allRegs = results.flatMap((r: any) => r.registrants.map((req: any) => ({
           name: req.name,
           roll: req.tuf_id || '-',
           event: r.event,
           time: req.registered_at ? new Date(req.registered_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Unknown',
           status: 'Confirmed'
         })));
         setMyRegistrants(allRegs);
      })
      .catch(console.error);
    }
  }, [events, orgData?.committee]);

  const handleSetup = async () => {
    if (!setupForm.name || !setupForm.year || !setupForm.branch || !setupForm.committee) {
      setSetupError('All fields are required');
      return;
    }
    setSetupLoading(true);
    setSetupError('');
    try {
      const res = await fetch('http://localhost:5000/api/auth/organizer/setup', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user?.id, ...setupForm })
      });
      const data = await res.json();
      if (data.success) {
        setOrgData({ ...orgData, ...setupForm, is_activated: true });
        setIsSetup(false);
      } else {
        setSetupError(data.error || 'Setup failed');
      }
    } catch (err) {
      setSetupError('Something went wrong');
    } finally {
      setSetupLoading(false);
    }
  };

  const createEvent = async () => {
    if (!form.name || !form.date) return;
    if (isPaid && !amount) { alert('Please enter the event fee amount.'); return; }
    const organizer = orgData.committee || form.organizer;
    try {
      const res = await fetch('http://localhost:5000/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form, organizer, color: '#10b981', emoji: '🎯',
          is_paid: isPaid,
          amount: isPaid ? amount : '',
          qr_image: isPaid ? qrImage : null,
          whatsapp_link: whatsappLink || null,
          team_size_min: isTeam ? parseInt(teamSizeMin) : 1,
          team_size_max: isTeam ? parseInt(teamSizeMax) : 1,
        })
      });
      const data = await res.json();
      if (data.success) {
        setEvents(e => [{
          id: data.eventId, name: form.name, organizer, cat: form.cat, date: form.date, time: form.time,
          venue: form.venue, seats: form.seats ? parseInt(form.seats) : 0, filled: 0,
          color: '#10b981', emoji: '🎯', status: 'Pending',
          is_paid: isPaid, amount: isPaid ? amount : '',
          whatsapp_link: whatsappLink || null,
          team_size_min: isTeam ? parseInt(teamSizeMin) : 1,
          team_size_max: isTeam ? parseInt(teamSizeMax) : 1,
        }, ...e]);
        setForm({ name: '', organizer: '', cat: 'Technology', date: '', time: '', venue: '', seats: '' });
        setIsPaid(false); setIsTeam(false); setAmount(''); setQrImage(null); setQrFileName(''); setWhatsappLink('');
        setShowModal(false);
        setTab('My Events');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteEvent = (id: number) => setEvents(e => e.filter(ev => ev.id !== id));

  const exportToCSV = async (eventId: number, eventName: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/events/${eventId}/registrants`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch data');
      
      const registrants = data.registrants;
      if (!registrants || registrants.length === 0) {
        alert('No registrants found for this event.');
        return;
      }

      const headers = ['Sr No.', 'Full Name', 'Year', 'Branch / Class', 'Div', 'TUF ID', 'Email ID', 'Mobile No.'];
      const rows = registrants.map((r: any, i: number) => [
        i + 1,
        `"${r.name || ''}"`,
        r.year || '',
        `"${r.branch || ''}"`,
        r.division || '',
        r.tuf_id || '',
        r.email || '',
        r.mobile_no || ''
      ]);
      
      const csvContent = [headers.join(','), ...rows.map((row: any[]) => row.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${eventName.replace(/\\s+/g, '_')}_Registrants.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export CSV. Please try again.');
    }
  };

  const initials = orgData?.name ? orgData.name.split(' ').map((n: string) => n[0]).join('').substring(0,2).toUpperCase() : 'OR';
  const displayName = orgData?.name || 'Organizer';
  const displayInfo = orgData?.committee ? `${orgData.committee} · ${orgData.year || ''} ${orgData.branch || ''}` : 'Organizer';

  const myEvents = events.filter((e: any) => e.organizer === orgData?.committee);

  // First-time setup screen
  if (isSetup) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter','Segoe UI',sans-serif" }}>
        <div style={{ background: 'rgba(10,8,30,0.6)', backdropFilter: 'blur(24px)', border: '1.5px solid rgba(139,92,246,0.3)', borderRadius: 28, padding: 40, maxWidth: 500, width: '100%', boxShadow: '0 24px 64px rgba(139,92,246,0.15)' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🚀</div>
            <h2 style={{ fontSize: 26, fontWeight: 800, fontFamily: 'monospace', color: '#f0f4ff', marginBottom: 6 }}>
              Welcome! <span style={{ background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Setup Your Profile</span>
            </h2>
            <p style={{ color: '#64748b', fontSize: 14 }}>This is a one-time setup. Tell us about yourself.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>Full Name</label>
              <input required placeholder="e.g., Pranav Naikude" value={setupForm.name} onChange={e => setSetupForm({ ...setupForm, name: e.target.value })} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 18px', borderRadius: 12, color: '#fff', outline: 'none', fontSize: 15, boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>Year</label>
                <select value={setupForm.year} onChange={e => setSetupForm({ ...setupForm, year: e.target.value })} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 18px', borderRadius: 12, color: '#fff', fontSize: 15, boxSizing: 'border-box' }}>
                  <option value="" style={{ background: '#0f172a' }}>Select Year</option>
                  <option style={{ background: '#0f172a' }}>FE</option><option style={{ background: '#0f172a' }}>SE</option><option style={{ background: '#0f172a' }}>TE</option><option style={{ background: '#0f172a' }}>BE</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>Branch</label>
                <input required placeholder="e.g., Computer Engineering" value={setupForm.branch} onChange={e => setSetupForm({ ...setupForm, branch: e.target.value })} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 18px', borderRadius: 12, color: '#fff', outline: 'none', fontSize: 15, boxSizing: 'border-box' }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>Committee Name</label>
              <input required placeholder="e.g., GDSC Terna" value={setupForm.committee} onChange={e => setSetupForm({ ...setupForm, committee: e.target.value })} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 18px', borderRadius: 12, color: '#fff', outline: 'none', fontSize: 15, boxSizing: 'border-box' }} />
            </div>
            {setupError && <div style={{ color: '#ef4444', fontSize: 13, background: 'rgba(239,68,68,0.1)', padding: '10px 14px', borderRadius: 8 }}>{setupError}</div>}
            <button onClick={handleSetup} disabled={setupLoading} style={{ marginTop: 8, padding: '14px', borderRadius: 12, fontWeight: 700, fontSize: 16, color: '#fff', border: 'none', background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', cursor: setupLoading ? 'wait' : 'pointer', boxShadow: '0 0 20px rgba(139,92,246,0.3)', opacity: setupLoading ? 0.7 : 1, transition: 'all 0.2s' }}>
              {setupLoading ? 'Saving...' : 'Complete Setup →'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (dashLoading) {
    return (
      <div style={g.page}>
        <ProgressBarLoader message="Loading organizer dashboard..." />
      </div>
    );
  }

  return (
    <div style={g.page}>
      <div style={g.sidebar}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 18, color: '#f0f4ff' }}>Campus<span style={g.grad}>Connect</span></div>
          <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, color: '#fff', margin: '16px 0 6px' }}>{initials}</div>
          <div style={{ fontWeight: 700, color: '#f0f4ff', fontSize: 14 }}>{displayName}</div>
          <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{displayInfo}</div>
        </div>
        <div style={{ padding: '16px 0', flex: 1 }}>
          {TABS.map((t, i) => (
            <div key={t} style={g.navItem(tab === t)} onClick={() => { setTab(t); if (t === 'Create Event') setShowModal(true); }}>
              <span>{TAB_ICONS[i]}</span> {t}
            </div>
          ))}
        </div>
        <div style={{ padding: '0 12px' }}>
          <button onClick={onLogout} style={{ width: '100%', padding: '10px', borderRadius: 12, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>🚪 Logout</button>
        </div>
      </div>

      <div style={g.main}>
        <div style={g.topbar}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#f0f4ff' }}>{tab}</div>
            <div style={{ fontSize: 12, color: '#475569' }}>Organizer Portal · Terna Engineering College</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={g.btn('#8b5cf6')} onClick={() => setShowModal(true)}>+ Create Event</button>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: '#fff' }}>PN</div>
          </div>
        </div>

        <div style={g.content}>
          {/* DASHBOARD */}
          {tab === 'Dashboard' && (
            <div>
              <div style={{ marginBottom: 28 }}>
                <h2 style={g.h2}>Welcome, Pranav! 📋</h2>
                <p style={{ color: '#475569', fontSize: 14 }}>Manage your events and track registrations.</p>
              </div>
              <div style={g.grid4}>
                {[
                  { label: 'My Events', value: myEvents.length, color: '#8b5cf6', emoji: '📋' },
                  { label: 'Total Registrants', value: myEvents.reduce((a, e) => a + e.filled, 0), color: '#4f8ef7', emoji: '👥' },
                  { label: 'Pending Approval', value: myEvents.filter(e => e.status === 'Pending').length, color: '#f59e0b', emoji: '⏳' },
                  { label: 'Active Events', value: myEvents.filter(e => e.status === 'Active').length, color: '#10b981', emoji: '✅' },
                ].map((s, i) => (
                  <div key={i} style={g.statCard()}>
                    <div style={{ fontSize: 26, marginBottom: 8 }}>{s.emoji}</div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: s.color, fontFamily: 'monospace' }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f4ff', marginBottom: 14 }}>Recent Registrations</div>
                <div style={{ ...g.glass, overflow: 'hidden' }}>
                  {myRegistrants.length === 0 && <div style={{ padding: '20px', color: '#64748b', fontSize: 14 }}>No registrations yet.</div>}
                  {myRegistrants.slice(0, 4).map((r, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#8b5cf6,#4f8ef7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: '#fff', flexShrink: 0 }}>{r.name[0]}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: '#f0f4ff', fontSize: 14 }}>{r.name}</div>
                        <div style={{ fontSize: 12, color: '#475569' }}>{r.roll} · {r.event}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: r.status === 'Confirmed' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: r.status === 'Confirmed' ? '#10b981' : '#f59e0b', border: `1px solid ${r.status === 'Confirmed' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}` }}>{r.status}</span>
                        <div style={{ fontSize: 11, color: '#374151', marginTop: 3 }}>{r.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MY EVENTS */}
          {tab === 'My Events' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                  <h2 style={g.h2}>My Events</h2>
                  <p style={{ color: '#475569', fontSize: 14 }}>Manage all events you've created</p>
                </div>
                <button style={g.btn('#8b5cf6')} onClick={() => setShowModal(true)}>+ New Event</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {myEvents.length === 0 && <div style={{ color: '#64748b', fontSize: 14, textAlign: 'center', padding: '40px 0' }}>No events created yet.</div>}
                {myEvents.map((ev: any) => {
                  const pct = ev.seats > 0 ? Math.round((ev.filled / ev.seats) * 100) : 0;
                  return (
                    <div key={ev.id} style={{ background: 'rgba(13,13,32,0.9)', border: `1px solid ${ev.color}25`, borderRadius: 18, padding: 22 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
                        <div style={{ fontSize: 26, width: 52, height: 52, borderRadius: 14, background: `${ev.color}18`, border: `1px solid ${ev.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{ev.emoji}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 16, color: '#f0f4ff' }}>{ev.name}</div>
                          <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>📅 {ev.date} &nbsp; 📍 {ev.venue}</div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 999, background: ev.status === 'Active' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: ev.status === 'Active' ? '#10b981' : '#f59e0b', border: `1px solid ${ev.status === 'Active' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}` }}>{ev.status}</span>
                      </div>
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#475569', marginBottom: 5 }}>
                          <span>Registrants: {ev.filled}{ev.seats > 0 ? `/${ev.seats}` : ''}</span>
                          <span style={{ color: ev.color, fontWeight: 700 }}>{ev.seats > 0 ? `${pct}% filled` : 'Unlimited'}</span>
                        </div>
                        <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 99 }}>
                          <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: ev.color, transition: 'width 0.8s' }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button style={{ padding: '8px 16px', borderRadius: 10, border: `1px solid ${ev.color}40`, background: `${ev.color}12`, color: ev.color, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>✏️ Edit</button>
                        <button onClick={() => deleteEvent(ev.id)} style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>🗑️ Delete</button>
                        <button onClick={() => viewRegistrants(ev.id, ev.name)} style={{ padding: '8px 16px', borderRadius: 10, border: `1px solid ${ev.color}40`, background: `${ev.color}18`, color: ev.color, cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>👥 View Registrants</button>
                        <button onClick={() => exportToCSV(ev.id, ev.name)} style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.08)', color: '#10b981', cursor: 'pointer', fontWeight: 600, fontSize: 12, marginLeft: 'auto' }}>📥 Download CSV</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}


          {/* ANALYTICS */}
          {tab === 'Analytics' && (
            <div>
              <h2 style={{ ...g.h2, marginBottom: 24 }}>Analytics</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {myEvents.length === 0 && <div style={{ color: '#64748b', fontSize: 14, textAlign: 'center', padding: '40px 0' }}>No analytics data available.</div>}
                {myEvents.map((ev: any) => {
                  const pct = ev.seats > 0 ? Math.round((ev.filled / ev.seats) * 100) : 0;
                  return (
                    <div key={ev.id} style={{ background: 'rgba(13,13,32,0.9)', border: `1px solid ${ev.color}25`, borderRadius: 18, padding: 24 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: 22 }}>{ev.emoji}</span>
                          <div>
                            <div style={{ fontWeight: 700, color: '#f0f4ff', fontSize: 15 }}>{ev.name}</div>
                            <div style={{ fontSize: 12, color: '#475569' }}>{ev.filled} registrants {ev.seats > 0 ? `out of ${ev.seats} seats` : ''}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: 28, fontWeight: 900, color: ev.color, fontFamily: 'monospace' }}>{ev.seats > 0 ? `${pct}%` : '∞'}</div>
                      </div>
                      <div style={{ height: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: `linear-gradient(90deg,${ev.color},${ev.color}88)`, transition: 'width 1s' }} />
                      </div>
                      <div style={{ display: 'flex', gap: 20, marginTop: 14 }}>
                        <div style={{ fontSize: 12, color: '#475569' }}>📅 {ev.date}</div>
                        <div style={{ fontSize: 12, color: '#475569' }}>💺 {ev.seats > 0 ? `${ev.seats - ev.filled} seats left` : 'Unlimited seats'}</div>
                        <div style={{ fontSize: 12, color: ev.color }}>● {ev.status}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CREATE EVENT tab triggers modal */}
          {tab === 'Create Event' && !showModal && (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>➕</div>
              <div style={{ fontSize: 17, color: '#64748b', marginBottom: 24 }}>Click below to create a new event</div>
              <button style={g.btn('#8b5cf6')} onClick={() => setShowModal(true)}>Create Event</button>
            </div>
          )}
        </div>
      </div>

      {/* Create Event Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(5,5,16,0.88)', backdropFilter: 'blur(10px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setShowModal(false)}>
          <div style={{ background: 'rgba(13,13,32,0.99)', border: '1px solid rgba(139,92,246,0.35)', borderRadius: 24, padding: 36, maxWidth: 500, width: '100%', maxHeight: '90vh', overflow: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#f0f4ff', marginBottom: 8 }}>Create New Event ➕</div>
            <div style={{ fontSize: 13, color: '#475569', marginBottom: 24 }}>Fill in the details for your new event</div>
            {[
              { label: 'Event Name', key: 'name', type: 'text', ph: 'e.g., Annual Hackathon 2025' },
              { label: 'Date', key: 'date', type: 'date', ph: '' },
              { label: 'Time', key: 'time', type: 'time', ph: '' },
              { label: 'Venue', key: 'venue', type: 'text', ph: 'e.g., Main Auditorium' },
              { label: 'Max Seats (Optional)', key: 'seats', type: 'number', ph: 'e.g., 100 (leave blank for unlimited)' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' as const, display: 'block', marginBottom: 6 }}>{f.label}</label>
                <input type={f.type} placeholder={f.ph} value={(form as Record<string, string>)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={g.input} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' as const, display: 'block', marginBottom: 6 }}>Category</label>
              <select value={form.cat} onChange={e => setForm(p => ({ ...p, cat: e.target.value }))} style={{ ...g.input, marginBottom: 20 }}>
                {['Technology', 'Coding', 'Cultural', 'Workshop', 'Sports', 'Design'].map(c => <option key={c} style={{ background: '#0f172a' }}>{c}</option>)}
              </select>
            </div>

            {/* ── Participation Type Toggle ── */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' as const, display: 'block', marginBottom: 10 }}>Participation Type</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: 13, color: !isTeam ? '#38bdf8' : '#94a3b8', fontWeight: !isTeam ? 700 : 500, transition: 'color 0.2s' }}>👤 Individual</span>
                <div
                  onClick={() => setIsTeam(p => !p)}
                  style={{
                    width: 52, height: 28, borderRadius: 99, cursor: 'pointer', position: 'relative',
                    background: isTeam ? 'linear-gradient(135deg,#c084fc,#8b5cf6)' : 'rgba(255,255,255,0.1)',
                    border: isTeam ? '1px solid rgba(192,132,252,0.5)' : '1px solid rgba(255,255,255,0.15)',
                    transition: 'background 0.3s, border 0.3s',
                    boxShadow: isTeam ? '0 0 12px rgba(139,92,246,0.35)' : 'none',
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 3, left: isTeam ? 26 : 3,
                    width: 20, height: 20, borderRadius: '50%', background: '#fff',
                    transition: 'left 0.3s', boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                  }} />
                </div>
                <span style={{ fontSize: 13, color: isTeam ? '#c084fc' : '#94a3b8', fontWeight: isTeam ? 700 : 500, transition: 'color 0.2s' }}>👥 Team</span>
              </div>
            </div>

            {isTeam && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 6 }}>Min Team Size</label>
                  <input type="number" min="1" value={teamSizeMin} onChange={e => setTeamSizeMin(e.target.value)} style={{ ...g.input, marginBottom: 0 }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 6 }}>Max Team Size</label>
                  <input type="number" min="1" value={teamSizeMax} onChange={e => setTeamSizeMax(e.target.value)} style={{ ...g.input, marginBottom: 0 }} />
                </div>
              </div>
            )}

            {/* ── Paid / Free Toggle ── */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' as const, display: 'block', marginBottom: 10 }}>Event Type</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: 13, color: isPaid ? '#94a3b8' : '#f0f4ff', fontWeight: isPaid ? 500 : 700, transition: 'color 0.2s' }}>🆓 Free</span>
                {/* Toggle pill */}
                <div
                  onClick={() => setIsPaid(p => !p)}
                  style={{
                    width: 52, height: 28, borderRadius: 99, cursor: 'pointer', position: 'relative',
                    background: isPaid ? 'linear-gradient(135deg,#f59e0b,#ef4444)' : 'rgba(255,255,255,0.1)',
                    border: isPaid ? '1px solid rgba(245,158,11,0.5)' : '1px solid rgba(255,255,255,0.15)',
                    transition: 'background 0.3s, border 0.3s',
                    boxShadow: isPaid ? '0 0 12px rgba(245,158,11,0.35)' : 'none',
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 3, left: isPaid ? 26 : 3,
                    width: 20, height: 20, borderRadius: '50%', background: '#fff',
                    transition: 'left 0.3s', boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                  }} />
                </div>
                <span style={{ fontSize: 13, color: isPaid ? '#f59e0b' : '#94a3b8', fontWeight: isPaid ? 700 : 500, transition: 'color 0.2s' }}>💰 Paid</span>
              </div>
            </div>

            {/* ── Paid-only fields ── */}
            {isPaid && (
              <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 14, padding: '18px 18px 4px', marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 14 }}>💰 Payment Details</div>

                {/* Amount */}
                <div>
                  <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' as const, display: 'block', marginBottom: 6 }}>Entry Fee *</label>
                  <input
                    type="text" placeholder="e.g., 50 or ₹500 Per Team"
                    value={amount} onChange={e => setAmount(e.target.value)}
                    style={{ ...g.input, border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.05)' }}
                  />
                </div>

                {/* QR Upload */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' as const, display: 'block', marginBottom: 6 }}>Payment QR Code *</label>
                  <label htmlFor="qr-upload" style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                    borderRadius: 12, border: `2px dashed ${qrImage ? 'rgba(16,185,129,0.5)' : 'rgba(245,158,11,0.3)'}`,
                    background: qrImage ? 'rgba(16,185,129,0.06)' : 'rgba(245,158,11,0.04)',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}>
                    <span style={{ fontSize: 22 }}>{qrImage ? '✅' : '📷'}</span>
                    <div>
                      <div style={{ fontSize: 13, color: qrImage ? '#10b981' : '#94a3b8', fontWeight: 600 }}>
                        {qrFileName || 'Upload QR Image'}
                      </div>
                      <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>PNG/JPG/WEBP • Max 2 MB</div>
                    </div>
                  </label>
                  <input
                    id="qr-upload" type="file" accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 2 * 1024 * 1024) { alert('File too large. Max 2 MB.'); return; }
                      setQrFileName(file.name);
                      const reader = new FileReader();
                      reader.onload = ev => setQrImage(ev.target?.result as string);
                      reader.readAsDataURL(file);
                    }}
                  />
                  {qrImage && (
                    <div style={{ marginTop: 10, textAlign: 'center' }}>
                      <img src={qrImage} alt="QR Preview" style={{ maxWidth: 120, maxHeight: 120, borderRadius: 10, border: '1px solid rgba(16,185,129,0.3)' }} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── WhatsApp Group Link (Optional) ── */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' as const, display: 'block', marginBottom: 6 }}>WhatsApp Group Link <span style={{ color: '#334155', fontWeight: 400, textTransform: 'none' as const }}>(Optional)</span></label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>💬</span>
                <input
                  type="url" placeholder="https://chat.whatsapp.com/..."
                  value={whatsappLink} onChange={e => setWhatsappLink(e.target.value)}
                  style={{ ...g.input, paddingLeft: 40, marginBottom: 0 }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#64748b', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button onClick={createEvent} style={{ flex: 2, padding: '12px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>Create Event →</button>
            </div>
          </div>
        </div>
      )}
      {/* VIEW REGISTRANTS MODAL */}
      {showRegModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(5,5,16,0.9)', backdropFilter: 'blur(12px)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setShowRegModal(false)}>
          <div style={{ background: 'rgba(13,13,32,0.99)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 28, padding: 32, maxWidth: 1000, width: '100%', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#f0f4ff' }}>{selectedEventName}</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>Manage and verify all registrations for this event</div>
              </div>
              <div onClick={() => setShowRegModal(false)} style={{ fontSize: 24, color: '#475569', cursor: 'pointer' }}>×</div>
            </div>

            <div style={{ flex: 1, overflow: 'auto', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
              {regsLoading ? (
                <div style={{ color: '#64748b', textAlign: 'center', padding: '100px 0' }}>📂 Loading records...</div>
              ) : registrants.length === 0 ? (
                <div style={{ color: '#64748b', textAlign: 'center', padding: '100px 0' }}>📭 No registrations found yet.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                  <thead style={{ position: 'sticky', top: 0, background: 'rgba(255,255,255,0.03)', zIndex: 5 }}>
                    <tr>
                      <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Participant</th>
                      <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Academic Details</th>
                      <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Team Info</th>
                      <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Payment</th>
                      <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrants.map((r, i) => (
                      <tr key={r.registration_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ color: '#f0f4ff', fontWeight: 600 }}>{r.name}</div>
                          <div style={{ color: '#64748b', fontSize: 11 }}>{r.email}</div>
                          <div style={{ color: '#444', fontSize: 11, marginTop: 2 }}>📞 {r.mobile_no}</div>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ color: '#cbd5e1' }}>{r.year} · {r.branch}</div>
                          <div style={{ color: '#475569', fontSize: 11 }}>Div: {r.division} · ID: {r.tuf_id}</div>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          {r.team_name ? (
                            <div>
                              <div style={{ color: '#c084fc', fontWeight: 700 }}>{r.team_name}</div>
                              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                                {JSON.parse(r.team_members || '[]').length + 1} members total
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: '#475569' }}>Individual</span>
                          )}
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          {r.payment_ss ? (
                            <div style={{ cursor: 'pointer' }} onClick={() => setViewingSS(r.payment_ss)}>
                              <img src={r.payment_ss} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
                              <div style={{ fontSize: 10, color: '#8b5cf6', marginTop: 4 }}>View Full →</div>
                            </div>
                          ) : (
                            <span style={{ color: '#475569' }}>N/A</span>
                          )}
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div style={{ 
                              fontSize: 11, fontWeight: 700, textAlign: 'center', padding: '3px 8px', borderRadius: 999, 
                              background: r.payment_status === 'Verified' ? 'rgba(16,185,129,0.15)' : r.payment_status === 'Rejected' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                              color: r.payment_status === 'Verified' ? '#10b981' : r.payment_status === 'Rejected' ? '#ef4444' : '#f59e0b',
                              border: `1px solid ${r.payment_status === 'Verified' ? 'rgba(16,185,129,0.3)' : r.payment_status === 'Rejected' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`
                             }}>
                              {r.payment_status}
                            </div>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button onClick={() => updatePaymentStatus(r.registration_id, 'Verified')} style={{ background: '#10b98120', border: 'none', borderRadius: 4, color: '#10b981', fontSize: 10, padding: '4px 8px', cursor: 'pointer' }}>Approve</button>
                              <button onClick={() => updatePaymentStatus(r.registration_id, 'Rejected')} style={{ background: '#ef444420', border: 'none', borderRadius: 4, color: '#ef4444', fontSize: 10, padding: '4px 8px', cursor: 'pointer' }}>Reject</button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FULL SCREEN IMAGE VIEWER */}
      {viewingSS && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}
          onClick={() => setViewingSS(null)}>
          <div style={{ position: 'absolute', top: 30, right: 30, color: '#fff', fontSize: 40, cursor: 'pointer' }}>×</div>
          <img src={viewingSS} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 12, boxShadow: '0 0 100px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
