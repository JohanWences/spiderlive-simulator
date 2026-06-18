// Single, app-wide connection to the SpiderLive Bridge. Lives outside React so it
// survives canvas remounts and tab switches (one socket, no reconnect storms). It:
//   - streams the active %IX inputs to the bridge (a pressed bound button → OpenPLC)
//   - receives the %QX coils OpenPLC drives → lights the output LEDs
//   - tracks the live status (WS + OpenPLC connection, I/O) for the Bridge panel
//   - relays panel commands (e.g. "configure OpenPLC") to the bridge
import { setOutputs, IN_ADDRS, getActiveInputs, subscribeInputs } from './inputs.js';
import { setBridgeStatus } from './bridge-status.js';

const URL = 'ws://localhost:8080';
let ws = null, started = false, retry = null;

const send = (obj) => { if (ws && ws.readyState === 1) { ws.send(JSON.stringify(obj)); return true; } return false; };
const sendInputs = () => { const a = getActiveInputs(); send({ type: 'inputs', inputs: IN_ADDRS.map(x => !!a[x]) }); };

// Ask the bridge to run an action (e.g. 'setup-openplc'). The reply arrives as
// {type:'command-result'} and lands in bridge-status.lastCommand.
export const bridgeCommand = (cmd) => {
  setBridgeStatus({ busy: cmd, lastCommand: null });
  const ok = send({ type: 'command', cmd });
  if (!ok) setBridgeStatus({ busy: null, lastCommand: { cmd, ok: false, message: 'Bridge offline — run: npx spiderlive-bridge', at: Date.now() } });
};

const connect = () => {
  try { ws = new WebSocket(URL); } catch { retry = setTimeout(connect, 3000); return; }
  ws.onopen = () => { setBridgeStatus({ wsConnected: true }); sendInputs(); };
  ws.onclose = () => { setBridgeStatus({ wsConnected: false, plcConnected: false }); ws = null; retry = setTimeout(connect, 3000); };
  ws.onerror = () => { try { ws.close(); } catch {} };
  ws.onmessage = (ev) => {
    let m; try { m = JSON.parse(ev.data); } catch { return; }
    if (m.type === 'coils') { setOutputs(m.coils); setBridgeStatus({ coils: m.coils }); }
    else if (m.type === 'status') { setOutputs(m.coils); setBridgeStatus({ plcConnected: !!m.plcConnected, coils: m.coils, inputs: m.inputs, lastUpdate: Date.now() }); }
    else if (m.type === 'command-result') { setBridgeStatus({ busy: null, lastCommand: { cmd: m.cmd, ok: !!m.ok, message: m.message, at: Date.now() } }); }
  };
};

export const startBridge = () => {
  if (started) return;
  started = true;
  subscribeInputs(sendInputs);                                   // push inputs whenever a bound element changes
  connect();
};
