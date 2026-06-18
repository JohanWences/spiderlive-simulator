import React from 'react';
import { navigate } from '../router.jsx';
import { T } from '../theme.js';
import SimPreview from './SimPreview.jsx';
import SiteFooter from './SiteFooter.jsx';
import { GitHubIcon, REPO_URL } from '../icons.jsx';
import logo from '../assets/spiderlive-logo-blue.png';

const ghost = {
  background: T.panel2, color: T.text, border: `1px solid ${T.border2}`, borderRadius: 12,
  padding: '13px 24px', fontWeight: 600, fontSize: 15, cursor: 'pointer', transition: 'background .12s',
};

export default function Landing() {
  return (
    <div style={{
      minHeight: '100vh', background: T.bg, color: T.text, overflow: 'hidden',
      font: '16px/1.5 system-ui, sans-serif', display: 'flex', flexDirection: 'column',
      // blue glow + faint dot grid across the whole page → the canvas blends into it
      backgroundImage: `radial-gradient(1100px 600px at 78% 2%, ${T.glow} 0%, rgba(11,14,19,0) 56%),
                        radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)`,
      backgroundSize: 'auto, 24px 24px',
    }}>
      {/* ---------------- minimal nav ---------------- */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '22px 40px', maxWidth: 1320, width: '100%', margin: '0 auto', boxSizing: 'border-box', zIndex: 2,
      }}>
        <img src={logo} alt="SpiderLive" style={{ height: 46, width: 'auto' }} />
        <div style={{ display: 'flex', gap: 22, alignItems: 'center' }}>
          <button onClick={() => navigate('/docs')}
            style={{ background: 'transparent', color: T.muted, border: 'none', cursor: 'pointer', fontSize: 14.5, fontWeight: 600 }}>
            Docs
          </button>
          <button onClick={() => navigate('/signin')}
            style={{ background: 'transparent', color: T.text, border: 'none', cursor: 'pointer', fontSize: 14.5, fontWeight: 600 }}>
            Sign in
          </button>
          <button onClick={() => navigate('/signup')}
            style={{
              background: T.grad, color: '#04121f', border: 'none', borderRadius: 11,
              padding: '10px 20px', fontSize: 14.5, fontWeight: 700, cursor: 'pointer',
              boxShadow: `0 6px 18px ${T.glow}`,
            }}>
            Sign up
          </button>
        </div>
      </nav>

      {/* ---------------- two-column hero ---------------- */}
      <main style={{
        flex: 1, width: '100%', maxWidth: 1320, margin: '0 auto', boxSizing: 'border-box',
        padding: '0 40px', display: 'flex', flexWrap: 'wrap', alignItems: 'center',
        gap: 24, justifyContent: 'center',
      }}>
        {/* left — copy */}
        <div style={{ flex: '1 1 380px', minWidth: 320, maxWidth: 540, zIndex: 2, padding: '24px 0' }}>
          <a href={REPO_URL} target="_blank" rel="noopener" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 22, textDecoration: 'none',
            fontSize: 13, fontWeight: 600, color: T.text,
            background: T.panel2, border: `1px solid ${T.border2}`, borderRadius: 999, padding: '7px 14px',
          }}>
            <GitHubIcon size={15} /> Open source · MIT <span style={{ color: T.cyan }}>↗</span>
          </a>
          <h1 style={{ fontSize: 'clamp(34px, 4.6vw, 58px)', fontWeight: 800, lineHeight: 1.05, margin: '0 0 20px', letterSpacing: -1 }}>
            Build, wire and run<br />
            <span style={{ background: T.grad, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
              automation that comes alive.
            </span>
          </h1>

          <p style={{ fontSize: 18, color: T.muted, margin: '0 0 36px', maxWidth: 480 }}>
            A PLC-driven pneumatic circuit you can design, animate and truly understand —
            right in your browser. No installs, no hardware.
          </p>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <button style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
              onClick={() => navigate('/simulator')}>
              <span style={{
                display: 'inline-block', background: T.grad, color: '#04121f', fontWeight: 700,
                fontSize: 15, borderRadius: 12, padding: '14px 28px', boxShadow: `0 10px 28px ${T.glow}`,
              }}>
                ▶ Launch Simulator
              </span>
            </button>
            <button style={ghost}
              onMouseEnter={e => { e.currentTarget.style.background = T.border; }}
              onMouseLeave={e => { e.currentTarget.style.background = T.panel2; }}
              onClick={() => navigate('/home')}>
              Browse Projects
            </button>
          </div>
        </div>

        {/* right — live canvas, frameless, blended into the background, pannable */}
        <div style={{
          flex: '1.3 1 540px', minWidth: 340, alignSelf: 'stretch', position: 'relative',
          marginRight: -40,                            // bleed toward the viewport edge
        }}>
          <div style={{
            position: 'absolute', inset: 0, minHeight: 460,
            // fade the canvas into the page at every edge → "part of the background"
            WebkitMaskImage: 'radial-gradient(125% 115% at 52% 48%, #000 48%, transparent 100%)',
            maskImage: 'radial-gradient(125% 115% at 52% 48%, #000 48%, transparent 100%)',
          }}>
            <SimPreview modules={3} />
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
