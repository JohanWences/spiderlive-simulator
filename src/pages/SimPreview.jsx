import React, { useRef, useMemo, useEffect, useCallback } from 'react';
import { ReactFlow, ReactFlowProvider, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { nodeTypes, edgeTypes } from '../nodes.jsx';
import * as E from '../engine.js';
import { makeNodes, makeEdges, paintNodes, paintEdges } from '../graph.js';

// Auto-running preview of the same circuit the simulator runs. Transparent + pannable,
// so it reads as part of the page background rather than a framed window.
// `modules` trims how many cylinders are shown (the engine still simulates all 6).
function PreviewInner({ modules }) {
  const sim = useRef(E.newSim());
  const drop = useMemo(() => {
    const s = new Set();
    for (let i = modules; i < 6; i++) s.add('m' + i);   // hide the trailing cylinders
    return s;
  }, [modules]);
  const initN = useMemo(() => makeNodes(sim, false).filter(n => !drop.has(n.id)), [drop]);
  const initE = useMemo(() => makeEdges(false).filter(e => !drop.has(e.source) && !drop.has(e.target)), [drop]);
  const [nodes, setNodes] = useNodesState(initN);
  const [edges, setEdges] = useEdgesState(initE);

  const applyState = useCallback(() => {
    setNodes(nds => paintNodes(sim.current, nds));
    setEdges(eds => paintEdges(sim.current, eds, true));
  }, [setNodes, setEdges]);

  useEffect(() => {
    sim.current.auto = false;            // never auto-stop — keep the loop running forever
    E.start(sim.current);
    let raf, prev = performance.now();
    const loop = (now) => {
      let dt = now - prev; prev = now; if (dt > 100) dt = 100;
      E.tick(sim.current, dt);
      applyState();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [applyState]);

  return (
    <ReactFlow
      nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes}
      fitView fitViewOptions={{ padding: 0.08 }} minZoom={0.05} maxZoom={2}
      nodesDraggable={false} nodesConnectable={false} elementsSelectable={false}
      nodesFocusable={false} edgesFocusable={false}
      panOnDrag                              // the canvas can be moved...
      panOnScroll={false} zoomOnScroll={false} zoomOnPinch={false} zoomOnDoubleClick={false}
      preventScrolling={false}
      proOptions={{ hideAttribution: true }}
      style={{ background: 'transparent' }}
    />
  );
}

export default function SimPreview({ modules = 6 }) {
  return (
    <ReactFlowProvider>
      <PreviewInner modules={modules} />
    </ReactFlowProvider>
  );
}
