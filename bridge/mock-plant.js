// Mock plant — a tiny stand-in for the SpiderLive browser, to test the bridge
// (and the full OpenPLC → bridge loop) from the terminal.
//
// It connects to the bridge over WebSocket, simulates 6 cylinders moving when
// their solenoid coil is energized, and reports a0/a1 sensors back. It also
// pulses the START button once at boot.

import WebSocket from 'ws';

const WS_URL = process.env.WS_URL || 'ws://localhost:8080';
const SPEED = 0.9;                 // travel per second (0..1)

const pos = [0, 0, 0, 0, 0, 0];    // 0 = retracted, 1 = extended
let coils = new Array(8).fill(false);
const inputs = new Array(16).fill(false);

const ts = () => new Date().toISOString().slice(11, 19);
const ws = new WebSocket(WS_URL);

ws.on('open', () => {
  console.log(`[${ts()}] mock plant connected to ${WS_URL}`);
  inputs[0] = true;                                  // pulse START
  setTimeout(() => { inputs[0] = false; }, 300);
});
ws.on('message', (data) => {
  try { const m = JSON.parse(data); if (m.type === 'coils') coils = m.coils; } catch {}
});
ws.on('error', (e) => console.error(`[${ts()}] WS error:`, e.message));
ws.on('close', () => { console.log(`[${ts()}] disconnected`); process.exit(0); });

let prev = Date.now();
setInterval(() => {
  const now = Date.now(); const dt = (now - prev) / 1000; prev = now;
  for (let i = 0; i < 6; i++) {
    const target = coils[i] ? 1 : 0;                 // solenoid energized → extend
    if (pos[i] < target) pos[i] = Math.min(1, pos[i] + SPEED * dt);
    else if (pos[i] > target) pos[i] = Math.max(0, pos[i] - SPEED * dt);
    inputs[4 + i]  = pos[i] >= 0.999;                // a1 extended
    inputs[10 + i] = pos[i] <= 0.001;                // a0 retracted
  }
  if (ws.readyState === 1) ws.send(JSON.stringify({ type: 'inputs', inputs }));
}, 50);

// status line every second
setInterval(() => {
  const sol = coils.slice(0, 6).map(c => c ? '1' : '0').join('');
  const p = pos.map(x => x.toFixed(2)).join(' ');
  console.log(`[${ts()}] solenoids ${sol} | pos ${p} | tower G${coils[6] ? 1 : 0} R${coils[7] ? 1 : 0}`);
}, 1000);
