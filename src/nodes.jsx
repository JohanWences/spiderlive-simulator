import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position, BaseEdge, EdgeLabelRenderer, useReactFlow } from '@xyflow/react';
import { LEG } from './engine.js';
import { setInput, useActiveInputs, useActiveOutputs } from './inputs.js';

// Wire registry: each edge publishes { drag, reset } and the canvas decides which one to grab (global hit-test, robust to overlaps).
export const edgeDragRegistry = new Map();

const GRN = '#2ec27e', AMB = '#e3b341', AIR = '#4aa3ff', MUT = '#8b949e', METAL = '#cdd9e5';
const hStyle = (c) => ({ background: c, width: 8, height: 8, border: '1px solid #0b0e13' });

// Small badge showing a node's bound OpenPLC address (%IX… input = blue · %QX… output = amber)
function IoBadge({ addr }){
  const inp = addr[1] === 'I';
  return <div style={{ position:'absolute', top:-9, right:-8, zIndex:6, pointerEvents:'none',
    background: inp ? '#2f7bf6' : '#e3b341', color: inp ? '#fff' : '#0b0e13',
    font:'700 9px system-ui', padding:'1px 5px', borderRadius:5, border:'1px solid #0b0e13', whiteSpace:'nowrap' }}>{addr}</div>;
}

// ---------- Wire path persistence (localStorage) ----------
const LS_EDGES = 'spiderlive-edges';
export const saveEdgePaths = (edges) => {
  const m = {};
  edges.forEach(e => { if (e.data && e.data.route && e.data.route.length) m[e.id] = e.data.route; });
  try { localStorage.setItem(LS_EDGES, JSON.stringify(m)); } catch {}
};
export const loadEdgePaths  = () => { try { return JSON.parse(localStorage.getItem(LS_EDGES)) || {}; } catch { return {}; } };
export const clearEdgePaths = () => { try { localStorage.removeItem(LS_EDGES); } catch {} };

// PLC terminal (handle id) → OpenPLC address. Wiring an element to a terminal
// gives that element the terminal's address (auto-bind).
export const PLC_ADDR = {
  i_start:'%IX0.0', i_stop1:'%IX0.1', i_stop2:'%IX0.2', i_emerg:'%IX0.3',
  in0:'%IX0.4', in1:'%IX0.5', in2:'%IX0.6', in3:'%IX0.7', in4:'%IX1.0', in5:'%IX1.1',
  in_a0_0:'%IX1.2', in_a0_1:'%IX1.3', in_a0_2:'%IX1.4', in_a0_3:'%IX1.5', in_a0_4:'%IX8.0', in_a0_5:'%IX8.1',
  q0:'%QX0.0', q1:'%QX0.1', q2:'%QX0.2', q3:'%QX0.3', q4:'%QX0.4', q5:'%QX0.5', q6:'%QX0.6', q7:'%QX0.7',
};

// "Stub" point: leaves the terminal in the handle's direction.
function stubPt(x, y, p, D=18){
  if (p === Position.Top)    return { x, y: y - D };
  if (p === Position.Bottom) return { x, y: y + D };
  if (p === Position.Left)   return { x: x - D, y };
  return { x: x + D, y };
}
// Automatic orthogonal routing → list of inner corners [A … B] (without source/target).
function buildRoute(sx, sy, sp, tx, ty, tp){
  const A = stubPt(sx, sy, sp), B = stubPt(tx, ty, tp);
  const sv = sp === Position.Top || sp === Position.Bottom;
  const tv = tp === Position.Top || tp === Position.Bottom;
  let pts;
  if (sv && tv){ const my = (A.y + B.y) / 2; pts = [A, { x:A.x, y:my }, { x:B.x, y:my }, B]; }
  else if (sv && !tv){ pts = [A, { x:A.x, y:B.y }, B]; }
  else if (!sv && tv){ pts = [A, { x:B.x, y:A.y }, B]; }
  else { const mx = (A.x + B.x) / 2; pts = [A, { x:mx, y:A.y }, { x:mx, y:B.y }, B]; }
  return pts.filter((p, i) => i === 0 || p.x !== pts[i-1].x || p.y !== pts[i-1].y);
}
// Path with rounded corners from [[x,y]…]
function roundPath(pts, r=7){
  if (pts.length < 2) return '';
  let d = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++){
    const [x0,y0] = pts[i-1], [x1,y1] = pts[i], [x2,y2] = pts[i+1];
    const v1x=x1-x0, v1y=y1-y0, l1=Math.hypot(v1x,v1y)||1;
    const v2x=x2-x1, v2y=y2-y1, l2=Math.hypot(v2x,v2y)||1;
    const rr=Math.min(r, l1/2, l2/2);
    d += ` L ${x1-v1x/l1*rr},${y1-v1y/l1*rr} Q ${x1},${y1} ${x1+v2x/l2*rr},${y1+v2y/l2*rr}`;
  }
  const last = pts[pts.length-1];
  return d + ` L ${last[0]},${last[1]}`;
}
// Distance from a point to a segment.
function segDist(a, b, p){
  const vx=b.x-a.x, vy=b.y-a.y, wx=p.x-a.x, wy=p.y-a.y;
  const len2 = vx*vx + vy*vy || 1;
  let t = (wx*vx + wy*vy) / len2; t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t*vx), p.y - (a.y + t*vy));
}
// Ensures the stubs to the terminals stay orthogonal (cleans up inherited diagonals).
function fixStubs(S, route, T, sp, tp){
  if (!route.length) return route;
  const sV = sp === Position.Top || sp === Position.Bottom;
  const tV = tp === Position.Top || tp === Position.Bottom;
  const r = route.map(p => ({ ...p }));
  if (sV ? Math.abs(r[0].x - S.x) > 0.5 : Math.abs(r[0].y - S.y) > 0.5)
    r.unshift(sV ? { x:S.x, y:r[0].y } : { x:r[0].x, y:S.y });
  const L = r.length - 1;
  if (tV ? Math.abs(r[L].x - T.x) > 0.5 : Math.abs(r[L].y - T.y) > 0.5)
    r.push(tV ? { x:T.x, y:r[L].y } : { x:r[L].x, y:T.y });
  return r;
}
// When dragging a segment attached to a terminal, insert an elbow so the stub does NOT tilt.
function insertForDrag(route, k, vert, S, T, sp, tp){
  const w = route.map(p => ({ ...p }));
  let a = k - 1, b = k;
  const sV = sp === Position.Top || sp === Position.Bottom;
  const tV = tp === Position.Top || tp === Position.Bottom;
  if (b === w.length - 1 && ((vert && tV) || (!vert && !tV)))
    w.push(vert ? { x:T.x, y:w[b].y } : { x:w[b].x, y:T.y });
  if (a === 0 && ((vert && sV) || (!vert && !sV))){
    w.unshift(vert ? { x:S.x, y:w[0].y } : { x:w[0].x, y:S.y });
    a++; b++;
  }
  return { work:w, iStart:a, iEnd:b };
}

// ---------- Edge: label anchored to the TERMINAL + draggable break point ----------
// Hover over the wire → a grip appears; drag it to move the wire; double-click = back to automatic.
export function TagEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style, data, label, markerEnd }){
  const { screenToFlowPosition, setEdges } = useReactFlow();
  const S = { x:sourceX, y:sourceY }, T = { x:targetX, y:targetY };

  // full polyline: source → (corners, sanitized stubs) → target
  const raw = (data && data.route && data.route.length)
    ? data.route
    : buildRoute(sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition);
  const route = fixStubs(S, raw, T, sourcePosition, targetPosition);
  const full = [S, ...route, T];
  const path = roundPath(full.map(p => [p.x, p.y]));
  const loI = 1, hiI = full.length - 3;                       // editable segments (excluding the terminal stubs)

  const nearestSeg = (g) => {
    let best = -1, bd = Infinity;
    for (let k = loI; k <= hiI; k++){ const d = segDist(full[k], full[k+1], g); if (d < bd){ bd = d; best = k; } }
    return best;
  };
  const segVert = (k) => Math.abs(full[k].x - full[k+1].x) <= Math.abs(full[k].y - full[k+1].y);

  const beginDrag = (cx, cy) => {                             // triggered by the canvas's global hit-test
    if (hiI < loI) return false;
    const k = nearestSeg(screenToFlowPosition({ x:cx, y:cy }));
    if (k < 0) return false;
    const vert = segVert(k);
    const { work, iStart, iEnd } = insertForDrag(route, k, vert, S, T, sourcePosition, targetPosition);
    let moved = false;
    const apply = (e) => {
      moved = true;
      const g = screenToFlowPosition({ x:e.clientX, y:e.clientY });
      const r = work.map(p => ({ ...p }));
      if (vert){ r[iStart].x = g.x; r[iEnd].x = g.x; } else { r[iStart].y = g.y; r[iEnd].y = g.y; }
      setEdges(eds => eds.map(ed => ed.id === id ? { ...ed, data:{ ...ed.data, route:r } } : ed));
    };
    const up = () => {
      window.removeEventListener('pointermove', apply);
      window.removeEventListener('pointerup', up);
      if (moved) setEdges(eds => { saveEdgePaths(eds); return eds; });
    };
    window.addEventListener('pointermove', apply);
    window.addEventListener('pointerup', up);
    return true;
  };
  const reset = () => setEdges(eds => { const r = eds.map(ed => ed.id === id ? { ...ed, data:{ ...ed.data, route:null } } : ed); saveEdgePaths(r); return r; });

  // publish this wire's API for the global hit-test (always the fresh version)
  const apiRef = useRef(null);
  apiRef.current = { drag:beginDrag, reset };
  useEffect(() => {
    edgeDragRegistry.set(id, { drag:(x,y) => apiRef.current.drag(x,y), reset:() => apiRef.current.reset() });
    return () => { edgeDragRegistry.delete(id); };
  }, [id]);

  // address label, attached to the terminal
  const at  = data?.tagAt === 'source' ? 'source' : 'target';
  const lx0 = at === 'source' ? sourceX : targetX;
  const ly0 = at === 'source' ? sourceY : targetY;
  const pos = at === 'source' ? sourcePosition : targetPosition;
  const tier = (data?.tier || 0) * 13;
  let ox = 0, oy = 0;
  if (pos === Position.Top)    oy = -11 - tier;
  else if (pos === Position.Bottom) oy = 11 + tier;
  else if (pos === Position.Left)   ox = -14 - tier;
  else if (pos === Position.Right)  ox = 14 + tier;
  const col = (style && style.stroke) || '#cdd9e5';

  return (
    <>
      <BaseEdge id={id} path={path} style={style} markerEnd={markerEnd} />
      {label && (
        <EdgeLabelRenderer>
          <div className="nodrag nopan" style={{
            position:'absolute', pointerEvents:'none', whiteSpace:'nowrap',
            transform:`translate(-50%,-50%) translate(${lx0+ox}px,${ly0+oy}px)`,
            fontSize:9, fontWeight:700, lineHeight:1, color:'#e6edf3',
            background:'#0b0e13', border:'1px solid '+col, borderRadius:3, padding:'2px 3px' }}>
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
export const edgeTypes = { tag: TagEdge };

// ---------- PLC ----------
export function PLCNode({ data }){
  const W = 520, H = 178;
  const sim = data.sim || { step:0, sysOn:false, emerg:false, q:[], di:[] };
  const active = useActiveInputs();                              // inputs lit by a pressed bound element
  const activeOut = useActiveOutputs();                          // outputs (coils) the PLC is driving, from the bridge
  // DI INPUTS (top terminal strip): handle, address, color
  const di = [
    ['i_start','I0.0','#aab0b8'],['i_stop1','I0.1','#aab0b8'],['i_stop2','I0.2','#aab0b8'],['i_emerg','I0.3','#aab0b8'],
    ['in0','I0.4',AMB],['in1','I0.5',AMB],['in2','I0.6',AMB],['in3','I0.7',AMB],['in4','I1.0',AMB],['in5','I1.1',AMB],
    ['in_a0_0','I1.2','#d68b2a'],['in_a0_1','I1.3','#d68b2a'],['in_a0_2','I1.4','#d68b2a'],['in_a0_3','I1.5','#d68b2a'],
    ['in_a0_4','I8.0','#d68b2a'],['in_a0_5','I8.1','#d68b2a'],
  ];
  const dx = k => 54 + k*28.5;
  // DQ relay OUTPUTS (bottom terminal strip) with 1L/2L commons
  const bot = [{lab:'1L'},{id:'q0',lab:'.0'},{id:'q1',lab:'.1'},{id:'q2',lab:'.2'},{id:'q3',lab:'.3'},
               {lab:'2L'},{id:'q4',lab:'.4'},{id:'q5',lab:'.5'},{id:'q6',lab:'.6'},{id:'q7',lab:'.7'}];
  const bx = k => 74 + k*34;
  return (
    <div title="SPI-DRY UTM-S9-MEC PLC · CPU 231043 AC/DC/RLY (14 DI / 10 relay DQ)" style={{ width:W, height:H, position:'relative' }}>
      {data.io && <IoBadge addr={data.io} />}
      {di.map(([id,addr,c],k) => <Handle key={id} type="target" position={Position.Top} id={id} title={`${addr} · ${id}`} style={{ ...hStyle(sim.di&&sim.di[k] ? c : '#39414d'), left: dx(k), top: 13 }} />)}
      {bot.map((t,k) => t.id ? <Handle key={t.id} type="source" position={Position.Bottom} id={t.id} title={`Q0${t.lab} (relay)`} style={{ ...hStyle(sim.q&&sim.q[+t.id.slice(1)] ? GRN : '#2a4035'), left: bx(k), top: H-13 }} /> : null)}
      <Handle type="target" position={Position.Right} id="lplus" title="L+ 24 VDC" style={{ ...hStyle('#e5534b'), top: 50 }} />
      <Handle type="target" position={Position.Right} id="m"     title="M 0 V"     style={{ ...hStyle(AIR), top: 80 }} />
      <svg width={W} height={H}>
        <rect x="0" y="0" width={W} height={H} rx="8" fill="#3a3f47" stroke="#15181d" strokeWidth="2" />
        {/* top terminal strip (DI terminals) */}
        <rect x="6" y="3" width={W-12} height="22" rx="4" fill="#2b3038" stroke="#1c2026" />
        <text x="12" y="16" fill="#7a828c" fontSize="7" fontWeight="bold">DIa</text>
        {di.map(([id,addr,c],k) => <g key={'t'+k}>
          <circle cx={dx(k)} cy="14" r="4.6" fill="#15181d" stroke="#5a6470" />
          <line x1={dx(k)-2.4} y1="14" x2={dx(k)+2.4} y2="14" stroke="#778595" strokeWidth="1.1" />
          <text x={dx(k)} y="35" fill="#8b949e" fontSize="6.5" textAnchor="middle">{addr.slice(1)}</text>
        </g>)}
        <rect x={dx(14)-9} y="1" width={dx(15)-dx(14)+18} height="35" rx="3" fill="none" stroke="#4a5a6a" strokeDasharray="2 2" />
        <text x={(dx(14)+dx(15))/2} y="45" fill="#6e7681" fontSize="6.5" textAnchor="middle">SM 1221</text>
        {/* DI status LEDs (green) — lit by the sim OR by a pressed bound element */}
        {di.map(([id,addr,c],k) => {
          const onLed = (sim.di && sim.di[k]) || !!active[PLC_ADDR[id]];
          return <circle key={'dl'+k} cx={dx(k)} cy="48" r="3" fill={onLed?'#39d98a':'#243027'} />;
        })}
        {/* RUN / STOP / ERROR */}
        <circle cx="24" cy="68" r="4" fill={sim.sysOn&&!sim.emerg?GRN:'#262b33'} /><text x="33" y="71" fill="#9aa0a8" fontSize="8">RUN</text>
        <circle cx="24" cy="84" r="4" fill={!sim.sysOn?AMB:'#262b33'} /><text x="33" y="87" fill="#9aa0a8" fontSize="8">STOP</text>
        <circle cx="24" cy="100" r="4" fill={sim.emerg?'#e5534b':'#262b33'} /><text x="33" y="103" fill="#9aa0a8" fontSize="8">ERROR</text>
        {/* brand and model */}
        <text x="116" y="82" fill="#eef1f5" fontFamily="Arial" fontWeight="bold" fontSize="20">SPI-DRY</text>
        <text x="116" y="100" fill="#aab0b8" fontSize="10">UTM-S9-MEC</text>
        <text x={W-46} y="70" fill="#aab0b8" fontSize="11" textAnchor="end">CPU 231043</text>
        <text x={W-46} y="85" fill="#9aa0a8" fontSize="10" textAnchor="end">AC/DC/RLY</text>
        {/* power supply terminals (right side) */}
        <text x={W-7} y="44" fill="#e5534b" fontSize="9" fontWeight="bold" textAnchor="end">L+</text>
        <text x={W-7} y="54" fill="#e5534b" fontSize="6.5" textAnchor="end">+24V</text>
        <text x={W-7} y="78" fill={AIR} fontSize="9" fontWeight="bold" textAnchor="end">M</text>
        <text x={W-7} y="88" fill={AIR} fontSize="6.5" textAnchor="end">0V</text>
        {/* PROFINET */}
        <rect x="116" y={H-64} width="30" height="22" rx="3" fill="#2ec27e" />
        <text x="131" y={H-67} fill="#7a828c" fontSize="6.5" textAnchor="middle">PROFINET</text>
        {/* DQ status LEDs (red = relay) — lit by the sim OR by a coil the PLC drives */}
        {bot.map((t,k) => { if (!t.id) return null;
          const onLed = (sim.q && sim.q[+t.id.slice(1)]) || !!activeOut[PLC_ADDR[t.id]];
          return <circle key={'ql'+k} cx={bx(k)} cy={H-46} r="3" fill={onLed?'#e5534b':'#302424'} />;
        })}
        {/* bottom terminal strip (RELAY OUTPUTS) */}
        <rect x="6" y={H-25} width={W-12} height="22" rx="4" fill="#2b3038" stroke="#1c2026" />
        <text x="12" y={H-11} fill="#7a828c" fontSize="7" fontWeight="bold">DQa</text>
        {bot.map((t,k) => <g key={'b'+k}>
          <circle cx={bx(k)} cy={H-14} r="4.6" fill="#15181d" stroke="#5a6470" />
          <line x1={bx(k)-2.4} y1={H-14} x2={bx(k)+2.4} y2={H-14} stroke="#778595" strokeWidth="1.1" />
          <text x={bx(k)} y={H-30} fill={t.lab[0]==='.'?'#8b949e':'#e3b341'} fontSize="6.5" textAnchor="middle">{t.lab}</text>
        </g>)}
        <text x={W-92} y={H-11} fill="#7a828c" fontSize="7">RELAY OUTPUTS</text>
      </svg>
    </div>
  );
}

// ---------- Push button ----------
export function ButtonNode({ data }){
  const [pressed, setPressed] = useState(false);
  const lit = data.on || pressed;
  return (
    <div onClick={data.onClick}
         onPointerDown={() => { setPressed(true); setInput(data.io, true); }}
         onPointerUp={() => { setPressed(false); setInput(data.io, false); }}
         onPointerLeave={() => { setPressed(false); setInput(data.io, false); }}
         style={{ width:56, height:70, position:'relative', cursor:'pointer' }}>
      {data.io && <IoBadge addr={data.io} />}
      <Handle type="source" position={Position.Bottom} id="out" style={hStyle(data.col)} />
      <svg width="56" height="70">
        <rect x="6" y="2" width="44" height="44" rx="7" fill="#0f1217" stroke="#000" />
        <circle cx="28" cy="24" r={pressed ? 12.5 : 16} fill={lit?data.col:'#1b2027'} stroke="rgba(0,0,0,.5)" style={{ transition:'r .07s ease' }} />
        {lit && <circle cx="28" cy="24" r="20" fill="none" stroke={data.col} strokeWidth="2.5" />}
        <text x="28" y="60" fill="#aab0b8" fontSize="9" fontWeight="bold" textAnchor="middle">{data.lab}</text>
      </svg>
    </div>
  );
}

// ---------- Emergency-stop mushroom button ----------
export function MushNode({ data }){
  const [pressed, setPressed] = useState(false);
  return (
    <div onClick={data.onClick}
         onPointerDown={() => { setPressed(true); setInput(data.io, true); }}
         onPointerUp={() => { setPressed(false); setInput(data.io, false); }}
         onPointerLeave={() => { setPressed(false); setInput(data.io, false); }}
         style={{ width:60, height:74, position:'relative', cursor:'pointer' }}>
      {data.io && <IoBadge addr={data.io} />}
      <Handle type="source" position={Position.Bottom} id="out" style={hStyle('#e5534b')} />
      <svg width="60" height="74">
        <rect x="6" y="2" width="48" height="48" rx="7" fill="#0f1217" />
        <circle cx="30" cy="26" r={pressed ? 16.5 : 20} fill={data.on?'#ff5247':'#7a1f1a'} stroke="rgba(0,0,0,.5)" strokeWidth="2" style={{ transition:'r .07s ease' }} />
        <circle cx="30" cy="26" r="10" fill="none" stroke="rgba(0,0,0,.4)" />
        <text x="30" y="66" fill="#aab0b8" fontSize="9" fontWeight="bold" textAnchor="middle">EMERG</text>
      </svg>
    </div>
  );
}

// ---------- Module: double-acting cylinder (ISO 1219) + 5/2 valve + sensors ----------
export function ModuleNode({ data }){
  const { i, pos = 0, on = false } = data;
  const W = 252, H = 150;
  const bx = 16, by = 24, bw = 96, bh = 30, midY = by + bh/2;
  const px = bx + 6 + pos * (bw - 20);
  const x_r = bx + bw + 6, travel = 102, pataW = 16, pataX = x_r + pos * travel;
  const xa0 = x_r + pataW/2, xa1 = x_r + travel + pataW/2;
  const vx = bx + bw/2 - 26, vy = by + bh + 26, B = 26;
  const dn = pos <= 0.001, upp = pos >= 0.999;
  const tri = (cx2) => `M${cx2-5} ${vy+B+8} L${cx2+5} ${vy+B+8} L${cx2} ${vy+B+16} Z`;
  return (
    <div title={'Double-acting cylinder '+(i+1)+'A  +  5/2 solenoid valve '+(i+1)+'V1'} style={{ width:W, height:H, position:'relative' }}>
      {data.io && <IoBadge addr={data.io} />}
      <Handle type="target" position={Position.Left}   id="sol" title="Pilot 14 — solenoid Y" style={{ ...hStyle(GRN), top: vy+B/2 }} />
      <Handle type="source" position={Position.Top}    id="a0"  title="Limit switch a0 — HOME (rod retracted)" style={{ ...hStyle('#d68b2a'), left: xa0 }} />
      <Handle type="source" position={Position.Top}    id="a1"  title="Limit switch a1 — END (rod extended)" style={{ ...hStyle(AMB), left: xa1 }} />
      <Handle type="target" position={Position.Bottom} id="air" title="Port 1 (P) — supply pressure" style={{ ...hStyle(AIR), left: vx+B }} />
      <svg width={W} height={H}>
        {/* symmetry axis + rod travel guide */}
        <line x1={bx-6} y1={midY} x2={bx+bw} y2={midY} stroke="#3a414c" strokeWidth="0.8" strokeDasharray="6 2 1.5 2" />
        <line x1={x_r} y1={midY} x2={xa1+8} y2={midY} stroke="#2a3340" strokeWidth="0.8" strokeDasharray="3 3" />
        {/* barrel + end caps */}
        <rect x={bx} y={by} width={bw} height={bh} fill="#171d26" stroke="#5a6470" strokeWidth="1.8" />
        <rect x={bx} y={by} width="4" height={bh} fill="#2a3340" />
        <rect x={bx+bw-4} y={by} width="4" height={bh} fill="#2a3340" />
        {/* adjustable cushioning */}
        <rect x={bx+7} y={midY-5} width="6" height="10" fill="none" stroke="#6e7681" strokeWidth="0.9" />
        <line x1={bx+5} y1={midY+6} x2={bx+15} y2={midY-6} stroke="#6e7681" strokeWidth="0.9" />
        <rect x={bx+bw-13} y={midY-5} width="6" height="10" fill="none" stroke="#6e7681" strokeWidth="0.9" />
        <line x1={bx+bw-15} y1={midY+6} x2={bx+bw-5} y2={midY-6} stroke="#6e7681" strokeWidth="0.9" />
        {/* piston + long rod + leg (cam that trips the limit switches) */}
        <rect x={px} y={by+3} width="7" height={bh-6} fill={on?GRN:'#9aa3ad'} />
        <line x1={px+7} y1={midY} x2={pataX} y2={midY} stroke={on?GRN:'#aab1ba'} strokeWidth="4" />
        <rect x={pataX} y={midY-9} width={pataW} height="18" fill={on?GRN:METAL} />
        <text x={pataX+pataW/2} y={midY+4} fill="#0b0e13" fontSize="10" fontWeight="bold" textAnchor="middle">{LEG[i]}</text>
        <text x={bx} y={by-7} fill={MUT} fontSize="11" fontWeight="bold">{(i+1)+'A'}</text>
        {/* limit switch a0 — HOME end of travel (rod retracted); roller facing down */}
        <g stroke="#5a6470" strokeWidth="1.1" fill="none">
          <rect x={xa0-5} y={midY-26} width="10" height="11" fill="#0e1116" />
          <line x1={xa0} y1={midY-15} x2={xa0-6} y2={midY-10} />
          <circle cx={xa0-7} cy={midY-9} r="2.3" />
        </g>
        <circle cx={xa0} cy={midY-20.5} r="2" fill={dn?'#d68b2a':'#444c56'} />
        <line x1={xa0} y1={midY-26} x2={xa0} y2="0" stroke="#5a6470" strokeWidth="1" />
        <text x={xa0+9} y={midY-18} fill={MUT} fontSize="7">a0</text>
        {/* limit switch a1 — FAR end of travel (rod extended); roller facing down */}
        <g stroke="#5a6470" strokeWidth="1.1" fill="none">
          <rect x={xa1-5} y={midY-26} width="10" height="11" fill="#0e1116" />
          <line x1={xa1} y1={midY-15} x2={xa1-6} y2={midY-10} />
          <circle cx={xa1-7} cy={midY-9} r="2.3" />
        </g>
        <circle cx={xa1} cy={midY-20.5} r="2" fill={upp?GRN:'#444c56'} />
        <line x1={xa1} y1={midY-26} x2={xa1} y2="0" stroke="#5a6470" strokeWidth="1" />
        <text x={xa1+9} y={midY-18} fill={MUT} fontSize="7">a1</text>
        {/* chamber letters A/B */}
        <text x={bx+14} y={by+bh+9} fill={MUT} fontSize="7" textAnchor="middle">A</text>
        <text x={bx+bw-14} y={by+bh+9} fill={MUT} fontSize="7" textAnchor="middle">B</text>
        {/* valve -> cylinder connections (4->A extends, 2->B retracts) */}
        <polyline points={`${vx+8},${vy} ${vx+8},${by+bh+11} ${bx+14},${by+bh+11} ${bx+14},${by+bh}`} fill="none" stroke={on?AIR:'#39414d'} strokeWidth="2" />
        <polyline points={`${vx+2*B-8},${vy} ${vx+2*B-8},${by+bh+19} ${bx+bw-14},${by+bh+19} ${bx+bw-14},${by+bh}`} fill="none" stroke={!on?AIR:'#39414d'} strokeWidth="2" />
        {/* 5/2 valve */}
        <rect x={vx} y={vy} width={B} height={B} fill={on?'rgba(74,163,255,.18)':'#11161d'} stroke="#5a6470" strokeWidth="1.5" />
        <rect x={vx+B} y={vy} width={B} height={B} fill={!on?'rgba(74,163,255,.18)':'#11161d'} stroke="#5a6470" strokeWidth="1.5" />
        <defs>
          <marker id={'ahB'+i} markerWidth="6" markerHeight="6" refX="4.6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill={AIR} /></marker>
          <marker id={'ahG'+i} markerWidth="6" markerHeight="6" refX="4.6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#5a6470" /></marker>
        </defs>
        <g strokeWidth="1.2" fill="none">
          {/* left box (pilot 14): active when ON */}
          <g stroke={on?AIR:'#5a6470'} markerEnd={`url(#${on?'ahB':'ahG'}${i})`}>
            <line x1={vx+B/2} y1={vy+B-5} x2={vx+6} y2={vy+6} />
            <line x1={vx+B-6} y1={vy+6} x2={vx+B-6} y2={vy+B-5} />
          </g>
          {/* right box (rest, spring 12): active when OFF */}
          <g stroke={!on?AIR:'#5a6470'} markerEnd={`url(#${!on?'ahB':'ahG'}${i})`}>
            <line x1={vx+B+B/2} y1={vy+B-5} x2={vx+2*B-6} y2={vy+6} />
            <line x1={vx+B+6} y1={vy+6} x2={vx+B+6} y2={vy+B-5} />
          </g>
        </g>
        {/* solenoid 14 + spring 12 */}
        <rect x={vx-15} y={vy} width="15" height={B} fill="none" stroke="#5a6470" strokeWidth="1.5" />
        <line x1={vx-12} y1={vy+3} x2={vx-3} y2={vy+B-3} stroke={on?GRN:'#6e7681'} strokeWidth="1.5" />
        <text x={vx-18} y={vy+10} fill={on?GRN:MUT} fontSize="9" textAnchor="end">{'Y_'+LEG[i]}</text>
        <text x={vx-8} y={vy-3} fill={MUT} fontSize="7" textAnchor="middle">14</text>
        <path d={`M${vx+2*B} ${vy+6} L${vx+2*B+2} ${vy+B-6} M${vx+2*B+4} ${vy+6} L${vx+2*B+6} ${vy+B-6} M${vx+2*B+8} ${vy+6} L${vx+2*B+10} ${vy+B-6}`} stroke="#6e7681" strokeWidth="1.2" fill="none" />
        <text x={vx+2*B+5} y={vy-3} fill={MUT} fontSize="7" textAnchor="middle">12</text>
        {/* port numbering */}
        <text x={vx+8} y={vy-3} fill={MUT} fontSize="8" textAnchor="middle">4</text>
        <text x={vx+2*B-8} y={vy-3} fill={MUT} fontSize="8" textAnchor="middle">2</text>
        <text x={vx+8} y={vy+B+10} fill={MUT} fontSize="8" textAnchor="middle">5</text>
        <text x={vx+B} y={vy+B+10} fill={MUT} fontSize="8" textAnchor="middle">1</text>
        <text x={vx+2*B-8} y={vy+B+10} fill={MUT} fontSize="8" textAnchor="middle">3</text>
        {/* exhausts 3,5 with silencer */}
        <line x1={vx+8} y1={vy+B} x2={vx+8} y2={vy+B+8} stroke="#39414d" strokeWidth="2" />
        <path d={tri(vx+8)} fill="none" stroke="#6e7681" />
        <line x1={vx+2*B-8} y1={vy+B} x2={vx+2*B-8} y2={vy+B+8} stroke="#39414d" strokeWidth="2" />
        <path d={tri(vx+2*B-8)} fill="none" stroke="#6e7681" />
      </svg>
    </div>
  );
}

// ---------- Pneumatic supply: compressor → tank → FRL → gauge ----------
export function SupplyNode(){
  return (
    <div style={{ width:300, height:64, position:'relative' }}>
      <Handle type="source" position={Position.Top} id="air" style={{ ...hStyle(AIR), left: 270 }} />
      <svg width="300" height="64">
        <circle cx="22" cy="30" r="15" fill="none" stroke="#9aa0a8" strokeWidth="1.6" />
        <path d="M16 23 L16 37 L30 30 Z" fill="#9aa0a8" />
        <text x="22" y="58" fill="#9aa0a8" fontSize="9" textAnchor="middle">Compressor</text>
        <line x1="37" y1="30" x2="62" y2="30" stroke={AIR} strokeWidth="2.4" />
        <rect x="62" y="14" width="30" height="32" rx="8" fill="#10151c" stroke="#9aa0a8" />
        <text x="77" y="58" fill="#9aa0a8" fontSize="9" textAnchor="middle">Tank</text>
        <line x1="92" y1="30" x2="116" y2="30" stroke={AIR} strokeWidth="2.4" />
        <rect x="116" y="18" width="14" height="24" fill="none" stroke="#9aa0a8" />
        <rect x="130" y="18" width="14" height="24" fill="none" stroke="#9aa0a8" />
        <rect x="144" y="18" width="14" height="24" fill="none" stroke="#9aa0a8" />
        <text x="137" y="58" fill="#9aa0a8" fontSize="9" textAnchor="middle">FRL</text>
        <line x1="158" y1="30" x2="182" y2="30" stroke={AIR} strokeWidth="2.4" />
        <circle cx="198" cy="30" r="14" fill="none" stroke="#9aa0a8" strokeWidth="1.6" />
        <line x1="198" y1="30" x2="206" y2="22" stroke={AMB} strokeWidth="1.6" />
        <text x="198" y="58" fill="#9aa0a8" fontSize="9" textAnchor="middle">Gauge</text>
        <line x1="212" y1="30" x2="270" y2="30" stroke={AIR} strokeWidth="2.6" />
        <line x1="270" y1="30" x2="270" y2="6" stroke={AIR} strokeWidth="2.6" />
      </svg>
    </div>
  );
}

// ---------- 24 VDC power supply ----------
export function Supply24Node(){
  return (
    <div style={{ width:90, height:80, position:'relative' }}>
      <Handle type="source" position={Position.Left} id="plus"  style={{ ...hStyle('#e5534b'), top: 24 }} />
      <Handle type="source" position={Position.Left} id="minus" style={{ ...hStyle(AIR), top: 56 }} />
      <svg width="90" height="80">
        <line x1="45" y1="14" x2="45" y2="24" stroke="#cdd9e5" strokeWidth="2" />
        <line x1="32" y1="24" x2="58" y2="24" stroke="#cdd9e5" strokeWidth="2" />
        <line x1="38" y1="32" x2="52" y2="32" stroke="#cdd9e5" strokeWidth="4" />
        <line x1="45" y1="32" x2="45" y2="56" stroke="#cdd9e5" strokeWidth="2" />
        <text x="26" y="22" fill="#e5534b" fontSize="13" fontWeight="bold" textAnchor="end">+</text>
        <text x="26" y="36" fill={AIR} fontSize="13" fontWeight="bold" textAnchor="end">–</text>
        <text x="45" y="74" fill="#9aa0a8" fontSize="10" fontWeight="bold" textAnchor="middle">24 VDC</text>
      </svg>
    </div>
  );
}

// ---------- Signal tower ----------
export function TowerNode({ data }){
  const sim = data.sim || {};
  const seg = [['#e5534b', sim.emerg], ['#e3b341', false], [GRN, sim.sysOn && !sim.emerg]];
  return (
    <div title="Signal tower (lamps driven by Q outputs)" style={{ width:46, height:100, position:'relative' }}>
      <Handle type="target" position={Position.Right} id="in_run" title="H_RUN ← Q0.6 (signal)" style={{ ...hStyle(GRN), top: 30 }} />
      <Handle type="target" position={Position.Right} id="in_emg" title="H_EMG ← Q0.7 (signal)" style={{ ...hStyle(GRN), top: 56 }} />
      <Handle type="source" position={Position.Bottom} id="com" title="Common 0 V (return to M)" style={{ ...hStyle('#539bf5'), left: 23 }} />
      <svg width="46" height="100">
        {seg.map((sgmt, k) => <rect key={k} x="8" y={6+k*26} width="30" height="24" rx="5"
          fill={sgmt[1] ? sgmt[0] : '#23262c'} stroke="rgba(0,0,0,.35)" />)}
        <rect x="6" y="86" width="34" height="10" rx="3" fill="#1b1f27" />
      </svg>
    </div>
  );
}

export const nodeTypes = {
  plc: PLCNode, button: ButtonNode, mush: MushNode, module: ModuleNode,
  supply: SupplyNode, supply24: Supply24Node, tower: TowerNode,
};
