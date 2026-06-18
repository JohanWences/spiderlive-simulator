import React, { useState } from 'react';
import { T } from '../theme.js';
import { Field, primaryBtn } from './auth-ui.jsx';
import { GoogleIcon } from '../icons.jsx';
import { signInWithGoogle, sendMagicLink } from '../auth.jsx';

const googleBtn = {
  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
  background: '#fff', color: '#1f2328', border: 'none', borderRadius: 12, padding: '12px',
  fontWeight: 600, fontSize: 14.5, cursor: 'pointer',
};

export default function AuthPanel({ signup }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const google = async () => {
    setErr('');
    const { error } = await signInWithGoogle();
    if (error) setErr(error.message);
  };

  const magic = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    const { error } = await sendMagicLink(email);
    setBusy(false);
    if (error) setErr(error.message); else setSent(true);
  };

  if (sent) {
    return (
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📬</div>
        <h3 style={{ margin: '0 0 8px', fontSize: 17 }}>Check your inbox</h3>
        <p style={{ color: T.muted, fontSize: 14, margin: 0 }}>
          We sent a magic link to <b style={{ color: T.text }}>{email}</b>. Click it to {signup ? 'finish signing up' : 'sign in'}.
        </p>
        <button onClick={() => setSent(false)} style={{ ...primaryBtn, background: T.panel2, color: T.text, marginTop: 18 }}>
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div>
      <button onClick={google} style={googleBtn}>
        <GoogleIcon /> {signup ? 'Sign up' : 'Continue'} with Google
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
        <span style={{ flex: 1, height: 1, background: T.border }} />
        <span style={{ color: T.faint, fontSize: 12.5 }}>or</span>
        <span style={{ flex: 1, height: 1, background: T.border }} />
      </div>

      <form onSubmit={magic}>
        <Field label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" autoComplete="email" />
        <button type="submit" style={{ ...primaryBtn, opacity: busy ? 0.7 : 1 }} disabled={busy}>
          {busy ? 'Sending…' : 'Email me a magic link'}
        </button>
      </form>

      {err && <p style={{ color: '#f78a82', fontSize: 13.5, margin: '12px 0 0', textAlign: 'center' }}>{err}</p>}
    </div>
  );
}
