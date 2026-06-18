import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { ReactFlow, ReactFlowProvider, Background, Controls, ViewportPortal, useNodesState, useEdgesState, useReactFlow, addEdge, ConnectionMode } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { nodeTypes, edgeTypes, clearEdgePaths, edgeDragRegistry, PLC_ADDR } from './nodes.jsx';
import * as E from './engine.js';
import { makeNodes, makeEdges, paintNodes, paintEdges, savePos, LS_POS, loadIO, saveIO, loadCanvas, saveCanvas, loadLabels, saveLabels } from './graph.js';
import { IconPlay, IconPause } from './icons.jsx';
import { useBridge } from './bridge-client.js';
import { useActiveOutputs, setRunning, clearActiveInputs } from './inputs.js';
import { solveCircuit } from './circuit.js';
import { setProgram } from './files.js';
import spiderLiveLogo from './assets/spiderlive-logo.png';

// Default data for components dropped from the Library (kept renderable + crash-safe).
export const DROP_DATA = {
  plc:      () => ({ sim:{} }),
  module:   () => ({ i:null, pos:0, on:false }),
  button:   (lab) => ({ col:'#444c56', on:false, lab: lab || 'Push button', onClick:()=>{} }),
  mush:     () => ({ on:false, onClick:()=>{} }),
  supply:   () => ({}),
  supply24: () => ({}),
  tower:    () => ({ sim:{} }),
};

// Rebuild a blank file's saved canvas (placed nodes + wires) into live React Flow
// objects, restoring the function-valued data (onClick) that JSON couldn't store.
function rebuildCanvas(){
  const saved = loadCanvas();
  if (!saved) return { nodes: [], edges: [] };
  const seen = new Set();
  const nodes = (saved.nodes || []).map(n => {
    let id = n.id;
    while (seen.has(id)) id = `${id}_x`;                         // de-dup legacy duplicate ids (caused click confusion)
    seen.add(id);
    const make = DROP_DATA[n.type] || (() => ({}));
    return { id, type: n.type, position: n.position,
             data: { ...make(n.data?.lab), ...n.data, _static: true } };
  });
  const edges = (saved.edges || []).map(e => ({
    id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle, targetHandle: e.targetHandle,
    type: 'tag', data: { kind: 'wire', tagAt: 'target' }, style: { stroke: '#8b949e', strokeWidth: 2 } }))
    .filter(e => seen.has(e.source) && seen.has(e.target));      // drop wires that referenced a removed duplicate
  return { nodes, edges };
}

const DOCS = {
  module:   { n:'Double-acting cylinder + 5/2 solenoid valve', d:'ISO 1219 linear actuator (barrel, piston, rod, cushioning) driven by a single-solenoid 5/2 valve (solenoid 14 + spring return 12). a0/a1 reed switches on the barrel.', u:'https://www.festo.com/us/en/search/?text=pneumatic%20cylinders' },
  plc:      { n:'SPI-DRY UTM-S9-MEC PLC · CPU 231043', d:'14 DI / 10 DO / 2 AI on board; runs the 22-step ladder program.', u:'https://github.com/JohanWences/spiderlive-simulator' },
  button:   { n:'Push button', d:'NO (start) or NC (stop), wired to a PLC I input.', u:'https://www.festo.com/us/en/search/?text=pushbutton' },
  mush:     { n:'Emergency stop button', d:'Latching mushroom head (NC). Stops the installation; all legs come down.', u:'https://www.festo.com/us/en/search/?text=emergency%20stop' },
  supply:   { n:'Pneumatic supply (compressor · tank · FRL · gauge)', d:'Generates, stores, conditions and measures the air (6 bar) feeding the manifold.', u:'https://www.festo.com/us/en/search/?text=air%20preparation' },
  supply24: { n:'24 VDC power supply', d:'Powers the PLC and the sensors. +24 V (red) / 0 V (blue).', u:'https://mall.industry.siemens.com/mall/en/WW/Catalog/Products/10044947' },
  tower:    { n:'Signal tower', d:'Light column driven by outputs Q0.6 (green, running) and Q0.7 (red, emergency).', u:'https://www.festo.com/us/en/search/?text=signal%20tower' },
};

const btnCss = (bg, fg='#0b0e13') => ({ background:bg, color:fg, border:'none', borderRadius:9, padding:'10px 15px', fontWeight:600, fontSize:13, cursor:'pointer' });
const chip = { background:'#161b22', border:'1px solid #2a313c', borderRadius:7, padding:'3px 8px', color:'#8b949e' };

// OpenPLC addresses you can bind a component to (14 DI, 10 relay DO)
const IN_ADDR = []; for (let b=0;b<2;b++) for (let i=0;i<8;i++) if (b===0 || i<6) IN_ADDR.push(`%IX${b}.${i}`);
const OUT_ADDR = []; for (let b=0;b<2;b++) for (let i=0;i<8;i++) if (b===0 || i<2) OUT_ADDR.push(`%QX${b}.${i}`);
const NODE_NAME = { plc:'PLC', module:'Cylinder', mush:'Emergency stop', supply:'Pneumatic supply', supply24:'24 VDC supply', tower:'Signal tower', button:'Push button' };
const nodeLabel = (n) => !n ? '' : (n.data?.lab || NODE_NAME[n.type] || n.type);


function Flow({ embedded, fileId = 'main', blank = false }){
  setProgram(fileId);                                            // namespace localStorage to this file BEFORE building state
  const rf = useReactFlow();
  const sim = useRef(E.newSim());
  const built = useMemo(() => (blank ? rebuildCanvas() : null), []);
  const initN = useMemo(() => (blank ? built.nodes : makeNodes(sim)), []);
  const initE = useMemo(() => (blank ? built.edges : makeEdges()), []);
  const [nodes, setNodes, onNodesChange] = useNodesState(initN);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initE);
  const [hud, setHud] = useState({ step:0, mode:'—', status:'STOPPED' });
  const [docKey, setDocKey] = useState(null);
  const [docsOpen, setDocsOpen] = useState(true);
  const [live, setLive] = useState(false);                       // Start → live simulation · Pause → frozen, nothing simulated
  const [sel, setSel] = useState(null);                          // AutoCAD-style selection box (screen coords)
  const hotRef = useRef(null);                                   // id of the highlighted wire (for the rAF loop)
  const dropRef = useRef(0);
  const bridge = useBridge();                                    // live link to the local bridge → OpenPLC
  const activeOut = useActiveOutputs();                          // %QX coils OpenPLC is driving (relay switch states)
  const _selected = nodes.filter(n => n.selected);               // properties panel = single selection (derived, never lags)
  const selNode = _selected.length === 1 ? _selected[0] : null;

  // Pushes the current state onto nodes/wires. animate=true → animated flow on wires. Only recreates what changed.
  const applyState = useCallback((animate) => {
    setNodes(nds => paintNodes(sim.current, nds));
    setEdges(eds => paintEdges(sim.current, eds, animate, hotRef.current));
  }, [setNodes, setEdges]);

  // Globally closest wire to the point (robust to overlaps): samples the real paths.
  const closestEdgeAt = (cx, cy) => {
    const g = rf.screenToFlowPosition({ x:cx, y:cy });
    let bestId = null, bd = Infinity, bestEl = null, bestL = 0;
    document.querySelectorAll('.react-flow__edge-path').forEach(el => {
      const id = el.id; if (!id) return;
      let L = 0; try { L = el.getTotalLength(); } catch { return; }
      if (!L) return;
      const N = Math.max(12, Math.min(90, Math.floor(L / 6)));
      for (let i=0;i<=N;i++){
        const l = L*i/N, pt = el.getPointAtLength(l);
        const d = (pt.x-g.x)**2 + (pt.y-g.y)**2;
        if (d < bd){ bd = d; bestId = id; bestEl = el; bestL = l; }
      }
    });
    let vert = true;
    if (bestEl){ const L = bestEl.getTotalLength();
      const a = bestEl.getPointAtLength(Math.max(0,bestL-4)), b = bestEl.getPointAtLength(Math.min(L,bestL+4));
      vert = Math.abs(b.y-a.y) >= Math.abs(b.x-a.x); }
    return { id:bestId, dist:Math.sqrt(bd), vert };
  };
  const onCanvasDblClick = (e) => {
    if (e.target.closest && e.target.closest('.react-flow__node, .react-flow__handle, button, a')) return;
    const hit = closestEdgeAt(e.clientX, e.clientY), zoom = rf.getZoom ? rf.getZoom() : 1;
    if (hit.id && hit.dist <= 12 / zoom){ const api = edgeDragRegistry.get(hit.id); if (api) api.reset(); }
  };
  // ---- AutoCAD-style box select: left→right = window (blue, encloses) · right→left = crossing (green, touches) ----
  const finalize = (a, b) => {
    if (Math.hypot(b.x - a.x, b.y - a.y) < 4){                    // plain click → clear
      setNodes(nds => nds.some(n => n.selected) ? nds.map(n => n.selected ? { ...n, selected:false } : n) : nds);
      setEdges(eds => eds.some(e => e.selected) ? eds.map(e => e.selected ? { ...e, selected:false } : e) : eds);
      return;
    }
    const crossing = b.x < a.x;                                   // right→left = crossing (green) · left→right = window (blue)
    // Hit-test against the REAL on-screen rectangles — no coord conversion, no dependency on n.measured → exact.
    const box = { left:Math.min(a.x,b.x), top:Math.min(a.y,b.y), right:Math.max(a.x,b.x), bottom:Math.max(a.y,b.y) };
    // green → select the instant the box TOUCHES the node · blue → select once the box COVERS part of its visible area
    const hit = (r) => {
      const ox = Math.min(box.right, r.right) - Math.max(box.left, r.left);
      const oy = Math.min(box.bottom, r.bottom) - Math.max(box.top, r.top);
      return crossing ? (ox >= 0 && oy >= 0) : (ox > 0 && oy > 0);
    };
    const selN = new Set();
    document.querySelectorAll('.react-flow__node').forEach(el => {
      const id = el.getAttribute('data-id');
      if (id && hit(el.getBoundingClientRect())) selN.add(id);
    });
    setNodes(nds => nds.map(n => (!!n.selected === selN.has(n.id)) ? n : { ...n, selected: selN.has(n.id) }));
    // Edges: a wire is selected once any part of its path lies inside the box (covers part of it).
    const p0 = rf.screenToFlowPosition({ x: box.left,  y: box.top });
    const p1 = rf.screenToFlowPosition({ x: box.right, y: box.bottom });
    const R = { minX:p0.x, minY:p0.y, maxX:p1.x, maxY:p1.y };
    const selE = new Set();
    document.querySelectorAll('.react-flow__edge-path').forEach(el => {
      const id = el.id; if (!id) return;
      let L = 0; try { L = el.getTotalLength(); } catch { return; }
      if (!L) return;
      const N = Math.max(12, Math.min(160, Math.floor(L/6)));
      for (let i=0;i<=N;i++){
        const pt = el.getPointAtLength(L*i/N);
        if (pt.x>=R.minX && pt.x<=R.maxX && pt.y>=R.minY && pt.y<=R.maxY){ selE.add(id); break; }
      }
    });
    setEdges(eds => eds.map(e => (!!e.selected === selE.has(e.id)) ? e : { ...e, selected: selE.has(e.id) }));
  };
  const onCanvasPointerDown = (e) => {
    if (e.button !== 0) return;                                   // left button only
    const t = e.target;                                           // only on empty canvas — nodes/handles/wires/controls handle their own
    if (t.closest && t.closest('.react-flow__node, .react-flow__handle, .react-flow__edge, .react-flow__controls, button, a, input')) return;
    const a = { x: e.clientX, y: e.clientY };
    setSel({ x0:a.x, y0:a.y, x1:a.x, y1:a.y });
    const move = (ev) => setSel(s => s ? { ...s, x1:ev.clientX, y1:ev.clientY } : s);
    const done = (ev) => {                                        // pointerup OR pointercancel — always tear down + clear the box
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', done);
      window.removeEventListener('pointercancel', done);
      const dragged = ev.type !== 'pointercancel' && Math.hypot(ev.clientX - a.x, ev.clientY - a.y) >= 4;
      try { if (ev.type !== 'pointercancel') finalize(a, { x: ev.clientX, y: ev.clientY }); }
      finally {
        setSel(null);
        if (dragged){                                             // swallow the click the browser fires after a drag,
          const swallow = (ce) => { ce.stopPropagation(); window.removeEventListener('click', swallow, true); };
          window.addEventListener('click', swallow, true);        // so React Flow's pane-click doesn't wipe our selection
        }
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', done);
    window.addEventListener('pointercancel', done);
  };
  // Selection: React Flow (controlled mode) mirrors the `nodes` prop into its internal store
  // from a post-commit effect, so its own `.selected` outline always lags one click. We hide
  // it (CSS below) and draw the outline OURSELVES from `nodes` (ViewportPortal) → instant.

  const hudOf = (s) => ({ step:s.step, mode:E.mode(s.step), status: s.emerg?'EMERGENCY' : s.sysOn?'RUNNING':'STOPPED' });

  // ---- Drag-and-drop: place a component dragged from the Library ----
  const addNode = (type, position, label) => {
    const make = DROP_DATA[type]; if (!make) return;
    // _static → this is a placed component with its OWN state; the engine never repaints it,
    // so two dropped PLCs don't share the simulated circuit's state.
    setNodes(nds => {
      const ids = new Set(nds.map(n => n.id));
      let id; do { id = `n_${type}_${++dropRef.current}`; } while (ids.has(id));   // unique even after a reload resets the counter
      return [...nds, { id, type, position, data: { ...make(label), _static: true } }];
    });
  };
  // ---- Connect two ports by dragging a wire between handles ----
  // The address binding is derived from the wiring (see the I/O BINDING effect), so this
  // just records the connection — the wire that reaches a PLC terminal defines the address.
  const onConnect = useCallback((params) => {
    setEdges(eds => addEdge({ ...params, type:'tag', data:{ kind:'wire', tagAt:'target' }, style:{ stroke:'#8b949e', strokeWidth:2 } }, eds));
  }, [setEdges]);

  const onDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const onDrop = (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/spiderlive');
    if (!type) return;
    const label = e.dataTransfer.getData('application/spiderlive-label');
    const position = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY });
    addNode(type, position, label);
  };

  // ---- Rename the selected component so you can identify it on the canvas ----
  const setNodeName = (name) => {
    if (!selNode) return;
    const lab = name || undefined;                               // empty → fall back to the default type name
    setNodes(nds => nds.map(n => n.id === selNode.id ? { ...n, data: { ...n.data, lab } } : n));
    const map = loadLabels(); if (lab) map[selNode.id] = lab; else delete map[selNode.id]; saveLabels(map);
  };

  useEffect(() => {                                              // SIMULATION: continuous animation loop
    if (!live) return;
    let raf, prev = performance.now();
    const loop = (now) => {
      let dt = now - prev; prev = now; if (dt > 100) dt = 100;
      const s = sim.current; E.tick(s, dt);
      applyState(true);
      const h = hudOf(s);
      setHud(p => (p.step===h.step && p.mode===h.mode && p.status===h.status) ? p : h);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [live, applyState]);

  useEffect(() => {                                              // EDIT: one static frame (no animation), then rest
    if (live) return;
    applyState(false);
    setHud(hudOf(sim.current));
  }, [live, applyState]);

  useEffect(() => {                                              // Stopped = edit mode: inputs are inert + released
    setRunning(live);
    if (!live) clearActiveInputs();
  }, [live]);

  useEffect(() => {                                              // BLANK files: persist the built canvas (placed nodes + wires)
    if (!blank) return;
    saveCanvas(nodes, edges);
  }, [blank, nodes, edges]);

  // CONTINUITY: light user-placed lamps from the actual circuit (loop closed across + and −).
  useEffect(() => {
    setNodes(nds => {
      let solved; try { solved = solveCircuit(nds, edges, addr => !!activeOut[addr]); } catch { return nds; }
      let changed = false;
      const out = nds.map(n => {
        if (n.type !== 'tower' || !n.data?._static) return n;
        const lamps = solved[n.id]; if (!lamps) return n;
        const p = n.data.lamps;
        if (p && p.in_emg === lamps.in_emg && p.in_amber === lamps.in_amber && p.in_run === lamps.in_run) return n;
        changed = true;
        return { ...n, data: { ...n.data, lamps } };
      });
      return changed ? out : nds;
    });
  }, [edges, activeOut, setNodes]);

  // I/O BINDING: an element's OpenPLC address is DEFINED BY THE WIRE reaching a PLC
  // terminal — the PLC terminals have fixed addresses. No manual assignment; pull the
  // wire to another terminal and the address follows; unplug it and it clears.
  useEffect(() => {
    setNodes(nds => {
      const isPlc = new Set(nds.filter(n => n.type === 'plc').map(n => n.id));
      const ioOf = {};
      edges.forEach(e => {
        if (isPlc.has(e.target) && PLC_ADDR[e.targetHandle]) ioOf[e.source] = PLC_ADDR[e.targetHandle];
        else if (isPlc.has(e.source) && PLC_ADDR[e.sourceHandle]) ioOf[e.target] = PLC_ADDR[e.sourceHandle];
      });
      let changed = false;
      const out = nds.map(n => {
        // only user-placed elements; PLC = source of addresses · tower = multi-terminal
        if (n.type === 'plc' || n.type === 'tower' || !n.data?._static) return n;
        const addr = ioOf[n.id];
        if ((n.data?.io || undefined) === (addr || undefined)) return n;
        changed = true;
        return { ...n, data: { ...n.data, io: addr || undefined } };
      });
      return changed ? out : nds;
    });
  }, [edges, setNodes]);

  return (
    <div style={{ width: embedded ? '100%' : '100vw', height: embedded ? '100%' : '100vh', background:'#0b0e13', position:'relative' }}
         onPointerDown={onCanvasPointerDown} onDoubleClick={onCanvasDblClick}
         onDragOver={onDragOver} onDrop={onDrop}>
      <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes}
        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect}
        onNodeDragStop={() => setNodes(nds => { savePos(nds); return nds; })}
        onNodeClick={(e, n) => setNodes(nds => nds.map(x => {            // our overlay reads this immediately
          const sel = e.shiftKey ? (x.id === n.id ? !x.selected : !!x.selected) : (x.id === n.id);
          return !!x.selected === !!sel ? x : { ...x, selected: sel };
        }))}
        onNodeMouseEnter={(_, n) => setDocKey(n.type)} onNodeMouseLeave={() => setDocKey(null)}
        connectionMode={ConnectionMode.Loose} deleteKeyCode={['Delete', 'Backspace']}
        selectionKeyCode={null} panOnDrag={[1, 2]} panOnScroll={false}
        fitView minZoom={0.3} proOptions={{ hideAttribution:true }}>
        <Background color="#1b222c" gap={22} />
        <Controls position="bottom-right" />
        {/* Our own selection outline — driven by `nodes`, so it lands on the clicked node instantly */}
        <ViewportPortal>
          {nodes.filter(n => n.selected).map(n => {
            const w = (n.measured && n.measured.width) || n.width || 60;
            const h = (n.measured && n.measured.height) || n.height || 60;
            return <div key={n.id} className="nodrag nopan" style={{
              position:'absolute', left:0, top:0, pointerEvents:'none',
              transform:`translate(${n.position.x - 4}px, ${n.position.y - 4}px)`,
              width:w + 8, height:h + 8, boxSizing:'border-box',
              border:'2px solid #4aa3ff', borderRadius:11, boxShadow:'0 0 0 4px rgba(74,163,255,0.15)' }} />;
          })}
        </ViewportPortal>
      </ReactFlow>
      <style>{`.react-flow__node.selected{box-shadow:none!important;outline:none!important;}`}</style>
      {sel && (() => {
        const cr = sel.x1 < sel.x0;                               // crossing (green, touches) vs window (blue, encloses)
        const L = Math.min(sel.x0,sel.x1), T = Math.min(sel.y0,sel.y1);
        const W = Math.abs(sel.x1-sel.x0), H = Math.abs(sel.y1-sel.y0);
        return <div style={{ position:'fixed', left:L, top:T, width:W, height:H, zIndex:20, pointerEvents:'none',
          border:'1.5px '+(cr?'dashed #2ec27e':'solid #4aa3ff'), background:(cr?'#2ec27e22':'#4aa3ff1f') }} />;
      })()}
      {embedded && (
        <div style={{ position:'absolute', top:10, left:10, zIndex:10, display:'flex', alignItems:'center', gap:6,
                      background:'#0d1117ee', border:'1px solid #2a313c', borderRadius:10, padding:'6px 8px', flexWrap:'wrap' }}>
          <span style={{ ...chip, font:'600 11px system-ui', display:'inline-flex', alignItems:'center', gap:6 }}>
            <span style={{ width:7, height:7, borderRadius:99, display:'inline-block',
              background: hud.status==='EMERGENCY'?'#e5534b':hud.status==='RUNNING'?'#2ec27e':'#8b949e' }} />
            <b style={{ color: hud.status==='EMERGENCY'?'#e5534b':hud.status==='RUNNING'?'#2ec27e':'#e6edf3' }}>{hud.status}</b>
          </span>
          <span style={{ ...chip, font:'600 11px system-ui', display:'inline-flex', alignItems:'center', gap:6 }} title={bridge ? 'Connected to the local bridge → OpenPLC' : 'Bridge offline (run: npx spiderlive-bridge)'}>
            <span style={{ width:7, height:7, borderRadius:99, display:'inline-block', background: bridge ? '#2ec27e' : '#5b6675' }} />
            <b style={{ color: bridge ? '#2ec27e' : '#8b949e' }}>OpenPLC</b>
          </span>
          <button title="Start" onClick={() => { setLive(true); E.start(sim.current); }}
            style={{ ...btnCss('#2ec27e'), padding:'8px 13px', display:'inline-flex', alignItems:'center', gap:7 }}>
            <IconPlay size={14} /> Start
          </button>
          <button title="Pause — full stop, nothing is simulated" onClick={() => { setLive(false); E.stop(sim.current); }}
            style={{ ...btnCss('#cdd9e5'), padding:'8px 13px', display:'inline-flex', alignItems:'center', gap:7 }}>
            <IconPause size={14} /> Pause
          </button>
        </div>
      )}
      {selNode && (() => {
        const live = nodes.find(n => n.id === selNode.id) || selNode;   // live address (follows the wiring)
        const addr = live.data?.io;
        const isIn = addr && addr[1] === 'I';
        return (
        <div style={{ position:'absolute', top:12, right:12, width:236, zIndex:16, overflow:'hidden',
                      background:'#0d1117f5', border:'1px solid #2a3445', borderRadius:12,
                      boxShadow:'0 16px 40px #000a', font:'13px system-ui' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8,
                        padding:'10px 12px', borderBottom:'1px solid #2a313c' }}>
            <span style={{ fontWeight:700, color:'#e6edf3' }}>{nodeLabel(selNode)}</span>
            <button onClick={() => setNodes(nds => nds.map(n => n.selected ? { ...n, selected:false } : n))} style={{ background:'none', border:'none', color:'#8b949e', cursor:'pointer', fontSize:17, lineHeight:1 }}>×</button>
          </div>
          <div style={{ padding:'12px 12px 14px' }}>
            <div style={{ fontSize:11, color:'#8b949e', fontWeight:600, marginBottom:7, letterSpacing:0.3 }}>Name</div>
            <input value={selNode.data?.lab || ''} onChange={e => setNodeName(e.target.value)}
              placeholder={NODE_NAME[selNode.type] || selNode.type} maxLength={24}
              style={{ width:'100%', boxSizing:'border-box', padding:'8px 10px', fontSize:13, marginBottom:14,
                       background:'#161b22', color:'#e6edf3', border:'1px solid #2a3445', borderRadius:8, outline:'none' }} />
            <div style={{ fontSize:11, color:'#8b949e', fontWeight:600, marginBottom:7, letterSpacing:0.3 }}>OpenPLC address</div>
            {addr ? (
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:8,
                            background:'#161b22', border:`1px solid ${isIn ? '#2f5fa6' : '#6e5a1e'}` }}>
                <span style={{ width:8, height:8, borderRadius:99, background: isIn ? '#2f7bf6' : '#e3b341' }} />
                <b style={{ color:'#e6edf3', font:'700 13px ui-monospace, Menlo, monospace' }}>{addr}</b>
                <span style={{ marginLeft:'auto', fontSize:11, color:'#8b949e' }}>{isIn ? 'input' : 'output'}</span>
              </div>
            ) : (
              <div style={{ padding:'8px 10px', borderRadius:8, background:'#161b22', border:'1px dashed #2a3445', color:'#8b949e', fontSize:12 }}>
                Not wired to the PLC
              </div>
            )}
            <p style={{ fontSize:11.5, color:'#8b949e', lineHeight:1.45, margin:'10px 0 0' }}>
              The address comes from the <b style={{ color:'#cdd9e5' }}>wire to the PLC</b> — connect this element to a PLC terminal and it takes that terminal's fixed address. <b style={{ color:'#5b9bff' }}>%IX</b> = input · <b style={{ color:'#e3b341' }}>%QX</b> = output.
            </p>
          </div>
        </div>
        );
      })()}
      {!embedded && (
      <div style={{ position:'absolute', top:12, left:12, zIndex:10,
                    background:'#0d1117ee', border:'1px solid #2a313c', borderRadius:13,
                    padding:'10px 14px', boxShadow:'0 8px 26px #000a' }}>
        <div style={{ display:'flex', alignItems:'center' }}>
          <a href="#/" title="Go to the SpiderLive landing page"
             style={{ display:'block', lineHeight:0, cursor:'pointer' }}>
            <img src={spiderLiveLogo} alt="SpiderLive — An electro-pneumatic Web Simulator"
                 style={{ height:48, width:'auto', display:'block' }} />
          </a>
        </div>
        <div style={{ display:'flex', gap:6, marginTop:10, flexWrap:'wrap', font:'600 11px system-ui' }}>
          <span style={chip}>
            <span style={{ width:7, height:7, borderRadius:99, display:'inline-block', marginRight:5, background: hud.status==='EMERGENCY'?'#e5534b':hud.status==='RUNNING'?'#2ec27e':'#8b949e' }} />
            <b style={{ color: hud.status==='EMERGENCY'?'#e5534b':hud.status==='RUNNING'?'#2ec27e':'#e6edf3' }}>{hud.status}</b>
          </span>
          <span style={chip}>Step <b style={{ color:'#e6edf3' }}>{hud.step}</b>/22</span>
          <span style={chip}><b style={{ color:'#e6edf3' }}>{hud.mode}</b></span>
          <span style={{ ...chip, color: live?'#e3b341':'#8b949e', borderColor: live?'#5a4a1e':'#2a313c' }}>
            {live ? 'Simulation' : 'Edit'}
          </span>
        </div>
      </div>
      )}
      {!embedded && (
      <div style={{ position:'absolute', bottom:16, left:16, display:'flex', gap:8, zIndex:10 }}>
        <button style={btnCss(live?'#e3b341':'#3a414c', live?'#0b0e13':'#e6edf3')} onClick={() => setLive(v => !v)}
                title="Edit = frozen and lightweight · Simulation = live animation (sensors and flow on the wires)">
          {live ? 'Simulation' : 'Edit'}</button>
        <button style={btnCss('#2ec27e')} onClick={() => { setLive(true); E.start(sim.current); }}>START</button>
        <button style={btnCss('#cdd9e5')} onClick={() => E.stop(sim.current)}>STOP</button>
        <button style={btnCss('#e5534b','#fff')} onClick={() => E.eStop(sim.current)}>E-STOP</button>
        <button style={btnCss('#3a414c','#e6edf3')} onClick={() => E.reset(sim.current)}>Reset</button>
        <button style={btnCss('#3a414c','#e6edf3')} onClick={() => { localStorage.removeItem(LS_POS); clearEdgePaths(); setNodes(makeNodes(sim)); setEdges(makeEdges()); }}>Arrange</button>
      </div>
      )}
      {!embedded && (
      <div style={{ position:'absolute', top:58, right:12, width:236, zIndex:10, display:'flex', flexDirection:'column', gap:6 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8,
                      color:'#8b949e', font:'12px system-ui',
                      background:'#161b22cc', border:'1px solid #2a313c', borderRadius:9, padding:'6px 9px' }}>
          <span>Documentation{docsOpen ? ' — hover over a component' : ''}</span>
          <button onClick={() => setDocsOpen(o => !o)}
                  style={{ background:'#21262d', color:'#e6edf3', border:'1px solid #2a313c', borderRadius:7,
                           cursor:'pointer', font:'12px system-ui', padding:'2px 8px', flexShrink:0 }}>
            {docsOpen ? '▾ Hide' : '▸ Show'}
          </button>
        </div>
        {docsOpen && Object.entries(DOCS).map(([k, v]) => (
          <a key={k} href={v.u} target="_blank" rel="noopener"
             style={{ textDecoration:'none', color:'#e6edf3', background:'#161b22', borderRadius:9,
                      border:'1px solid ' + (docKey===k ? '#ffd24a' : '#2a313c'),
                      boxShadow: docKey===k ? '0 0 0 1px #ffd24a66' : 'none', padding:'7px 9px', transition:'border-color .12s' }}>
            <div style={{ fontSize:12, fontWeight:600 }}>{v.n}</div>
            <div style={{ fontSize:10.5, color:'#8b949e', margin:'2px 0 3px', lineHeight:1.25 }}>{v.d}</div>
            <div style={{ fontSize:10, color:'#539bf5' }}>View docs ↗</div>
          </a>
        ))}
      </div>
      )}
    </div>
  );
}

export default function App({ embedded = false, fileId = 'main', blank = false }){
  return (
    <ReactFlowProvider>
      <Flow embedded={embedded} fileId={fileId} blank={blank} />
    </ReactFlowProvider>
  );
}
