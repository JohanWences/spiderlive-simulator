import { createClient } from '@supabase/supabase-js';

// Public values (the publishable/anon key is safe in the browser). Env vars override
// them on Vercel. PKCE flow returns ?code=… in the query, which doesn't clash with
// our hash router (#/route).
const url = import.meta.env.VITE_SUPABASE_URL || 'https://xszxazqmbjxelevqzgdk.supabase.co';
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_0n5-aDdFBu_Huu6nIXoJbA_sog9trzY';

export const supabase = createClient(url, key, {
  auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true },
});
