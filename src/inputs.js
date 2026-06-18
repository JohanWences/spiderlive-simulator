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
