import { getServiceSupabase } from '@/lib/supabaseAdmin';
import { notFound } from 'next/navigation';
import React from 'react';

// Force dynamic rendering to ensure fresh data every time
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Transaction {
  id: string;
  code: string;
  amount: number;
  remaining_balance: number;
  status: string;
  issued_at: string;
  customer: {
    email: string;
    name: string | null;
  };
  redemptions: Array<{
    redeemed_at: string;
    redeemed_amount: number;
  }>;
}

interface CustomerStats {
  email: string;
  name: string | null;
  total_purchased: number;
  total_redeemed: number;
  card_count: number;
}

export default async function BusinessFinancePage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const supabase = getServiceSupabase();

  // Admin view - no auth required, just fetch business
  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', businessId)
    .single();

  if (!business) {
    notFound();
  }

  // Fetch all gift cards for financial calculations
  const { data: giftCardsRaw, error: giftCardsError } = await supabase
    .from('gift_cards')
    .select(`
      id,
      code,
      amount,
      remaining_balance,
      status,
      issued_at,
      created_at,
      customer:customers(email, name)
    `)
    .eq('business_id', businessId)
    .order('issued_at', { ascending: false });

  // Type the data correctly
  const giftCards = (giftCardsRaw || []).map(card => ({
    ...card,
    customer: Array.isArray(card.customer) ? card.customer[0] : card.customer
  })) as Array<{
    id: string;
    code: string;
    amount: number;
    remaining_balance: number;
    status: string;
    issued_at: string;
    created_at: string;
    customer: { email: string; name: string | null };
  }>;

  if (giftCardsError) {
    console.error('Error fetching gift cards:', giftCardsError);
    notFound();
  }

  // Fetch redemption transactions
  const { data: redemptions } = await supabase
    .from('redemptions')
    .select('gift_card_id, redeemed_at, redeemed_amount')
    .in('gift_card_id', giftCards?.map(c => c.id) || [])
    .order('redeemed_at', { ascending: false });

  // Calculate time periods
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  // Calculate financial metrics - All Time
  const totalIssued = giftCards.reduce((sum, card) => sum + card.amount, 0);
  const totalRedeemed = giftCards.reduce((sum, card) => sum + (card.amount - card.remaining_balance), 0);
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

  // Average metrics
  const avgCardValue = totalCards > 0 ? totalIssued / totalCards : 0;
  const redemptionRate = totalIssued > 0 ? (totalRedeemed / totalIssued) * 100 : 0;

  // Status breakdown
  const statusCounts = giftCards.reduce((acc, card) => {
    acc[card.status] = (acc[card.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Customer analytics
  const customerMap = new Map<string, CustomerStats>();
  giftCards.forEach(card => {
    const key = card.customer.email;
    if (!customerMap.has(key)) {
      customerMap.set(key, {
        email: card.customer.email,
        name: card.customer.name,
        total_purchased: 0,
        total_redeemed: 0,
        card_count: 0,
      });
    }
    const customer = customerMap.get(key)!;
    customer.total_purchased += card.amount;
    customer.total_redeemed += card.amount - card.remaining_balance;
    customer.card_count += 1;
  });

  const topCustomers = Array.from(customerMap.values())
    .sort((a, b) => b.total_purchased - a.total_purchased)
    .slice(0, 10);

  // Group redemptions by gift card
  const redemptionsByCard = redemptions?.reduce((acc, redemption) => {
    if (!acc[redemption.gift_card_id]) {
      acc[redemption.gift_card_id] = [];
    }
    acc[redemption.gift_card_id].push(redemption);
    return acc;
  }, {} as Record<string, typeof redemptions>) || {};

  // Combine gift cards with their redemptions for transaction list
  const transactions: Transaction[] = giftCards.map(card => ({
    ...card,
    redemptions: redemptionsByCard[card.id] || [],
  }));

  // Monthly trends (last 6 months)
  const monthlyData: { month: string; issued: number; redeemed: number }[] = [];
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

    monthlyData.push({
      month: monthName,
      issued: monthGiftCards.reduce((sum, card) => sum + card.amount, 0),
      redeemed: monthRedems.reduce((sum, r) => sum + r.redeemed_amount, 0),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-light text-black">Finance</h2>
      </div>

      {/* Quick Overview - All Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          title="Total Revenue"
          value={`$${totalIssued.toFixed(2)}`}
          subtitle={`${totalCards} gift cards`}
          color="blue"
          trend={`$${avgCardValue.toFixed(2)} avg`}
        />
        <SummaryCard
          title="Total Redeemed"
          value={`$${totalRedeemed.toFixed(2)}`}
          subtitle={`${redemptionRate.toFixed(1)}% redemption rate`}
          color="green"
          trend={`${redemptions?.length || 0} transactions`}
        />
        <SummaryCard
          title="Active Balance"
          value={`$${activeBalance.toFixed(2)}`}
          subtitle="Outstanding credit"
          color="purple"
          trend={`${statusCounts.issued || 0} active cards`}
        />
        <SummaryCard
          title="Unique Customers"
          value={customerMap.size.toString()}
          subtitle="Total customers"
          color="orange"
          trend={`${(totalCards / customerMap.size || 0).toFixed(1)} cards/customer`}
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

      {/* Gift Card Status & Monthly Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white border border-gray-200 p-6">
          <h3 className="text-lg font-light text-black mb-4">Gift Card Status</h3>
          <div className="space-y-3">
            {Object.entries(statusCounts).map(([status, count]) => (
              <StatusBar
                key={status}
                label={status}
                value={count}
                total={totalCards}
              />
            ))}
            {Object.keys(statusCounts).length === 0 && (
              <p className="text-center text-gray-500 py-4">No gift cards issued yet</p>
            )}
          </div>
        </div>

        {/* Monthly Trends */}
        <div className="bg-white border border-gray-200 p-6">
          <h3 className="text-lg font-light text-black mb-4">6-Month Trend</h3>
          <div className="space-y-3">
            {monthlyData.map((data) => (
              <MonthlyBar
                key={data.month}
                month={data.month}
                issued={data.issued}
                redeemed={data.redeemed}
                max={Math.max(...monthlyData.map(d => Math.max(d.issued, d.redeemed)), 100)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Top Customers */}
      <div className="bg-white border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-light text-black">Top Customers</h3>
          <p className="text-sm text-gray-500 mt-1">By total gift card purchases</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-light text-gray-600 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-right text-xs font-light text-gray-600 uppercase tracking-wider">
                  Cards
                </th>
                <th className="px-6 py-3 text-right text-xs font-light text-gray-600 uppercase tracking-wider">
                  Total Purchased
                </th>
                <th className="px-6 py-3 text-right text-xs font-light text-gray-600 uppercase tracking-wider">
                  Total Redeemed
                </th>
                <th className="px-6 py-3 text-right text-xs font-light text-gray-600 uppercase tracking-wider">
                  Remaining
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topCustomers.length > 0 ? (
                topCustomers.map((customer, idx) => (
                  <tr key={customer.email} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-black flex items-center justify-center text-white font-semibold text-sm">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="text-sm font-light text-black">
                            {customer.name || 'Unknown'}
                          </div>
                          <div className="text-xs text-gray-500">{customer.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                      {customer.card_count}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-black">
                      ${customer.total_purchased.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                      ${customer.total_redeemed.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-black">
                      ${(customer.total_purchased - customer.total_redeemed).toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No customers yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-light text-black">Transaction History</h3>
          <p className="text-sm text-gray-500 mt-1">All gift card issuances and redemptions</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-light text-gray-600 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-light text-gray-600 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-light text-gray-600 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-light text-gray-600 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-right text-xs font-light text-gray-600 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-right text-xs font-light text-gray-600 uppercase tracking-wider">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No transactions yet
                  </td>
                </tr>
              ) : (
                <>
                  {transactions.slice(0, 50).map((transaction) => (
                    <React.Fragment key={transaction.id}>
                      {/* Issuance row */}
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" suppressHydrationWarning>
                          {new Date(transaction.issued_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono text-sm font-light text-black">
                            {transaction.code}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {transaction.customer.name || transaction.customer.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            Issued
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-black">
                          +${transaction.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          ${transaction.remaining_balance.toFixed(2)}
                        </td>
                      </tr>

                      {/* Redemption rows */}
                      {transaction.redemptions.map((redemption, idx) => (
                        <tr key={`${transaction.id}-redemption-${idx}`} className="bg-gray-50/50 hover:bg-gray-100">
                          <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500" suppressHydrationWarning>
                            {new Date(redemption.redeemed_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap">
                            <span className="font-mono text-sm text-gray-600">
                              {transaction.code}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-600">
                            {transaction.customer.name || transaction.customer.email}
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700">
                              Redeemed
                            </span>
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-semibold text-red-600">
                            -${redemption.redeemed_amount.toFixed(2)}
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-right text-sm text-gray-600">
                            -
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                  {transactions.length > 50 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        Showing 50 of {transactions.length} transactions
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
  color,
  trend,
}: {
  title: string;
  value: string;
  subtitle: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
  trend: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-black',
    green: 'bg-green-50 text-black',
    purple: 'bg-purple-50 text-black',
    orange: 'bg-orange-50 text-black',
  };

  return (
    <div className="bg-white overflow-hidden border border-gray-200">
      <div className="px-4 py-5 sm:p-6">
        <dt className="text-sm font-light text-gray-600 truncate">{title}</dt>
        <dd className={`mt-1 text-3xl font-semibold ${colorClasses[color]}`}>
          {value}
        </dd>
        <p className="mt-2 text-xs text-gray-500">{subtitle}</p>
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
          <p className="text-sm text-gray-500">Issued</p>
          <p className="text-2xl font-bold text-black">${issued.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">{cardCount} cards</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Redeemed</p>
          <p className="text-2xl font-bold text-black">${redeemed.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">{redemptionCount} transactions</p>
        </div>
      </div>
    </div>
  );
}

function StatusBar({ label, value, total }: { label: string; value: number; total: number }) {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  const colorMap: Record<string, string> = {
    issued: 'bg-black',
    redeemed: 'bg-gray-500',
    expired: 'bg-gray-600',
    partially_redeemed: 'bg-gray-400',
  };

  const color = colorMap[label] || 'bg-black';

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700 capitalize">{label.replace('_', ' ')}</span>
        <span className="font-light text-black">
          {value} ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="w-full h-2 bg-gray-200 overflow-hidden">
        <div className={`h-full ${color} transition-all duration-300`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function MonthlyBar({
  month,
  issued,
  redeemed,
  max,
}: {
  month: string;
  issued: number;
  redeemed: number;
  max: number;
}) {
  const issuedPct = (issued / max) * 100;
  const redeemedPct = (redeemed / max) * 100;

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="font-medium text-gray-700">{month}</span>
        <span className="text-gray-500">
          <span className="text-black font-semibold">${issued.toFixed(0)}</span>
          {' / '}
          <span className="text-black font-semibold">${redeemed.toFixed(0)}</span>
        </span>
      </div>
      <div className="flex gap-1">
        <div className="flex-1 h-2 bg-gray-200 overflow-hidden">
          <div className="h-full bg-black transition-all duration-300" style={{ width: `${issuedPct}%` }} />
        </div>
        <div className="flex-1 h-2 bg-gray-200 overflow-hidden">
          <div className="h-full bg-black transition-all duration-300" style={{ width: `${redeemedPct}%` }} />
        </div>
      </div>
    </div>
  );
}
