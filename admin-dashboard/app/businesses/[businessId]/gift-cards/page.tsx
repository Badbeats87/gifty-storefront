import { getServiceSupabase } from '@/lib/supabaseAdmin';
import { notFound } from 'next/navigation';

// Format date consistently
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

export default async function BusinessGiftCardsPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const supabase = getServiceSupabase();

  // Fetch business
  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', businessId)
    .single();

  if (!business) {
    notFound();
  }

  // Fetch all gift cards for this business
  const { data: giftCards, error } = await supabase
    .from('gift_cards')
    .select(`
      *,
      customer:customers(email, name)
    `)
    .eq('business_id', businessId)
    .order('issued_at', { ascending: false });

  if (error) {
    console.error('Error fetching gift cards:', error);
    return (
      <div className="text-red-600">Error loading gift cards</div>
    );
  }

  // Calculate summary stats
  const totalCards = giftCards?.length || 0;
  const activeCards = giftCards?.filter(c => c.status === 'issued' || c.status === 'partially_redeemed').length || 0;
  const redeemedCards = giftCards?.filter(c => c.status === 'redeemed').length || 0;
  const totalValue = giftCards?.reduce((sum, c) => sum + c.amount, 0) || 0;
  const activeBalance = giftCards?.reduce((sum, c) => sum + c.remaining_balance, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-light text-black">Gift Cards</h2>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard label="Total Cards" value={totalCards.toString()} />
        <StatCard label="Active" value={activeCards.toString()} color="green" />
        <StatCard label="Redeemed" value={redeemedCards.toString()} color="gray" />
        <StatCard label="Total Value" value={`$${totalValue.toFixed(2)}`} color="blue" />
        <StatCard label="Active Balance" value={`$${activeBalance.toFixed(2)}`} color="purple" />
      </div>

      {/* Gift Cards Table */}
      <div className="bg-white border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-light text-black">All Gift Cards</h3>
          <p className="text-sm text-gray-500 mt-1">{totalCards} total cards</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-light text-gray-600 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-light text-gray-600 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-light text-gray-600 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-light text-gray-600 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-light text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-light text-gray-600 uppercase tracking-wider">
                  Issued
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {giftCards && giftCards.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No gift cards found
                  </td>
                </tr>
              ) : (
                giftCards?.map((card: any) => (
                  <tr key={card.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono font-light text-black">
                        {card.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {card.customer?.name || 'Unknown'}
                        </div>
                        <div className="text-gray-500">{card.customer?.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${card.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-black">
                        ${card.remaining_balance.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded ${
                          card.status === 'issued'
                            ? 'bg-gray-100 text-gray-800'
                            : card.status === 'redeemed'
                            ? 'bg-gray-100 text-gray-800'
                            : card.status === 'partially_redeemed'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {card.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" suppressHydrationWarning>
                      {formatDate(card.issued_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color = 'gray'
}: {
  label: string;
  value: string;
  color?: 'gray' | 'green' | 'blue' | 'purple';
}) {
  const colorClasses = {
    gray: 'text-gray-900',
    green: 'text-black',
    blue: 'text-black',
    purple: 'text-black',
  };

  return (
    <div className="bg-white border border-gray-200 p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${colorClasses[color]}`}>{value}</p>
    </div>
  );
}
