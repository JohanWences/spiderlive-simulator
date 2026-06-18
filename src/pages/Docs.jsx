import React, { useMemo, useState } from 'react';
import { navigate } from '../router.jsx';
import { T } from '../theme.js';
import { GitHubIcon, REPO_URL, IconSearch, IconPlay } from '../icons.jsx';
import SiteFooter from './SiteFooter.jsx';
import logo from '../assets/spiderlive-logo-blue.png';

// ------- content model: blocks → { t:'h2'|'p'|'code'|'ul'|'note', x } -------
const DOCS = [
  {
    group: 'Getting started',
    items: [
      {
        id: 'introduction', title: 'Introduction',
        blocks: [
          { t: 'p', x: 'SpiderLive is an open-source, electro-pneumatic web simulator. It models a fairground "flying spider" ride: six pneumatic cylinders driven by a SPI-DRY UTM-S9-MEC PLC running a verified 22-step sequence — all in the browser, with no installs and no hardware.' },
          { t: 'p', x: 'Every component is a node with ports, and every wire — electrical and pneumatic — is an edge that re-routes itself as you move things around. This guide grows alongside the platform.' },
          { t: 'h2', x: 'What you can do' },
          { t: 'ul', x: ['Run the full PLC sequence and watch sensors, air and power animate along the wires.', 'Rearrange nodes and reshape wires; your layout is saved locally.', 'Hover any component for its documentation and a manufacturer reference.'] },
          { t: 'note', x: 'SpiderLive is for learning and demonstration. It is not a substitute for certified engineering tools or real-world safety testing.' },
        ],
      },
      {
        id: 'installation', title: 'Installation',
        blocks: [
          { t: 'p', x: 'You can use the hosted app directly, or run it locally. SpiderLive is built with React, Vite and React Flow, so you only need Node.js.' },
          { t: 'h2', x: 'Run it locally' },
          { t: 'code', x: 'git clone https://github.com/JohanWences/spiderlive-simulator\ncd spiderlive-simulator\nnpm install\nnpm run dev' },
          { t: 'p', x: 'The dev server starts at http://localhost:5173. For a static build ready to publish:' },
          { t: 'code', x: 'npm run build     # generates /dist\nnpm run preview   # serves /dist locally' },
        ],
      },
      {
        id: 'the-interface', title: 'The interface',
        blocks: [
          { t: 'p', x: 'The simulator fills the screen. The badge top-left shows status, the current step and the mode. The bottom toolbar holds the run controls. The panel on the right is live documentation that highlights the component you hover.' },
          { t: 'h2', x: 'Edit vs Simulation' },
          { t: 'p', x: 'Use the Edit / Simulation toggle to switch between a frozen, lightweight view (good for arranging the circuit) and the live animation where flow lights up along the wires.' },
        ],
      },
    ],
  },
  {
    group: 'Using the simulator',
    items: [
      {
        id: 'running', title: 'Running a simulation',
        blocks: [
          { t: 'p', x: 'The bottom toolbar drives the installation:' },
          { t: 'ul', x: ['START — begins the 22-step sequence.', 'STOP — halts the sequence; legs return down.', 'E-STOP — latches an emergency stop (press again to release).', 'Reset — returns every cylinder to its retracted position.', 'Arrange — restores the default layout.'] },
          { t: 'p', x: 'You can also click the START, STOP and emergency buttons directly on the panel inside the canvas.' },
        ],
      },
      {
        id: 'components', title: 'Components',
        blocks: [
          { t: 'p', x: 'The circuit is built from these nodes:' },
          { t: 'ul', x: ['SPI-DRY UTM-S9-MEC PLC (CPU 231043) — 14 DI / 10 DO, runs the ladder program.', 'Six double-acting cylinders with 5/2 single-solenoid valves and a0/a1 reed switches.', 'Push buttons and a latching emergency mushroom button.', 'Pneumatic supply: compressor, tank, FRL and gauge (6 bar).', '24 VDC power supply and a signal tower (green = running, red = emergency).'] },
          { t: 'note', x: 'Hover any node in the simulator to open its documentation card with a link to the manufacturer.' },
        ],
      },
      {
        id: 'wiring', title: 'Wiring & layout',
        blocks: [
          { t: 'p', x: 'Drag any node to move it — connected wires re-route automatically. Drag a wire segment to reshape its path, or double-click a wire to reset it.' },
          { t: 'h2', x: 'Saved layout' },
          { t: 'p', x: 'Your node positions and custom wire paths are stored in your browser, so the circuit looks the same next time. Use Arrange to return to the default layout.' },
          { t: 'h2', x: 'Selection' },
          { t: 'p', x: 'Drag on empty canvas to select: left-to-right encloses (blue window), right-to-left crosses (green) — the same convention as CAD tools.' },
        ],
      },
    ],
  },
  {
    group: 'Connect a real PLC',
    items: [
      {
        id: 'requirements', title: 'What you need',
        blocks: [
          { t: 'p', x: 'The simulator on its own needs nothing — just open the web app and the built-in 22-step demo runs in your browser. To drive the plant with YOUR own PLC program, SpiderLive connects to OpenPLC over Modbus through a small local bridge. For that "connected" mode you need:' },
          { t: 'ul', x: [
            'Node.js 18+ — to run the bridge (download from nodejs.org).',
            'OpenPLC Runtime — the server app that runs your program and speaks Modbus TCP (openplcproject.com). Note: the Editor\'s built-in "OpenPLC Simulator" is a closed test loop and cannot connect to external I/O — you need the Runtime.',
            'OpenPLC Editor — to write your ladder / Structured Text program (skip if you already have one).',
          ] },
          { t: 'note', x: 'Standalone mode (the built-in demo) requires no installs at all. The tools above are only for connecting your own OpenPLC program.' },
        ],
      },
      {
        id: 'the-bridge', title: 'The bridge',
        blocks: [
          { t: 'p', x: 'The SpiderLive Bridge links OpenPLC (Modbus TCP) to the SpiderLive browser (WebSocket). No clone needed — run it with npx:' },
          { t: 'code', x: 'npx spiderlive-bridge' },
          { t: 'p', x: 'It starts a Modbus TCP slave on port 502 (OpenPLC connects here) and a WebSocket server on port 8080 (the browser connects here). Leave it running while you work.' },
          { t: 'h2', x: 'I/O map' },
          { t: 'ul', x: [
            'Coils 0–5 → cylinder solenoids (Q0.0–Q0.5); coils 6–7 → signal tower (Q0.6–Q0.7).',
            'Discrete inputs 0–3 → START / STOP 1 / STOP 2 / EMERGENCY (I0.0–I0.3).',
            'Discrete inputs 4–9 → a1 sensors (extended); 10–15 → a0 sensors (retracted).',
          ] },
        ],
      },
      {
        id: 'connect-openplc', title: 'Connecting OpenPLC',
        blocks: [
          { t: 'p', x: 'First, give each program variable a physical address in its Location field — for example Inicio at %IX0.0 (a digital input) and Salida at %QX0.0 (a digital output). A variable with no Location is internal only and nothing outside can read or write it.' },
          { t: 'p', x: 'Then, in OpenPLC Runtime, add a Slave Device pointing at the bridge:' },
          { t: 'ul', x: [
            'Protocol Modbus TCP · IP 127.0.0.1 · Port 502 · Slave ID 1',
            'Discrete Inputs: start 0, size 16 → mapped to %I (buttons + sensors).',
            'Coils: start 0, size 8 → mapped to %Q (solenoids + tower).',
          ] },
          { t: 'p', x: 'Run your program. Every scan OpenPLC polls the bridge: it reads your buttons/sensors into %I and writes your outputs from %Q — and SpiderLive reacts in real time.' },
          { t: 'note', x: 'Binding canvas elements to specific Modbus addresses from inside SpiderLive is on the way; for now the bridge uses the fixed map above.' },
        ],
      },
    ],
  },
  {
    group: 'Reference',
    items: [
      {
        id: 'sequence', title: 'The 22-step sequence',
        blocks: [
          { t: 'p', x: 'The PLC program is a port of a verified Structured Text program with 22 steps, grouped into three modes:' },
          { t: 'ul', x: ['Steps 1–12 — Mode 1: one cylinder at a time (extend then retract, A through F).', 'Steps 13–18 — Mode 2: cylinders move in pairs.', 'Steps 19–22 — Mode 3: cylinders move in trios.'] },
          { t: 'p', x: 'Each step waits for the relevant a1 (extended) or a0 (retracted) limit switches before advancing, exactly like the real installation.' },
        ],
      },
      {
        id: 'faq', title: 'FAQ',
        blocks: [
          { t: 'h2', x: 'Is SpiderLive free and open source?' },
          { t: 'p', x: 'Yes. The code is MIT-licensed and available on GitHub. You are welcome to use, study and contribute.' },
          { t: 'h2', x: 'Does it need any installation?' },
          { t: 'p', x: 'No. It runs entirely in the browser. You can optionally run it locally with Node.js (see Installation).' },
        ],
      },
    ],
  },
];

const ALL = DOCS.flatMap(g => g.items);

function Block({ b }) {
  if (b.t === 'h2') return <h2 style={{ fontSize: 21, fontWeight: 700, margin: '34px 0 12px', scrollMarginTop: 90 }} id={slug(b.x)}>{b.x}</h2>;
  if (b.t === 'p') return <p style={{ color: '#aeb7c2', fontSize: 16, margin: '0 0 16px', maxWidth: 720 }}>{b.x}</p>;
  if (b.t === 'note') return (
    <div style={{ borderLeft: `3px solid ${T.cyan}`, background: 'rgba(55,224,200,0.07)', borderRadius: '0 10px 10px 0', padding: '12px 16px', margin: '0 0 16px', color: '#c7cfda', fontSize: 14.5, maxWidth: 720 }}>{b.x}</div>
  );
  if (b.t === 'ul') return (
    <ul style={{ color: '#aeb7c2', fontSize: 16, margin: '0 0 16px', paddingLeft: 22, maxWidth: 720 }}>
      {b.x.map((li, i) => <li key={i} style={{ margin: '0 0 7px' }}>{li}</li>)}
    </ul>
  );
  if (b.t === 'code') return (
    <pre style={{
      background: '#0d1117', border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 18px',
      overflow: 'auto', margin: '0 0 18px', maxWidth: 720,
      font: '13.5px/1.6 ui-monospace, SFMono-Regular, Menlo, monospace', color: '#cdd9e5',
    }}><code>{b.x}</code></pre>
  );
  return null;
}

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export default function Docs() {
  const [activeId, setActiveId] = useState(ALL[0].id);
  const [q, setQ] = useState('');

  const active = useMemo(() => ALL.find(i => i.id === activeId) || ALL[0], [activeId]);
  const onThisPage = active.blocks.filter(b => b.t === 'h2').map(b => b.x);
  const ql = q.trim().toLowerCase();

  const select = (id) => { setActiveId(id); window.scrollTo(0, 0); };

  const sideLink = (it) => {
    const on = it.id === activeId;
    return (
      <button key={it.id} onClick={() => select(it.id)}
        style={{
          display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer', border: 'none',
          background: 'transparent', padding: '6px 12px', margin: '1px 0', fontSize: 14, borderRadius: 8,
          color: on ? T.blueLt : T.muted, fontWeight: on ? 600 : 500,
          borderLeft: `2px solid ${on ? T.blue : T.border}`,
        }}>
        {it.title}
      </button>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, font: '16px/1.7 system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>
      {/* top bar */}
      <nav style={{
        display: 'flex', alignItems: 'center', gap: 20, padding: '14px 28px', position: 'sticky', top: 0, zIndex: 10,
        borderBottom: `1px solid ${T.border}`, background: 'rgba(11,14,19,0.85)', backdropFilter: 'blur(8px)',
      }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <img src={logo} alt="SpiderLive" style={{ height: 34 }} />
        </button>
        <div style={{ flex: 1, maxWidth: 420, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 10 }}>
          <span style={{ color: T.faint, display: 'flex' }}><IconSearch size={15} /></span>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search docs"
            style={{ border: 'none', outline: 'none', background: 'transparent', color: T.text, fontSize: 14, width: '100%' }} />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href={REPO_URL} target="_blank" rel="noopener" style={{ color: T.muted, display: 'flex' }} title="View on GitHub"
            onMouseEnter={e => { e.currentTarget.style.color = T.text; }} onMouseLeave={e => { e.currentTarget.style.color = T.muted; }}>
            <GitHubIcon size={20} />
          </a>
          <button onClick={() => navigate('/simulator')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.grad, color: '#04121f', border: 'none', borderRadius: 11, padding: '9px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            <IconPlay size={13} /> Launch
          </button>
        </div>
      </nav>

      <div style={{ flex: 1, display: 'flex', maxWidth: 1300, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {/* left sidebar */}
        <aside style={{ width: 250, flexShrink: 0, padding: '28px 16px', borderRight: `1px solid ${T.border}`, position: 'sticky', top: 64, alignSelf: 'flex-start', maxHeight: 'calc(100vh - 64px)', overflow: 'auto' }}>
          {DOCS.map(g => {
            const items = g.items.filter(it => !ql || it.title.toLowerCase().includes(ql) || it.blocks.some(b => typeof b.x === 'string' && b.x.toLowerCase().includes(ql)));
            if (!items.length) return null;
            return (
              <div key={g.group} style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: T.faint, textTransform: 'uppercase', padding: '0 12px 8px' }}>{g.group}</div>
                {items.map(sideLink)}
              </div>
            );
          })}
        </aside>

        {/* content */}
        <main style={{ flex: 1, minWidth: 0, padding: '40px 48px' }}>
          <p style={{ color: T.cyan, fontWeight: 700, fontSize: 12.5, letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 8px' }}>Documentation</p>
          <h1 style={{ fontSize: 34, fontWeight: 800, margin: '0 0 24px', letterSpacing: -0.5 }}>{active.title}</h1>
          {active.blocks.map((b, i) => <Block key={i} b={b} />)}
        </main>

        {/* on this page */}
        <aside style={{ width: 200, flexShrink: 0, padding: '40px 20px', position: 'sticky', top: 64, alignSelf: 'flex-start', display: onThisPage.length ? 'block' : 'none' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: T.faint, textTransform: 'uppercase', marginBottom: 12 }}>On this page</div>
          {onThisPage.map((h, i) => (
            <a key={i} href={`#docs-${slug(h)}`} onClick={(e) => { e.preventDefault(); const el = document.getElementById(slug(h)); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}
              style={{ display: 'block', color: T.muted, fontSize: 13.5, margin: '0 0 9px', textDecoration: 'none' }}>{h}</a>
          ))}
        </aside>
      </div>

      <SiteFooter />
    </div>
  );
}
