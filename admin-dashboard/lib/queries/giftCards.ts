import 'server-only';
import { getServiceSupabase } from '@/lib/supabaseAdmin';
import type { Database } from '@/lib/database.types';

type GiftCard = Database['public']['Tables']['gift_cards']['Row'];
type Customer = Database['public']['Tables']['customers']['Row'];

// Define a new type that includes the customer details
export type GiftCardWithCustomer = GiftCard & {
  customer: Pick<Customer, 'email' | 'name'> | null;
};

/**
 * Fetches all gift cards ordered by creation date, including customer details.
 * @returns Array of gift cards with customer details.
 * @throws {Error} If database query fails.
 */
export async function getAllGiftCards(): Promise<GiftCardWithCustomer[]> {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from('gift_cards')
    .select(`
      *,
      customer:customers(email, name)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch all gift cards: ${error.message}`);
  }

  return data || [];
}

/**
 * Fetches gift cards for a specific business, including customer details.
 * @param businessId - The ID of the business.
 * @returns Array of gift cards with customer details.
 * @throws {Error} If database query fails.
 */
export async function getGiftCardsByBusiness(businessId: string): Promise<GiftCardWithCustomer[]> {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from('gift_cards')
    .select(`
      *,
      customer:customers(email, name)
    `)
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch gift cards for business ${businessId}: ${error.message}`);
  }

  return data || [];
}


/**
 * Searches for a gift card by its code
 * @param code - The unique code of the gift card
 * @returns GiftCard or null if not found
 * @throws {Error} If database query fails
 */
export async function searchGiftCardByCode(code: string): Promise<GiftCard | null> {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from('gift_cards')
    .select('*')
    .eq('code', code)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to search gift card by code ${code}: ${error.message}`);
  }

  return data;
}

/**
 * Calculates aggregated statistics for gift cards.
 * This function currently returns total issued, total redeemed, active, and redeemed card counts.
 * Future enhancements might include filtering by business_id or date ranges.
 * @returns An object containing gift card statistics.
 * @throws {Error} If database query fails.
 */
export async function getGiftCardStats() {
  const supabase = getServiceSupabase();

  const { data: giftCards, error } = await supabase
    .from('gift_cards')
    .select('amount, remaining_balance, status');

  if (error) {
    throw new Error(`Failed to fetch gift card stats: ${error.message}`);
  }

  const cards = giftCards || [];

  return {
    totalIssuedAmount: cards.reduce((sum, card) => sum + card.amount, 0),
    totalRedeemedAmount: cards.reduce((sum, card) => sum + (card.amount - card.remaining_balance), 0),
    activeCardsCount: cards.filter(c => c.status === 'issued' || c.status === 'partially_redeemed').length,
    fullyRedeemedCardsCount: cards.filter(c => c.status === 'redeemed').length,
    totalGiftCards: cards.length,
  };
}
