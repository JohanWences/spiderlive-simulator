import React, { useMemo } from 'react';
import { ReactFlow, ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { nodeTypes } from '../nodes.jsx';

// Renders a single real node (the actual component graphic) as a static, non-interactive preview.
export default function NodePreview({ type, data }) {
  const nodes = useMemo(() => [{ id: 'preview', type, position: { x: 0, y: 0 }, data, draggable: false }], [type, data]);
  return (
    <div style={{ width: '100%', height: '100%', pointerEvents: 'none' }}>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes} nodeTypes={nodeTypes}
          fitView fitViewOptions={{ padding: 0.16 }} minZoom={0.1} maxZoom={8}
          nodesDraggable={false} nodesConnectable={false} elementsSelectable={false}
          nodesFocusable={false} panOnDrag={false} zoomOnScroll={false} zoomOnPinch={false}
          zoomOnDoubleClick={false} preventScrolling={false}
          proOptions={{ hideAttribution: true }} style={{ background: 'transparent' }}
        />
      </ReactFlowProvider>
    </div>
  );
}
