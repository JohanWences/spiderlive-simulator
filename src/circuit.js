// Continuity solver for user-built circuits.
// A lamp lights when its two terminals reach OPPOSITE supply rails (+ and −)
// through the wiring — exactly like a real circuit. No coil is read directly:
//   • wire + and − of the 24 V source across a lamp  → it lights
//   • go through a PLC relay output → that output is a SWITCH: when energized it
//     closes (ties its terminal to L+), completing the loop.
import { PLC_ADDR } from './nodes.jsx';

const OUT_HANDLES = Object.keys(PLC_ADDR).filter(h => (PLC_ADDR[h] || '').startsWith('%QX'));
const TOWER_LAMPS = ['in_emg', 'in_amber', 'in_run'];
const key = (n, h) => `${n}|${h}`;

// coilOn(addr) → is the PLC output at this %QX address energized? (the relay's coil)
export function solveCircuit(nodes, edges, coilOn) {
  const parent = new Map();
  const find = (x) => {
    if (!parent.has(x)) { parent.set(x, x); return x; }
    let r = x; while (parent.get(r) !== r) r = parent.get(r);
    while (parent.get(x) !== r) { const nx = parent.get(x); parent.set(x, r); x = nx; }
    return r;
  };
  const union = (a, b) => { const ra = find(a), rb = find(b); if (ra !== rb) parent.set(ra, rb); };

  // 1) wires tie the two handles into one electrical node
  edges.forEach(e => { if (e.sourceHandle && e.targetHandle) union(key(e.source, e.sourceHandle), key(e.target, e.targetHandle)); });

  // 2) PLC relay outputs: a closed (energized) contact ties its terminal to L+
  nodes.forEach(n => {
    if (n.type === 'plc') OUT_HANDLES.forEach(q => { if (coilOn(PLC_ADDR[q])) union(key(n.id, q), key(n.id, 'lplus')); });
  });

  // 3) seed the rails from every 24 V source
  const pos = new Set(), neg = new Set();
  nodes.forEach(n => { if (n.type === 'supply24') { pos.add(find(key(n.id, 'plus'))); neg.add(find(key(n.id, 'minus'))); } });
  const onPos = (k) => pos.has(find(k));
  const onNeg = (k) => neg.has(find(k));

  // 4) a lamp lights when its two terminals span + and − (either polarity)
  const res = {};
  nodes.forEach(n => {
    if (n.type !== 'tower' || !n.data || !n.data._static) return;
    const com = key(n.id, 'com');
    const lit = {};
    TOWER_LAMPS.forEach(h => { const a = key(n.id, h); lit[h] = (onPos(a) && onNeg(com)) || (onNeg(a) && onPos(com)); });
    res[n.id] = lit;
  });
  return res;
}
