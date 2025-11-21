import { getBusinessByIdForUser, requireAuth } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/supabaseAdmin';
import { notFound } from 'next/navigation';
import GiftCardTable from './GiftCardTable';

export default async function GiftCardsPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessId: string }>;
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const session = await requireAuth();
  const { businessId } = await params;
  const { search, status } = await searchParams;
  const business = await getBusinessByIdForUser(businessId, session.email);

  if (!business) {
    notFound();
  }

  const supabase = getServiceSupabase();

  // Build query
  let query = supabase
    .from('gift_cards')
    .select(`
      *,
      customer:customers(email, name)
    `)
    .eq('business_id', businessId)
    .order('issued_at', { ascending: false });

  // Apply filters
  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  if (search) {
    query = query.ilike('code', `%${search}%`);
  }

  const { data: giftCards, error } = await query;

  if (error) {
    console.error('Error fetching gift cards:', error);
    return <div>Error loading gift cards</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-light text-black">Gift Cards</h2>
          <p className="text-gray-600 mt-1">
            View and manage all gift cards for your business
          </p>
        </div>
        <div className="text-sm text-gray-600">
          Total: {giftCards?.length || 0} cards
        </div>
      </div>

      <GiftCardTable giftCards={giftCards || []} />
    </div>
  );
}
