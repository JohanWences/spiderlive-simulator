import React, { useState } from 'react';
import { navigate } from '../router.jsx';
import { T } from '../theme.js';
import { GitHubIcon, REPO_URL } from '../icons.jsx';

const COOKIE_KEY = 'spiderlive-cookies';

function Toggle({ on, onChange, disabled }) {
  return (
    <button type="button" disabled={disabled} onClick={() => onChange(!on)}
      style={{
        width: 42, height: 24, borderRadius: 99, border: 'none', position: 'relative', flexShrink: 0,
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1,
        background: on ? T.blue : T.border2, transition: 'background .15s',
      }}>
      <span style={{
        position: 'absolute', top: 3, left: on ? 21 : 3, width: 18, height: 18, borderRadius: 99,
        background: '#fff', transition: 'left .15s',
      }} />
    </button>
  );
}

function CookieModal({ onClose }) {
  const [analytics, setAnalytics] = useState(false);
  const save = () => {
    try { localStorage.setItem(COOKIE_KEY, JSON.stringify({ essential: true, analytics, ts: Date.now() })); } catch {}
    onClose();
  };
  const row = (title, desc, control) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 0', borderTop: `1px solid ${T.border}` }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 14.5 }}>{title}</div>
        <div style={{ color: T.muted, fontSize: 13, marginTop: 3 }}>{desc}</div>
      </div>
      {control}
    </div>
  );
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 460, background: T.panel, border: `1px solid ${T.border2}`,
        borderRadius: 16, padding: '24px 26px', boxShadow: '0 30px 70px rgba(0,0,0,.6)',
        color: T.text, font: '15px/1.5 system-ui, sans-serif',
      }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 19, fontWeight: 800 }}>Cookie preferences</h2>
        <p style={{ margin: '0 0 8px', color: T.muted, fontSize: 14 }}>
          We use cookies to run the app and, optionally, to understand usage. Choose what to allow.
        </p>
        {row('Essential', 'Required for the app to work (session, your saved layout). Always on.', <Toggle on disabled />)}
        {row('Analytics', 'Anonymous usage stats to help us improve SpiderLive.', <Toggle on={analytics} onChange={setAnalytics} />)}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button onClick={onClose} style={{ background: T.panel2, color: T.text, border: `1px solid ${T.border2}`, borderRadius: 10, padding: '10px 18px', fontWeight: 600, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={save} style={{ background: T.grad, color: '#04121f', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 700, cursor: 'pointer' }}>
            Save preferences
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SiteFooter() {
  const [showCookies, setShowCookies] = useState(false);
  const linkStyle = { background: 'none', border: 'none', color: T.muted, cursor: 'pointer', fontSize: 13, fontWeight: 500, padding: 0 };
  const a = { color: T.muted, textDecoration: 'none', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 7 };

  return (
    <footer style={{ borderTop: `1px solid ${T.border}`, marginTop: 40 }}>
      <div style={{
        maxWidth: 1240, margin: '0 auto', padding: '22px 40px', boxSizing: 'border-box',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14,
        font: 'system-ui, sans-serif',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <a href={REPO_URL} target="_blank" rel="noopener" style={a}
            onMouseEnter={e => { e.currentTarget.style.color = T.text; }}
            onMouseLeave={e => { e.currentTarget.style.color = T.muted; }}>
            <GitHubIcon size={18} /> Open source on GitHub
          </a>
          <span style={{ color: T.faint, fontSize: 13 }}>
            Built by <a href="https://bithouse.mx" target="_blank" rel="noopener" style={{ color: T.blueLt, textDecoration: 'none', fontWeight: 600 }}>bithouse.mx</a>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <button style={linkStyle} onClick={() => navigate('/terms')}
            onMouseEnter={e => { e.currentTarget.style.color = T.text; }} onMouseLeave={e => { e.currentTarget.style.color = T.muted; }}>Terms</button>
          <button style={linkStyle} onClick={() => navigate('/privacy')}
            onMouseEnter={e => { e.currentTarget.style.color = T.text; }} onMouseLeave={e => { e.currentTarget.style.color = T.muted; }}>Privacy</button>
          <button style={linkStyle} onClick={() => setShowCookies(true)}
            onMouseEnter={e => { e.currentTarget.style.color = T.text; }} onMouseLeave={e => { e.currentTarget.style.color = T.muted; }}>Manage cookies</button>
          <span style={{ color: T.faint, fontSize: 12.5 }}>© 2026 SpiderLive</span>
        </div>
      </div>
      {showCookies && <CookieModal onClose={() => setShowCookies(false)} />}
    </footer>
  );
}
