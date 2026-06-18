import React from 'react';
import LegalShell from './LegalShell.jsx';

const sections = [
  {
    h: 'What cookies are',
    p: [
      'Cookies and similar technologies (including browser localStorage) are small pieces of data stored on your device. SpiderLive uses them to keep the app working and, optionally, to understand how it is used.',
    ],
  },
  {
    h: 'Categories we use',
    p: [
      'Essential — required for the Service to function: keeping your session, remembering your saved circuit layout and your cookie choice. These are always on and cannot be disabled, as the app would not work without them.',
      'Analytics (optional) — anonymous, aggregated usage statistics that help us improve SpiderLive. These are only set if you opt in.',
    ],
  },
  {
    h: 'Managing your choices',
    p: [
      'You can review and change your preferences at any time using the "Manage cookies" link in the footer. You can also clear or block cookies through your browser settings, though disabling essential storage may affect how the app works.',
    ],
  },
  {
    h: 'Changes',
    p: [
      'We may update this Cookie Policy as the platform evolves. The "Last updated" date above reflects the latest version.',
    ],
  },
];

export default function Cookies() {
  return (
    <LegalShell
      title="Cookie Policy"
      updated="June 17, 2026"
      intro="This policy explains how SpiderLive uses cookies and local storage, and how you can control them."
      sections={sections}
    />
  );
}
