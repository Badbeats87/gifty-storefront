import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getBusinessByIdForUser } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { code, businessId } = await request.json();

  if (!code || !businessId) {
    return NextResponse.json(
      { error: 'Code and businessId are required' },
      { status: 400 }
    );
  }

  const business = await getBusinessByIdForUser(businessId, session.email);

  if (!business) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const supabase = getServiceSupabase();
  const normalizedCode = code.trim().toUpperCase();

  const { data: giftCard, error } = await supabase
    .from('gift_cards')
    .select(
      `
        *,
        customer:customers(email, name)
      `
    )
    .eq('business_id', businessId)
    .eq('code', normalizedCode)
    .maybeSingle();

  if (error || !giftCard) {
    return NextResponse.json(
      { error: 'Gift card not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ giftCard });
}
