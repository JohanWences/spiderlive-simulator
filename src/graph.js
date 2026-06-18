// Shared graph: builds the nodes/edges for the Flying-Spider example and paints
// them from a sim state. Single source of truth so the full simulator and the
// landing-page live preview show the exact same circuit.
import * as E from './engine.js';
import { loadEdgePaths } from './nodes.jsx';
import { pkey } from './files.js';

export const MODX = [40, 380, 720, 1060, 1400, 1740];

// ---------- Node position persistence (localStorage, per active program) ----------
export const LS_POS = 'spiderlive-pos';
export const loadPos = () => { try { return JSON.parse(localStorage.getItem(pkey(LS_POS))) || {}; } catch { return {}; } };
export const savePos = (nodes) => {
  const m = {}; nodes.forEach(n => { m[n.id] = n.position; });
  try { localStorage.setItem(pkey(LS_POS), JSON.stringify(m)); } catch {}
};

// ---- I/O address binding per node (e.g. a button → %IX0.0, an output → %QX0.0) ----
export const LS_IO = 'spiderlive-io';
export const loadIO = () => { try { return JSON.parse(localStorage.getItem(pkey(LS_IO))) || {}; } catch { return {}; } };
export const saveIO = (map) => { try { localStorage.setItem(pkey(LS_IO), JSON.stringify(map)); } catch {} };

// ---- Custom node names (so you can rename "PUSH B" → "Cycle start", etc.) ----
export const LS_LAB = 'spiderlive-lab';
export const loadLabels = () => { try { return JSON.parse(localStorage.getItem(pkey(LS_LAB))) || {}; } catch { return {}; } };
export const saveLabels = (map) => { try { localStorage.setItem(pkey(LS_LAB), JSON.stringify(map)); } catch {} };

// ---- Full canvas snapshot for blank (user-built) files: placed nodes + wires ----
export const LS_CANVAS = 'spiderlive-canvas';
export const loadCanvas = () => { try { return JSON.parse(localStorage.getItem(pkey(LS_CANVAS))) || null; } catch { return null; } };
export const saveCanvas = (nodes, edges) => {
  // JSON.stringify drops function-valued data (onClick/lit) — rebuilt from DROP_DATA on load.
  const N = nodes.map(n => ({ id: n.id, type: n.type, position: n.position, data: n.data }));
  // route = the wire's waypoints (the wiring "shape") — persisted so bends survive a reload.
  const Ed = edges.map(e => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle, targetHandle: e.targetHandle, route: e.data?.route || null }));
  try { localStorage.setItem(pkey(LS_CANVAS), JSON.stringify({ nodes: N, edges: Ed })); } catch {}
};

const arrEq = (a, b) => { if (!a || !b || a.length !== b.length) return false; for (let i=0;i<a.length;i++) if (a[i] !== b[i]) return false; return true; };

// persist=false → canonical layout, ignore the user's saved positions (used by the preview).
export function makeNodes(sim, persist = true){
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
  if (persist){                                                   // restore the user's saved layout + I/O bindings + names
    const saved = loadPos();
    n.forEach(nd => { if (saved[nd.id]) nd.position = saved[nd.id]; });
    const io = loadIO();
    n.forEach(nd => { if (io[nd.id]) nd.data = { ...nd.data, io: io[nd.id] }; });
    const lab = loadLabels();
    n.forEach(nd => { if (lab[nd.id]) nd.data = { ...nd.data, lab: lab[nd.id] }; });
  }
  return n;
}

export function makeEdges(persist = true){
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
  const ep = persist ? loadEdgePaths() : {};                      // restore dragged wire paths
  e.forEach(x => {
    x.type = 'tag';                                               // label anchored to the PLC terminal
    if (x.data){
      x.data.tagAt = x.source === 'plc' ? 'source' : 'target';
      if (ep[x.id]) x.data.route = ep[x.id];
    }
  });
  return e;
}

// ---------- Painting: push a sim state onto nodes/edges (only recreate what changed) ----------
function paintNode(s, n){
    if (n.data && n.data._static) return n;                     // placed components keep their own independent state
    if (n.type === 'module'){
      const i = n.data.i;
      if (typeof i !== 'number' || i < 0 || i > 5) return n;   // dropped/extra cylinders stay static (not wired to the engine)
      const pos = s.pos[i], on = E.solenoid(s,i);
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
}

// Returns the SAME array when nothing changed, so React Flow doesn't re-render
// every animation frame (which would interrupt connection dragging in live mode).
export function paintNodes(s, nds){
  let changed = false;
  const out = nds.map(n => { const m = paintNode(s, n); if (m !== n) changed = true; return m; });
  return changed ? out : nds;
}

// animate=true → flow animation on active wires. hotId = id of a hover-highlighted wire (full app only).
function paintEdge(s, e, animate, hotId){
    const k = e.data?.kind;
    if (k === 'wire') return e;                                  // user-drawn connections keep their own style
    let on = false, col = '#39414d';
    if (k === 'out')    { on = E.solenoid(s, e.data.i); col = on ? '#39d98a' : '#234a37'; }
    else if (k==='sensor'){ on = E.upS(s.pos, e.data.i); col = on ? '#e3b341' : '#4a431f'; }
    else if (k==='sensor0'){ on = E.downS(s.pos, e.data.i); col = on ? '#d68b2a' : '#43361c'; }
    else if (k==='air')   { on = true; col = '#4aa3ff'; }
    else if (k==='ctrl')  { on = e.data.lit ? e.data.lit(s) : false; col = on ? '#39d98a' : '#2a4a37'; }
    else if (k==='emg')   { on = s.emerg; col = on ? '#e5534b' : '#3a2422'; }
    else if (k==='pwr')   { on = true; col = e.data.col; }
    const anim = !!(animate && on);
    const stroke = e.selected ? '#e6edf3' : col;
    const width  = e.selected ? 3 : (e.id === hotId ? 3.5 : (on ? 2.5 : 1.5));
    if (e.animated === anim && e.style && e.style.stroke === stroke && e.style.strokeWidth === width) return e;
    return { ...e, animated:anim, style:{ stroke, strokeWidth:width } };
}

// animate=true → flow animation on active wires. hotId = id of a hover-highlighted wire (full app only).
export function paintEdges(s, eds, animate = false, hotId = null){
  let changed = false;
  const out = eds.map(e => { const m = paintEdge(s, e, animate, hotId); if (m !== e) changed = true; return m; });
  return changed ? out : eds;
}
