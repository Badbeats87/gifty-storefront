import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    const { limit = 50, status } = await request.json();

    const supabase = getServiceSupabase();

    let query = supabase
      .from('audit_logs')
      .select(`
        *,
        admin_user:admin_users(username, email)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      // If table doesn't exist, return empty array instead of error
      if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
        console.warn('audit_logs table not yet created');
        return NextResponse.json([]);
      }

      console.error('Error fetching audit logs:', error);
      return NextResponse.json([], { status: 200 }); // Return empty array on error
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json([], { status: 200 }); // Return empty array on error
  }
}
