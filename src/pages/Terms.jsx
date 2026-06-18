import React from 'react';
import LegalShell from './LegalShell.jsx';

const sections = [
  {
    h: 'Acceptance of these terms',
    p: [
      'SpiderLive ("the Service") is an open-source, educational electro-pneumatic web simulator operated by Bithouse (bithouse.mx). By accessing or using the Service you agree to these Terms. If you do not agree, please do not use the Service.',
    ],
  },
  {
    h: 'The service',
    p: [
      'SpiderLive lets you build, wire and run simulated electro-pneumatic circuits in your browser. It is intended for learning, teaching and demonstration. It is not a substitute for engineering validation, certified design tools, or real-world safety testing of physical equipment.',
      'The Service is provided on an "as is" and "as available" basis and may change, pause or be discontinued at any time.',
    ],
  },
  {
    h: 'Open-source license',
    p: [
      'The SpiderLive source code is released under the MIT License and is available at github.com/JohanWences/spiderlive-simulator. Your use, copying, modification and distribution of the code is governed by that license. These Terms govern your use of the hosted Service, not the code license.',
    ],
  },
  {
    h: 'Acceptable use',
    p: [
      'You agree not to misuse the Service: no unlawful activity, no attempts to disrupt, overload, reverse-engineer the hosted infrastructure, or gain unauthorized access, and no use of the Service to harm others or to make real-world safety decisions without independent professional verification.',
    ],
  },
  {
    h: 'Accounts',
    p: [
      'Some features may require an account. You are responsible for the accuracy of your registration details and for keeping your credentials secure. You are responsible for activity that occurs under your account.',
    ],
  },
  {
    h: 'Intellectual property',
    p: [
      'The SpiderLive name, logo and brand are property of Bithouse. The underlying code is licensed under MIT as described above. Content you create with the Service remains yours.',
    ],
  },
  {
    h: 'Disclaimer of warranties',
    p: [
      'To the maximum extent permitted by law, the Service is provided without warranties of any kind, whether express or implied, including fitness for a particular purpose, accuracy, or non-infringement. Simulation results are illustrative and may not reflect real physical behavior.',
    ],
  },
  {
    h: 'Limitation of liability',
    p: [
      'To the maximum extent permitted by law, Bithouse and its contributors shall not be liable for any indirect, incidental, special or consequential damages, or for any loss arising from your use of, or inability to use, the Service — including any decision made based on simulation output.',
    ],
  },
  {
    h: 'Changes and governing law',
    p: [
      'We may update these Terms from time to time; continued use after changes means you accept the updated Terms. These Terms are governed by the laws of Mexico, without regard to conflict-of-law rules.',
    ],
  },
];

export default function Terms() {
  return (
    <LegalShell
      title="Terms of Service"
      updated="June 17, 2026"
      intro="These Terms govern your use of the SpiderLive web simulator. Please read them carefully — they explain what SpiderLive is, how you may use it, and the limits of our responsibility."
      sections={sections}
    />
  );
}
