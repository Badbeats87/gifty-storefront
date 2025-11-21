import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    const { startDate, endDate } = await request.json();

    if (!startDate || !endDate) {
      return NextResponse.json([], { status: 200 });
    }

    const supabase = getServiceSupabase();

    // First try with full relationships
    let result = await supabase
      .from('orders')
      .select(`
        id,
        created_at,
        total_amount,
        status,
        customer:customers(email, name),
        business:businesses(name)
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    let { data, error } = result;

    // If relationship query fails, try without relationships
    if (error && error.message?.includes('relation')) {
      console.warn('Order history: Trying without relationships');
      const fallbackResult = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          total_amount,
          status
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      data = fallbackResult.data as any;
      error = fallbackResult.error;
    }

    // If table doesn't exist, return empty array gracefully
    if (error) {
      if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
        console.warn('Orders table may not be created yet');
        return NextResponse.json([]);
      }

      console.error('Error fetching orders:', error);
      return NextResponse.json([]);
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching order history:', error);
    return NextResponse.json([]);
  }
}
