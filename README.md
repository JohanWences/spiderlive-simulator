# SpiderLive Simulator

![SpiderLive Simulator — overview of the electro-pneumatic circuit](docs/screenshot.png)

Interactive **electro-pneumatic** web simulator built with **React + Vite + React Flow**.
It models a fairground "flying spider" ride: 6 pneumatic cylinders driven by a PLC running a
22-step sequence (port of a verified Structured Text program).

Every circuit component is a **node with ports (handles)** and every wire —electrical **and**
pneumatic— is an **edge** that React Flow routes and keeps connected on its own as you move the nodes.

## Running it

Requires **Node.js**. In this folder:

```bash
npm install      # installs React, Vite and React Flow (one time)
npm run dev      # starts the dev server (http://localhost:5173)
```

For a static build ready to publish:

```bash
npm run build    # generates /dist
npm run preview  # serves /dist locally
```

## Features

- **Native connections**: wires are edges between handles; they re-route themselves when you
  drag nodes, with no manual coordinate math.
- **Pan / zoom / drag** out of the box (mouse wheel + Controls bar).
- **Animated, state-colored edges**: active output → bright green, a1 sensor → amber,
  air → blue, power → red/blue.
- The **panel buttons** are clickable and the PLC runs the full 22-step sequence.

## Structure

```
src/
├─ engine.js     ← pure PLC logic (22 steps)
├─ nodes.jsx     ← node components (PLC, cylinder+valve module, buttons, FRL, 24 VDC, signal tower)
├─ App.jsx       ← graph (nodes + edges), simulation loop, controls
└─ main.jsx
```

## Ideas for contributing

- Wire the `a0` sensor of every cylinder (currently only `a1` is wired as a sample; ~6 more edges).
- Turn it into an **editor**: a component palette with drag-and-drop and free wiring
  (React Flow's `onConnect` already provides the basis).
- Improve the node graphics toward ISO 1219 / IEC 60617 standard symbols.

Pull requests are welcome. For major changes, please open an issue first to discuss
what you would like to change.

## License

[MIT](LICENSE)
