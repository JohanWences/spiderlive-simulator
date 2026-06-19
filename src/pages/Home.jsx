import React, { useState } from 'react';
import { navigate } from '../router.jsx';
import { T } from '../theme.js';
import { useAuth, signOut } from '../auth.jsx';
import { IconPlus, IconFolder, IconGlobe, IconBook, IconLogout, IconArrowLeft, IconSearch } from '../icons.jsx';
import logo from '../assets/spiderlive-logo-v2.png';

// ---- Seed projects (a real catalog would come from disk / a backend later) ----
const PROJECTS = [
  { id: 'demo', name: 'SpiderLive Demo', path: '...\\SpiderLive\\Simulator', modified: 'opens the live simulator', go: '/simulator' },
];

const folderClip = 'polygon(0% 16%, 54% 16%, 62% 0%, 100% 0%, 100% 100%, 0% 100%)';

// ---------------- Project card (folder silhouette, blue glow on hover) ----------------
function ProjectCard({ p }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={() => navigate(p.go)} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        width: 236, height: 198, border: 'none', background: 'transparent', padding: 0,
        cursor: 'pointer', textAlign: 'left', display: 'block',
        transform: h ? 'translateY(-3px)' : 'none', transition: 'transform .14s', position: 'relative',
      }}>
      <div style={{
        position: 'absolute', inset: 0, clipPath: folderClip,
        background: h
          ? 'linear-gradient(165deg, #1c2536 0%, #11161f 100%)'
          : 'linear-gradient(165deg, #161d28 0%, #0f141d 100%)',
        boxShadow: h ? `0 14px 30px rgba(0,0,0,.5), 0 0 0 1px ${T.blue}, 0 0 26px ${T.glow}`
                     : `0 8px 18px rgba(0,0,0,.4), 0 0 0 1px ${T.border}`,
        transition: 'box-shadow .14s',
      }} />
      <div style={{ position: 'absolute', inset: 0, padding: '20px 18px 18px', boxSizing: 'border-box',
                    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <div style={{ position: 'absolute', top: 14, right: 14, opacity: h ? 1 : 0.5, transition: 'opacity .14s', color: T.blueLt }}><IconFolder size={20} /></div>
        <div style={{ fontSize: 17, fontWeight: 700, color: T.text, marginBottom: 6 }}>{p.name}</div>
        <div style={{ fontSize: 12, color: T.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.path}</div>
        <div style={{ fontSize: 11, color: T.faint, marginTop: 3 }}>{p.modified}</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.blueLt, marginTop: 8, opacity: h ? 1 : 0, transition: 'opacity .14s' }}>Open →</div>
      </div>
    </button>
  );
}

// ---------------- "New project" tile (dashed) ----------------
function NewCard() {
  const [h, setH] = useState(false);
  return (
    <button onClick={() => navigate('/simulator')} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        width: 236, height: 198, cursor: 'pointer', borderRadius: 14,
        border: `1.5px dashed ${h ? T.blue : T.border2}`, background: h ? 'rgba(47,123,246,0.06)' : 'transparent',
        color: h ? T.blueLt : T.muted, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 10, transition: 'all .14s',
      }}>
      <IconPlus size={30} />
      <span style={{ fontSize: 14, fontWeight: 600 }}>New project</span>
    </button>
  );
}

// ---------------- Sidebar item ----------------
function NavItem({ Icon, label, onClick, primary, active }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'left',
        border: primary ? 'none' : `1px solid ${h ? T.border2 : 'transparent'}`, cursor: 'pointer',
        borderRadius: 10, padding: '11px 14px', fontSize: 14.5, fontWeight: primary ? 700 : 500,
        color: primary ? '#fff' : (active ? T.text : T.muted),
        background: primary ? T.blue : (h || active ? T.panel2 : 'transparent'),
        boxShadow: primary ? `0 6px 16px ${T.glow}` : 'none', transition: 'all .12s',
      }}>
      <span style={{ width: 20, display: 'inline-flex', justifyContent: 'center' }}><Icon size={17} /></span>
      {label}
    </button>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [order, setOrder] = useState('Recent');
  let visible = PROJECTS.filter(p => p.name.toLowerCase().includes(q.trim().toLowerCase()));
  if (order === 'Name') visible = [...visible].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', background: T.bg, color: T.text,
      font: '16px/1.45 system-ui, sans-serif',
      backgroundImage: `radial-gradient(900px 500px at 75% -10%, ${T.glow} 0%, rgba(11,14,19,0) 55%)`,
    }}>
      {/* ---------------- Sidebar ---------------- */}
      <aside style={{
        width: 248, flexShrink: 0, background: T.panel, borderRight: `1px solid ${T.border}`,
        display: 'flex', flexDirection: 'column', padding: '22px 16px',
      }}>
        <button onClick={() => navigate('/')}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 6px 22px', textAlign: 'left' }}>
          <img src={logo} alt="SpiderLive" style={{ height: 34, width: 'auto', display: 'block' }} />
        </button>

        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: T.faint, textTransform: 'uppercase', padding: '0 8px 8px' }}>
          Workspace
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <NavItem Icon={IconPlus} label="New Project" primary onClick={() => navigate('/simulator')} />
          <NavItem Icon={IconFolder} label="Open" onClick={() => navigate('/simulator')} />
          <NavItem Icon={IconGlobe} label="Community" onClick={() => navigate('/community')} />
          <NavItem Icon={IconBook} label="Tutorials" onClick={() => navigate('/docs')} />
        </div>

        <div style={{ flex: 1 }} />
        <div style={{ height: 1, background: T.border, margin: '12px 6px' }} />
        {user && (
          <div style={{ padding: '4px 12px 8px' }}>
            <div style={{ fontSize: 11, color: T.faint }}>Signed in as</div>
            <div style={{ fontSize: 13, color: T.text, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
          </div>
        )}
        {user
          ? <NavItem Icon={IconLogout} label="Sign out" onClick={async () => { await signOut(); navigate('/'); }} />
          : <NavItem Icon={IconArrowLeft} label="Exit to landing" onClick={() => navigate('/')} />}
      </aside>

      {/* ---------------- Main ---------------- */}
      <main style={{ flex: 1, padding: '32px 44px', minWidth: 0, overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 26 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: -0.3 }}>Projects</h1>
            <p style={{ margin: '6px 0 0', color: T.muted, fontSize: 14 }}>Open a simulation or start a new one.</p>
          </div>
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 30 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 11, padding: '11px 16px',
                        background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 12, maxWidth: 460 }}>
            <span style={{ color: T.faint, display: 'flex' }}><IconSearch size={15} /></span>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search for a project"
              style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 14.5, width: '100%', color: T.text }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 14px',
                        background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 12 }}>
            <span style={{ color: T.muted, fontSize: 13 }}>Order by</span>
            <select value={order} onChange={e => setOrder(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontSize: 14, fontWeight: 600, color: T.text, cursor: 'pointer', outline: 'none' }}>
              <option style={{ color: '#000' }}>Recent</option>
              <option style={{ color: '#000' }}>Name</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 26 }}>
          {visible.map(p => <ProjectCard key={p.id} p={p} />)}
          {!q && <NewCard />}
          {q && !visible.length && <p style={{ color: T.muted }}>No projects match "{q}".</p>}
        </div>
      </main>
    </div>
  );
}
