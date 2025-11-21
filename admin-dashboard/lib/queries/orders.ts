import 'server-only';
import { getServiceSupabase } from '@/lib/supabaseAdmin';
import type { Database } from '@/lib/database.types';

type Order = Database['public']['Tables']['orders']['Row'];

export interface OrderWithDetails extends Order {
  customer?: { email: string; name: string | null } | null;
  business?: { name: string } | null;
}

/**
 * Fetches orders within a specified date range
 * @param startDate - Start date for filtering
 * @param endDate - End date for filtering
 * @returns Array of orders with customer and business details
 */
export async function getOrdersByDateRange(
  startDate: Date,
  endDate: Date
): Promise<OrderWithDetails[]> {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      customer:customers(email, name),
      business:businesses(name)
    `)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch orders: ${error.message}`);
  }

  return (data as OrderWithDetails[]) || [];
}

/**
 * Fetches all orders, ordered by creation date
 * @returns Array of all orders
 */
export async function getAllOrders(): Promise<OrderWithDetails[]> {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      customer:customers(email, name),
      business:businesses(name)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch all orders: ${error.message}`);
  }

  return (data as OrderWithDetails[]) || [];
}

/**
 * Fetches orders for a specific business
 * @param businessId - The business ID
 * @returns Array of orders for that business
 */
export async function getOrdersByBusiness(
  businessId: string
): Promise<OrderWithDetails[]> {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      customer:customers(email, name),
      business:businesses(name)
    `)
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch orders for business: ${error.message}`);
  }

  return (data as OrderWithDetails[]) || [];
}

/**
 * Gets order statistics
 * @returns Order count and total revenue
 */
export async function getOrderStats(): Promise<{
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}> {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from('orders')
    .select('total_amount');

  if (error) {
    throw new Error(`Failed to fetch order stats: ${error.message}`);
  }

  const orders = (data as Array<{ total_amount: number | null }>) || [];
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return {
    totalOrders,
    totalRevenue,
    averageOrderValue,
  };
}
