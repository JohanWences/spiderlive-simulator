# SpiderLive Bridge

Connects **OpenPLC** (the real PLC runtime, Modbus TCP master) to the **SpiderLive**
web simulator (the virtual plant, in the browser).

```
[OpenPLC Runtime] ──Modbus TCP──▶ [bridge] ──WebSocket──▶ [SpiderLive browser]
   runs your ladder    master       slave/relay   plant      cylinders + sensors
```

OpenPLC runs your program and treats SpiderLive as its field I/O: it **writes the
solenoids** (coils) and **reads the sensors/buttons** (discrete inputs). The bridge
exists because a browser cannot speak raw Modbus TCP.

## Run it

Requires **Node.js**.

```bash
cd bridge
npm install
npm start          # starts the Modbus slave (:502) and the WebSocket server (:8080)
```

Ports are configurable: `MODBUS_PORT`, `WS_PORT`, `MODBUS_HOST`, `UNIT_ID`.

Test the loop without the browser (a terminal stand-in for the plant):

```bash
npm run mock       # in a second terminal — simulates the 6 cylinders + sensors
```

## I/O map

**Coils** — PLC outputs → plant (OpenPLC writes):

| Coil | Signal | PLC addr |
|----|--------|------|
| 0–5 | Solenoid, cylinder A–F | Q0.0–Q0.5 |
| 6 | Signal tower green (running) | Q0.6 |
| 7 | Signal tower red (emergency) | Q0.7 |

**Discrete inputs** — plant → PLC (OpenPLC reads):

| Input | Signal | PLC addr |
|----|--------|------|
| 0 | START button | I0.0 |
| 1 | STOP 1 | I0.1 |
| 2 | STOP 2 | I0.2 |
| 3 | EMERGENCY | I0.3 |
| 4–9 | a1 — extended, cylinder A–F | I0.4–I1.1 |
| 10–15 | a0 — retracted, cylinder A–F | I1.2–I8.1 |

## Configure OpenPLC

In the OpenPLC Editor/Runtime, add a **Slave Device** pointing at this bridge:

- **Protocol:** Modbus TCP
- **IP:** `127.0.0.1` (same machine) · **Port:** `502` · **Slave ID:** `1`
- **Discrete Inputs:** start `0`, size `16` → mapped to `%IX` (sensors + buttons)
- **Coils:** start `0`, size `8` → mapped to `%QX` (solenoids + tower)

Then write your ladder against those `%I` / `%Q` and run it. OpenPLC polls the bridge
every scan; SpiderLive reacts in real time.

> Next step: the SpiderLive browser app connects to `ws://localhost:8080` in
> "Connected (Modbus)" mode — solenoid coils drive the cylinders, and the a0/a1
> sensors + buttons are sent back to OpenPLC.
