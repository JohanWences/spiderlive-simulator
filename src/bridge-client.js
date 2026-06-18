import { useEffect } from 'react';
import { startBridge } from './bridge.js';
import { useWsConnected } from './bridge-status.js';

// Ensures the app-wide bridge connection is running and returns whether the
// browser ↔ bridge WebSocket is up (used for the toolbar "OpenPLC" badge).
// Uses a selective subscription so the canvas doesn't re-render on every status tick.
export function useBridge() {
  useEffect(() => { startBridge(); }, []);
  return useWsConnected();
}
