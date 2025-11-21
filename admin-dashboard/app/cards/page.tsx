import { getServiceSupabase } from '@/lib/supabaseAdmin';
import React from 'react';

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Valid statuses
const VALID_STATUSES = ['issued', 'partially_redeemed', 'redeemed', 'expired', 'all'];

interface GiftCardWithDetails {
  id: string;
  code: string;
  amount: number;
  remaining_balance: number;
  status: string;
  issued_at: string;
  business_id: string;
  customer_id: string;
  customer?: { email: string; name: string | null };
  business?: { name: string };
  redeemed_at?: string;
  redemption_count?: number;
}

export default async function CardsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; business?: string; search?: string }>;
}) {
  const { status, business, search } = await searchParams;
  const supabase = getServiceSupabase();

  // Validate inputs
  const validStatus = status && VALID_STATUSES.includes(status) ? status : 'all';
  const sanitizedSearch = search ? String(search).trim().slice(0, 100) : '';
  const sanitizedBusiness = business ? String(business).trim().slice(0, 100) : '';

  // Fetch all gift cards with relationships
  let query = supabase
    .from('gift_cards')
    .select(`
      *,
      customer:customers(email, name),
      business:businesses(name)
    `)
    .order('issued_at', { ascending: false });

  // Apply filters
  if (validStatus && validStatus !== 'all') {
    query = query.eq('status', validStatus);
  }

  if (sanitizedBusiness) {
    query = query.ilike('business_id', `%${sanitizedBusiness}%`);
  }

  if (sanitizedSearch) {
    query = query.ilike('code', `%${sanitizedSearch}%`);
  }

  const { data: giftCards, error } = await query;

  if (error) {
    console.error('Error fetching gift cards:', error);
    return <div className="text-red-600">Error loading gift cards</div>;
  }

  const cards = (giftCards || []) as GiftCardWithDetails[];

  // Calculate statistics
  const stats = {
    total: cards.length,
    issued: cards.filter(c => c.status === 'issued').length,
    redeemed: cards.filter(c => c.status === 'redeemed').length,
    partiallyRedeemed: cards.filter(c => c.status === 'partially_redeemed').length,
    expired: cards.filter(c => c.status === 'expired').length,
    totalIssued: cards.reduce((sum, c) => sum + c.amount, 0),
    totalRedeemed: cards.reduce((sum, c) => sum + (c.amount - c.remaining_balance), 0),
    activeBalance: cards.reduce((sum, c) => sum + c.remaining_balance, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-light text-black">Gift Cards</h2>
          <p className="text-gray-600 mt-1">Track all gift card operations across your platform</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Cards" value={stats.total} color="blue" />
        <StatCard title="Total Issued" value={`$${stats.totalIssued.toFixed(2)}`} color="green" />
        <StatCard title="Total Redeemed" value={`$${stats.totalRedeemed.toFixed(2)}`} color="orange" />
        <StatCard title="Active Balance" value={`$${stats.activeBalance.toFixed(2)}`} color="purple" />
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatusCard label="Issued" count={stats.issued} color="bg-black" />
        <StatusCard label="Partially Redeemed" count={stats.partiallyRedeemed} color="bg-gray-400" />
        <StatusCard label="Redeemed" count={stats.redeemed} color="bg-gray-600" />
        <StatusCard label="Expired" count={stats.expired} color="bg-gray-800" />
        <StatusCard label="Total" count={stats.total} color="bg-gray-700" />
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 p-6">
        <h3 className="text-lg font-light text-black mb-4">Filters</h3>
        <form className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-light text-black mb-2">Status</label>
            <select
              name="status"
              defaultValue={validStatus}
              className="w-full border border-gray-200 px-4 py-2 focus:outline-none focus:ring-1 focus:ring-black text-sm font-light"
            >
              <option value="all">All Statuses</option>
              <option value="issued">Issued</option>
              <option value="partially_redeemed">Partially Redeemed</option>
              <option value="redeemed">Redeemed</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-light text-black mb-2">Business ID</label>
            <input
              type="text"
              name="business"
              placeholder="Filter by business..."
              defaultValue={sanitizedBusiness}
              className="w-full border border-gray-200 px-4 py-2 focus:outline-none focus:ring-1 focus:ring-black text-sm font-light"
            />
          </div>
          <div>
            <label className="block text-sm font-light text-black mb-2">Card Code</label>
            <input
              type="text"
              name="search"
              placeholder="Search by code..."
              defaultValue={sanitizedSearch}
              className="w-full border border-gray-200 px-4 py-2 focus:outline-none focus:ring-1 focus:ring-black text-sm font-light"
            />
          </div>
        </form>
        <button
          type="submit"
          form="filter-form"
          className="mt-4 bg-black text-white px-6 py-2 font-light text-sm hover:bg-gray-800 transition"
        >
          Apply Filters
        </button>
      </div>

      {/* Gift Cards Table */}
      <div className="bg-white border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-light text-black">Gift Cards ({cards.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-light text-gray-600 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-light text-gray-600 uppercase tracking-wider">Business</th>
                <th className="px-6 py-3 text-left text-xs font-light text-gray-600 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-right text-xs font-light text-gray-600 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-right text-xs font-light text-gray-600 uppercase tracking-wider">Balance</th>
                <th className="px-6 py-3 text-left text-xs font-light text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-light text-gray-600 uppercase tracking-wider">Issued</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {cards.length > 0 ? (
                cards.map(card => (
                  <tr key={card.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm font-light text-black">{card.code}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-light text-black">
                      {card.business?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-sm font-light">
                      <div className="text-black">{card.customer?.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{card.customer?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-black">
                      ${card.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-light">
                      <span className={card.remaining_balance === 0 ? 'text-gray-500' : 'text-green-600 font-semibold'}>
                        ${card.remaining_balance.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={card.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-light" suppressHydrationWarning>
                      {new Date(card.issued_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 font-light">
                    No gift cards found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  color,
}: {
  title: string;
  value: string | number;
  color: 'blue' | 'green' | 'orange' | 'purple';
}) {
  const colorClasses = {
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    orange: 'bg-orange-50',
    purple: 'bg-purple-50',
  };

  return (
    <div className={`${colorClasses[color]} border border-gray-200 p-6 rounded`}>
      <p className="text-sm text-gray-600 font-light mb-2">{title}</p>
      <p className="text-3xl font-semibold text-black">{value}</p>
    </div>
  );
}

function StatusCard({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="border border-gray-200 p-4 rounded">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-3 h-3 rounded-full ${color}`}></div>
        <span className="text-sm font-light text-gray-600">{label}</span>
      </div>
      <p className="text-2xl font-semibold text-black">{count}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    issued: { bg: 'bg-black', text: 'text-white' },
    partially_redeemed: { bg: 'bg-gray-400', text: 'text-white' },
    redeemed: { bg: 'bg-gray-600', text: 'text-white' },
    expired: { bg: 'bg-gray-800', text: 'text-white' },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || { bg: 'bg-gray-200', text: 'text-black' };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded text-xs font-light ${config.bg} ${config.text}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
