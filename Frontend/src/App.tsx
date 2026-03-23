import { useState } from 'react';
import ParticleBackground from './components/ParticleBackground';
import LandingPage from './components/LandingPage';
import StudentDashboard from './components/StudentDashboard';
import OrganizerDashboard from './components/OrganizerDashboard';
import AdminDashboard from './components/AdminDashboard';

type Role = 'student' | 'organizer' | 'admin' | null;

export default function App() {
  const [role, setRole] = useState<Role>(null);
  const [user, setUser] = useState<any>(null);
  const [opacity, setOpacity] = useState(1);
  const [fading, setFading] = useState(false);

  const handleLogin = (selectedRole: 'student' | 'organizer' | 'admin', loggedInUser?: any) => {
    setFading(true);
    setOpacity(0);
    setTimeout(() => {
      setRole(selectedRole);
      if (loggedInUser) setUser(loggedInUser);
      setOpacity(1);
      setFading(false);
    }, 500);
  };

  const handleLogout = () => {
    setFading(true);
    setOpacity(0);
    setTimeout(() => {
      setRole(null);
      setUser(null);
      setOpacity(1);
      setFading(false);
    }, 500);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'transparent',
      position: 'relative',
    }}>
      {/* 3D Canvas — fixed behind everything */}
      <ParticleBackground />

      {/* Page content */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        opacity,
        transition: 'opacity 0.5s ease',
        pointerEvents: fading ? 'none' : 'auto',
        minHeight: '100vh',
      }}>
        {role === null      && <LandingPage onLogin={handleLogin} />}
        {role === 'student'   && <StudentDashboard user={user} onLogout={handleLogout} />}
        {role === 'organizer' && <OrganizerDashboard user={user} onLogout={handleLogout} />}
        {role === 'admin'     && <AdminDashboard onLogout={handleLogout} />}
      </div>
    </div>
  );
}
