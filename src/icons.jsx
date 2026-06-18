import React from 'react';

export const REPO_URL = 'https://github.com/JohanWences/spiderlive-simulator';

// ---- Monochrome line/solid icon set (no emojis) ----
function S({ size = 18, w = 2, children, style }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>{children}</svg>;
}
function F({ size = 18, children, style }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ display: 'block', ...style }}>{children}</svg>;
}

export const IconSearch = (p) => <S {...p}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></S>;
export const IconPanel = (p) => <S {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /></S>;
export const IconComponents = (p) => <S {...p}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></S>;
export const IconCpu = (p) => <S {...p}><rect x="6" y="6" width="12" height="12" rx="1.5" /><rect x="9.5" y="9.5" width="5" height="5" rx="0.5" /><path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2" /></S>;
export const IconPlay = (p) => <F {...p}><path d="M7 5l12 7-12 7z" /></F>;
export const IconStop = (p) => <F {...p}><rect x="6" y="6" width="12" height="12" rx="1.5" /></F>;
export const IconPause = (p) => <F {...p}><rect x="6.5" y="5" width="4" height="14" rx="1" /><rect x="13.5" y="5" width="4" height="14" rx="1" /></F>;
export const IconAlert = (p) => <S {...p}><path d="M12 3L2 20h20z" /><path d="M12 9v5" /><path d="M12 17.5h.01" /></S>;
export const IconReset = (p) => <S {...p}><path d="M3 9a9 9 0 1 1-2 5" /><path d="M3 4v5h5" /></S>;
export const IconFit = (p) => <S {...p}><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></S>;
export const IconFolder = (p) => <S {...p}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></S>;
export const IconFile = (p) => <S {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /></S>;
export const IconSettings = (p) => <S {...p}><path d="M4 7h10M18 7h2" /><circle cx="16" cy="7" r="2" /><path d="M4 17h6M14 17h6" /><circle cx="12" cy="17" r="2" /></S>;
export const IconLink = (p) => <S {...p}><path d="M9 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1" /><path d="M15 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1" /></S>;
export const IconGrip = (p) => <F {...p}><circle cx="9" cy="6" r="1.4" /><circle cx="15" cy="6" r="1.4" /><circle cx="9" cy="12" r="1.4" /><circle cx="15" cy="12" r="1.4" /><circle cx="9" cy="18" r="1.4" /><circle cx="15" cy="18" r="1.4" /></F>;
export const IconChevron = (p) => <S {...p}><path d="M9 6l6 6-6 6" /></S>;
export const IconPlus = (p) => <S {...p}><path d="M12 5v14M5 12h14" /></S>;
export const IconStar = (p) => <F {...p}><path d="M12 2l2.9 6.3 6.6.6-5 4.4 1.5 6.4L12 16.9 6 20.1l1.5-6.4-5-4.4 6.6-.6z" /></F>;
export const IconMail = (p) => <S {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></S>;
export const IconX = (p) => <S {...p}><path d="M6 6l12 12M18 6L6 18" /></S>;
export const IconArrowLeft = (p) => <S {...p}><path d="M19 12H5M12 19l-7-7 7-7" /></S>;
export const IconLogout = (p) => <S {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></S>;
export const IconGlobe = (p) => <S {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z" /></S>;
export const IconBook = (p) => <S {...p}><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M4 5v14" /></S>;

export function GoogleIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden="true" style={{ display: 'block' }}>
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.96v2.34A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.98 10.72a5.4 5.4 0 0 1 0-3.44V4.96H.96a9 9 0 0 0 0 8.1l3.02-2.34z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.47.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3.02 2.34C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}

export function GitHubIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} fill={color} aria-hidden="true" style={{ display: 'block' }}>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.65 7.65 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}
