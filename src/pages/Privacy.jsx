import React from 'react';
import LegalShell from './LegalShell.jsx';

const sections = [
  {
    h: 'Overview',
    p: [
      'This Privacy Policy explains what information SpiderLive ("we", operated by Bithouse) collects and how we use it. We aim to collect as little as possible.',
    ],
  },
  {
    h: 'Information we collect',
    p: [
      'Local data on your device: your circuit layout and preferences are stored in your browser (localStorage). This never leaves your device unless you explicitly share it.',
      'Account data (only if you register): your name and email address, used to create and secure your account.',
      'Usage data (only if you allow Analytics cookies): anonymous, aggregated metrics such as page views and feature usage, to help us improve the Service.',
    ],
  },
  {
    h: 'How we use information',
    p: [
      'To operate and secure the Service, to remember your work between sessions, to respond to your requests, and — where allowed — to understand usage so we can improve SpiderLive. We do not sell your personal data.',
    ],
  },
  {
    h: 'Cookies',
    p: [
      'We use essential cookies to run the app and optional analytics cookies if you consent. You can change your choice at any time via "Manage cookies" in the footer. See our Cookie Policy for details.',
    ],
  },
  {
    h: 'Service providers',
    p: [
      'As the platform grows we may rely on trusted third-party providers (for example, hosting and authentication infrastructure) that process data on our behalf under their own security and privacy commitments. We will keep this policy updated to reflect those providers.',
    ],
  },
  {
    h: 'Data retention',
    p: [
      'Local data remains until you clear it in your browser. Account data is kept while your account is active; you may request deletion at any time.',
    ],
  },
  {
    h: 'Your rights',
    p: [
      'You may request access to, correction of, or deletion of your personal data, and you may withdraw analytics consent at any time. To exercise these rights, contact us at contacto@bithouse.mx.',
    ],
  },
  {
    h: 'Children',
    p: [
      'SpiderLive is intended for general and educational audiences and is not directed at children under 13. We do not knowingly collect personal data from children.',
    ],
  },
  {
    h: 'Changes',
    p: [
      'We may update this policy; material changes will be reflected by the "Last updated" date above.',
    ],
  },
];

export default function Privacy() {
  return (
    <LegalShell
      title="Privacy Policy"
      updated="June 17, 2026"
      intro="Your privacy matters. This policy describes what data SpiderLive handles, why, and the control you have over it."
      sections={sections}
    />
  );
}
