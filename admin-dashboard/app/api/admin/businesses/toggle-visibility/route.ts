import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import { getServiceSupabase } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    await requireAdminAuth();

    const { businessId, isVisible } = await request.json();

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID is required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('businesses')
      .update({ is_visible: isVisible })
      .eq('id', businessId)
      .select()
      .single();

    if (error) {
      console.error('Error toggling visibility:', error.message);
      return NextResponse.json({ error: `Failed to toggle visibility: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({
      message: `Business visibility updated to ${isVisible ? 'visible' : 'hidden'}`,
      business: data,
    }, { status: 200 });

  } catch (error: any) {
    console.error('API Error (POST /api/admin/businesses/toggle-visibility):', error.message);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
