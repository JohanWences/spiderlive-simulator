import React, { useState } from 'react';
import { navigate } from '../router.jsx';
import { T } from '../theme.js';
import SiteFooter from './SiteFooter.jsx';
import { IconComponents, IconSearch, IconStar } from '../icons.jsx';
import logo from '../assets/spiderlive-logo-blue.png';

const CATEGORIES = ['All', 'Pneumatics', 'Electrical', 'Education', 'Showcase'];

// Seed marketplace items (real community uploads will come later).
const PROJECTS = [
  { id: 'conveyor', title: '6-Cylinder Conveyor Sorter', author: 'Ana R.', cat: 'Pneumatics', grad: 'linear-gradient(135deg,#2f7bf6,#37e0c8)', stars: 142, uses: 980, desc: 'Pick-and-place sorting line driven by a 12-step sequence.' },
  { id: 'traffic', title: 'Traffic Light PLC', author: 'Diego M.', cat: 'Electrical', grad: 'linear-gradient(135deg,#e3b341,#e5534b)', stars: 98, uses: 640, desc: 'Classic 3-phase intersection with pedestrian crossing.' },
  { id: 'press', title: 'Hydraulic Press Cycle', author: 'María L.', cat: 'Showcase', grad: 'linear-gradient(135deg,#7a5cff,#2f7bf6)', stars: 211, uses: 1530, desc: 'Two-hand safety start, clamp, press and eject.' },
  { id: 'elevator', title: '3-Floor Elevator', author: 'Kenji T.', cat: 'Education', grad: 'linear-gradient(135deg,#37e0c8,#2ec27e)', stars: 76, uses: 410, desc: 'Call buttons, door logic and floor sensors — great for class.' },
  { id: 'bottling', title: 'Bottling Filler', author: 'Sofía P.', cat: 'Pneumatics', grad: 'linear-gradient(135deg,#2f7bf6,#5b9bff)', stars: 134, uses: 870, desc: 'Indexing table, fill valve and capper in sync.' },
  { id: 'robotarm', title: 'Pneumatic Robot Arm', author: 'Omar V.', cat: 'Showcase', grad: 'linear-gradient(135deg,#e5534b,#7a5cff)', stars: 188, uses: 1190, desc: '4-axis arm built from double-acting cylinders.' },
];

function Card({ p }) {
  const [h, setH] = useState(false);
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        background: T.panel2, border: `1px solid ${h ? T.border2 : T.border}`, borderRadius: 16, overflow: 'hidden',
        transform: h ? 'translateY(-3px)' : 'none', transition: 'transform .14s, border-color .14s, box-shadow .14s',
        boxShadow: h ? '0 16px 34px rgba(0,0,0,.45)' : 'none', display: 'flex', flexDirection: 'column',
      }}>
      <div style={{ height: 116, background: p.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        <IconComponents size={38} />
      </div>
      <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: T.cyan, textTransform: 'uppercase', letterSpacing: 0.6 }}>{p.cat}</span>
          <span style={{ fontSize: 12, color: T.faint, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <IconStar size={11} /> {p.stars} · {p.uses} uses
          </span>
        </div>
        <h3 style={{ margin: '8px 0 4px', fontSize: 16, fontWeight: 700 }}>{p.title}</h3>
        <p style={{ margin: '0 0 12px', fontSize: 13, color: T.muted, flex: 1 }}>{p.desc}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.muted }}>
            <span style={{ width: 22, height: 22, borderRadius: 99, background: T.border2, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: T.text }}>
              {p.author[0]}
            </span>
            {p.author}
          </span>
          <button onClick={() => navigate('/simulator')}
            style={{ background: T.grad, color: '#04121f', border: 'none', borderRadius: 9, padding: '7px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Open
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Community() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const ql = q.trim().toLowerCase();
  const visible = PROJECTS.filter(p =>
    (cat === 'All' || p.cat === cat) &&
    (!ql || p.title.toLowerCase().includes(ql) || p.author.toLowerCase().includes(ql)));

  return (
    <div style={{
      minHeight: '100vh', background: T.bg, color: T.text, font: '16px/1.5 system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
      backgroundImage: `radial-gradient(1000px 520px at 80% -8%, ${T.glow} 0%, rgba(11,14,19,0) 55%)`,
    }}>
      {/* nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 32px', borderBottom: `1px solid ${T.border}`,
      }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <img src={logo} alt="SpiderLive" style={{ height: 38 }} />
        </button>
        <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
          <button onClick={() => navigate('/docs')} style={{ background: 'none', color: T.muted, border: 'none', cursor: 'pointer', fontSize: 14.5, fontWeight: 600 }}>Docs</button>
          <button onClick={() => navigate('/home')} style={{ background: T.panel2, color: T.text, border: `1px solid ${T.border2}`, borderRadius: 11, padding: '9px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>My workspace</button>
        </div>
      </nav>

      <main style={{ flex: 1, maxWidth: 1180, width: '100%', margin: '0 auto', boxSizing: 'border-box', padding: '40px 32px' }}>
        {/* header */}
        <p style={{ color: T.cyan, fontWeight: 700, fontSize: 12.5, letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 8px' }}>Community</p>
        <h1 style={{ fontSize: 34, fontWeight: 800, margin: '0 0 10px', letterSpacing: -0.5 }}>Explore creations from the community</h1>
        <p style={{ color: T.muted, fontSize: 16, margin: '0 0 22px', maxWidth: 620 }}>
          Open, learn from and remix circuits built by other makers.
        </p>

        <div style={{ display: 'inline-block', fontSize: 12.5, color: T.blueLt, background: 'rgba(47,123,246,0.1)', border: `1px solid ${T.border2}`, borderRadius: 999, padding: '6px 13px', marginBottom: 26 }}>
          Community publishing is coming soon — these are sample creations.
        </div>

        {/* toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240, maxWidth: 420, display: 'flex', alignItems: 'center', gap: 11, padding: '11px 16px', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 12 }}>
            <span style={{ color: T.faint, display: 'flex' }}><IconSearch size={15} /></span>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search creations or makers"
              style={{ border: 'none', outline: 'none', background: 'transparent', color: T.text, fontSize: 14.5, width: '100%' }} />
          </div>
        </div>

        {/* category chips */}
        <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginBottom: 28 }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCat(c)}
              style={{
                background: cat === c ? T.blue : T.panel2, color: cat === c ? '#fff' : T.muted,
                border: `1px solid ${cat === c ? T.blue : T.border}`, borderRadius: 999, padding: '7px 16px',
                fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
              }}>
              {c}
            </button>
          ))}
        </div>

        {/* grid */}
        {visible.length ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 22 }}>
            {visible.map(p => <Card key={p.id} p={p} />)}
          </div>
        ) : (
          <p style={{ color: T.muted }}>No creations match your search.</p>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
