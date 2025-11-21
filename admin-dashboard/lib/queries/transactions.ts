import 'server-only';
import { getServiceSupabase } from '@/lib/supabaseAdmin';
import type { Database } from '@/lib/database.types';

type Transaction = Database['public']['Tables']['transactions']['Row'];

/**
 * Fetches all transactions ordered by creation date.
 * @returns Array of transactions.
 * @throws {Error} If the database query fails.
 */
export async function getAllTransactions(): Promise<Transaction[]> {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch all transactions: ${error.message}`);
  }

  return data || [];
}

/**
 * Fetches transactions for a specific business, ordered by creation date.
 * @param businessId - The ID of the business.
 * @returns Array of transactions for the specified business.
 * @throws {Error} If the database query fails.
 */
export async function getTransactionsByBusiness(businessId: string): Promise<Transaction[]> {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch transactions for business ${businessId}: ${error.message}`);
  }

  return data || [];
}

/**
 * Calculates aggregated statistics for transactions.
 * This function currently returns counts for all transactions, purchase transactions, and redemption transactions.
 * Future enhancements might include filtering by business_id or date ranges.
 * @returns An object containing transaction statistics.
 * @throws {Error} If the database query fails.
 */
export async function getTransactionStats() {
  const supabase = getServiceSupabase();

  const { count: totalCount, error: totalError } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true });

  if (totalError) {
    throw new Error(`Failed to fetch total transaction count: ${totalError.message}`);
  }

  const { count: purchaseCount, error: purchaseError } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('type', 'purchase'); // Assuming 'purchase' is a type in your transactions table

  if (purchaseError) {
    throw new Error(`Failed to fetch purchase transaction count: ${purchaseError.message}`);
  }

  const { count: redemptionCount, error: redemptionError } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('type', 'redemption'); // Assuming 'redemption' is a type in your transactions table

  if (redemptionError) {
    throw new Error(`Failed to fetch redemption transaction count: ${redemptionError.message}`);
  }

  return {
    totalTransactions: totalCount || 0,
    purchaseTransactions: purchaseCount || 0,
    redemptionTransactions: redemptionCount || 0,
  };
}
