import React, { useState } from 'react';
import { navigate } from '../router.jsx';
import { T } from '../theme.js';
import App from '../App.jsx';
import NodePreview from './NodePreview.jsx';
import logo from '../assets/spiderlive-logo-blue.png';
import {
  IconSearch, IconPanel, IconComponents, IconCpu, IconPlay, IconFolder, IconFile,
  IconSettings, IconLink, IconChevron, IconPlus, IconX,
} from '../icons.jsx';

const LIB_H_KEY = 'spiderlive-lib-h';

// Component library, grouped into collapsible folders. Each item carries the node
// type (for drag-and-drop) and metadata (for the info panel).
const LIBRARY_TREE = [
  { group: 'Controllers', items: [
    { label: 'SPI-DRY UTM-S9-MEC PLC', type: 'plc', data: { sim: {} },
      desc: 'Programmable logic controller. 14 digital inputs / 10 relay outputs; runs the 22-step ladder program.',
      info: ['14 DI · 10 DO · 2 AI', 'CPU 231043', 'AC / DC / RLY'] },
  ] },
  { group: 'Actuators', items: [
    { label: 'Double-acting cylinder', type: 'module', data: { i: 0, pos: 0.45, on: false },
      desc: 'ISO 1219 linear actuator (barrel, piston, rod) driven by a single-solenoid 5/2 valve, with a0/a1 reed switches.',
      info: ['Double-acting', '5/2 single-solenoid valve', 'a0 / a1 limit switches'] },
    { label: '5/2 solenoid valve', type: 'module', data: { i: 0, pos: 0, on: true },
      desc: 'Single-solenoid 5/2 directional valve (solenoid 14 + spring return 12) that drives a cylinder.',
      info: ['5 ports · 2 positions', 'Solenoid 14 / spring 12'] },
  ] },
  { group: 'Inputs', items: [
    { label: 'Push button (NO)', type: 'button', data: { col: '#2ec27e', on: true, lab: 'START' },
      desc: 'Normally-open momentary push button, wired to a PLC digital input.', info: ['NO contact', 'Momentary'] },
    { label: 'Push button (NC)', type: 'button', data: { col: '#d83a34', on: false, lab: 'STOP' },
      desc: 'Normally-closed momentary push button, wired to a PLC digital input.', info: ['NC contact', 'Momentary'] },
    { label: 'Emergency stop', type: 'mush', data: { on: false },
      desc: 'Latching mushroom-head emergency stop (NC). Stops the installation; all legs come down.', info: ['Latching', 'NC contact'] },
  ] },
  { group: 'Pneumatic supply', items: [
    { label: 'Pneumatic supply (FRL)', type: 'supply', data: {},
      desc: 'Generates, stores, conditions and measures the air (6 bar): compressor, tank, FRL and gauge.', info: ['6 bar', 'Compressor · tank · FRL · gauge'] },
  ] },
  { group: 'Power', items: [
    { label: '24 VDC supply', type: 'supply24', data: {},
      desc: 'Powers the PLC and the sensors. +24 V (red) / 0 V (blue).', info: ['+24 V / 0 V', 'L+ / M'] },
  ] },
  { group: 'Signaling', items: [
    { label: 'Signal tower', type: 'tower', data: { sim: { sysOn: true, emerg: false } },
      desc: 'Light column driven by outputs Q0.6 (green, running) and Q0.7 (red, emergency).', info: ['Green = running', 'Red = emergency'] },
  ] },
];

const TREE = [
  { label: 'Canvas', Icon: IconFolder, children: [{ label: 'main', Icon: IconFile, active: true }] },
  { label: 'Components', Icon: IconComponents },
  { label: 'Configuration', Icon: IconSettings },
  { label: 'Device', Icon: IconCpu, children: [{ label: 'Configuration', Icon: IconSettings }, { label: 'I/O Mapping', Icon: IconLink }] },
];

const RAIL = [IconPanel, IconSearch, IconComponents, IconCpu, IconPlay];

function MenuBar({ onTogglePanel, onToggleConsole }) {
  const [open, setOpen] = useState(null);
  const MENUS = {
    File: [
      { label: 'New project', onClick: () => navigate('/home') },
      { label: 'Open…', onClick: () => navigate('/home') },
      { label: 'Share link', hint: 'soon' },
      { sep: true },
      { label: 'Back to Home', onClick: () => navigate('/home') },
      { label: 'Exit to landing', onClick: () => navigate('/') },
    ],
    Edit: [{ label: 'Undo', hint: 'Ctrl Z' }, { label: 'Redo', hint: 'Ctrl Shift Z' }],
    Display: [
      { label: 'Toggle left panel', onClick: onTogglePanel },
      { label: 'Toggle console', onClick: onToggleConsole },
    ],
    Help: [
      { label: 'Documentation', onClick: () => navigate('/docs') },
      { label: 'About SpiderLive', onClick: () => navigate('/') },
    ],
  };
  const close = () => setOpen(null);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '0 12px', height: 38, flexShrink: 0, userSelect: 'none',
                  background: '#0b1322', borderBottom: `1px solid ${T.border}`, position: 'relative', zIndex: 30 }}>
      <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 10px 0 2px', display: 'flex', alignItems: 'center' }}>
        <img src={logo} alt="SpiderLive" style={{ height: 20 }} />
      </button>
      {Object.keys(MENUS).map(name => (
        <div key={name} style={{ position: 'relative' }}>
          <button onClick={() => setOpen(o => o === name ? null : name)}
            style={{ background: open === name ? T.panel2 : 'transparent', color: T.text, border: 'none',
                     padding: '6px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 13.5 }}>
            {name}
          </button>
          {open === name && (
            <>
              <div onClick={close} style={{ position: 'fixed', inset: 0, zIndex: 1 }} />
              <div style={{ position: 'absolute', top: '100%', left: 0, minWidth: 200, background: T.panel,
                            border: `1px solid ${T.border2}`, borderRadius: 10, padding: 6, marginTop: 4, zIndex: 2,
                            boxShadow: '0 16px 40px rgba(0,0,0,.5)' }}>
                {MENUS[name].map((it, i) => it.sep
                  ? <div key={i} style={{ height: 1, background: T.border, margin: '5px 4px' }} />
                  : <button key={i} onClick={() => { close(); it.onClick && it.onClick(); }}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18, width: '100%',
                               background: 'none', border: 'none', color: it.onClick ? T.text : T.faint, cursor: it.onClick ? 'pointer' : 'default',
                               padding: '7px 10px', borderRadius: 7, fontSize: 13.5, textAlign: 'left' }}
                      onMouseEnter={e => { if (it.onClick) e.currentTarget.style.background = T.panel2; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}>
                      {it.label}{it.hint && <span style={{ color: T.faint, fontSize: 11.5 }}>{it.hint}</span>}
                    </button>)}
              </div>
            </>
          )}
        </div>
      ))}
      <div style={{ width: 1, height: 18, background: T.border, margin: '0 8px' }} />
      <span style={{ color: T.muted, fontSize: 13.5 }}>Recent</span>
    </div>
  );
}

function TreeRow({ node, depth = 0 }) {
  const [open, setOpen] = useState(true);
  const has = node.children && node.children.length;
  const Icon = node.Icon;
  return (
    <>
      <button onClick={() => has && setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 7, width: '100%', textAlign: 'left',
                 background: node.active ? T.panel2 : 'transparent', border: 'none', cursor: 'pointer',
                 padding: `5px 8px 5px ${8 + depth * 14}px`, borderRadius: 7, fontSize: 13.5,
                 color: node.active ? T.text : T.muted }}>
        <span style={{ width: 10, display: 'inline-flex', color: T.faint, transform: has && open ? 'rotate(90deg)' : 'none', transition: 'transform .1s' }}>
          {has ? <IconChevron size={11} /> : null}
        </span>
        <Icon size={15} />{node.label}
      </button>
      {has && open && node.children.map((c, i) => <TreeRow key={i} node={c} depth={depth + 1} />)}
    </>
  );
}

function LibFolder({ group, items, q, selected, onSelect }) {
  const [open, setOpen] = useState(false);
  const ql = q.trim().toLowerCase();
  const matches = ql ? items.filter(it => it.label.toLowerCase().includes(ql)) : items;
  const isOpen = ql ? true : open;
  if (ql && !matches.length) return null;
  return (
    <div>
      <button onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 7, width: '100%', textAlign: 'left', border: 'none',
                 background: 'transparent', cursor: 'pointer', padding: '5px 8px', borderRadius: 7, fontSize: 13, color: T.muted }}
        onMouseEnter={e => { e.currentTarget.style.background = T.panel2; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
        <span style={{ width: 10, display: 'inline-flex', color: T.faint, transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform .1s' }}><IconChevron size={11} /></span>
        <span style={{ color: T.blueLt }}><IconFolder size={15} /></span>
        {group}
      </button>
      {isOpen && matches.map((it, i) => {
        const on = selected === it.label;
        return (
          <div key={i} draggable
            onDragStart={e => {
              e.dataTransfer.setData('application/spiderlive', it.type);
              e.dataTransfer.setData('application/spiderlive-label', it.label);
              e.dataTransfer.effectAllowed = 'move';
            }}
            onClick={() => onSelect(it)}
            title="Drag onto the canvas to add · click for details"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px 5px 30px', borderRadius: 7,
                     color: on ? T.text : T.muted, fontSize: 12.5, cursor: 'pointer',
                     background: on ? T.panel2 : 'transparent' }}
            onMouseEnter={e => { e.currentTarget.style.background = T.panel2; }}
            onMouseLeave={e => { e.currentTarget.style.background = on ? T.panel2 : 'transparent'; }}>
            <span style={{ color: T.faint }}><IconFile size={13} /></span>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function InfoPanel({ el, onClose }) {
  return (
    <div style={{ position: 'absolute', top: 12, right: 12, width: 290, zIndex: 20, userSelect: 'none',
                  background: '#0d1117f5', border: `1px solid ${T.border2}`, borderRadius: 13, overflow: 'hidden',
                  boxShadow: '0 18px 44px rgba(0,0,0,.55)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '11px 12px', borderBottom: `1px solid ${T.border}` }}>
        <span style={{ fontWeight: 700, fontSize: 13.5, color: T.text }}>{el.label}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', display: 'flex' }}><IconX size={16} /></button>
      </div>
      <div style={{ height: 188, background: '#0b0e13', borderBottom: `1px solid ${T.border}` }}>
        <NodePreview type={el.type} data={el.data} />
      </div>
      <div style={{ padding: '12px 13px' }}>
        <p style={{ margin: '0 0 10px', fontSize: 12.5, color: '#aeb7c2', lineHeight: 1.5 }}>{el.desc}</p>
        {el.info && el.info.map((line, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.muted, margin: '4px 0' }}>
            <span style={{ width: 4, height: 4, borderRadius: 99, background: T.blueLt, flexShrink: 0 }} />{line}
          </div>
        ))}
        <div style={{ marginTop: 11, fontSize: 11.5, color: T.faint }}>Drag it onto the canvas to add.</div>
      </div>
    </div>
  );
}

export default function Workspace() {
  const [panel, setPanel] = useState(true);
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [tab, setTab] = useState('main');
  const [libQ, setLibQ] = useState('');
  const [selEl, setSelEl] = useState(null);
  const [libH, setLibH] = useState(() => {
    const v = parseInt(localStorage.getItem(LIB_H_KEY), 10);
    return Number.isFinite(v) ? v : 250;
  });
  const [log, setLog] = useState([
    { t: 'ready', m: 'SpiderLive workspace loaded' },
    { t: 'info', m: 'PLC SPI-DRY UTM-S9-MEC · 22-step program ready' },
  ]);

  const startLibResize = (e) => {
    e.preventDefault();
    const startY = e.clientY, startH = libH;
    let last = startH;
    const onMove = (ev) => {
      let h = startH + (startY - ev.clientY);                 // drag up → taller library
      h = Math.max(120, Math.min(window.innerHeight - 240, h));
      last = h; setLibH(h);
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      try { localStorage.setItem(LIB_H_KEY, String(Math.round(last))); } catch {}
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: T.bg, color: T.text,
                  font: '14px system-ui, sans-serif', overflow: 'hidden' }}>
      <MenuBar onTogglePanel={() => setPanel(p => !p)} onToggleConsole={() => setConsoleOpen(c => !c)} />

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* icon rail */}
        <div style={{ width: 50, flexShrink: 0, background: '#0b1322', borderRight: `1px solid ${T.border}`,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 0' }}>
          {RAIL.map((Ic, i) => (
            <button key={i} onClick={() => i === 0 && setPanel(p => !p)}
              style={{ width: 34, height: 34, borderRadius: 9, border: 'none', cursor: 'pointer',
                       display: 'flex', alignItems: 'center', justifyContent: 'center',
                       background: i === 0 && panel ? T.panel2 : 'transparent', color: i === 0 && panel ? T.text : T.muted }}
              onMouseEnter={e => { e.currentTarget.style.background = T.panel2; }}
              onMouseLeave={e => { e.currentTarget.style.background = i === 0 && panel ? T.panel2 : 'transparent'; }}>
              <Ic size={19} />
            </button>
          ))}
        </div>

        {/* left panel: project tree + library */}
        {panel && (
          <aside style={{ width: 250, flexShrink: 0, background: T.panel, borderRight: `1px solid ${T.border}`,
                          display: 'flex', flexDirection: 'column', minHeight: 0, userSelect: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderBottom: `1px solid ${T.border}` }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 13.5 }}>
                <span style={{ color: T.blueLt }}><IconFolder size={16} /></span> SpiderLive Project
              </span>
              <button onClick={() => navigate('/home')} title="New / open"
                style={{ width: 26, height: 26, borderRadius: 7, border: 'none', background: T.blue, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconPlus size={16} />
              </button>
            </div>

            {/* project tree (flex) */}
            <div style={{ flex: 1, overflow: 'auto', padding: '8px 6px', minHeight: 60 }}>
              {TREE.map((n, i) => <TreeRow key={i} node={n} />)}
            </div>

            {/* resize handle */}
            <div onPointerDown={startLibResize} title="Drag to resize"
              style={{ height: 9, flexShrink: 0, cursor: 'row-resize', borderTop: `1px solid ${T.border}`,
                       display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' }}
              onMouseEnter={e => { e.currentTarget.style.background = T.panel2; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
              <span style={{ width: 28, height: 3, borderRadius: 2, background: T.border2 }} />
            </div>

            {/* Library (resizable folders) */}
            <div style={{ height: libH, flexShrink: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 12px' }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: T.faint, textTransform: 'uppercase' }}>Library</span>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 7, padding: '5px 9px', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, flex: 1, maxWidth: 150 }}>
                  <span style={{ color: T.faint }}><IconSearch size={13} /></span>
                  <input value={libQ} onChange={e => setLibQ(e.target.value)} placeholder="Search"
                    style={{ border: 'none', outline: 'none', background: 'transparent', color: T.text, fontSize: 12.5, width: '100%' }} />
                </div>
              </div>
              <div style={{ flex: 1, overflow: 'auto', padding: '2px 6px 8px' }}>
                {LIBRARY_TREE.map((g, i) => <LibFolder key={i} group={g.group} items={g.items} q={libQ} selected={selEl?.label} onSelect={setSelEl} />)}
              </div>
            </div>
          </aside>
        )}

        {/* main column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* tabs + breadcrumb */}
          <div style={{ flexShrink: 0, borderBottom: `1px solid ${T.border}`, background: T.panel, userSelect: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'stretch' }}>
              {[['main', IconFile], ['Configuration', IconSettings]].map(([name, Ic]) => (
                <button key={name} onClick={() => setTab(name)}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px', border: 'none', cursor: 'pointer',
                           background: tab === name ? T.bg : 'transparent', color: tab === name ? T.text : T.muted,
                           borderBottom: `2px solid ${tab === name ? T.blue : 'transparent'}`, fontSize: 13.5, fontWeight: 600 }}>
                  <Ic size={15} />{name}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 16px', color: T.muted, fontSize: 12.5, borderTop: `1px solid ${T.border}` }}>
              <span>SpiderLive Project</span><span style={{ color: T.faint }}>›</span>
              <span>Canvas</span><span style={{ color: T.faint }}>›</span>
              <span style={{ color: T.text }}>main</span>
            </div>
          </div>

          {/* canvas / configuration */}
          <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
            {tab === 'main'
              ? <App embedded />
              : <div style={{ padding: 40, color: T.muted }}>
                  <h2 style={{ color: T.text, fontWeight: 700 }}>Configuration</h2>
                  <p>Device, I/O mapping and program settings will live here.</p>
                </div>}
            {tab === 'main' && selEl && <InfoPanel el={selEl} onClose={() => setSelEl(null)} />}
          </div>

          {/* console */}
          <div style={{ flexShrink: 0, borderTop: `1px solid ${T.border}`, background: T.panel, userSelect: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px' }}>
              <button onClick={() => setConsoleOpen(o => !o)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: T.text, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                <span style={{ display: 'inline-flex', color: T.faint, transform: consoleOpen ? 'rotate(90deg)' : 'none', transition: 'transform .1s' }}><IconChevron size={12} /></span>
                Console
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ background: T.panel2, color: T.muted, border: `1px solid ${T.border}`, borderRadius: 7, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}>Filters</button>
                <button onClick={() => setLog([])} style={{ background: T.panel2, color: T.muted, border: `1px solid ${T.border}`, borderRadius: 7, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}>Clear console</button>
              </div>
            </div>
            {consoleOpen && (
              <div style={{ height: 120, overflow: 'auto', padding: '8px 14px', borderTop: `1px solid ${T.border}`,
                            font: '12.5px/1.7 ui-monospace, Menlo, monospace', color: '#aeb7c2', background: T.bg }}>
                {log.length ? log.map((l, i) => (
                  <div key={i}><span style={{ color: l.t === 'ready' ? T.cyan : T.blueLt }}>[{l.t}]</span> {l.m}</div>
                )) : <span style={{ color: T.faint }}>Console cleared.</span>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
