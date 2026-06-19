// Multi-file project. Each file is an independent program (its own canvas, I/O
// bindings and wire routes), namespaced in localStorage so files never share
// state. `main` keeps the original un-suffixed keys for backward compatibility.

const LS_FILES = 'spiderlive-files';

// ---- Active program namespace (read by graph.js / nodes.jsx persistence) ----
let activeId = 'main';
export const setProgram = (id) => { activeId = id || 'main'; };
export const getProgram = () => activeId;
// 'main' → legacy base key (keeps the existing spider state); others → suffixed.
export const pkey = (base) => (activeId === 'main' ? base : `${base}::${activeId}`);

// ---- File list ----
const DEFAULT_FILES = [{ id: 'main', name: 'main', preset: 'spider' }];

export const loadFiles = () => {
  try {
    const v = JSON.parse(localStorage.getItem(LS_FILES));
    if (Array.isArray(v) && v.length) return v;
  } catch {}
  return DEFAULT_FILES;
};
export const saveFiles = (files) => {
  try { localStorage.setItem(LS_FILES, JSON.stringify(files)); } catch {}
};

export const newFileId = () => 'f' + Math.random().toString(36).slice(2, 9);

// ---- Pending open: a file id the Workspace should open on its next mount ----
// Used when a shared link imports a circuit and then redirects to the editor.
const LS_OPEN = 'spiderlive-open';
export const setPendingOpen = (id) => { try { sessionStorage.setItem(LS_OPEN, id); } catch {} };
export const takePendingOpen = () => {
  try { const v = sessionStorage.getItem(LS_OPEN); if (v) sessionStorage.removeItem(LS_OPEN); return v || null; }
  catch { return null; }
};

// Wipe a file's saved canvas state when it's deleted.
export const dropProgramState = (id) => {
  ['spiderlive-pos', 'spiderlive-io', 'spiderlive-edges', 'spiderlive-canvas']
    .forEach(base => { try { localStorage.removeItem(`${base}::${id}`); } catch {} });
};
