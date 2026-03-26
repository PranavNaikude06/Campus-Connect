import { useState, useEffect } from 'react';
import { ProgressBarLoader } from './LoadingScreens';

interface Props { onLogout: () => void; }




const TABS = ['Overview', 'All Events', 'All Users', 'Approvals', 'Committees', 'Analytics'];
const TAB_ICONS = ['🏠', '📅', '👥', '✅', '📋', '📊'];

const g = {
  page: { minHeight: '100vh', background: 'transparent', display: 'flex', fontFamily: "'Inter','Segoe UI',sans-serif" },
  sidebar: { width: 260, background: 'rgba(20, 20, 30, 0.4)', backdropFilter: 'blur(40px) saturate(200%)', WebkitBackdropFilter: 'blur(40px) saturate(200%)', borderRight: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column' as const, padding: '28px 0', flexShrink: 0, zIndex: 20 },
  grad: { background: 'linear-gradient(135deg,#ec4899,#f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
  navItem: (active: boolean) => ({
    padding: '12px 24px', cursor: 'pointer', fontSize: 14, fontWeight: active ? 600 : 500,
    color: active ? '#fff' : '#94a3b8',
    background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
    borderLeft: `3px solid ${active ? '#ec4899' : 'transparent'}`,
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
  btn: (color: string) => ({ padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: `linear-gradient(135deg,${color},${color}bb)`, color: '#fff' }),
  tag: (color: string) => ({ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const, padding: '3px 10px', borderRadius: 999, background: `${color}18`, color, border: `1px solid ${color}30` }),
};

const alertColor = (t: string) => t === 'warn' ? '#f59e0b' : t === 'success' ? '#10b981' : '#4f8ef7';
const alertBg = (t: string) => t === 'warn' ? 'rgba(245,158,11,0.1)' : t === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(79,142,247,0.1)';
const roleColor = (r: string) => r === 'Admin' ? '#ec4899' : r === 'Organizer' ? '#8b5cf6' : '#4f8ef7';

export default function AdminDashboard({ onLogout }: Props) {
  const [tab, setTab] = useState('Overview');
  const [events, setEvents] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  // Credential management state
  const [credentials, setCredentials] = useState<any[]>([]);
  const [credForm, setCredForm] = useState({ username: '', password: '' });
  const [credLoading, setCredLoading] = useState(false);
  const [credError, setCredError] = useState('');
  const [credSuccess, setCredSuccess] = useState('');
  const [dashLoading, setDashLoading] = useState(true);

  useEffect(() => {
    setDashLoading(true);
    Promise.all([
      fetch('http://localhost:5000/api/events').then(r => r.json()).then(setEvents).catch(console.error),
      fetch('http://localhost:5000/api/admin/users').then(r => r.json()).then(setUsers).catch(console.error),
      fetch('http://localhost:5000/api/admin/alerts').then(r => r.json()).then(setAlerts).catch(console.error),
    ]).finally(() => setDashLoading(false));
  }, []);

  useEffect(() => {
    if (tab === 'Committees') {
      fetch('http://localhost:5000/api/admin/credentials')
        .then(r => r.json())
        .then(setCredentials)
        .catch(console.error);
    }
  }, [tab]);

  const createCredential = async () => {
    if (!credForm.username || !credForm.password) { setCredError('All fields required'); return; }
    setCredLoading(true); setCredError(''); setCredSuccess('');
    try {
      const res = await fetch('http://localhost:5000/api/admin/credentials', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCredSuccess(`Credentials created! Valid until ${data.validUntil}`);
      setCredForm({ username: '', password: '' });
      // Refresh list
      const listRes = await fetch('http://localhost:5000/api/admin/credentials');
      setCredentials(await listRes.json());
    } catch (err: any) {
      setCredError(err.message || 'Failed');
    } finally {
      setCredLoading(false);
    }
  };

  const deleteCredential = async (id: number) => {
    try {
      await fetch(`http://localhost:5000/api/admin/credentials/${id}`, { method: 'DELETE' });
      setCredentials(c => c.filter(cr => cr.id !== id));
    } catch (err) { console.error(err); }
  };

  const pendingEvents = events.filter(e => e.status === 'Pending');
  const approve = async (id: number) => {
    try {
      await fetch(`http://localhost:5000/api/events/${id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'Active' }) });
      setEvents(e => e.map(ev => ev.id === id ? { ...ev, status: 'Active' } : ev));
    } catch (err) { console.error(err); }
  };
  const reject = async (id: number) => {
    try {
      await fetch(`http://localhost:5000/api/events/${id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'Rejected' }) });
      setEvents(e => e.map(ev => ev.id === id ? { ...ev, status: 'Rejected' } : ev));
    } catch (err) { console.error(err); }
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.branch?.toLowerCase().includes(search.toLowerCase()) ||
    u.year?.toLowerCase().includes(search.toLowerCase())
  );

  if (dashLoading) {
    return (
      <div style={g.page}>
        <ProgressBarLoader message="Loading admin dashboard..." />
      </div>
    );
  }

  return (
    <div style={g.page}>
      <div style={g.sidebar}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 18, color: '#f0f4ff' }}>Campus<span style={g.grad}>Connect</span></div>
          <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,#ec4899,#f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, color: '#fff', margin: '16px 0 6px' }}>AD</div>
          <div style={{ fontWeight: 700, color: '#f0f4ff', fontSize: 14 }}>ADMIN</div>
        </div>
        <div style={{ padding: '16px 0', flex: 1 }}>
          {TABS.map((t, i) => (
            <div key={t} style={g.navItem(tab === t)} onClick={() => { setTab(t); setSelectedEvent(null); }}>
              <span>{TAB_ICONS[i]}</span> {t}
              {t === 'Approvals' && pendingEvents.length > 0 && (
                <span style={{ marginLeft: 'auto', background: '#ec4899', color: '#fff', borderRadius: 999, width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800 }}>{pendingEvents.length}</span>
              )}
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
            <div style={{ fontSize: 12, color: '#475569' }}>Admin Portal · Terna Engineering College</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {pendingEvents.length > 0 && (
              <div style={{ padding: '6px 14px', borderRadius: 999, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', fontSize: 12, fontWeight: 600 }}>
                ⏳ {pendingEvents.length} pending approval
              </div>
            )}
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#ec4899,#f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: '#fff' }}>AD</div>
          </div>
        </div>

        <div style={g.content}>
          {/* OVERVIEW */}
          {tab === 'Overview' && (
            <div>
              <div style={{ marginBottom: 28 }}>
                <h2 style={g.h2}>System Overview 🛡️</h2>
                <p style={{ color: '#475569', fontSize: 14 }}>Full control over the Campus Connect portal.</p>
              </div>
              <div style={g.grid4}>
                {[
                  { label: 'Total Events', value: events.length, color: '#ec4899', emoji: '📅' },
                  { label: 'Total Users', value: users.length, color: '#4f8ef7', emoji: '👥' },
                  { label: 'Pending Approvals', value: pendingEvents.length, color: '#f59e0b', emoji: '⏳' },
                  { label: 'Total Registrations', value: events.reduce((a, e) => a + e.filled, 0), color: '#10b981', emoji: '✅' },
                ].map((s, i) => (
                  <div key={i} style={g.statCard()}>
                    <div style={{ fontSize: 26, marginBottom: 8 }}>{s.emoji}</div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: s.color, fontFamily: 'monospace' }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div style={{ background: 'rgba(25, 25, 35, 0.5)', backdropFilter: 'blur(40px) saturate(200%)', WebkitBackdropFilter: 'blur(40px) saturate(200%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 28, boxShadow: '0 12px 40px rgba(0,0,0,0.15)' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#f0f4ff', marginBottom: 20 }}>🔔 System Alerts</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {alerts.length === 0 && <div style={{ fontSize: 13, color: '#64748b', padding: '10px 0' }}>No active alerts.</div>}
                    {alerts.map((a, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 18px', borderRadius: 16, background: alertBg(a.type), border: `1px solid ${alertColor(a.type)}25` }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: alertColor(a.type), marginTop: 4, flexShrink: 0, boxShadow: `0 0 10px ${alertColor(a.type)}` }} />
                        <div style={{ flex: 1, fontSize: 14, color: '#94a3b8', fontWeight: 500 }}>{a.msg}</div>
                        <div style={{ fontSize: 12, color: '#64748b', flexShrink: 0 }}>{a.time}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Event Fill Rates */}
                <div style={{ background: 'rgba(25, 25, 35, 0.5)', backdropFilter: 'blur(40px) saturate(200%)', WebkitBackdropFilter: 'blur(40px) saturate(200%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 28, boxShadow: '0 12px 40px rgba(0,0,0,0.15)' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#f0f4ff', marginBottom: 20 }}>📊 Event Fill Rates</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {events.slice(0, 4).map(ev => {
                      const pct = ev.seats > 0 ? Math.round((ev.filled / ev.seats) * 100) : 0;
                      return (
                        <div key={ev.id}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                            <span style={{ color: '#94a3b8' }}>{ev.emoji} {ev.name}</span>
                            <span style={{ color: ev.color, fontWeight: 700 }}>{pct}%</span>
                          </div>
                          <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 99 }}>
                            <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: ev.color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ALL EVENTS */}
          {tab === 'All Events' && (
            <div>
              {selectedEvent ? (
                <div>
                  <button onClick={() => setSelectedEvent(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, padding: 0, marginBottom: 24 }}>← Back to Events</button>
                  <div style={{ background: 'rgba(25, 25, 35, 0.5)', backdropFilter: 'blur(40px) saturate(200%)', WebkitBackdropFilter: 'blur(40px) saturate(200%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 40, boxShadow: '0 12px 40px rgba(0,0,0,0.15)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32 }}>
                      <div style={{ width: 64, height: 64, borderRadius: '20%', background: `linear-gradient(135deg,${selectedEvent.color},${selectedEvent.color}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, boxShadow: `0 8px 24px ${selectedEvent.color}40` }}>{selectedEvent.emoji}</div>
                      <div>
                        <h2 style={{ fontSize: 28, fontWeight: 800, color: '#f0f4ff', margin: 0 }}>{selectedEvent.name}</h2>
                        <div style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>Organized by <strong style={{ color: '#f0f4ff' }}>{selectedEvent.organizer}</strong></div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
                      <div>
                        <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em', marginBottom: 6 }}>Category</div>
                        <div style={{ fontSize: 16, color: '#f0f4ff', fontWeight: 500 }}>{selectedEvent.cat}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em', marginBottom: 6 }}>Date & Time</div>
                        <div style={{ fontSize: 16, color: '#f0f4ff', fontWeight: 500 }}>{selectedEvent.date} at {selectedEvent.time}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em', marginBottom: 6 }}>Venue</div>
                        <div style={{ fontSize: 16, color: '#f0f4ff', fontWeight: 500 }}>{selectedEvent.venue}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em', marginBottom: 6 }}>Total Capacity</div>
                        <div style={{ fontSize: 16, color: '#f0f4ff', fontWeight: 500 }}>{selectedEvent.seats} seats</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 style={{ ...g.h2, marginBottom: 24 }}>Active Events</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {events.filter(e => e.status === 'Active').map(ev => (
                      <div key={ev.id} onClick={() => setSelectedEvent(ev)} style={{ cursor: 'pointer', background: 'rgba(25, 25, 35, 0.5)', backdropFilter: 'blur(40px) saturate(200%)', WebkitBackdropFilter: 'blur(40px) saturate(200%)', border: `1px solid rgba(255,255,255,0.08)`, borderRadius: 20, padding: '22px 28px', boxShadow: '0 12px 30px rgba(0,0,0,0.1)', transition: 'transform 0.2s, box-shadow 0.2s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                          <span style={{ fontSize: 26 }}>{ev.emoji}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, color: '#f0f4ff', fontSize: 15 }}>{ev.name}</div>
                            <div style={{ fontSize: 12, color: '#475569' }}>📅 {ev.date} &nbsp; 👤 {ev.organizer}</div>
                          </div>
                          <span style={{ fontSize: 16 }}>➔</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ALL USERS */}
          {tab === 'All Users' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                  <h2 style={g.h2}>All Users</h2>
                  <p style={{ color: '#475569', fontSize: 14 }}>Manage all registered users</p>
                </div>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search users..."
                  style={{ padding: '9px 16px', borderRadius: 11, border: '1px solid rgba(236,72,153,0.2)', background: 'rgba(10,10,26,0.8)', color: '#f0f4ff', fontSize: 13, outline: 'none', width: 220 }} />
              </div>
              <div style={{ background: 'rgba(25, 25, 35, 0.5)', backdropFilter: 'blur(40px) saturate(200%)', WebkitBackdropFilter: 'blur(40px) saturate(200%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, overflowX: 'auto', boxShadow: '0 12px 40px rgba(0,0,0,0.15)' }}>
                <div style={{ minWidth: 800 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1.5fr) minmax(130px, 1fr) 1fr 1fr 1fr', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: 12, fontWeight: 800, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    <span>User</span><span>Year & Branch</span><span>Role</span><span>Joined</span><span>Status</span>
                  </div>
                  {filteredUsers.map((u, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)', alignItems: 'center', padding: '13px 20px', borderBottom: i < filteredUsers.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <div style={{ width: 32, height: 32, flexShrink: 0, borderRadius: '50%', background: `linear-gradient(135deg,${roleColor(u.role)},${roleColor(u.role)}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>{u.name?.[0] || '?'}</div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f4ff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</div>
                          <div style={{ fontSize: 11, color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 13, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: 10 }}>
                        {u.year === '-' ? u.branch : <><span style={{ fontWeight: 700, color: '#f0f4ff' }}>{u.year}</span> • {u.branch}</>}
                      </div>
                      <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: `${roleColor(u.role)}18`, color: roleColor(u.role), border: `1px solid ${roleColor(u.role)}30`, width: 'fit-content' }}>{u.role}</span>
                      <div style={{ fontSize: 12, color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.joined}</div>
                      <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: u.status === 'Active' ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.15)', color: u.status === 'Active' ? '#10b981' : '#64748b', border: `1px solid ${u.status === 'Active' ? 'rgba(16,185,129,0.3)' : 'rgba(100,116,139,0.3)'}`, width: 'fit-content' }}>{u.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* APPROVALS */}
          {tab === 'Approvals' && (
            <div>
              <h2 style={{ ...g.h2, marginBottom: 24 }}>Event Approvals</h2>
              {pendingEvents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0', color: '#374151' }}>
                  <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
                  <div style={{ fontSize: 17, color: '#64748b' }}>All events are approved!</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {pendingEvents.map(ev => (
                    <div key={ev.id} style={{ background: 'rgba(25, 25, 35, 0.5)', backdropFilter: 'blur(40px) saturate(200%)', WebkitBackdropFilter: 'blur(40px) saturate(200%)', border: `1px solid rgba(255,255,255,0.08)`, borderRadius: 24, padding: 28, boxShadow: '0 12px 40px rgba(0,0,0,0.15)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
                        <span style={{ fontSize: 32 }}>{ev.emoji}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: '#f0f4ff', fontSize: 16 }}>{ev.name}</div>
                          <div style={{ fontSize: 13, color: '#475569' }}>📅 {ev.date} &nbsp; 👤 {ev.organizer} &nbsp; 💺 {ev.seats} seats</div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '5px 14px', borderRadius: 999, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>⏳ Pending</span>
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => approve(ev.id)} style={{ flex: 1, padding: '11px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>✅ Approve</button>
                        <button onClick={() => reject(ev.id)} style={{ flex: 1, padding: '11px', borderRadius: 12, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>❌ Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ANALYTICS */}
          {tab === 'Analytics' && (
            <div>
              <h2 style={{ ...g.h2, marginBottom: 24 }}>Platform Analytics</h2>
              <div style={{ maxWidth: 500, margin: '0 0 24px' }}>
                <div style={{ background: 'rgba(25, 25, 35, 0.5)', backdropFilter: 'blur(40px) saturate(200%)', WebkitBackdropFilter: 'blur(40px) saturate(200%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 32, boxShadow: '0 12px 40px rgba(0,0,0,0.15)' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#f0f4ff', marginBottom: 24 }}>👥 Users by Role</div>
                  {[
                    { role: 'Organizers', count: users.filter(u => u.role === 'Organizer').length, color: '#8b5cf6' },
                    { role: 'Admins', count: users.filter(u => u.role === 'Admin').length, color: '#ec4899' },
                  ].map((r, i) => {
                    const pct = users.length > 0 ? Math.round((r.count / users.length) * 100) : 0;
                    return (
                      <div key={i} style={{ marginBottom: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                          <span style={{ color: '#94a3b8' }}>{r.role}</span>
                          <span style={{ color: r.color, fontWeight: 800, fontFamily: 'monospace', fontSize: 16 }}>{r.count}</span>
                        </div>
                        <div style={{ height: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 99 }}>
                          <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: `linear-gradient(90deg,${r.color},${r.color}88)` }} />
                        </div>
                        <div style={{ fontSize: 11, color: '#374151', marginTop: 4 }}>{pct}% of all users</div>
                      </div>
                    );
                  })}
                  <div style={{ marginTop: 8, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: 12, color: '#475569' }}>Total registered users</div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: '#ec4899', fontFamily: 'monospace' }}>{users.length}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* COMMITTEES */}
          {tab === 'Committees' && (
            <div>
              <h2 style={{ ...g.h2, marginBottom: 24 }}>Committee Credentials</h2>
              {/* Create credentials form */}
              <div style={{ background: 'rgba(25, 25, 35, 0.5)', backdropFilter: 'blur(40px) saturate(200%)', WebkitBackdropFilter: 'blur(40px) saturate(200%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 32, boxShadow: '0 12px 40px rgba(0,0,0,0.15)', marginBottom: 28 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#f0f4ff', marginBottom: 20 }}>➕ Create New Credential</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(140px, 1fr) minmax(140px, 1fr) auto auto', gap: 12, alignItems: 'end' }}>
                  <div>
                    <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>Username</label>
                    <input placeholder="e.g., gdsc_2025" value={credForm.username} onChange={e => setCredForm({ ...credForm, username: e.target.value })} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: 12, color: '#fff', outline: 'none', fontSize: 14, boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>Password</label>
                    <input placeholder="Password" value={credForm.password} onChange={e => setCredForm({ ...credForm, password: e.target.value })} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: 12, color: '#fff', outline: 'none', fontSize: 14, boxSizing: 'border-box' }} />
                  </div>
                  <button onClick={() => {
                    const r = Math.random().toString(36).substring(2, 8);
                    setCredForm({ ...credForm, username: `org_${r}`, password: `pass_${r}` });
                  }} style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(139,92,246,0.5)', background: 'rgba(139,92,246,0.1)', color: '#a78bfa', cursor: 'pointer', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' }}>
                    Auto Generate
                  </button>
                  <button onClick={createCredential} disabled={credLoading} style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', opacity: credLoading ? 0.7 : 1 }}>
                    {credLoading ? 'Creating...' : 'Create'}
                  </button>
                </div>
                {credError && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 12 }}>{credError}</div>}
                {credSuccess && <div style={{ color: '#10b981', fontSize: 12, marginTop: 12 }}>{credSuccess}</div>}
              </div>
              {/* Credentials list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {credentials.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: '#475569' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                    <div style={{ fontSize: 15 }}>No credentials created yet</div>
                  </div>
                ) : credentials.map((c: any) => {
                  const expired = new Date() > new Date(c.valid_until);
                  const daysLeft = Math.ceil((new Date(c.valid_until).getTime() - Date.now()) / 86400000);
                  return (
                    <div key={c.id} style={{ background: 'rgba(25, 25, 35, 0.5)', backdropFilter: 'blur(40px) saturate(200%)', WebkitBackdropFilter: 'blur(40px) saturate(200%)', border: `1px solid rgba(255,255,255,0.08)`, borderRadius: 20, padding: '22px 28px', boxShadow: '0 12px 30px rgba(0,0,0,0.1)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                          <div style={{ width: 44, height: 44, borderRadius: '50%', background: c.is_activated ? 'linear-gradient(135deg,#8b5cf6,#ec4899)' : 'rgba(100,100,120,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, color: '#fff' }}>
                            {c.is_activated && c.name ? c.name.split(' ').map((n: string) => n[0]).join('').substring(0,2).toUpperCase() : '?'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#f0f4ff', fontSize: 15 }}>
                              {c.is_activated ? c.committee : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Waiting for Setup</span>}
                            </div>
                            <div style={{ fontSize: 12, color: '#475569' }}>
                              {c.is_activated
                                ? `${c.name} · ${c.year} ${c.branch}`
                                : `Username: ${c.username}`
                              }
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 999, background: expired ? 'rgba(239,68,68,0.15)' : c.is_activated ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: expired ? '#ef4444' : c.is_activated ? '#10b981' : '#f59e0b', border: `1px solid ${expired ? 'rgba(239,68,68,0.3)' : c.is_activated ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
                            {expired ? 'Expired' : c.is_activated ? 'Active' : 'Unclaimed'}
                          </span>
                          <span style={{ fontSize: 11, color: expired ? '#ef4444' : '#475569' }}>
                            {expired ? 'Expired' : `${daysLeft}d left`}
                          </span>
                          <button onClick={() => deleteCredential(c.id)} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Delete</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
