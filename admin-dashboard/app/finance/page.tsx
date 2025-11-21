import { getServiceSupabase } from '@/lib/supabaseAdmin';
import OrderHistoryFilter from '@/components/OrderHistoryFilter';

// Force dynamic rendering to ensure fresh data every time
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface BusinessRevenue {
  business_id: string;
  business_name: string;
  total_issued: number;
  total_redeemed: number;
  active_balance: number;
  card_count: number;
  customer_count: number;
  avg_card_value: number;
  redemption_rate: number;
}

export default async function AdminFinancePage() {
  const supabase = getServiceSupabase();

  // Fetch all gift cards with business information
  const { data: giftCards, error: giftCardsError } = await supabase
    .from('gift_cards')
    .select(`
      id,
      amount,
      remaining_balance,
      status,
      issued_at,
      business_id,
      customer_id,
      business:businesses(name)
    `);

  if (giftCardsError) {
    console.error('Error fetching gift cards:', giftCardsError);
    return (
      <div className="p-8">
        <div className="text-red-600">Error loading financial data</div>
      </div>
    );
  }

  // Fetch all redemptions
  const { data: redemptions } = await supabase
    .from('redemptions')
    .select('gift_card_id, redeemed_at, redeemed_amount')
    .order('redeemed_at', { ascending: false });

  // Calculate time periods
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Calculate platform-wide metrics
  const totalIssued = giftCards.reduce((sum, card) => sum + card.amount, 0);
  const totalRedeemed = giftCards.reduce(
    (sum, card) => sum + (card.amount - card.remaining_balance),
    0
  );
  const activeBalance = giftCards.reduce((sum, card) => sum + card.remaining_balance, 0);
  const totalCards = giftCards.length;

  // This Week metrics
  const weekCards = giftCards.filter(card => new Date(card.issued_at) >= startOfWeek);
  const weekIssued = weekCards.reduce((sum, card) => sum + card.amount, 0);
  const weekRedemptions = redemptions?.filter(r => new Date(r.redeemed_at) >= startOfWeek) || [];
  const weekRedeemed = weekRedemptions.reduce((sum, r) => sum + r.redeemed_amount, 0);

  // This Month metrics
  const monthCards = giftCards.filter(card => new Date(card.issued_at) >= startOfMonth);
  const monthIssued = monthCards.reduce((sum, card) => sum + card.amount, 0);
  const monthRedemptions = redemptions?.filter(r => new Date(r.redeemed_at) >= startOfMonth) || [];
  const monthRedeemed = monthRedemptions.reduce((sum, r) => sum + r.redeemed_amount, 0);

  // Group by business
  const businessMap = new Map<string, BusinessRevenue>();

  giftCards.forEach((card) => {
    const businessId = card.business_id;
    const businessName = (card.business as any)?.name || 'Unknown';

    if (!businessMap.has(businessId)) {
      businessMap.set(businessId, {
        business_id: businessId,
        business_name: businessName,
        total_issued: 0,
        total_redeemed: 0,
        active_balance: 0,
        card_count: 0,
        customer_count: 0,
        avg_card_value: 0,
        redemption_rate: 0,
      });
    }

    const business = businessMap.get(businessId)!;
    business.total_issued += card.amount;
    business.total_redeemed += card.amount - card.remaining_balance;
    business.active_balance += card.remaining_balance;
    business.card_count += 1;
  });

  // Calculate customer counts per business
  const customersByBusiness = giftCards.reduce((acc, card) => {
    if (!acc[card.business_id]) {
      acc[card.business_id] = new Set();
    }
    acc[card.business_id].add(card.customer_id);
    return acc;
  }, {} as Record<string, Set<string>>);

  // Update business stats with customer counts and calculated metrics
  businessMap.forEach((business, businessId) => {
    business.customer_count = customersByBusiness[businessId]?.size || 0;
    business.avg_card_value = business.card_count > 0 ? business.total_issued / business.card_count : 0;
    business.redemption_rate = business.total_issued > 0 ? (business.total_redeemed / business.total_issued) * 100 : 0;
  });

  // Convert to array and sort by total issued (descending)
  const businessRevenues = Array.from(businessMap.values()).sort(
    (a, b) => b.total_issued - a.total_issued
  );

  // Status breakdown
  const statusCounts = giftCards.reduce((acc, card) => {
    acc[card.status] = (acc[card.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Monthly trends (last 6 months)
  const monthlyData: { month: string; issued: number; redeemed: number; businesses: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    const monthName = monthDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

    const monthGiftCards = giftCards.filter(card => {
      const cardDate = new Date(card.issued_at);
      return cardDate >= monthDate && cardDate <= monthEnd;
    });

    const monthRedems = redemptions?.filter(r => {
      const redemDate = new Date(r.redeemed_at);
      return redemDate >= monthDate && redemDate <= monthEnd;
    }) || [];

    const uniqueBusinesses = new Set(monthGiftCards.map(c => c.business_id)).size;

    monthlyData.push({
      month: monthName,
      issued: monthGiftCards.reduce((sum, card) => sum + card.amount, 0),
      redeemed: monthRedems.reduce((sum, r) => sum + r.redeemed_amount, 0),
      businesses: uniqueBusinesses,
    });
  }

  // Unique customers
  const uniqueCustomers = new Set(giftCards.map(card => card.customer_id)).size;

  return (
    <div className="p-8 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-light text-black mb-2">Platform Finance</h1>
          <p className="text-gray-600">Comprehensive revenue analytics and business performance</p>
        </div>

        {/* Platform-wide Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SummaryCard
            title="Total Revenue"
            value={`$${totalIssued.toFixed(2)}`}
            subtitle={`${totalCards} gift cards`}
            trend={`$${(totalIssued / totalCards || 0).toFixed(2)} avg`}
          />
          <SummaryCard
            title="Total Redeemed"
            value={`$${totalRedeemed.toFixed(2)}`}
            subtitle={`${Math.round((totalRedeemed / totalIssued) * 100) || 0}% utilized`}
            trend={`${redemptions?.length || 0} transactions`}
          />
          <SummaryCard
            title="Active Balance"
            value={`$${activeBalance.toFixed(2)}`}
            subtitle="Outstanding customer credit"
            trend={`${statusCounts.issued || 0} active cards`}
          />
          <SummaryCard
            title="Platform Reach"
            value={businessRevenues.length.toString()}
            subtitle="Active businesses"
            trend={`${uniqueCustomers} customers`}
          />
        </div>

        {/* Period Performance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PeriodCard
            title="This Week"
            issued={weekIssued}
            redeemed={weekRedeemed}
            cardCount={weekCards.length}
            redemptionCount={weekRedemptions.length}
          />
          <PeriodCard
            title="This Month"
            issued={monthIssued}
            redeemed={monthRedeemed}
            cardCount={monthCards.length}
            redemptionCount={monthRedemptions.length}
          />
        </div>

        {/* Status & Monthly Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gift Card Status */}
          <div className="bg-white border border-gray-200 p-6">
            <h3 className="text-lg font-light text-black mb-4">Platform Gift Card Status</h3>
            <div className="space-y-3">
              {Object.entries(statusCounts).map(([status, count]) => (
                <StatusBar
                  key={status}
                  label={status}
                  value={count}
                  total={totalCards}
                />
              ))}
            </div>
          </div>

          {/* Monthly Trends */}
          <div className="bg-white border border-gray-200 p-6">
            <h3 className="text-lg font-light text-black mb-4">6-Month Platform Trend</h3>
            <div className="space-y-3">
              {monthlyData.map((data) => (
                <MonthlyBar
                  key={data.month}
                  month={data.month}
                  issued={data.issued}
                  redeemed={data.redeemed}
                  businesses={data.businesses}
                  max={Math.max(...monthlyData.map(d => Math.max(d.issued, d.redeemed)), 100)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Revenue by Business - Enhanced */}
        <div className="bg-white border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-light text-black">Business Performance</h3>
            <p className="text-sm text-gray-600 mt-1">
              Detailed financial breakdown for each business
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Business
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customers
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cards
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Value
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Issued
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Redeemed
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {businessRevenues.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      No business data available
                    </td>
                  </tr>
                ) : (
                  businessRevenues.map((business, idx) => (
                    <tr key={business.business_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white font-light text-sm">
                            {idx + 1}
                          </div>
                          <div>
                            <div className="text-sm font-light text-black">
                              {business.business_name}
                            </div>
                            <div className="text-xs text-gray-600">{business.business_id ? business.business_id.slice(0, 8) : 'N/A'}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {business.customer_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {business.card_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                        ${business.avg_card_value.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-light text-black">
                        ${business.total_issued.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-black">
                        ${business.total_redeemed.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-light text-black">
                        ${business.active_balance.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-sm text-black">{business.redemption_rate.toFixed(1)}%</span>
                          <div className="w-16 h-2 bg-gray-200 overflow-hidden">
                            <div
                              className="h-full bg-black"
                              style={{ width: `${Math.min(business.redemption_rate, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                <tr>
                  <td className="px-6 py-4 font-light text-black" colSpan={2}>
                    Platform Totals
                  </td>
                  <td className="px-6 py-4 text-right font-light text-black">
                    {totalCards}
                  </td>
                  <td className="px-6 py-4 text-right font-light text-black">
                    ${(totalIssued / totalCards || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right font-light text-black">
                    ${totalIssued.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right font-light text-black">
                    ${totalRedeemed.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right font-light text-black">
                    ${activeBalance.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right font-light text-black">
                    {((totalRedeemed / totalIssued) * 100 || 0).toFixed(1)}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Order History */}
        <div className="mt-8">
          <OrderHistoryFilter />
        </div>

        {/* Financial Insights */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <InsightCard
            title="Avg Gift Card"
            value={`$${(totalIssued / totalCards || 0).toFixed(2)}`}
            description="Platform average"
            icon="🎁"
          />
          <InsightCard
            title="Avg per Business"
            value={`$${(totalIssued / businessRevenues.length || 0).toFixed(2)}`}
            description="Mean revenue"
            icon="🏢"
          />
          <InsightCard
            title="Platform Rate"
            value={`${Math.round((totalRedeemed / totalIssued) * 100) || 0}%`}
            description="Redemption rate"
            icon="✓"
          />
          <InsightCard
            title="Avg Customers"
            value={`${Math.round(uniqueCustomers / businessRevenues.length || 0)}`}
            description="Per business"
            icon="👥"
          />
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
  trend,
}: {
  title: string;
  value: string;
  subtitle: string;
  trend: string;
}) {
  return (
    <div className="bg-white overflow-hidden border border-gray-200">
      <div className="px-4 py-5 sm:p-6">
        <dt className="text-sm font-light text-gray-600 truncate">{title}</dt>
        <dd className="mt-1 text-3xl font-light text-black">
          {value}
        </dd>
        <p className="mt-2 text-xs text-gray-600">{subtitle}</p>
        <p className="mt-1 text-xs font-light text-gray-600">{trend}</p>
      </div>
    </div>
  );
}

function PeriodCard({
  title,
  issued,
  redeemed,
  cardCount,
  redemptionCount,
}: {
  title: string;
  issued: number;
  redeemed: number;
  cardCount: number;
  redemptionCount: number;
}) {
  return (
    <div className="bg-white border border-gray-200 p-6">
      <h3 className="text-lg font-light text-black mb-4">{title}</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-600">Issued</p>
          <p className="text-2xl font-light text-black">${issued.toFixed(2)}</p>
          <p className="text-xs text-gray-600 mt-1">{cardCount} cards</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Redeemed</p>
          <p className="text-2xl font-light text-black">${redeemed.toFixed(2)}</p>
          <p className="text-xs text-gray-600 mt-1">{redemptionCount} transactions</p>
        </div>
      </div>
    </div>
  );
}

function StatusBar({ label, value, total }: { label: string; value: number; total: number }) {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600 capitalize">{label.replace('_', ' ')}</span>
        <span className="font-light text-black">
          {value} ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="w-full h-2 bg-gray-200 overflow-hidden">
        <div className="h-full bg-black transition-all duration-300" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function MonthlyBar({
  month,
  issued,
  redeemed,
  businesses,
  max,
}: {
  month: string;
  issued: number;
  redeemed: number;
  businesses: number;
  max: number;
}) {
  const issuedPct = (issued / max) * 100;
  const redeemedPct = (redeemed / max) * 100;

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <div>
          <span className="font-light text-gray-600">{month}</span>
          <span className="text-gray-600 ml-2">({businesses} biz)</span>
        </div>
        <span className="text-gray-600">
          <span className="text-black font-light">${issued.toFixed(0)}</span>
          {' / '}
          <span className="text-black font-light">${redeemed.toFixed(0)}</span>
        </span>
      </div>
      <div className="flex gap-1">
        <div className="flex-1 h-2 bg-gray-200 overflow-hidden">
          <div className="h-full bg-black transition-all duration-300" style={{ width: `${issuedPct}%` }} />
        </div>
        <div className="flex-1 h-2 bg-gray-200 overflow-hidden">
          <div className="h-full bg-gray-400 transition-all duration-300" style={{ width: `${redeemedPct}%` }} />
        </div>
      </div>
    </div>
  );
}

function InsightCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="bg-white overflow-hidden border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{icon}</span>
        <h4 className="text-sm font-light text-gray-600">{title}</h4>
      </div>
      <p className="text-2xl font-light text-black mb-1">{value}</p>
      <p className="text-xs text-gray-600">{description}</p>
    </div>
  );
}
