import React from 'react';
import { navigate } from '../router.jsx';
import { AuthShell, linkBtn } from './auth-ui.jsx';
import AuthPanel from './AuthPanel.jsx';

export default function SignIn() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your SpiderLive account"
      footer={<>New to SpiderLive? <button style={linkBtn} onClick={() => navigate('/signup')}>Create an account</button></>}>
      <AuthPanel signup={false} />
    </AuthShell>
  );
}
