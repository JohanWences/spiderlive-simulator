import { useEffect, useRef, useState } from 'react';
import { useActiveInputs, IN_ADDRS, setOutputs } from './inputs.js';

const BRIDGE_URL = 'ws://localhost:8080';

// Connects to the local SpiderLive Bridge and streams the active inputs to it,
// so a pressed bound button (e.g. %IX0.0) drives the matching %IX in OpenPLC via Modbus.
// Returns true while the bridge link is up.
export function useBridge() {
  const active = useActiveInputs();
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let stopped = false, retry;
    const connect = () => {
      if (stopped) return;
      let ws;
      try { ws = new WebSocket(BRIDGE_URL); } catch { retry = setTimeout(connect, 3000); return; }
      wsRef.current = ws;
      ws.onopen = () => setConnected(true);
      ws.onclose = () => { setConnected(false); if (wsRef.current === ws) wsRef.current = null; if (!stopped) retry = setTimeout(connect, 3000); };
      ws.onerror = () => { try { ws.close(); } catch {} };
      ws.onmessage = (ev) => { try { const m = JSON.parse(ev.data); if (m.type === 'coils') setOutputs(m.coils); } catch {} };
    };
    connect();
    return () => { stopped = true; clearTimeout(retry); try { wsRef.current?.close(); } catch {} };
  }, []);

  // push the current input vector whenever a bound element is pressed/released (and on connect)
  useEffect(() => {
    const ws = wsRef.current;
    if (ws && ws.readyState === 1) {
      ws.send(JSON.stringify({ type: 'inputs', inputs: IN_ADDRS.map(a => !!active[a]) }));
    }
  }, [active, connected]);

  return connected;
}
