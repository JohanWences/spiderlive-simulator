// SpiderLive Bridge
// ------------------
// Connects OpenPLC (Modbus TCP master) to the SpiderLive web simulator (browser).
//
//   [OpenPLC Runtime] --Modbus TCP--> [this bridge] --WebSocket--> [SpiderLive browser]
//        master                          slave/relay                   virtual plant
//
// The bridge holds the plant I/O state and relays it both ways:
//   - OpenPLC writes COILS (the actuators). We push them to the browser.
//   - The browser sends DISCRETE INPUTS (sensors/buttons). OpenPLC reads them.
//
// ---- I/O MAP ----
// Coils (PLC outputs → plant): OpenPLC writes, SpiderLive reads
//   0..5   solenoid of cylinder A..F   (Q0.0 .. Q0.5)
//   6      signal tower green (running) (Q0.6)
//   7      signal tower red (emergency) (Q0.7)
// Discrete inputs (plant → PLC): SpiderLive writes, OpenPLC reads
//   0      START button     (I0.0)
//   1      STOP 1           (I0.1)
//   2      STOP 2           (I0.2)
//   3      EMERGENCY        (I0.3)
//   4..9   a1 extended  cylinder A..F  (I0.4 .. I1.1)
//   10..15 a0 retracted cylinder A..F  (I1.2 .. I8.1)

import ModbusRTU from 'modbus-serial';
import { WebSocketServer } from 'ws';

const MODBUS_HOST = process.env.MODBUS_HOST || '0.0.0.0';
const MODBUS_PORT = Number(process.env.MODBUS_PORT || 502);
const WS_PORT     = Number(process.env.WS_PORT || 8080);
const UNIT_ID     = Number(process.env.UNIT_ID || 1);

const N_COILS = 8;
const N_INPUTS = 16;

const coils = new Array(N_COILS).fill(false);          // PLC → plant (OpenPLC writes)
const inputs = new Array(N_INPUTS).fill(false);        // plant → PLC (SpiderLive writes)

const ts = () => new Date().toISOString().slice(11, 19);
const log = (...a) => console.log(`[${ts()}]`, ...a);

// ---------------- WebSocket: talk to the SpiderLive browser ----------------
const wss = new WebSocketServer({ port: WS_PORT });

function broadcastCoils() {
  const payload = JSON.stringify({ type: 'coils', coils });
  for (const c of wss.clients) if (c.readyState === 1) c.send(payload);
}

wss.on('connection', (socket) => {
  log('SpiderLive connected (WebSocket)');
  socket.send(JSON.stringify({ type: 'coils', coils }));   // send current actuator state on connect
  socket.on('message', (data) => {
    let msg; try { msg = JSON.parse(data); } catch { return; }
    if (msg.type === 'inputs' && Array.isArray(msg.inputs)) {
      for (let i = 0; i < N_INPUTS; i++) inputs[i] = !!msg.inputs[i];
    }
  });
  socket.on('close', () => log('SpiderLive disconnected'));
});

// ---------------- Modbus TCP slave: talk to OpenPLC ----------------
let coilsDirty = false;
const vector = {
  getCoil:          (addr) => !!coils[addr],
  getDiscreteInput: (addr) => !!inputs[addr],
  getInputRegister: () => 0,
  getHoldingRegister: () => 0,
  setCoil: (addr, value) => {
    if (addr < N_COILS && coils[addr] !== !!value) { coils[addr] = !!value; coilsDirty = true; }
  },
  setRegister: () => {},
};

const server = new ModbusRTU.ServerTCP(vector, { host: MODBUS_HOST, port: MODBUS_PORT, debug: false, unitID: UNIT_ID });

server.on('socketConnection', () => log('OpenPLC connected (Modbus TCP)'));
server.on('socketError', (err) => log('Modbus socket error:', err.message));
server.on('serverError', (err) => log('Modbus server error:', err.message));

// OpenPLC writes coils one-by-one within a scan; coalesce and push once per tick.
setInterval(() => { if (coilsDirty) { coilsDirty = false; broadcastCoils(); } }, 20);

log(`SpiderLive Bridge running`);
log(`  Modbus TCP slave : ${MODBUS_HOST}:${MODBUS_PORT}  (unit ${UNIT_ID})  ← add as a Slave Device in OpenPLC`);
log(`  WebSocket server : ws://localhost:${WS_PORT}        ← the SpiderLive browser connects here`);
log(`  I/O: 8 coils (solenoids + tower) · 16 discrete inputs (buttons + a0/a1 sensors)`);

process.on('SIGINT', () => { log('shutting down'); process.exit(0); });
