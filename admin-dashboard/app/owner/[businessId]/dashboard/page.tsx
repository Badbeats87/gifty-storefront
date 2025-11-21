import { getBusinessByIdForUser, requireAuth } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { getGiftCardsByBusiness } from '@/lib/queries/giftCards'; // Import the new query function

export default async function BusinessDashboardPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  // Require authentication
  const session = await requireAuth();
  const { businessId } = await params; // Await params
  const business = await getBusinessByIdForUser(businessId, session.email);

  if (!business) {
    notFound();
  }

  // Fetch gift card summary data for the business using the query function
  const giftCards = await getGiftCardsByBusiness(businessId);

  const totalIssuedAmount = giftCards.reduce((sum, card) => sum + card.amount, 0);
  const totalRemainingBalance = giftCards.reduce((sum, card) => sum + (card.remaining_balance || 0), 0);
  const totalRedeemedAmount = totalIssuedAmount - totalRemainingBalance;
  const activeCardsCount = giftCards.filter(card => card.status === 'issued' || card.status === 'partially_redeemed').length;
  const redeemedCardsCount = giftCards.filter(card => card.status === 'redeemed').length;

  // Get recent activity (last 10 cards) - still need to select customer details
  // Note: getGiftCardsByBusiness fetches all gift card data for the business.
  // If we needed more complex joins or filters not supported by getGiftCardsByBusiness,
  // we might consider extending it or creating a new specific query.
  const recentCards = giftCards
    .sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime())
    .slice(0, 10);


  return (
    <div className="space-y-8">
      <h2 className="text-lg font-light text-black tracking-tight">Overview</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard title="Total Issued Value" value={`$${totalIssuedAmount.toFixed(2)}`} />
        <DashboardCard title="Total Redeemed Value" value={`$${totalRedeemedAmount.toFixed(2)}`} />
        <DashboardCard title="Active Gift Cards" value={activeCardsCount.toString()} />
        <DashboardCard title="Redeemed Gift Cards" value={redeemedCardsCount.toString()} />
      </div>

      {/* Recent Activity */}
      <div className="border border-gray-200 p-8">
        <h3 className="text-lg font-light text-black mb-8 tracking-tight">Recent Activity</h3>
        <div className="space-y-0">
          {recentCards && recentCards.length > 0 ? (
            recentCards.map((card) => (
              <div key={card.id} className="flex items-center justify-between py-4 border-b border-gray-200 last:border-0">
                <div className="flex-1">
                  <p className="font-mono text-sm font-light text-black">{card.code}</p>
                  <p className="text-xs text-gray-600 font-light">
                    {card.customer?.name || card.customer?.email} • {new Date(card.updated_at || 0).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-light text-black">
                    ${(card.remaining_balance || 0).toFixed(2)} / ${card.amount.toFixed(2)}
                  </p>
                  <span
                    className={`inline-block px-3 py-1 text-xs font-light ${
                      card.status === 'issued'
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-black'
                    }`}
                  >
                    {card.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-600 py-12 font-light">No activity yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

function DashboardCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="border border-gray-200 p-6">
      <dt className="text-xs font-light text-gray-600 uppercase tracking-widest mb-3">{title}</dt>
      <dd className="text-3xl font-light text-black">{value}</dd>
    </div>
  );
}
