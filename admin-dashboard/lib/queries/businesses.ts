import 'server-only';
import { getServiceSupabase } from '@/lib/supabaseAdmin';
import type { Database } from '@/lib/database.types';

type Business = Database['public']['Tables']['businesses']['Row'];
type BusinessApplication = Database['public']['Tables']['business_applications']['Row'];
type BusinessInvite = Database['public']['Tables']['business_invites']['Row'];

/**
 * Fetches all businesses ordered by creation date
 * @returns Array of businesses
 * @throws {Error} If database query fails
 */
export async function getAllBusinesses(): Promise<Business[]> {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch businesses: ${error.message}`);
  }

  return data || [];
}

/**
 * Fetches a single business by ID
 * @param businessId - The business UUID
 * @returns Business or null if not found
 */
export async function getBusinessById(businessId: string): Promise<Business | null> {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', businessId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch business: ${error.message}`);
  }

  return data;
}

/**
 * Fetches all pending business applications
 * @returns Array of pending applications
 */
export async function getPendingApplications(): Promise<BusinessApplication[]> {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from('business_applications')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch applications: ${error.message}`);
  }

  return data || [];
}

/**
 * Fetches all business invites
 * @returns Array of all invites
 */
export async function getAllInvites(): Promise<BusinessInvite[]> {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from('business_invites')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch invites: ${error.message}`);
  }

  return data || [];
}

/**
 * Fetches business statistics including gift card data
 * @param businessId - The business UUID
 * @returns Business stats
 */
export async function getBusinessStats(businessId: string) {
  const supabase = getServiceSupabase();

  const { data: giftCards, error } = await supabase
    .from('gift_cards')
    .select('amount, remaining_balance, status')
    .eq('business_id', businessId);

  if (error) {
    throw new Error(`Failed to fetch business stats: ${error.message}`);
  }

  const cards = giftCards || [];

  return {
    totalIssued: cards.reduce((sum, card) => sum + card.amount, 0),
    totalRedeemed: cards.reduce((sum, card) => sum + (card.amount - card.remaining_balance), 0),
    activeCards: cards.filter(c => c.status === 'issued' || c.status === 'partially_redeemed').length,
    redeemedCards: cards.filter(c => c.status === 'redeemed').length,
  };
}
