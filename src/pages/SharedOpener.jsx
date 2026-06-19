import React, { useEffect, useState } from 'react';
import { T } from '../theme.js';
import { navigate } from '../router.jsx';
import { fetchShared, importSharedAsFile } from '../share.js';
import { setPendingOpen } from '../files.js';

// Route handler for .../#/p/<id> — fetches the shared circuit, imports it as a
// new editable file, and redirects to the editor with that file open.
export default function SharedOpener({ id }) {
  const [err, setErr] = useState(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await fetchShared(id);
        if (!alive) return;
        if (!data) { setErr('notfound'); return; }
        const fileId = importSharedAsFile(data);
        setPendingOpen(fileId);
        navigate('/simulator');
      } catch (e) {
        if (alive) setErr((e && e.message) || 'error');
      }
    })();
    return () => { alive = false; };
  }, [id]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: T.bg, color: T.text, font: '15px system-ui', textAlign: 'center', padding: 24 }}>
      {err ? (
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
            {err === 'notfound' ? 'Este link no existe o expiró' : 'No se pudo abrir el link compartido'}
          </div>
          <div style={{ color: T.muted, fontSize: 13, marginBottom: 16 }}>
            {err === 'notfound' ? 'Pídele a quien te lo compartió que genere uno nuevo.' : err}
          </div>
          <button onClick={() => navigate('/home')}
            style={{ background: T.blue, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 600, cursor: 'pointer' }}>
            Ir al inicio
          </button>
        </div>
      ) : (
        <div style={{ color: T.muted }}>Abriendo el circuito compartido…</div>
      )}
    </div>
  );
}
