import React from 'react';
import { createRoot } from 'react-dom/client';
import Workspace from './pages/Workspace.jsx';
import Landing from './pages/Landing.jsx';
import Home from './pages/Home.jsx';
import Docs from './pages/Docs.jsx';
import SignIn from './pages/SignIn.jsx';
import SignUp from './pages/SignUp.jsx';
import Terms from './pages/Terms.jsx';
import Privacy from './pages/Privacy.jsx';
import Cookies from './pages/Cookies.jsx';
import Community from './pages/Community.jsx';
import SharedOpener from './pages/SharedOpener.jsx';
import { useRoute } from './router.jsx';
import { AuthProvider } from './auth.jsx';

function Root() {
  const route = useRoute();
  if (route.startsWith('/p/')) return <SharedOpener id={route.slice(3)} />;   // shared circuit link
  if (route === '/simulator') return <Workspace />;
  if (route === '/home') return <Home />;
  if (route === '/community') return <Community />;
  if (route === '/docs') return <Docs />;
  if (route === '/signin') return <SignIn />;
  if (route === '/signup') return <SignUp />;
  if (route === '/terms') return <Terms />;
  if (route === '/privacy') return <Privacy />;
  if (route === '/cookies') return <Cookies />;
  return <Landing />;   // '/', '/spiderlive' (alias) and anything else → the landing
}

createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <Root />
  </AuthProvider>
);
