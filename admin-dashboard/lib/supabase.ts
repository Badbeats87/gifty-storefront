import { createClient } from '@supabase/supabase-js';

let supabaseClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    // Use service role key for admin dashboard (bypasses RLS)
    // Note: In production, use server-side API routes for better security
    supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
  }

  return supabaseClient;
}

export const supabase = new Proxy({} as any, {
  get(target, prop) {
    return Reflect.get(getSupabaseClient(), prop);
  },
});

// Database types
export interface GiftCard {
  id: string;
  code: string;
  business_id: string;
  customer_id: string;
  amount: number;
  currency: string;
  remaining_balance: number;
  status: 'issued' | 'redeemed' | 'expired' | 'cancelled';
  order_id: string | null;
  line_item_id: string | null;
  purchase_source: string;
  expires_at: string;
  redeemed_at: string | null;
  redeemed_by: string | null;
  created_at: string;
  metadata: any;
  business?: { name: string };
  customer?: { email: string; name: string | null };
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Customer {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
}
