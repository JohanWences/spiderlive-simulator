import React from 'react';

// Normalized schematic symbols (IEC 60617 / JIC-NFPA contact symbols, matching the
// AutoCAD Electrical push-button library HPB/VPB) + EN 50005 terminal numbering.
// These are the *standards* counterpart to the "physical" node graphics in nodes.jsx:
// the circle/mushroom shows what the device looks like, these show how it is drawn
// on a control diagram.
//
// Drawn in the vertical orientation (terminals top/bottom), line-art on the dark
// inspector background. The contact itself carries the meaning — no extra operator
// glyph (the "2nd+ contact" form):
//   make contact  (NO) → blade lifted off, air gap ........ terminals 13 / 14
//   break contact (NC) → blade pressed on the fixed bar ... terminals 11 / 12
//   emergency stop ..... NC contact + latching mushroom ... terminals 21 / 22

const LINE = '#cdd9e5';   // contact / lead strokes
const LAB  = '#aab0b8';   // terminal labels
const RED  = '#e5534b';   // emergency mushroom

const wrap = (vb) => ({ viewBox: vb, width: '100%', height: '100%', preserveAspectRatio: 'xMidYMid meet' });
const labels = { fill: LAB, fontFamily: 'system-ui, sans-serif', fontSize: 12, fontWeight: 700 };

// Normally-open (make) contact, terminals 13 / 14.
// Collinear leads; the moving blade is hinged at the top lead and lifted away from
// the bottom contact → air gap = open at rest.
export function SymNO() {
  return (
    <svg {...wrap('0 0 110 170')}>
      <g stroke={LINE} strokeWidth="2.2" fill="none" strokeLinecap="round">
        <line x1="55" y1="18" x2="55" y2="64" />          {/* terminal 13 lead */}
        <line x1="55" y1="64" x2="82" y2="92" />          {/* moving contact (lifted, open) */}
        <line x1="55" y1="106" x2="55" y2="152" />        {/* terminal 14 lead (fixed contact at top) */}
      </g>
      <g {...labels}>
        <text x="62" y="32">13</text>
        <text x="62" y="148">14</text>
      </g>
    </svg>
  );
}

// Normally-closed (break) contact, terminals 11 / 12.
// The moving blade rests on the fixed-contact bar → touching = closed at rest.
export function SymNC() {
  return (
    <svg {...wrap('0 0 110 170')}>
      <g stroke={LINE} strokeWidth="2.2" fill="none" strokeLinecap="round">
        <line x1="55" y1="18" x2="55" y2="60" />          {/* terminal 11 lead */}
        <line x1="55" y1="60" x2="74" y2="99" />          {/* moving contact (pressed down) */}
        <line x1="55" y1="100" x2="82" y2="100" />        {/* fixed contact bar (blade rests here) */}
        <line x1="55" y1="100" x2="55" y2="152" />        {/* terminal 12 lead */}
      </g>
      <g {...labels}>
        <text x="62" y="32">11</text>
        <text x="62" y="148">12</text>
      </g>
    </svg>
  );
}

// Emergency stop — NC contact (terminals 21 / 22) operated by a latching mushroom head.
export function SymEStop() {
  return (
    <svg {...wrap('0 0 140 170')}>
      <g stroke={LINE} strokeWidth="2.2" fill="none" strokeLinecap="round">
        <line x1="50" y1="18" x2="50" y2="60" />          {/* terminal 21 lead */}
        <line x1="50" y1="60" x2="69" y2="99" />          {/* moving contact (pressed down) */}
        <line x1="50" y1="100" x2="77" y2="100" />        {/* fixed contact bar */}
        <line x1="50" y1="100" x2="50" y2="152" />        {/* terminal 22 lead */}
        {/* mechanical link (dotted) up to the mushroom stem */}
        <line x1="60" y1="80" x2="100" y2="80" strokeDasharray="3 3" strokeWidth="1.4" />
        <line x1="100" y1="58" x2="100" y2="80" />
      </g>
      {/* mushroom head (red half-disc) */}
      <path d="M84 58 A16 12 0 0 1 116 58 Z" fill={RED} stroke={RED} strokeWidth="1.5" strokeLinejoin="round" />
      <g {...labels}>
        <text x="57" y="32">21</text>
        <text x="57" y="148">22</text>
      </g>
    </svg>
  );
}

// Symbol registry — library items reference a symbol by key (see LIBRARY_TREE).
export const SYMBOLS = { no: SymNO, nc: SymNC, estop: SymEStop };
