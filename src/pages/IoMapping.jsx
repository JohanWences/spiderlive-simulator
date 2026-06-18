import React from 'react';
import { T } from '../theme.js';
import { useBridgeStatus } from '../bridge-status.js';
import { IN_ADDRS, OUT_ADDRS } from '../inputs.js';

// What each address means (matches the bridge's I/O map + the PLC terminals).
const IN_LABELS = [
  'START button', 'STOP 1', 'STOP 2', 'EMERGENCY',
  'a1 · cylinder A extended', 'a1 · cylinder B extended', 'a1 · cylinder C extended',
  'a1 · cylinder D extended', 'a1 · cylinder E extended', 'a1 · cylinder F extended',
  'a0 · cylinder A retracted', 'a0 · cylinder B retracted', 'a0 · cylinder C retracted',
  'a0 · cylinder D retracted', 'a0 · cylinder E retracted', 'a0 · cylinder F retracted',
];
const OUT_LABELS = [
  'Solenoid A', 'Solenoid B', 'Solenoid C', 'Solenoid D', 'Solenoid E', 'Solenoid F',
  'Signal tower — green (running)', 'Signal tower — red (emergency)',
];

function Table({ title, subtitle, addrs, labels, values, accent }) {
  const live = Array.isArray(values) && values.length > 0;
  return (
    <div style={{ flex: 1, minWidth: 340 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: T.text, marginBottom: 2 }}>{title}</div>
      <div style={{ fontSize: 11.5, color: T.faint, marginBottom: 10 }}>{subtitle}</div>
      <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
        {addrs.map((a, i) => {
          const on = live && !!values[i];
          return (
            <div key={a} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                                  borderBottom: i < addrs.length - 1 ? `1px solid ${T.border}` : 'none',
                                  background: i % 2 ? 'transparent' : '#0e131c' }}>
              <span style={{ width: 9, height: 9, borderRadius: 99, flexShrink: 0, background: on ? accent : '#39414d' }} />
              <code style={{ width: 60, flexShrink: 0, font: '600 12px ui-monospace, Menlo, monospace', color: on ? T.text : T.muted }}>{a}</code>
              <span style={{ flex: 1, fontSize: 12.5, color: T.muted }}>{labels[i]}</span>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: on ? accent : T.faint }}>{on ? 'ON' : 'off'}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function IoMapping() {
  const s = useBridgeStatus();
  return (
    <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'auto', padding: '24px 28px', color: T.text, font: '14px system-ui, sans-serif' }}>
      <h2 style={{ margin: '0 0 4px', fontSize: 19, fontWeight: 700 }}>I/O Mapping</h2>
      <p style={{ margin: '0 0 20px', color: T.muted, fontSize: 13 }}>
        How the PLC addresses map to the plant signals, with their live state from the bridge.
        {!s.wsConnected && <span style={{ color: '#e5534b' }}> · Bridge offline — start it to see live values.</span>}
      </p>
      <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap' }}>
        <Table title="Discrete inputs · %IX" subtitle="SpiderLive → OpenPLC (buttons & sensors)" addrs={IN_ADDRS} labels={IN_LABELS} values={s.inputs} accent="#2ec27e" />
        <Table title="Coils · %QX" subtitle="OpenPLC → SpiderLive (solenoids & tower)" addrs={OUT_ADDRS} labels={OUT_LABELS} values={s.coils} accent="#e3b341" />
      </div>
    </div>
  );
}
