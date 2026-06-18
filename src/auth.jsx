import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase.js';
import { navigate } from './router.jsx';

const AuthCtx = createContext({ session: null, user: null, loading: true });
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      setSession(sess);
      if (event === 'SIGNED_IN') {
        const route = window.location.hash.replace(/^#/, '');
        if (route === '/signin' || route === '/signup' || route === '' || route === '/') navigate('/home');
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return <AuthCtx.Provider value={{ session, user: session?.user ?? null, loading }}>{children}</AuthCtx.Provider>;
}

// Auth actions
export const signInWithGoogle = () =>
  supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/' } });

export const sendMagicLink = (email) =>
  supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin + '/' } });

export const signOut = () => supabase.auth.signOut();
