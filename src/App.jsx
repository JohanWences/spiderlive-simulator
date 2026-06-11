import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { ReactFlow, ReactFlowProvider, Background, Controls, useNodesState, useEdgesState, useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { nodeTypes, edgeTypes, loadEdgePaths, clearEdgePaths, edgeDragRegistry } from './nodes.jsx';
import * as E from './engine.js';
import spiderLiveLogo from './assets/spiderlive-logo.png';

const MODX = [40, 380, 720, 1060, 1400, 1740];

// ---------- Node position persistence (localStorage) ----------
const LS_POS = 'spiderlive-pos';
const loadPos = () => { try { return JSON.parse(localStorage.getItem(LS_POS)) || {}; } catch { return {}; } };
const savePos = (nodes) => {
  const m = {}; nodes.forEach(n => { m[n.id] = n.position; });
  try { localStorage.setItem(LS_POS, JSON.stringify(m)); } catch {}
};

const DOCS = {
  module:   { n:'Double-acting cylinder + 5/2 solenoid valve', d:'ISO 1219 linear actuator (barrel, piston, rod, cushioning) driven by a single-solenoid 5/2 valve (solenoid 14 + spring return 12). a0/a1 reed switches on the barrel.', u:'https://www.festo.com/us/en/search/?text=pneumatic%20cylinders' },
  plc:      { n:'Siemens S7-1200 PLC · CPU 1214C', d:'14 DI / 10 DO / 2 AI on board; runs the 22-step ladder program.', u:'https://www.siemens.com/global/en/products/automation/systems/industrial/plc/s7-1200.html' },
  button:   { n:'Push button', d:'NO (start) or NC (stop), wired to a PLC I input.', u:'https://www.festo.com/us/en/search/?text=pushbutton' },
  mush:     { n:'Emergency stop button', d:'Latching mushroom head (NC). Stops the installation; all legs come down.', u:'https://www.festo.com/us/en/search/?text=emergency%20stop' },
  supply:   { n:'Pneumatic supply (compressor · tank · FRL · gauge)', d:'Generates, stores, conditions and measures the air (6 bar) feeding the manifold.', u:'https://www.festo.com/us/en/search/?text=air%20preparation' },
  supply24: { n:'24 VDC power supply', d:'Powers the PLC and the sensors. +24 V (red) / 0 V (blue).', u:'https://mall.industry.siemens.com/mall/en/WW/Catalog/Products/10044947' },
  tower:    { n:'Signal tower', d:'Light column driven by outputs Q0.6 (green, running) and Q0.7 (red, emergency).', u:'https://www.festo.com/us/en/search/?text=signal%20tower' },
};

function makeNodes(sim){
  const n = [];
  n.push({ id:'plc', type:'plc', position:{ x:380, y:60 }, data:{ sim:{} }, draggable:true });
  n.push({ id:'v24', type:'supply24', position:{ x:910, y:70 }, data:{} });
  n.push({ id:'tor', type:'tower', position:{ x:250, y:70 }, data:{ sim:{} } });
  const btns = [
    ['b_start','START', '#2ec27e', () => E.start(sim.current),     s => s.sysOn && !s.emerg],
    ['b_stop1','STOP 1','#d83a34', () => E.stop(sim.current),      () => false],
    ['b_stop2','STOP 2','#444c56', () => E.stop(sim.current),      () => false],
    ['b_auto', 'AUTO',  '#444c56', () => { sim.current.auto = !sim.current.auto; }, s => s.auto],
  ];
  btns.forEach(([id,lab,col,onClick,lit],k) =>
    n.push({ id, type:'button', position:{ x:400+k*86, y:-30 }, data:{ lab, col, onClick, lit, on:false } }));
  n.push({ id:'b_emerg', type:'mush', position:{ x:760, y:-34 }, data:{ onClick:() => E.eStop(sim.current), on:false } });
  for (let i=0;i<6;i++)
    n.push({ id:'m'+i, type:'module', position:{ x:MODX[i], y:300 }, data:{ i, pos:0, on:false } });
  n.push({ id:'sup', type:'supply', position:{ x:430, y:540 }, data:{} });
  const saved = loadPos();                                         // restore the user's saved layout
  n.forEach(nd => { if (saved[nd.id]) nd.position = saved[nd.id]; });
  return n;
}

function makeEdges(){
  const e = [];
  const A1 = ['I0.4','I0.5','I0.6','I0.7','I1.0','I1.1'];          // a1 inputs (extended)
  const A0 = ['I1.2','I1.3','I1.4','I1.5','I8.0','I8.1'];          // a0 inputs (retracted; e0/f0 on the SM 1221)
  const ctrl = (id, src, tgt, label, lit, tier=0) => ({ id, source:src, sourceHandle:'out', target:'plc', targetHandle:tgt, label, data:{ kind:'ctrl', lit, tier } });
  e.push(ctrl('e-start','b_start','i_start','I0.0', s=>s.sysOn&&!s.emerg, 0));
  e.push(ctrl('e-stop1','b_stop1','i_stop1','I0.1', null, 1));
  e.push(ctrl('e-stop2','b_stop2','i_stop2','I0.2', null, 0));
  e.push(ctrl('e-emerg','b_emerg','i_emerg','I0.3', s=>s.emerg, 1));
  for (let i=0;i<6;i++){
    e.push({ id:'e-q'+i, source:'plc', sourceHandle:'q'+i, target:'m'+i, targetHandle:'sol', label:'Q0.'+i, data:{ kind:'out', i, tier:i%2 } });
    e.push({ id:'e-s'+i, source:'m'+i, sourceHandle:'a1', target:'plc', targetHandle:'in'+i, label:A1[i], data:{ kind:'sensor', i, tier:i%2 } });
    e.push({ id:'e-s0'+i, source:'m'+i, sourceHandle:'a0', target:'plc', targetHandle:'in_a0_'+i, label:A0[i], data:{ kind:'sensor0', i, tier:i%2 } });
    e.push({ id:'e-air'+i, source:'sup', sourceHandle:'air', target:'m'+i, targetHandle:'air', data:{ kind:'air' } });
  }
  e.push({ id:'e-tor-run', source:'plc', sourceHandle:'q6', target:'tor', targetHandle:'in_run', label:'Q0.6', data:{ kind:'ctrl', lit:s=>s.sysOn&&!s.emerg } });
  e.push({ id:'e-tor-emg', source:'plc', sourceHandle:'q7', target:'tor', targetHandle:'in_emg', label:'Q0.7', data:{ kind:'ctrl', lit:s=>s.emerg } });
  e.push({ id:'e-tor-com', source:'tor', sourceHandle:'com', target:'plc', targetHandle:'m', label:'0V', data:{ kind:'pwr', col:'#539bf5' } });
  e.push({ id:'e-lp', source:'v24', sourceHandle:'plus',  target:'plc', targetHandle:'lplus', label:'L+', data:{ kind:'pwr', col:'#e5534b' } });
  e.push({ id:'e-m',  source:'v24', sourceHandle:'minus', target:'plc', targetHandle:'m',     label:'M',  data:{ kind:'pwr', col:'#539bf5' } });
  const ep = loadEdgePaths();                                     // restore dragged wire paths
  e.forEach(x => {
    x.type = 'tag';                                               // label anchored to the PLC terminal
    if (x.data){
      x.data.tagAt = x.source === 'plc' ? 'source' : 'target';
      if (ep[x.id]) x.data.route = ep[x.id];
    }
  });
  return e;
}

const btnCss = (bg, fg='#0b0e13') => ({ background:bg, color:fg, border:'none', borderRadius:9, padding:'10px 15px', fontWeight:600, fontSize:13, cursor:'pointer' });
const arrEq = (a, b) => { if (!a || !b || a.length !== b.length) return false; for (let i=0;i<a.length;i++) if (a[i] !== b[i]) return false; return true; };
const chip = { background:'#161b22', border:'1px solid #2a313c', borderRadius:7, padding:'3px 8px', color:'#8b949e' };


function Flow(){
  const rf = useReactFlow();
  const sim = useRef(E.newSim());
  const initN = useMemo(() => makeNodes(sim), []);
  const initE = useMemo(() => makeEdges(), []);
  const [nodes, setNodes, onNodesChange] = useNodesState(initN);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initE);
  const [hud, setHud] = useState({ step:0, mode:'—', status:'STOPPED' });
  const [docKey, setDocKey] = useState(null);
  const [docsOpen, setDocsOpen] = useState(true);
  const [sel, setSel] = useState(null);                          // selection box (screen coords)
  const [live, setLive] = useState(false);                       // false = Edit (frozen) · true = animated Simulation
  const hotRef = useRef(null);                                   // id of the highlighted wire (for the rAF loop)
  const hovT = useRef(0);

  // Pushes the current state onto nodes/wires. animate=true → animated flow on wires. Only recreates what changed.
  const applyState = useCallback((animate) => {
    const s = sim.current;
    setNodes(nds => nds.map(n => {
      if (n.type === 'module'){
        const i = n.data.i, pos = s.pos[i], on = E.solenoid(s,i);
        return (n.data.pos === pos && n.data.on === on) ? n : { ...n, data:{ ...n.data, pos, on } };
      }
      if (n.type === 'plc'){
        const q = [ ...[0,1,2,3,4,5].map(i=>E.solenoid(s,i)), s.sysOn&&!s.emerg, s.emerg ];
        const di = [ s.sysOn&&!s.emerg, false, false, s.emerg,
          ...[0,1,2,3,4,5].map(i=>E.upS(s.pos,i)), ...[0,1,2,3,4,5].map(i=>E.downS(s.pos,i)) ];
        const p = n.data.sim || {};
        if (p.step===s.step && p.sysOn===s.sysOn && p.emerg===s.emerg && arrEq(p.q,q) && arrEq(p.di,di)) return n;
        return { ...n, data:{ ...n.data, sim:{ step:s.step, sysOn:s.sysOn, emerg:s.emerg, q, di } } };
      }
      if (n.type === 'tower'){
        const p = n.data.sim || {};
        return (p.sysOn===s.sysOn && p.emerg===s.emerg) ? n : { ...n, data:{ ...n.data, sim:{ sysOn:s.sysOn, emerg:s.emerg } } };
      }
      if (n.type === 'button'){
        const on = n.data.lit ? n.data.lit(s) : false;
        return (n.data.on === on) ? n : { ...n, data:{ ...n.data, on } };
      }
      if (n.type === 'mush') return (n.data.on === s.emerg) ? n : { ...n, data:{ ...n.data, on: s.emerg } };
      return n;
    }));
    setEdges(eds => eds.map(e => {
      const k = e.data?.kind; let on = false, col = '#39414d';
      if (k === 'out')    { on = E.solenoid(s, e.data.i); col = on ? '#39d98a' : '#234a37'; }
      else if (k==='sensor'){ on = E.upS(s.pos, e.data.i); col = on ? '#e3b341' : '#4a431f'; }
      else if (k==='sensor0'){ on = E.downS(s.pos, e.data.i); col = on ? '#d68b2a' : '#43361c'; }
      else if (k==='air')   { on = true; col = '#4aa3ff'; }
      else if (k==='ctrl')  { on = e.data.lit ? e.data.lit(s) : false; col = on ? '#39d98a' : '#2a4a37'; }
      else if (k==='emg')   { on = s.emerg; col = on ? '#e5534b' : '#3a2422'; }
      else if (k==='pwr')   { on = true; col = e.data.col; }
      const anim = !!(animate && on);
      const stroke = e.selected ? '#e6edf3' : col;
      const width  = e.selected ? 3 : (e.id === hotRef.current ? 3.5 : (on ? 2.5 : 1.5));
      if (e.animated === anim && e.style && e.style.stroke === stroke && e.style.strokeWidth === width) return e;
      return { ...e, animated:anim, style:{ stroke, strokeWidth:width } };
    }));
  }, [setNodes, setEdges]);

  // Globally closest wire to the point (robust to overlaps): samples the real paths.
  const closestEdgeAt = (cx, cy) => {
    const g = rf.screenToFlowPosition({ x:cx, y:cy });
    let bestId = null, bd = Infinity, bestEl = null, bestL = 0;
    document.querySelectorAll('.react-flow__edge-path').forEach(el => {
      const id = el.id; if (!id) return;
      let L = 0; try { L = el.getTotalLength(); } catch { return; }
      if (!L) return;
      const N = Math.max(12, Math.min(90, Math.floor(L / 6)));
      for (let i=0;i<=N;i++){
        const l = L*i/N, pt = el.getPointAtLength(l);
        const d = (pt.x-g.x)**2 + (pt.y-g.y)**2;
        if (d < bd){ bd = d; bestId = id; bestEl = el; bestL = l; }
      }
    });
    let vert = true;
    if (bestEl){ const L = bestEl.getTotalLength();
      const a = bestEl.getPointAtLength(Math.max(0,bestL-4)), b = bestEl.getPointAtLength(Math.min(L,bestL+4));
      vert = Math.abs(b.y-a.y) >= Math.abs(b.x-a.x); }
    return { id:bestId, dist:Math.sqrt(bd), vert };
  };
  const onCanvasDblClick = (e) => {
    if (e.target.closest && e.target.closest('.react-flow__node, .react-flow__handle, button, a')) return;
    const hit = closestEdgeAt(e.clientX, e.clientY), zoom = rf.getZoom ? rf.getZoom() : 1;
    if (hit.id && hit.dist <= 12 / zoom){ const api = edgeDragRegistry.get(hit.id); if (api) api.reset(); }
  };
  const onCanvasPointerMove = (e) => {                           // highlight + cursor for the closest wire
    if (sel || e.buttons) return;                                // not during selection / drag / pan
    const now = performance.now(); if (now - hovT.current < 55) return; hovT.current = now;
    const pane = document.querySelector('.react-flow__pane');
    const onObj = e.target.closest && e.target.closest('.react-flow__node, .react-flow__handle, button, a');
    let id = null, cursor = 'crosshair';
    if (!onObj){
      const hit = closestEdgeAt(e.clientX, e.clientY), zoom = rf.getZoom ? rf.getZoom() : 1;
      if (hit.id && hit.dist <= 12 / zoom){ id = hit.id; cursor = hit.vert ? 'ew-resize' : 'ns-resize'; }
    }
    if (pane) pane.style.cursor = cursor;
    if (hotRef.current !== id){ hotRef.current = id; if (!live) applyState(false); }   // in Live the rAF loop refreshes it
  };

  // ---- AutoCAD-style selection: left→right encloses (blue window) · right→left crosses (green) ----
  const finalize = (a, b) => {
    if (Math.hypot(b.x - a.x, b.y - a.y) < 4){                    // plain click → clear selection
      setNodes(nds => nds.map(n => n.selected ? { ...n, selected:false } : n));
      setEdges(eds => eds.map(e => e.selected ? { ...e, selected:false } : e));
      return;
    }
    const crossing = b.x < a.x;                                   // dragging leftwards = crossing
    const p0 = rf.screenToFlowPosition({ x: Math.min(a.x,b.x), y: Math.min(a.y,b.y) });
    const p1 = rf.screenToFlowPosition({ x: Math.max(a.x,b.x), y: Math.max(a.y,b.y) });
    const R = { minX:p0.x, minY:p0.y, maxX:p1.x, maxY:p1.y };
    const selN = new Set();
    rf.getNodes().forEach(n => {
      const w = (n.measured && n.measured.width)  || n.width  || 0;
      const h = (n.measured && n.measured.height) || n.height || 0;
      const x = n.position.x, y = n.position.y;
      const inside = x>=R.minX && x+w<=R.maxX && y>=R.minY && y+h<=R.maxY;
      const cross  = x<=R.maxX && x+w>=R.minX && y<=R.maxY && y+h>=R.minY;
      if (crossing ? cross : inside) selN.add(n.id);
    });
    setNodes(nds => nds.map(n => ({ ...n, selected: selN.has(n.id) })));
    const selE = new Set();
    document.querySelectorAll('.react-flow__edge-path').forEach(el => {
      const id = el.id; if (!id) return;
      let L = 0; try { L = el.getTotalLength(); } catch { return; }
      if (!L) return;
      const N = Math.max(12, Math.min(160, Math.floor(L/6)));
      let any = false, all = true;
      for (let i=0;i<=N;i++){
        const pt = el.getPointAtLength(L*i/N);
        const inR = pt.x>=R.minX && pt.x<=R.maxX && pt.y>=R.minY && pt.y<=R.maxY;
        if (inR) any = true; else all = false;
      }
      if (crossing ? any : all) selE.add(id);
    });
    setEdges(eds => eds.map(e => ({ ...e, selected: selE.has(e.id) })));
  };
  const onCanvasPointerDown = (e) => {
    if (e.button !== 0) return;                                   // left button only
    const t = e.target;
    if (t.closest && t.closest('.react-flow__node, .react-flow__handle, .react-flow__controls, button, a')) return;
    // 1) is there a wire nearby? grab the GLOBALLY closest one (not fooled by overlaps)
    const hit = closestEdgeAt(e.clientX, e.clientY), zoom = rf.getZoom ? rf.getZoom() : 1;
    if (hit.id && hit.dist <= 12 / zoom){
      const api = edgeDragRegistry.get(hit.id);
      if (api && api.drag(e.clientX, e.clientY)) return;
    }
    // 2) otherwise, on empty canvas → selection box
    if (!(t.classList && t.classList.contains('react-flow__pane'))) return;
    const a = { x: e.clientX, y: e.clientY };
    setSel({ x0:a.x, y0:a.y, x1:a.x, y1:a.y });
    const move = (ev) => setSel(s => s ? { ...s, x1:ev.clientX, y1:ev.clientY } : s);
    const up = (ev) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      finalize(a, { x: ev.clientX, y: ev.clientY });
      setSel(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const hudOf = (s) => ({ step:s.step, mode:E.mode(s.step), status: s.emerg?'EMERGENCY' : s.sysOn?'RUNNING':'STOPPED' });

  useEffect(() => {                                              // SIMULATION: continuous animation loop
    if (!live) return;
    let raf, prev = performance.now();
    const loop = (now) => {
      let dt = now - prev; prev = now; if (dt > 100) dt = 100;
      const s = sim.current; E.tick(s, dt);
      applyState(true);
      const h = hudOf(s);
      setHud(p => (p.step===h.step && p.mode===h.mode && p.status===h.status) ? p : h);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [live, applyState]);

  useEffect(() => {                                              // EDIT: one static frame (no animation), then rest
    if (live) return;
    applyState(false);
    setHud(hudOf(sim.current));
  }, [live, applyState]);

  return (
    <div style={{ width:'100vw', height:'100vh', background:'#0b0e13' }}
         onPointerDown={onCanvasPointerDown} onPointerMove={onCanvasPointerMove} onDoubleClick={onCanvasDblClick}>
      <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes}
        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
        onNodeDragStop={() => setNodes(nds => { savePos(nds); return nds; })}
        onNodeMouseEnter={(_, n) => setDocKey(n.type)} onNodeMouseLeave={() => setDocKey(null)}
        panOnDrag={[1]} selectionOnDrag={false} panOnScroll={false}
        fitView minZoom={0.3} proOptions={{ hideAttribution:true }}>
        <Background color="#1b222c" gap={22} />
        <Controls position="bottom-right" />
      </ReactFlow>
      {sel && (() => {
        const cr = sel.x1 < sel.x0;                               // crossing (green) vs window (blue)
        const L = Math.min(sel.x0,sel.x1), T = Math.min(sel.y0,sel.y1);
        const W = Math.abs(sel.x1-sel.x0), H = Math.abs(sel.y1-sel.y0);
        return <div style={{ position:'absolute', left:L, top:T, width:W, height:H, zIndex:6, pointerEvents:'none',
          border:'1.5px '+(cr?'dashed #2ec27e':'solid #4aa3ff'), background:(cr?'#2ec27e22':'#4aa3ff1f') }} />;
      })()}
      <div style={{ position:'absolute', top:12, left:12, zIndex:10,
                    background:'#0d1117ee', border:'1px solid #2a313c', borderRadius:13,
                    padding:'10px 14px', boxShadow:'0 8px 26px #000a' }}>
        <div style={{ display:'flex', alignItems:'center' }}>
          <img src={spiderLiveLogo} alt="SpiderLive — An electro-pneumatic Web Simulator"
               style={{ height:48, width:'auto', display:'block' }} />
        </div>
        <div style={{ display:'flex', gap:6, marginTop:10, flexWrap:'wrap', font:'600 11px system-ui' }}>
          <span style={chip}>
            <span style={{ color: hud.status==='EMERGENCY'?'#e5534b':hud.status==='RUNNING'?'#2ec27e':'#8b949e' }}>●</span>{' '}
            <b style={{ color: hud.status==='EMERGENCY'?'#e5534b':hud.status==='RUNNING'?'#2ec27e':'#e6edf3' }}>{hud.status}</b>
          </span>
          <span style={chip}>Step <b style={{ color:'#e6edf3' }}>{hud.step}</b>/22</span>
          <span style={chip}><b style={{ color:'#e6edf3' }}>{hud.mode}</b></span>
          <span style={{ ...chip, color: live?'#e3b341':'#8b949e', borderColor: live?'#5a4a1e':'#2a313c' }}>
            {live ? '◉ Simulation' : '✎ Edit'}
          </span>
        </div>
      </div>
      <div style={{ position:'absolute', bottom:16, left:16, display:'flex', gap:8, zIndex:10 }}>
        <button style={btnCss(live?'#e3b341':'#3a414c', live?'#0b0e13':'#e6edf3')} onClick={() => setLive(v => !v)}
                title="Edit = frozen and lightweight · Simulation = live animation (sensors and flow on the wires)">
          {live ? '◉ Simulation' : '✎ Edit'}</button>
        <button style={btnCss('#2ec27e')} onClick={() => { setLive(true); E.start(sim.current); }}>▶ START</button>
        <button style={btnCss('#cdd9e5')} onClick={() => E.stop(sim.current)}>STOP</button>
        <button style={btnCss('#e5534b','#fff')} onClick={() => E.eStop(sim.current)}>E-STOP</button>
        <button style={btnCss('#3a414c','#e6edf3')} onClick={() => E.reset(sim.current)}>↺ Reset</button>
        <button style={btnCss('#3a414c','#e6edf3')} onClick={() => { localStorage.removeItem(LS_POS); clearEdgePaths(); setNodes(makeNodes(sim)); setEdges(makeEdges()); }}>⤢ Arrange</button>
      </div>
      <div style={{ position:'absolute', top:58, right:12, width:236, zIndex:10, display:'flex', flexDirection:'column', gap:6 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8,
                      color:'#8b949e', font:'12px system-ui',
                      background:'#161b22cc', border:'1px solid #2a313c', borderRadius:9, padding:'6px 9px' }}>
          <span>Documentation{docsOpen ? ' — hover over a component' : ''}</span>
          <button onClick={() => setDocsOpen(o => !o)}
                  style={{ background:'#21262d', color:'#e6edf3', border:'1px solid #2a313c', borderRadius:7,
                           cursor:'pointer', font:'12px system-ui', padding:'2px 8px', flexShrink:0 }}>
            {docsOpen ? '▾ Hide' : '▸ Show'}
          </button>
        </div>
        {docsOpen && Object.entries(DOCS).map(([k, v]) => (
          <a key={k} href={v.u} target="_blank" rel="noopener"
             style={{ textDecoration:'none', color:'#e6edf3', background:'#161b22', borderRadius:9,
                      border:'1px solid ' + (docKey===k ? '#ffd24a' : '#2a313c'),
                      boxShadow: docKey===k ? '0 0 0 1px #ffd24a66' : 'none', padding:'7px 9px', transition:'border-color .12s' }}>
            <div style={{ fontSize:12, fontWeight:600 }}>{v.n}</div>
            <div style={{ fontSize:10.5, color:'#8b949e', margin:'2px 0 3px', lineHeight:1.25 }}>{v.d}</div>
            <div style={{ fontSize:10, color:'#539bf5' }}>View docs ↗</div>
          </a>
        ))}
      </div>
    </div>
  );
}

export default function App(){
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}
