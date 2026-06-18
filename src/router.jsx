import { useSyncExternalStore } from 'react';

// Minimal hash-based router (no dependency). Routes are the part after '#',
// e.g. location '#/spiderlive' → route '/spiderlive'. Default route is '/'.
const getRoute = () => window.location.hash.replace(/^#/, '') || '/';
const subscribe = (cb) => {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
};

// Current route, re-rendering the component on every hashchange.
export const useRoute = () => useSyncExternalStore(subscribe, getRoute, () => '/');

// Programmatic navigation. Setting the hash fires 'hashchange' on its own.
export const navigate = (path) => { window.location.hash = path; window.scrollTo(0, 0); };
