

// ── Design 1: Orbital Ring ── (Auth / initial load)
export function OrbitalRingLoader({ message = 'Authenticating...' }: { message?: string }) {
  return (
    <div className="loader-overlay">
      <div className="d1">
        <div className="d1-ring">
          <svg width="90" height="90" viewBox="0 0 90 90">
            <circle cx="45" cy="45" r="38" fill="none" stroke="rgba(0,229,255,0.08)" strokeWidth="2"/>
            <circle cx="45" cy="45" r="38" fill="none" stroke="#00e5ff" strokeWidth="2" strokeLinecap="round"
              strokeDasharray="60 180" strokeDashoffset="0"/>
            <circle cx="45" cy="45" r="28" fill="none" stroke="rgba(0,229,255,0.05)" strokeWidth="1"/>
            <circle cx="45" cy="45" r="28" fill="none" stroke="rgba(0,229,255,0.4)" strokeWidth="1"
              strokeDasharray="30 150" strokeDashoffset="90"/>
          </svg>
          <div className="d1-logo">CC</div>
        </div>
        <div className="d1-text">
          <h2>Campus<span>Connect</span></h2>
          <p>{message}</p>
        </div>
        <div className="d1-dots"><span></span><span></span><span></span></div>
      </div>
    </div>
  );
}

// ── Design 2: Progress Bar ── (Dashboard data loading)
export function ProgressBarLoader({ message = 'Loading your dashboard...' }: { message?: string }) {
  return (
    <div className="loader-overlay">
      <div className="d2">
        <div>
          <div className="d2-logo">Campus<span>Connect</span></div>
          <div className="d2-sub">Terna Engineering College</div>
        </div>
        <div className="d2-bar-wrap">
          <div className="d2-label"><span>Loading data</span><span className="pct">—</span></div>
          <div className="d2-track"><div className="d2-fill"></div></div>
        </div>
        <div className="d2-msg">{message}</div>
      </div>
    </div>
  );
}

// ── Design 3: Scanning Logo ── (View Events cold-start)
export function ScanningLogoLoader({ message = 'Connecting to server...' }: { message?: string }) {
  return (
    <div className="loader-overlay">
      <div className="d3">
        <div className="d3-icon">
          <svg viewBox="0 0 26 26" width="72" height="72" fill="none">
            <circle cx="13" cy="13" r="11" stroke="#00e5ff" strokeWidth="1.2" opacity="0.6"/>
            <circle cx="13" cy="13" r="4.5" fill="#00e5ff" opacity="0.9"/>
            <circle cx="13" cy="13" r="1.8" fill="#03050d"/>
          </svg>
        </div>
        <div className="d3-name">Campus<span>Connect</span></div>
        <div className="d3-scan"></div>
        <div className="d3-tag">{message}</div>
      </div>
    </div>
  );
}

