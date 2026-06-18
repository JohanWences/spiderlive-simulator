import React from 'react';
import { navigate } from '../router.jsx';
import { T } from '../theme.js';
import logo from '../assets/spiderlive-logo-blue.png';

export function Field({ label, type = 'text', value, onChange, placeholder, autoComplete }) {
  return (
    <label style={{ display: 'block', marginBottom: 16 }}>
      <span style={{ display: 'block', fontSize: 13, color: T.muted, marginBottom: 7, fontWeight: 600 }}>{label}</span>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete} required
        style={{
          width: '100%', boxSizing: 'border-box', padding: '12px 14px', fontSize: 14.5,
          background: T.panel2, border: `1px solid ${T.border2}`, borderRadius: 11, color: T.text, outline: 'none',
        }}
        onFocus={e => { e.target.style.borderColor = T.blue; }}
        onBlur={e => { e.target.style.borderColor = T.border2; }} />
    </label>
  );
}

export const primaryBtn = {
  width: '100%', background: T.grad, color: '#04121f', fontWeight: 700, fontSize: 15,
  border: 'none', borderRadius: 12, padding: '13px', cursor: 'pointer', marginTop: 6, boxShadow: `0 8px 22px ${T.glow}`,
};

export const linkBtn = { background: 'none', border: 'none', color: T.blueLt, fontWeight: 600, cursor: 'pointer', fontSize: 14, padding: 0 };

export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div style={{
      minHeight: '100vh', background: T.bg, color: T.text, font: '16px/1.5 system-ui, sans-serif',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px',
      backgroundImage: `radial-gradient(900px 500px at 50% -12%, ${T.glow} 0%, rgba(11,14,19,0) 60%),
                        radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)`,
      backgroundSize: 'auto, 24px 24px',
    }}>
      <div style={{ width: '100%', maxWidth: 404 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            title="Back to home">
            <img src={logo} alt="SpiderLive" style={{ height: 40 }} />
          </button>
        </div>
        <div style={{
          background: T.panel, border: `1px solid ${T.border}`, borderRadius: 18, padding: '32px 30px',
          boxShadow: '0 24px 60px rgba(0,0,0,.5)',
        }}>
          <h1 style={{ fontSize: 23, fontWeight: 800, margin: '0 0 6px', textAlign: 'center' }}>{title}</h1>
          <p style={{ fontSize: 14, color: T.muted, margin: '0 0 24px', textAlign: 'center' }}>{subtitle}</p>
          {children}
        </div>
        <div style={{ textAlign: 'center', marginTop: 18, fontSize: 14, color: T.muted }}>{footer}</div>
      </div>
    </div>
  );
}
