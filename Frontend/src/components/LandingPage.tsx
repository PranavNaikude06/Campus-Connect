import { useState, useEffect } from 'react';
import { ScanningLogoLoader } from './LoadingScreens';

interface Props {
  onLogin: (role: 'student' | 'organizer' | 'admin', user?: any) => void;
}


// ── EventCard ─────────────────────────────────────────────────────────────────
function EventCard({ ev, i, onRegister }: { ev: any; i: number, onRegister: (ev: any) => void }) {
  const [hov, setHov] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), i * 120);
    return () => clearTimeout(t);
  }, [i]);
  const pct = ev.seats > 0 ? Math.round((ev.filled / ev.seats) * 100) : 0;
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: 'rgba(10,8,30,0.55)',
        backdropFilter: 'blur(24px)',
        border: `1px solid ${hov ? ev.color + '55' : ev.color + '25'}`,
        borderRadius: 20, padding: 24, cursor: 'pointer',
        position: 'relative', overflow: 'hidden',
        opacity: mounted ? 1 : 0,
        transform: mounted ? (hov ? 'translateY(-8px) scale(1.02)' : 'none') : 'translateY(30px)',
        transition: 'all 0.4s ease',
        boxShadow: hov ? `0 20px 60px ${ev.color}25` : 'none',
      }}
    >
      {hov && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 20, pointerEvents: 'none',
          background: `radial-gradient(circle at 50% 40%, ${ev.color}18, transparent 70%)`,
        }} />
      )}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 22,
            background: `${ev.color}20`, border: `1px solid ${ev.color}35`,
          }}>{ev.emoji}</div>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
            padding: '4px 10px', borderRadius: 999,
            background: `${ev.color}18`, color: ev.color, border: `1px solid ${ev.color}30`,
          }}>{ev.cat}</span>
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#f0f4ff', marginBottom: 6 }}>{ev.name}</div>
        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#64748b', marginBottom: 16 }}>
          <span>📅 {ev.date}</span><span>👥 {ev.filled}{ev.seats > 0 ? `/${ev.seats}` : ''}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#475569', marginBottom: 6 }}>
          <span>Registration</span>
          <span style={{ color: ev.color, fontWeight: 700 }}>{ev.seats > 0 ? `${pct}%` : 'Open'}</span>
        </div>
        <div style={{ width: '100%', height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: `linear-gradient(90deg,${ev.color},${ev.color}99)`, transition: 'width 1s ease' }} />
        </div>
        <div style={{
          maxHeight: hov ? 50 : 0,
          opacity: hov ? 1 : 0,
          marginTop: hov ? 14 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.35s ease, opacity 0.3s ease, margin-top 0.35s ease',
        }}>
          <div
            onClick={() => onRegister(ev)}
            style={{
              padding: '10px 0', borderRadius: 12, textAlign: 'center',
              fontSize: 13, fontWeight: 700,
              background: `linear-gradient(135deg,${ev.color}35,${ev.color}15)`,
              border: `1px solid ${ev.color}45`, color: ev.color, cursor: 'pointer'
            }}>
            Register Now →
          </div>
        </div>
      </div>
    </div>
  );
}


// ── LandingPage ───────────────────────────────────────────────────────────────
export default function LandingPage({ onLogin }: Props) {
  const [events, setEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'home' | 'login' | 'events' | 'student-auth' | 'admin-auth' | 'organizer-auth'>('home');
  const [registerEvent, setRegisterEvent] = useState<any | null>(null);

  useEffect(() => {
    setEventsLoading(true);
    fetch('http://localhost:5000/api/events')
      .then(r => r.json())
      .then(data => setEvents(data.filter((e: any) => e.status === 'Active')))
      .catch(console.error)
      .finally(() => setEventsLoading(false));
  }, []);
  const [regData, setRegData] = useState({ name: '', email: '', className: '', division: '', year: '', mobile_no: '', tuf_id: '' });
  const [regStatus, setRegStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [regError, setRegError] = useState('');

  // Student Auth State
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [authForm, setAuthForm] = useState({ name: '', email: '', year: '', branch: '', division: '', mobile_no: '', tuf_id: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Admin Auth State
  const [adminForm, setAdminForm] = useState({ username: '', password: '' });
  const [adminError, setAdminError] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);

  // Organizer Auth State
  const [orgForm, setOrgForm] = useState({ username: '', password: '' });
  const [orgError, setOrgError] = useState('');
  const [orgLoading, setOrgLoading] = useState(false);

  const handleRoleClick = (id: string) => {
    if (id === 'student') {
      setCurrentView('student-auth');
    } else if (id === 'admin') {
      setCurrentView('admin-auth');
    } else if (id === 'organizer') {
      setCurrentView('organizer-auth');
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setAuthLoading(true);
    try {
      if (authMode === 'reset') {
        const res = await fetch('http://localhost:5000/api/auth/student/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: authForm.email, tuf_id: authForm.tuf_id, new_password: authForm.password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to reset password');
        setAuthSuccess('Password reset successfully! Please login.');
        setTimeout(() => { setAuthMode('login'); setAuthForm({ name: '', email: '', year: '', branch: '', division: '', mobile_no: '', tuf_id: '', password: '' }); setAuthSuccess(''); }, 3000);
      } else {
        const endpoint = authMode === 'signup' ? '/api/auth/student/signup' : '/api/auth/student/login';
        const body = authMode === 'signup'
          ? { name: authForm.name, email: authForm.email, year: authForm.year, class: authForm.branch, division: authForm.division, mobile_no: authForm.mobile_no, tuf_id: authForm.tuf_id, password: authForm.password }
          : { email: authForm.email, password: authForm.password };

        const res = await fetch(`http://localhost:5000${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Authentication failed');

        // Success! Log them in
        onLogin('student', data.user || { name: authForm.name, email: authForm.email, tuf_id: authForm.tuf_id });
      }
    } catch (err: any) {
      setAuthError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    setAdminLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Admin login failed');

      onLogin('admin', data.user);
    } catch (err: any) {
      setAdminError(err.message || 'Invalid credentials');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleOrganizerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrgError('');
    setOrgLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/organizer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orgForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Organizer login failed');
      onLogin('organizer', data.organizer);
    } catch (err: any) {
      setOrgError(err.message || 'Invalid credentials');
    } finally {
      setOrgLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegStatus('loading');
    setRegError('');
    try {
      const res = await fetch('http://localhost:5000/api/students/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: registerEvent?.id, ...regData })
      });
      if (res.ok) {
        setRegStatus('success');
        setTimeout(() => { setRegisterEvent(null); setRegStatus('idle'); setRegData({ name: '', email: '', className: '', division: '', year: '', mobile_no: '', tuf_id: '' }); }, 2000);
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Connection error failed to register. Try again.');
      }
    } catch (err: any) {
      setRegStatus('error');
      setRegError(err.message || 'Connection error failed to register. Try again.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'transparent', // canvas shows through
      position: 'relative',
      overflowX: 'hidden',
    }}>

      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <nav>
        <div className="logo" onClick={() => setCurrentView('home')}>
          <svg viewBox="0 0 26 26" fill="none"><circle cx="13" cy="13" r="11" stroke="#00e5ff" strokeWidth="1.2" opacity="0.6" /><circle cx="13" cy="13" r="4.5" fill="#00e5ff" opacity="0.9" /><circle cx="13" cy="13" r="1.8" fill="#03050d" /></svg>
          Campus<span>Connect</span>
        </div>
        <ul className="nav-links">
          <li onClick={() => setCurrentView('events')}>Events</li>
        </ul>
        <button className="nav-cta" onClick={() => setCurrentView('login')}>Get Started →</button>
      </nav>

      {/* ── Views ───────────────────────────────────────────────────────── */}
      {currentView === 'home' && (
        <>
          <section className="hero" id="home">
            <div className="hero-tag"><span className="htdot"></span>Terna Engineering College · Mumbai</div>
            <h1><span className="outline">Campus</span><br /><span className="glow">Connect</span></h1>
            <p className="hero-p">One centralized portal to discover, register, and manage every college event — for students and clubs.</p>
            <div className="hero-btns">
              <button className="bp" onClick={() => setCurrentView('login')}>Get Started</button>
              <button className="bg2" onClick={() => setCurrentView('events')}>View Events</button>
            </div>
          </section>

        </>
      )}

      {currentView === 'login' && (
        <section className="sec reveal visible" id="roles" style={{
          minHeight: 'calc(100vh - 90px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '40px 24px', position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto'
        }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div className="lbl" style={{ marginBottom: '14px', background: 'rgba(0,229,255,0.05)', padding: '7px 18px', borderRadius: 999, display: 'inline-flex', border: '1px solid rgba(0,229,255,0.18)' }}>
              🔐 Choose Your Role
            </div>
            <h2 className="sh" style={{ color: '#f0f4ff' }}>Select your portal</h2>
            <p className="sp2" style={{ margin: '0 auto' }}>Three roles, one platform — pick yours and get started instantly.</p>
          </div>
          <div className="rg">
            <div className="rc s" onClick={() => handleRoleClick('student')}><div className="rc-shine"></div><div className="rc-num">01</div>
              <div className="ri">🎓</div><div className="rt">Student Login</div><div className="rb">Self-Service</div>
            </div>
            <div className="rc o" onClick={() => handleRoleClick('organizer')}><div className="rc-shine"></div><div className="rc-num">02</div>
              <div className="ri">📋</div><div className="rt">Organizer</div><div className="rb">Committee / Club</div>
            </div>
            <div className="rc a" onClick={() => handleRoleClick('admin')}><div className="rc-shine"></div><div className="rc-num">03</div>
              <div className="ri">🛡️</div><div className="rt">Admin</div><div className="rb">Master Access</div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <span onClick={() => setCurrentView('home')} style={{ color: '#556e85', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
              ← Cancel &amp; GO BACK
            </span>
          </div>
        </section>
      )}

      {currentView === 'events' && (
        <section className="sec reveal visible" style={{
          minHeight: 'calc(100vh - 90px)', display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '40px 24px', position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto'
        }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 className="sh" style={{ color: '#f0f4ff' }}>Upcoming Events</h2>
            <p className="sp2" style={{ margin: '0 auto' }}>Discover and register for the latest campus activities.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 24, width: '100%' }}>
            {events.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                No active events available right now.
              </div>
            ) : events.map(ev => {
              const pct = ev.seats > 0 ? Math.round((ev.filled / ev.seats) * 100) : 0;
              return (
                <div key={ev.id} style={{ background: 'rgba(10,5,30,0.6)', backdropFilter: 'blur(16px)', border: `1px solid ${ev.color}25`, borderRadius: 18, padding: 22, transition: 'all 0.3s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div style={{ fontSize: 26, width: 48, height: 48, borderRadius: 14, background: `${ev.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{ev.emoji}</div>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 999, background: `${ev.color}18`, color: ev.color, border: `1px solid ${ev.color}30` }}>{ev.cat}</span>
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
                  <button onClick={() => setCurrentView('login')} style={{ width: '100%', padding: '9px', borderRadius: 11, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: `linear-gradient(135deg,${ev.color},${ev.color}bb)`, color: '#fff' }}>
                    Login to Register
                  </button>
                </div>
              );
            })}
          </div>

          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <span onClick={() => setCurrentView('home')} style={{ color: '#556e85', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
              ← Cancel &amp; GO BACK
            </span>
          </div>
        </section>
      )}

      {currentView === 'student-auth' && (
        <section style={{
          minHeight: 'calc(100vh - 90px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '40px 24px 60px', position: 'relative', zIndex: 1,
        }}>
          <div style={{
            background: 'rgba(10,8,30,0.6)', backdropFilter: 'blur(24px)',
            border: `1.5px solid rgba(79,142,247,0.3)`, borderRadius: 28, padding: 40,
            maxWidth: 460, width: '100%', boxShadow: '0 24px 64px rgba(79,142,247,0.15)',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ fontSize: 42, marginBottom: 12 }}>🎓</div>
              <h2 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'monospace', color: '#f0f4ff', marginBottom: 6 }}>
                Student <span style={{ color: '#4f8ef7' }}>Portal</span>
              </h2>
              <p style={{ color: '#64748b', fontSize: 14 }}>
                {authMode === 'login' ? 'Welcome back! Please login to continue.' :
                  authMode === 'signup' ? 'Create your account to get started.' :
                    'Enter your Email and TUF ID to reset password.'}
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {authMode === 'signup' && (
                <>
                  <input required placeholder="Full Name" value={authForm.name} onChange={e => setAuthForm({ ...authForm, name: e.target.value })}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 18px', borderRadius: 12, color: '#fff', outline: 'none', fontSize: 15 }} />

                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(80px, 1fr) 2fr 1fr', gap: 12 }}>
                    <select required value={authForm.year} onChange={e => setAuthForm({ ...authForm, year: e.target.value })} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 18px', borderRadius: 12, color: '#fff', fontSize: 15, boxSizing: 'border-box' }}>
                      <option value="" style={{ background: '#0f172a' }}>Year</option>
                      <option style={{ background: '#0f172a' }}>FE</option><option style={{ background: '#0f172a' }}>SE</option><option style={{ background: '#0f172a' }}>TE</option><option style={{ background: '#0f172a' }}>BE</option>
                    </select>
                    <input required placeholder="Branch" value={authForm.branch} onChange={e => setAuthForm({ ...authForm, branch: e.target.value })}
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 18px', borderRadius: 12, color: '#fff', outline: 'none', fontSize: 15 }} />
                    <input required placeholder="Div (e.g. A)" value={authForm.division} onChange={e => setAuthForm({ ...authForm, division: e.target.value })}
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 18px', borderRadius: 12, color: '#fff', outline: 'none', fontSize: 15 }} />
                  </div>

                  <input required placeholder="Mobile Number" value={authForm.mobile_no} onChange={e => setAuthForm({ ...authForm, mobile_no: e.target.value })}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 18px', borderRadius: 12, color: '#fff', outline: 'none', fontSize: 15 }} />
                </>
              )}
              <input required type="email" placeholder="Email Address" value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 18px', borderRadius: 12, color: '#fff', outline: 'none', fontSize: 15 }} />

              {(authMode === 'signup' || authMode === 'reset') && (
                <input required placeholder="TUF ID" value={authForm.tuf_id} onChange={e => setAuthForm({ ...authForm, tuf_id: e.target.value })}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 18px', borderRadius: 12, color: '#fff', outline: 'none', fontSize: 15 }} />
              )}

              <input required type="password" placeholder={authMode === 'reset' ? "New Password" : "Password"} value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 18px', borderRadius: 12, color: '#fff', outline: 'none', fontSize: 15 }} />

              {authMode === 'login' && (
                <div style={{ textAlign: 'right' }}>
                  <span onClick={() => { setAuthMode('reset'); setAuthError(''); setAuthSuccess(''); }} style={{ color: '#4f8ef7', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>Forgot Password?</span>
                </div>
              )}

              {authError && <div style={{ color: '#ef4444', fontSize: 13, background: 'rgba(239, 68, 68, 0.1)', padding: '10px 14px', borderRadius: 8 }}>{authError}</div>}
              {authSuccess && <div style={{ color: '#10b981', fontSize: 13, background: 'rgba(16, 185, 129, 0.1)', padding: '10px 14px', borderRadius: 8 }}>{authSuccess}</div>}

              <button type="submit" disabled={authLoading} style={{
                marginTop: 8, padding: '14px', borderRadius: 12, fontWeight: 700, fontSize: 16, color: '#fff', border: 'none',
                background: `linear-gradient(135deg,#4f8ef7,#2563eb)`, cursor: authLoading ? 'wait' : 'pointer',
                boxShadow: '0 0 20px rgba(79,142,247,0.3)', opacity: authLoading ? 0.7 : 1, transition: 'all 0.2s'
              }}>
                {authLoading ? 'Please wait...' : (authMode === 'login' ? 'Login →' : authMode === 'signup' ? 'Create Account →' : 'Reset Password →')}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#64748b' }}>
              {authMode === 'login' ? "Don't have an account? " : authMode === 'signup' ? "Already have an account? " : "Remembered your password? "}
              <span
                onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthError(''); setAuthSuccess(''); setAuthForm({ name: '', email: '', year: '', branch: '', division: '', mobile_no: '', tuf_id: '', password: '' }); }}
                style={{ color: '#4f8ef7', fontWeight: 600, cursor: 'pointer' }}
              >
                {authMode === 'login' ? 'Sign up' : 'Login'}
              </span>
            </div>

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <span onClick={() => setCurrentView('login')} style={{ color: '#64748b', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
                ← Back to Roles
              </span>
            </div>
          </div>
        </section>
      )}

      {currentView === 'admin-auth' && (
        <section style={{
          minHeight: 'calc(100vh - 90px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '40px 24px 60px', position: 'relative', zIndex: 1,
        }}>
          <div style={{
            background: 'rgba(5,0,20,0.85)', backdropFilter: 'blur(24px)',
            border: `1.5px solid rgba(244,63,94,0.3)`, borderRadius: 28, padding: 40,
            maxWidth: 420, width: '100%', boxShadow: '0 24px 64px rgba(244,63,94,0.15)',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ fontSize: 42, marginBottom: 12 }}>🛡️</div>
              <h2 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'monospace', color: '#f0f4ff', marginBottom: 6 }}>
                Admin <span style={{ color: '#f43f5e' }}>Portal</span>
              </h2>
              <p style={{ color: '#64748b', fontSize: 14 }}>
                Please sign in with administrative credentials.
              </p>
            </div>

            <form onSubmit={handleAdminSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <input required placeholder="Username" value={adminForm.username} onChange={e => setAdminForm({ ...adminForm, username: e.target.value })}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 18px', borderRadius: 12, color: '#fff', outline: 'none', fontSize: 15 }} />

              <input required type="password" placeholder="Password" value={adminForm.password} onChange={e => setAdminForm({ ...adminForm, password: e.target.value })}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 18px', borderRadius: 12, color: '#fff', outline: 'none', fontSize: 15 }} />

              {adminError && <div style={{ color: '#ef4444', fontSize: 13, background: 'rgba(239, 68, 68, 0.1)', padding: '10px 14px', borderRadius: 8 }}>{adminError}</div>}

              <button type="submit" disabled={adminLoading} style={{
                marginTop: 8, padding: '14px', borderRadius: 12, fontWeight: 700, fontSize: 16, color: '#fff', border: 'none',
                background: `linear-gradient(135deg,#f43f5e,#e11d48)`, cursor: adminLoading ? 'wait' : 'pointer',
                boxShadow: '0 0 20px rgba(244,63,94,0.3)', opacity: adminLoading ? 0.7 : 1, transition: 'all 0.2s'
              }}>
                {adminLoading ? 'Authenticating...' : 'Secure Login →'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <span onClick={() => setCurrentView('login')} style={{ color: '#64748b', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
                ← Back to Roles
              </span>
            </div>
          </div>
        </section>
      )}

      {currentView === 'organizer-auth' && (
        <section style={{
          minHeight: 'calc(100vh - 90px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '40px 24px 60px', position: 'relative', zIndex: 1,
        }}>
          <div style={{
            background: 'rgba(10,8,30,0.6)', backdropFilter: 'blur(24px)',
            border: `1.5px solid rgba(139,92,246,0.3)`, borderRadius: 28, padding: 40,
            maxWidth: 460, width: '100%', boxShadow: '0 24px 64px rgba(139,92,246,0.15)',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ fontSize: 42, marginBottom: 12 }}>📋</div>
              <h2 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'monospace', color: '#f0f4ff', marginBottom: 6 }}>
                Organizer <span style={{ color: '#8b5cf6' }}>Portal</span>
              </h2>
              <p style={{ color: '#64748b', fontSize: 14 }}>
                Sign in with credentials provided by your Admin.
              </p>
            </div>

            <form onSubmit={handleOrganizerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <input required placeholder="Username" value={orgForm.username} onChange={e => setOrgForm({ ...orgForm, username: e.target.value })}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 18px', borderRadius: 12, color: '#fff', outline: 'none', fontSize: 15 }} />

              <input required type="password" placeholder="Password" value={orgForm.password} onChange={e => setOrgForm({ ...orgForm, password: e.target.value })}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 18px', borderRadius: 12, color: '#fff', outline: 'none', fontSize: 15 }} />

              {orgError && <div style={{ color: '#ef4444', fontSize: 13, background: 'rgba(239, 68, 68, 0.1)', padding: '10px 14px', borderRadius: 8 }}>{orgError}</div>}

              <button type="submit" disabled={orgLoading} style={{
                marginTop: 8, padding: '14px', borderRadius: 12, fontWeight: 700, fontSize: 16, color: '#fff', border: 'none',
                background: `linear-gradient(135deg,#8b5cf6,#6d28d9)`, cursor: orgLoading ? 'wait' : 'pointer',
                boxShadow: '0 0 20px rgba(139,92,246,0.3)', opacity: orgLoading ? 0.7 : 1, transition: 'all 0.2s'
              }}>
                {orgLoading ? 'Authenticating...' : 'Login →'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <span onClick={() => setCurrentView('home')} style={{ color: '#64748b', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
                ← Back to Roles
              </span>
            </div>
          </div>
        </section>
      )}

      {currentView === 'events' && (
        eventsLoading ? (
          <ScanningLogoLoader message="Fetching events from server..." />
        ) : (
          <section style={{ padding: '40px 24px 80px', position: 'relative', zIndex: 1 }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: 56 }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 18px', borderRadius: 999,
                  marginBottom: 14, fontSize: 13, background: 'rgba(139,92,246,0.12)',
                  border: '1px solid rgba(139,92,246,0.3)', color: '#8b5cf6',
                }}>⭐ Upcoming Events</div>
                <h2 style={{ fontSize: 'clamp(1.8rem,5vw,3rem)', fontWeight: 800, fontFamily: 'monospace', color: '#f0f4ff', marginBottom: 12 }}>
                  Don't Miss Out
                </h2>
                <p style={{ color: '#64748b', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
                  Register for the most exciting campus events before seats run out
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 20, alignItems: 'start' }}>
                {events.length === 0 && <div style={{ color: '#64748b' }}>No active events found.</div>}
                {events.map((ev, i) => <EventCard key={ev.id} ev={ev} i={i} onRegister={setRegisterEvent} />)}
              </div>

              {/* Registration Modal Popup */}
              {registerEvent && (
                <div style={{
                  position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(5,0,16,0.8)', backdropFilter: 'blur(8px)', padding: 24
                }}>
                  <div style={{
                    background: 'rgba(15,12,41,0.95)', border: `1px solid ${registerEvent.color}55`, borderRadius: 24, padding: '32px 40px',
                    width: '100%', maxWidth: 500, boxShadow: `0 30px 60px rgba(0,0,0,0.5), 0 0 40px ${registerEvent.color}20`,
                    position: 'relative'
                  }}>
                    <div style={{ position: 'absolute', top: 20, right: 24, fontSize: 24, color: '#64748b', cursor: 'pointer' }} onClick={() => setRegisterEvent(null)}>×</div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${registerEvent.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{registerEvent.emoji}</div>
                      <div>
                        <div style={{ fontSize: 12, color: registerEvent.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Register For</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#f0f4ff' }}>{registerEvent.name}</div>
                      </div>
                    </div>

                    {regStatus === 'success' ? (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: '#10b981' }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
                        <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Registered Successfully!</h3>
                        <p style={{ color: '#94a3b8' }}>Check your email for further instructions.</p>
                      </div>
                    ) : (
                      <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                          <input required placeholder="Full Name" value={regData.name} onChange={e => setRegData({ ...regData, name: e.target.value })} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: 12, color: '#fff', outline: 'none' }} />
                          <input required type="email" placeholder="Email ID" value={regData.email} onChange={e => setRegData({ ...regData, email: e.target.value })} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: 12, color: '#fff', outline: 'none' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(80px, 1fr) 2fr 1fr', gap: 16 }}>
                          <select required value={regData.year} onChange={e => setRegData({ ...regData, year: e.target.value })} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: 12, color: '#fff', outline: 'none', boxSizing: 'border-box' }}>
                            <option value="" style={{ background: '#0f172a' }}>Year</option>
                            <option style={{ background: '#0f172a' }}>FE</option><option style={{ background: '#0f172a' }}>SE</option><option style={{ background: '#0f172a' }}>TE</option><option style={{ background: '#0f172a' }}>BE</option>
                          </select>
                          <input required placeholder="Branch" value={regData.className} onChange={e => setRegData({ ...regData, className: e.target.value })} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: 12, color: '#fff', outline: 'none' }} />
                          <input required placeholder="Div (e.g. A)" value={regData.division} onChange={e => setRegData({ ...regData, division: e.target.value })} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: 12, color: '#fff', outline: 'none' }} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                          <input required placeholder="Mobile No." value={regData.mobile_no} onChange={e => setRegData({ ...regData, mobile_no: e.target.value })} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: 12, color: '#fff', outline: 'none' }} />
                          <input required placeholder="TUF ID" value={regData.tuf_id} onChange={e => setRegData({ ...regData, tuf_id: e.target.value })} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: 12, color: '#fff', outline: 'none' }} />
                        </div>

                        {regStatus === 'error' && <div style={{ color: '#ef4444', fontSize: 14 }}>{regError}</div>}

                        <button type="submit" disabled={regStatus === 'loading'} style={{
                          marginTop: 8, padding: '14px', borderRadius: 12, fontWeight: 700, fontSize: 16, color: '#fff', border: 'none',
                          background: `linear-gradient(135deg,${registerEvent.color},${registerEvent.color}dd)`, cursor: regStatus === 'loading' ? 'wait' : 'pointer',
                          boxShadow: `0 0 20px ${registerEvent.color}40`, opacity: regStatus === 'loading' ? 0.7 : 1
                        }}>
                          {regStatus === 'loading' ? 'Processing...' : 'Confirm Registration'}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        )
      )}

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer>
        <div className="flogo">Campus<span>Connect</span></div>
        <p>© 2025 Terna Engineering College · All rights reserved</p>
        <ul className="flinks">
          <li><a href="#">Privacy</a></li>
          <li><a href="#">Terms</a></li>
          <li><a href="#">Contact</a></li>
        </ul>
      </footer>
    </div>
  );
}
