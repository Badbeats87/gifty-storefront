import 'server-only';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
// Only use server-side service role key (never NEXT_PUBLIC_* version for security)
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Supabase configuration missing:', {
    hasUrl: !!SUPABASE_URL,
    hasServiceKey: !!SERVICE_ROLE_KEY,
    urlValue: SUPABASE_URL ? 'SET' : 'MISSING',
    keyValue: SERVICE_ROLE_KEY ? 'SET (length: ' + SERVICE_ROLE_KEY.length + ')' : 'MISSING',
  });
  throw new Error('Supabase service role credentials are not configured');
}

const serviceClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export function getServiceSupabase() {
  return serviceClient;
}
