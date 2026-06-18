import React from 'react';
import { navigate } from '../router.jsx';
import { T } from '../theme.js';
import logo from '../assets/spiderlive-logo-blue.png';
import SiteFooter from './SiteFooter.jsx';

// Shared layout for Terms / Privacy / Cookies. `sections` = [{ h, p: [paragraph, ...] }].
export default function LegalShell({ title, updated, intro, sections }) {
  return (
    <div style={{
      minHeight: '100vh', background: T.bg, color: T.text, font: '16px/1.7 system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
      backgroundImage: `radial-gradient(900px 460px at 88% -8%, ${T.glow} 0%, rgba(11,14,19,0) 52%)`,
    }}>
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 32px', borderBottom: `1px solid ${T.border}`,
      }}>
        <button onClick={() => navigate('/spiderlive')} style={{ background: 'none', border: 'none', cursor: 'pointer' }} title="Back to home">
          <img src={logo} alt="SpiderLive" style={{ height: 38 }} />
        </button>
        <button onClick={() => navigate('/docs')}
          style={{ background: T.panel2, color: T.text, border: `1px solid ${T.border2}`, borderRadius: 11, padding: '9px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          Docs
        </button>
      </nav>

      <main style={{ flex: 1, maxWidth: 820, width: '100%', margin: '0 auto', padding: '48px 32px', boxSizing: 'border-box' }}>
        <h1 style={{ fontSize: 38, fontWeight: 800, margin: '0 0 8px', letterSpacing: -0.6 }}>{title}</h1>
        <p style={{ color: T.faint, fontSize: 14, margin: '0 0 28px' }}>Last updated: {updated}</p>

        <p style={{ color: '#c7cfda', fontSize: 16.5, margin: '0 0 30px' }}>{intro}</p>

        {sections.map((s, i) => (
          <section key={i} style={{ marginBottom: 30 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 12px' }}>{i + 1}. {s.h}</h2>
            {s.p.map((para, j) => (
              <p key={j} style={{ color: '#aeb7c2', fontSize: 15.5, margin: '0 0 12px' }}>{para}</p>
            ))}
          </section>
        ))}

        <div style={{ marginTop: 36, padding: '14px 16px', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 12, color: T.muted, fontSize: 13.5 }}>
          This document is a plain-language template provided for transparency and is not legal advice.
          For a binding agreement, have it reviewed by qualified counsel. Questions:{' '}
          <a href="mailto:contacto@bithouse.mx" style={{ color: T.blueLt, textDecoration: 'none' }}>contacto@bithouse.mx</a>.
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
