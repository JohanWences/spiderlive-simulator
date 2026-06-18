import React from 'react';
import { navigate } from '../router.jsx';
import { AuthShell, linkBtn } from './auth-ui.jsx';
import AuthPanel from './AuthPanel.jsx';

export default function SignUp() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Start building and simulating in minutes"
      footer={<>Already have an account? <button style={linkBtn} onClick={() => navigate('/signin')}>Sign in</button></>}>
      <AuthPanel signup={true} />
    </AuthShell>
  );
}
