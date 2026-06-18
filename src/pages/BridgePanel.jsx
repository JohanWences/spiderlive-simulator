import React, { useState } from 'react';
import { T } from '../theme.js';
import { useBridgeStatus } from '../bridge-status.js';
import { bridgeCommand } from '../bridge.js';

// A copyable terminal command.
function CmdLine({ cmd }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { try { navigator.clipboard.writeText(cmd); setCopied(true); setTimeout(() => setCopied(false), 1200); } catch {} };
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', gap: 8, marginBottom: 8 }}>
      <code style={{ flex: 1, minWidth: 0, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 11px',
                     font: '12.5px ui-monospace, Menlo, monospace', color: '#cdd9e5', overflowX: 'auto', whiteSpace: 'nowrap' }}>
        <span style={{ color: T.faint, userSelect: 'none' }}>$ </span>{cmd}
      </code>
      <button onClick={copy} style={{ background: T.panel2, color: copied ? '#2ec27e' : T.muted, border: `1px solid ${T.border}`,
                 borderRadius: 7, padding: '0 12px', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

function StatusCard({ label, on, okText, badText, hint }) {
  return (
    <div style={{ flex: 1, minWidth: 240, background: T.panel, borderRadius: 12, padding: '14px 16px',
                  border: `1px solid ${on ? '#1f6f43' : T.border2}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}>
        <span style={{ width: 9, height: 9, borderRadius: 99, background: on ? '#2ec27e' : '#e5534b' }} />
        <span style={{ fontSize: 12.5, fontWeight: 700, color: T.text }}>{label}</span>
      </div>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: on ? '#2ec27e' : '#e5534b', marginBottom: 4 }}>{on ? okText : badText}</div>
      {hint && <div style={{ fontSize: 11.5, color: T.faint, lineHeight: 1.45 }}>{hint}</div>}
    </div>
  );
}

export default function BridgePanel() {
  const s = useBridgeStatus();
  const busy = s.busy === 'setup-openplc';
  const res = s.lastCommand && s.lastCommand.cmd === 'setup-openplc' ? s.lastCommand : null;

  return (
    <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'auto', padding: '24px 28px', color: T.text, font: '14px system-ui, sans-serif' }}>
      <h2 style={{ margin: '0 0 4px', fontSize: 19, fontWeight: 700 }}>OpenPLC Bridge</h2>
      <p style={{ margin: '0 0 20px', color: T.muted, fontSize: 13 }}>
        Live status of the link between SpiderLive (this browser), the bridge, and the OpenPLC Runtime.
      </p>

      {/* connection status — the two hops */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 22 }}>
        <StatusCard label="SpiderLive → Bridge (WebSocket)" on={s.wsConnected}
          okText="Connected" badText="Offline"
          hint={s.wsConnected ? 'The browser is streaming inputs to the bridge.' : 'Start the bridge:  npx spiderlive-bridge'} />
        <StatusCard label="Bridge → OpenPLC (Modbus)" on={s.plcConnected}
          okText="Connected — polling" badText="Not connected"
          hint={s.plcConnected ? 'OpenPLC is reading inputs and writing coils.' : 'Click “Configure OpenPLC”, then restart the runtime in OpenPLC Editor.'} />
      </div>

      {/* install & run the bridge (it can't start itself — these are terminal commands) */}
      <div style={{ background: T.panel, border: `1px solid ${s.wsConnected ? T.border : T.border2}`, borderRadius: 12, padding: '16px 18px', marginBottom: 22 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 4 }}>
          Install &amp; run the bridge {s.wsConnected && <span style={{ color: '#2ec27e', fontWeight: 600, fontSize: 12 }}>· running ✓</span>}
        </div>
        <p style={{ margin: '0 0 12px', fontSize: 12.5, color: T.muted, lineHeight: 1.5 }}>
          The bridge is a tiny Node program (needs <b style={{ color: T.text }}>Node.js 18+</b>) — it can't launch itself from the browser. Run it in a terminal:
        </p>
        <div style={{ fontSize: 11.5, color: T.faint, marginBottom: 5 }}>1 · Start the bridge</div>
        <CmdLine cmd="npx spiderlive-bridge" />
        <div style={{ fontSize: 11.5, color: T.faint, margin: '9px 0 5px' }}>2 · Configure OpenPLC (first time, or after re-uploading a program)</div>
        <CmdLine cmd="npx spiderlive-bridge --setup-openplc" />
        <div style={{ fontSize: 11.5, color: T.faint, marginTop: 9, lineHeight: 1.5 }}>
          Optional — install once so it's always available: <code style={{ color: '#cdd9e5' }}>npm install -g spiderlive-bridge</code>
        </div>
      </div>

      {/* one-click setup */}
      <div style={{ background: T.panel, border: `1px solid ${T.border2}`, borderRadius: 12, padding: '16px 18px', marginBottom: 22 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 4 }}>Set up / reconnect OpenPLC</div>
        <p style={{ margin: '0 0 12px', fontSize: 12.5, color: T.muted, lineHeight: 1.5 }}>
          Writes the I/O map into the OpenPLC Modbus-master config and enables the plugin — no terminal needed.
          OpenPLC v4 disables it whenever you re-upload a program, so run this again afterwards.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => bridgeCommand('setup-openplc')} disabled={busy || !s.wsConnected}
            style={{ background: s.wsConnected ? T.blue : T.panel2, color: s.wsConnected ? '#fff' : T.faint,
                     border: 'none', borderRadius: 9, padding: '10px 16px', fontWeight: 600, fontSize: 13,
                     cursor: busy || !s.wsConnected ? 'default' : 'pointer', opacity: busy ? 0.7 : 1 }}>
            {busy ? 'Configuring…' : 'Configure OpenPLC'}
          </button>
          {!s.wsConnected && <span style={{ fontSize: 12, color: T.faint }}>Bridge offline — start it first.</span>}
        </div>
        {res && (
          <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 8, fontSize: 12.5, lineHeight: 1.5,
                        background: res.ok ? '#0f2a1a' : '#2a1414', border: `1px solid ${res.ok ? '#1f6f43' : '#6f2a2a'}`,
                        color: res.ok ? '#7ee2a8' : '#f0a3a3' }}>
            {(res.ok ? '✓ ' : '✗ ') + res.message}
            {res.ok && <div style={{ marginTop: 6, color: T.muted }}>Next: in OpenPLC Editor, restart the runtime (Stop → Start) without re-uploading.</div>}
          </div>
        )}
      </div>

      <div style={{ fontSize: 12, color: T.faint }}>
        Live %IX / %QX values are under <b style={{ color: T.muted }}>Device › I/O Mapping</b>.
      </div>
    </div>
  );
}
