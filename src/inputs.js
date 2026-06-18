import { useSyncExternalStore } from 'react';

// Shared store of input addresses currently active (e.g. a bound button being pressed).
// A button sets its address active; the PLC lights the matching DI LED.
let active = {};                       // { '%IX0.0': true, ... }
const subs = new Set();

export const setInput = (addr, on) => {
  if (!addr) return;
  const has = !!active[addr];
  if (!!on === has) return;            // no change
  active = { ...active };
  if (on) active[addr] = true; else delete active[addr];
  subs.forEach(f => f());
};

export const useActiveInputs = () =>
  useSyncExternalStore(cb => { subs.add(cb); return () => subs.delete(cb); }, () => active, () => active);

// Non-hook access for the bridge singleton (which lives outside React).
export const getActiveInputs = () => active;
export const subscribeInputs = (cb) => { subs.add(cb); return () => subs.delete(cb); };

// Clears every held input (e.g. when the simulation stops).
export const clearActiveInputs = () => { if (!Object.keys(active).length) return; active = {}; subs.forEach(f => f()); };

// Simulation run state — true only while Start is active. While Stopped the canvas is
// in edit mode: buttons are inert (draggable, no signals), so arranging never fires inputs.
let running = false;
const runSubs = new Set();
export const setRunning = (on) => { if (running === !!on) return; running = !!on; runSubs.forEach(f => f()); };
export const useRunning = () =>
  useSyncExternalStore(cb => { runSubs.add(cb); return () => runSubs.delete(cb); }, () => running, () => running);

// Address ↔ bridge register index (must match the bridge's I/O map + the PLC terminals).
export const IN_ADDRS = ['%IX0.0','%IX0.1','%IX0.2','%IX0.3','%IX0.4','%IX0.5','%IX0.6','%IX0.7','%IX1.0','%IX1.1','%IX1.2','%IX1.3','%IX1.4','%IX1.5','%IX8.0','%IX8.1'];
export const OUT_ADDRS = ['%QX0.0','%QX0.1','%QX0.2','%QX0.3','%QX0.4','%QX0.5','%QX0.6','%QX0.7'];

// Outputs (coils) the PLC is driving — fed from the bridge; lights output LEDs / elements.
let activeOut = {};
const outSubs = new Set();
const sameMap = (a, b) => { const ka = Object.keys(a), kb = Object.keys(b); return ka.length === kb.length && ka.every(k => b[k]); };

export const setOutputs = (coils) => {
  const next = {};
  OUT_ADDRS.forEach((a, i) => { if (coils && coils[i]) next[a] = true; });
  if (sameMap(next, activeOut)) return;
  activeOut = next;
  outSubs.forEach(f => f());
};

export const useActiveOutputs = () =>
  useSyncExternalStore(cb => { outSubs.add(cb); return () => outSubs.delete(cb); }, () => activeOut, () => activeOut);
