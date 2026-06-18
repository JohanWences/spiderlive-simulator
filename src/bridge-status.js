import { useSyncExternalStore } from 'react';

// Live status of the SpiderLive Bridge, shared app-wide (the Bridge panel + the
// connection badge read from here). Fed by bridge.js as messages arrive.
let status = {
  wsConnected: false,    // browser ↔ bridge (WebSocket)
  plcConnected: false,   // bridge ↔ OpenPLC (Modbus master polling)
  coils: [],             // %QX OpenPLC is driving
  inputs: [],            // %IX SpiderLive is sending
  lastUpdate: 0,
  lastCommand: null,     // { cmd, ok, message, at } — result of a panel action (e.g. configure)
  busy: null,            // cmd currently running (button spinner)
};
const subs = new Set();

export const setBridgeStatus = (patch) => {
  status = { ...status, ...patch };
  subs.forEach(f => f());
};

export const useBridgeStatus = () =>
  useSyncExternalStore(cb => { subs.add(cb); return () => subs.delete(cb); }, () => status, () => status);

// Selective subscription: re-renders only when the WS link flips (not on every status tick).
export const useWsConnected = () =>
  useSyncExternalStore(cb => { subs.add(cb); return () => subs.delete(cb); }, () => status.wsConnected, () => status.wsConnected);
