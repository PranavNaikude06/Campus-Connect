import { useState, useEffect } from 'react';

interface Props { 
  onLogout: () => void; 
  user?: any;
}


const CATS = ['All', 'Technology', 'Coding', 'Cultural', 'Workshop', 'Sports', 'Design'];
const TABS = ['Home', 'Browse Events', 'My Registrations', 'Certificates', 'Settings'];

const g = {
  page: { minHeight: '100vh', background: 'transparent', display: 'flex', fontFamily: "'Inter','Segoe UI',sans-serif" },
  sidebar: { width: 260, background: 'rgba(20, 20, 30, 0.4)', backdropFilter: 'blur(40px) saturate(200%)', WebkitBackdropFilter: 'blur(40px) saturate(200%)', borderRight: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column' as const, padding: '28px 0', flexShrink: 0, zIndex: 20 },
  sideTop: { padding: '0 24px 28px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', textAlign: 'center' as const },
  logo: { fontFamily: 'monospace', fontWeight: 800, fontSize: 20, color: '#f0f4ff' },
  grad: { background: 'linear-gradient(135deg,#4f8ef7,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
  avatar: { width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#4f8ef7,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 20, color: '#fff', margin: '20px 0 10px', boxShadow: '0 8px 24px rgba(79,142,247,0.3)' },
  userName: { fontWeight: 700, color: '#f0f4ff', fontSize: 16 },
  userSub: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  navItem: (active: boolean) => ({
    padding: '12px 24px', cursor: 'pointer', fontSize: 14, fontWeight: active ? 600 : 500,
    color: active ? '#fff' : '#94a3b8',
    background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
    borderLeft: `3px solid ${active ? '#4f8ef7' : 'transparent'}`,
    transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 12,
  }),
  main: { flex: 1, display: 'flex', flexDirection: 'column' as const, overflow: 'auto', position: 'relative' as const },
  topbar: { padding: '20px 36px', background: 'rgba(20, 20, 30, 0.4)', backdropFilter: 'blur(40px) saturate(200%)', WebkitBackdropFilter: 'blur(40px) saturate(200%)', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky' as const, top: 0, zIndex: 10 },
  content: { padding: '36px', flex: 1 },
  card: (color = 'rgba(25, 25, 35, 0.5)', border = 'rgba(255, 255, 255, 0.1)') => ({
    background: color, border: `1px solid ${border}`, borderRadius: 24, padding: 28,
    backdropFilter: 'blur(40px) saturate(200%)', WebkitBackdropFilter: 'blur(40px) saturate(200%)',
    boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
  }),
  h2: { fontSize: 26, fontWeight: 800, color: '#f0f4ff', marginBottom: 6, letterSpacing: '-0.02em' },
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, marginBottom: 32 },
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 24 },
  statCard: () => ({
    background: 'rgba(25, 25, 35, 0.5)', backdropFilter: 'blur(40px) saturate(200%)', WebkitBackdropFilter: 'blur(40px) saturate(200%)', border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 24, padding: '24px 20px',
    boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
  }),
  btn: (color: string) => ({
    padding: '9px 20px', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
    background: `linear-gradient(135deg,${color},${color}bb)`, color: '#fff',
  }),
  tag: (color: string) => ({
    fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const,
    padding: '3px 10px', borderRadius: 999, background: `${color}18`, color, border: `1px solid ${color}30`,
  }),
};

const TAB_ICONS = ['🏠', '🔍', '📝', '🎖️', '⚙️'];

export default function StudentDashboard({ onLogout, user }: Props) {
  const [tab, setTab] = useState('Home');
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('All');
  const [registered, setRegistered] = useState<number[]>([]);
  const [loadingReg, setLoadingReg] = useState(false);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/events')
      .then(res => res.json())
      .then(data => setEvents(data.filter((e: any) => e.status === 'Active')))
      .catch(err => console.error('Failed to load events', err));
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetch(`http://localhost:5000/api/students/${user.id}/registrations`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.eventIds) {
            setRegistered(data.eventIds);
          }
        })
        .catch(err => console.error('Failed to load registrations', err));
    }
  }, [user]);
  const [modal, setModal] = useState<any | null>(null);
  const [hovNav, setHovNav] = useState<string | null>(null);

  const initials = user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0,2).toUpperCase() : 'ST';
  const firstName = user?.name ? user.name.split(' ')[0] : 'Student';

  const filtered = events.filter(e =>
    (cat === 'All' || e.cat === cat) &&
    e.name.toLowerCase().includes(search.toLowerCase())
  );
  const myEvents = events.filter(e => registered.includes(e.id));

  const register = async (id: number) => {
    if (registered.includes(id) || loadingReg) return;
    setLoadingReg(true);
    try {
      const res = await fetch('http://localhost:5000/api/students/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: id,
          name: user?.name,
          email: user?.email,
          className: user?.class,
          year: user?.year,
          mobile_no: user?.mobile_no,
          tuf_id: user?.tuf_id
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRegistered(r => [...r, id]);
        setModal(null);
      } else {
        alert(data.error || 'Failed to register');
      }
    } catch (err) {
      alert('Registration error. Please try again.');
    } finally {
      setLoadingReg(false);
    }
  };

  return (
    <div style={g.page}>
      {/* Sidebar */}
      <div style={g.sidebar}>
        <div style={g.sideTop}>
          <div style={g.logo}>Campus<span style={g.grad}>Connect</span></div>
          <div style={g.avatar}>{initials}</div>
          <div style={g.userName}>{user?.name || 'Student Name'}</div>
          {user?.tuf_id && <div style={g.userSub}>TUF ID: {user.tuf_id}</div>}
          <div style={g.userSub}>{user?.class || 'SE COMPS-A'}</div>
        </div>
        <div style={{ padding: '16px 0', flex: 1 }}>
          {TABS.map((t, i) => (
            <div key={t}
              style={{
                ...g.navItem(tab === t),
                background: hovNav === t && tab !== t ? 'rgba(79,142,247,0.05)' : g.navItem(tab === t).background,
              }}
              onClick={() => setTab(t)}
              onMouseEnter={() => setHovNav(t)}
              onMouseLeave={() => setHovNav(null)}
            >
              <span>{TAB_ICONS[i]}</span> {t}
            </div>
          ))}
        </div>
        <div style={{ padding: '0 12px' }}>
          <button onClick={onLogout} style={{ width: '100%', padding: '10px', borderRadius: 12, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={g.main}>
        {/* Topbar */}
        <div style={g.topbar}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#f0f4ff' }}>{tab}</div>
            <div style={{ fontSize: 12, color: '#475569' }}>Student Portal · Terna Engineering College</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
            <span style={{ fontSize: 12, color: '#10b981' }}>Online</span>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#4f8ef7,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: '#fff' }}>{initials}</div>
          </div>
        </div>

        <div style={g.content}>
          {/* HOME */}
          {tab === 'Home' && (
            <div>
              <div style={g.card('rgba(20, 20, 30, 0.4)', 'rgba(255,255,255,0.08)')}>
                <h2 style={g.h2}>Welcome back, {firstName}! 👋</h2>
                <p style={{ color: '#475569', fontSize: 14 }}>Here's what's happening on campus today.</p>
              </div>
              <div style={g.grid4}>
                {[
                  { label: 'Events Available', value: events.length, color: '#4f8ef7', emoji: '📅' },
                  { label: 'Registered', value: registered.length, color: '#10b981', emoji: '✅' },
                  { label: 'Upcoming', value: events.length - registered.length, color: '#8b5cf6', emoji: '⏰' },
                  { label: 'Certificates', value: registered.length, color: '#f59e0b', emoji: '🎖️' },
                ].map((s, i) => (
                  <div key={i} style={g.statCard()}>
                    <div style={{ fontSize: 26, marginBottom: 8 }}>{s.emoji}</div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: s.color, fontFamily: 'monospace' }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f4ff', marginBottom: 16 }}>Upcoming Events</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14 }}>
                  {events.slice(0, 3).map(ev => (
                    <div key={ev.id} style={{ background: 'rgba(10,5,30,0.6)', backdropFilter: 'blur(16px)', border: `1px solid ${ev.color}25`, borderRadius: 16, padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ fontSize: 28, width: 48, height: 48, borderRadius: 14, background: `${ev.color}18`, border: `1px solid ${ev.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{ev.emoji}</div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#f0f4ff', fontSize: 14 }}>{ev.name}</div>
                        <div style={{ fontSize: 12, color: '#475569' }}>{ev.date}</div>
                        <div style={{ fontSize: 11, color: ev.color, marginTop: 2 }}>{ev.cat}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <button style={g.btn('#4f8ef7')} onClick={() => setTab('Browse Events')}>Browse Events →</button>
                <button style={g.btn('#8b5cf6')} onClick={() => setTab('My Registrations')}>My Registrations →</button>
              </div>
            </div>
          )}

          {/* BROWSE EVENTS */}
          {tab === 'Browse Events' && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <h2 style={g.h2}>Browse Events</h2>
                <p style={{ color: '#475569', fontSize: 14 }}>Find and register for events happening on campus</p>
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="🔍 Search events..."
                  style={{ flex: 1, minWidth: 220, padding: '10px 16px', borderRadius: 12, border: '1px solid rgba(79,142,247,0.2)', background: 'rgba(10,10,26,0.8)', color: '#f0f4ff', fontSize: 14, outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                {CATS.map(c => (
                  <button key={c} onClick={() => setCat(c)} style={{
                    padding: '7px 16px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    background: cat === c ? '#4f8ef7' : 'rgba(79,142,247,0.08)',
                    color: cat === c ? '#fff' : '#64748b',
                    transition: 'all 0.2s',
                  }}>{c}</button>
                ))}
              </div>
              <div style={g.grid3}>
                {filtered.map(ev => {
                  const pct = Math.round((ev.filled / ev.seats) * 100);
                  const isReg = registered.includes(ev.id);
                  return (
                    <div key={ev.id} style={{ background: 'rgba(10,5,30,0.6)', backdropFilter: 'blur(16px)', border: `1px solid ${ev.color}25`, borderRadius: 18, padding: 22, transition: 'all 0.3s' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                        <div style={{ fontSize: 26, width: 48, height: 48, borderRadius: 14, background: `${ev.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{ev.emoji}</div>
                        <span style={g.tag(ev.color)}>{ev.cat}</span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 16, color: '#f0f4ff', marginBottom: 6 }}>{ev.name}</div>
                      <div style={{ fontSize: 12, color: '#475569', marginBottom: 14 }}>📅 {ev.date} &nbsp; 📍 {ev.venue}</div>
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#475569', marginBottom: 5 }}>
                          <span>Seats: {ev.filled}/{ev.seats}</span>
                          <span style={{ color: ev.color, fontWeight: 700 }}>{pct}%</span>
                        </div>
                        <div style={{ height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 99 }}>
                          <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: ev.color }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setModal(ev)} style={{ flex: 1, padding: '9px', borderRadius: 11, border: `1px solid ${ev.color}40`, background: `${ev.color}15`, color: ev.color, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                          View Details
                        </button>
                        <button onClick={() => register(ev.id)} style={{ flex: 1, padding: '9px', borderRadius: 11, border: 'none', cursor: isReg ? 'default' : 'pointer', fontWeight: 700, fontSize: 13, background: isReg ? 'rgba(16,185,129,0.2)' : `linear-gradient(135deg,${ev.color},${ev.color}bb)`, color: isReg ? '#10b981' : '#fff' }}>
                          {isReg ? '✓ Registered' : 'Register'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#374151' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
                  <div style={{ fontSize: 16 }}>No events found</div>
                </div>
              )}
            </div>
          )}

          {/* MY REGISTRATIONS */}
          {tab === 'My Registrations' && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <h2 style={g.h2}>My Registrations</h2>
                <p style={{ color: '#475569', fontSize: 14 }}>All events you've registered for</p>
              </div>
              {myEvents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0', color: '#374151' }}>
                  <div style={{ fontSize: 56, marginBottom: 16 }}>📭</div>
                  <div style={{ fontSize: 17, color: '#64748b' }}>No registrations yet</div>
                  <button style={{ ...g.btn('#4f8ef7'), marginTop: 20 }} onClick={() => setTab('Browse Events')}>Browse Events →</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {myEvents.map(ev => (
                    <div key={ev.id} style={{ background: 'rgba(10,5,30,0.6)', backdropFilter: 'blur(16px)', border: `1px solid ${ev.color}25`, borderRadius: 18, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 18 }}>
                      <div style={{ fontSize: 28, width: 56, height: 56, borderRadius: 16, background: `${ev.color}18`, border: `1px solid ${ev.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{ev.emoji}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: '#f0f4ff', fontSize: 16 }}>{ev.name}</div>
                        <div style={{ fontSize: 12, color: '#475569', marginTop: 3 }}>📅 {ev.date} &nbsp; ⏰ {ev.time} &nbsp; 📍 {ev.venue}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                        <span style={{ padding: '5px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>✓ Confirmed</span>
                        <span style={g.tag(ev.color)}>{ev.cat}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CERTIFICATES */}
          {tab === 'Certificates' && (
            <div>
              <h2 style={{ ...g.h2, marginBottom: 24 }}>Certificates</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 18 }}>
                {myEvents.map(ev => (
                  <div key={ev.id} style={{ background: 'rgba(10,5,30,0.6)', backdropFilter: 'blur(16px)', border: `1px solid ${ev.color}35`, borderRadius: 18, padding: 24, textAlign: 'center' }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>🎖️</div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#f0f4ff', marginBottom: 6 }}>{ev.name}</div>
                    <div style={{ fontSize: 12, color: '#475569', marginBottom: 18 }}>Certificate of Participation</div>
                    <button style={g.btn(ev.color)}>Download PDF</button>
                  </div>
                ))}
                {myEvents.length === 0 && (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0', color: '#374151' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🎖️</div>
                    <div>Register for events to earn certificates</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SETTINGS */}
          {tab === 'Settings' && (
            <div>
              <h2 style={{ ...g.h2, marginBottom: 24 }}>Settings</h2>
              <div style={{ maxWidth: 500 }}>
                {[
                  { label: 'Full Name', val: user?.name || '' },
                  { label: 'TUF ID', val: user?.tuf_id || '' },
                  { label: 'Class/Year', val: user?.class || 'SE COMPS / Sem IV / Div A' },
                  { label: 'Email', val: user?.email || '' },
                ].map((f, i) => (
                  <div key={i} style={{ marginBottom: 18 }}>
                    <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>{f.label}</label>
                    <input disabled defaultValue={f.val} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(79,142,247,0.2)', background: 'rgba(10,10,26,0.8)', color: '#f0f4ff', fontSize: 14, outline: 'none', opacity: 0.7 }} title="Cannot edit these details from here." />
                  </div>
                ))}
                <button style={{ ...g.btn('#4f8ef7'), opacity: 0.5, cursor: 'not-allowed' }} disabled>Save Changes (Coming Soon)</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(5,5,16,0.85)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setModal(null)}>
          <div style={{ background: 'rgba(8,4,25,0.97)', backdropFilter: 'blur(30px)', border: `1px solid ${modal.color}40`, borderRadius: 24, padding: 36, maxWidth: 480, width: '100%' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>{modal.emoji}</div>
            <span style={g.tag(modal.color)}>{modal.cat}</span>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: '#f0f4ff', margin: '12px 0 8px' }}>{modal.name}</h3>
            <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>{modal.desc}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {[['📅', 'Date', modal.date], ['⏰', 'Time', modal.time], ['📍', 'Venue', modal.venue], ['👥', 'Seats', `${modal.filled}/${modal.seats}`]].map(([icon, label, val]) => (
                <div key={label} style={{ display: 'flex', gap: 10, fontSize: 14 }}>
                  <span>{icon}</span>
                  <span style={{ color: '#475569', minWidth: 60 }}>{label}:</span>
                  <span style={{ color: '#f0f4ff' }}>{val}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: '12px', borderRadius: 13, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#64748b', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button 
                onClick={() => register(modal.id)} 
                disabled={registered.includes(modal.id) || loadingReg}
                style={{ 
                  flex: 2, padding: '12px', borderRadius: 13, border: 'none', 
                  cursor: (registered.includes(modal.id) || loadingReg) ? 'default' : 'pointer', 
                  fontWeight: 700, fontSize: 14, 
                  background: registered.includes(modal.id) ? 'rgba(16,185,129,0.2)' : `linear-gradient(135deg,${modal.color},${modal.color}bb)`, 
                  color: registered.includes(modal.id) ? '#10b981' : '#fff',
                  opacity: loadingReg ? 0.7 : 1
                }}
              >
                {loadingReg ? 'Processing...' : registered.includes(modal.id) ? '✓ Already Registered' : 'Confirm Registration'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
