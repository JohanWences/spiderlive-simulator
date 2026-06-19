// Share a circuit via a short link, backed by Supabase (`shared_circuits`).
// "Share" serializes the active file's canvas and stores it under a short id;
// opening .../#/p/<id> imports it as a NEW editable file (a copy).
import { supabase } from './supabase.js';
import { loadPos, loadIO, loadLabels, loadCanvas, LS_POS, LS_IO, LS_LAB, LS_CANVAS } from './graph.js';
import { loadEdgePaths } from './nodes.jsx';
import { loadFiles, saveFiles, newFileId, getProgram, setProgram, pkey } from './files.js';

const LS_EDGES = 'spiderlive-edges';

// 10 chars from an unambiguous alphabet → ~10^15 combos (link is the secret).
const shortId = () => {
  const A = 'abcdefghijkmnpqrstuvwxyz23456789';
  const r = crypto.getRandomValues(new Uint8Array(10));
  let s = ''; for (let i = 0; i < 10; i++) s += A[r[i] % A.length];
  return s;
};

// Read the active file's full canvas state into a portable payload.
export function serializeFile(file) {
  const prev = getProgram();
  setProgram(file.id);                                   // read THIS file's namespaced keys
  try {
    return {
      v: 1,
      name: file.name || 'untitled',
      preset: file.preset || 'blank',
      pos: loadPos(),
      io: loadIO(),
      lab: loadLabels(),
      canvas: loadCanvas(),
      edges: loadEdgePaths(),
    };
  } finally { setProgram(prev); }
}

// Upload and return the short id (retry on the rare id collision).
export async function shareFile(file) {
  const data = serializeFile(file);
  for (let i = 0; i < 5; i++) {
    const id = shortId();
    const { error } = await supabase.from('shared_circuits').insert({ id, data });
    if (!error) return id;
    if (error.code !== '23505') throw error;             // 23505 = unique_violation → retry
  }
  throw new Error('No se pudo generar un link único, intenta de nuevo');
}

export async function fetchShared(id) {
  const { data, error } = await supabase.from('shared_circuits').select('data').eq('id', id).single();
  if (error) { if (error.code === 'PGRST116') return null; throw error; }   // PGRST116 = no rows
  return data?.data || null;
}

// Materialize a shared payload as a new local file (an editable copy) → returns its id.
export function importSharedAsFile(data) {
  const id = newFileId();
  const files = loadFiles();
  files.push({ id, name: (data.name || 'shared').slice(0, 40), preset: data.preset || 'blank' });
  saveFiles(files);
  const prev = getProgram();
  setProgram(id);
  try {
    const put = (base, val) => { if (val != null) { try { localStorage.setItem(pkey(base), JSON.stringify(val)); } catch {} } };
    put(LS_POS, data.pos);
    put(LS_IO, data.io);
    put(LS_LAB, data.lab);
    put(LS_CANVAS, data.canvas);
    put(LS_EDGES, data.edges);
  } finally { setProgram(prev); }
  return id;
}

export const shareLink = (id) => `${location.origin}${location.pathname}#/p/${id}`;
