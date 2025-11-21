import { getServiceSupabase } from '@/lib/supabaseAdmin';
import { notFound } from 'next/navigation';
import BusinessPasswordManager from '@/components/BusinessPasswordManager';

export default async function BusinessDetailPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const supabase = getServiceSupabase();

  // Fetch business details
  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', businessId)
    .single();

  if (!business) {
    notFound();
  }

  // Fetch gift card summary data
  const { data: giftCardsRaw } = await supabase
    .from('gift_cards')
    .select('amount, remaining_balance, status, issued_at, customer:customers(email, name)')
    .eq('business_id', businessId);

  // Normalize customer data
  const giftCards = (giftCardsRaw || []).map(card => ({
    ...card,
    customer: Array.isArray(card.customer) ? card.customer[0] : card.customer
  }));

  const totalIssuedAmount = giftCards.reduce((sum, card) => sum + card.amount, 0);
  const totalRemainingBalance = giftCards.reduce((sum, card) => sum + card.remaining_balance, 0);
  const totalRedeemedAmount = totalIssuedAmount - totalRemainingBalance;
  const activeCardsCount = giftCards.filter(card => card.status === 'issued' || card.status === 'partially_redeemed').length;
  const redeemedCardsCount = giftCards.filter(card => card.status === 'redeemed').length;
  const totalCards = giftCards.length;

  // Get recent activity (last 10 cards)
  const { data: recentCardsRaw } = await supabase
    .from('gift_cards')
    .select(`
      *,
      customer:customers(email, name)
    `)
    .eq('business_id', businessId)
    .order('issued_at', { ascending: false })
    .limit(10);

  // Normalize recent cards
  const recentCards = (recentCardsRaw || []).map(card => ({
    ...card,
    customer: Array.isArray(card.customer) ? card.customer[0] : card.customer
  }));

  // Unique customers
  const uniqueCustomers = new Set(giftCards.map(card => card.customer?.email).filter(Boolean)).size;

  // Calculate this month's activity
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthCards = giftCards?.filter(card => new Date(card.issued_at) >= startOfMonth) || [];
  const monthRevenue = monthCards.reduce((sum, card) => sum + card.amount, 0);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-light text-black">Business Overview</h2>

      {/* Business Information */}
      <div className="bg-white border border-gray-200 p-6">
        <h3 className="text-lg font-light text-black mb-4">Business Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoItem label="Business Name" value={business.name} />
          <InfoItem label="Slug" value={business.slug} />
          <InfoItem label="Status" value={business.status} />
          <InfoItem label="Contact Email" value={business.contact_email || '-'} />
          <InfoItem label="Contact Name" value={business.contact_name || '-'} />
          <InfoItem label="Phone" value={business.phone || '-'} />
          <InfoItem label="IBAN" value={business.iban || '-'} />
          <InfoItem label="Wix Product ID" value={business.wix_product_id || '-'} />
          <InfoItem
            label="Created At"
            value={new Date(business.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          />
          <InfoItem
            label="Updated At"
            value={new Date(business.updated_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          />
        </div>
      </div>

      {/* Password Management */}
      {business.contact_email && (
        <BusinessPasswordManager
          businessId={business.id}
          businessName={business.name}
          contactEmail={business.contact_email}
        />
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Issued"
          value={`$${totalIssuedAmount.toFixed(2)}`}
          subtitle={`${totalCards} cards`}
          color="blue"
        />
        <StatCard
          title="Total Redeemed"
          value={`$${totalRedeemedAmount.toFixed(2)}`}
          subtitle={`${Math.round((totalRedeemedAmount / totalIssuedAmount) * 100) || 0}% rate`}
          color="green"
        />
        <StatCard
          title="Active Balance"
          value={`$${totalRemainingBalance.toFixed(2)}`}
          subtitle={`${activeCardsCount} active`}
          color="purple"
        />
        <StatCard
          title="This Month"
          value={`$${monthRevenue.toFixed(2)}`}
          subtitle={`${monthCards.length} cards`}
          color="orange"
        />
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          icon="🎁"
          label="Total Gift Cards"
          value={totalCards.toString()}
        />
        <MetricCard
          icon="👥"
          label="Unique Customers"
          value={uniqueCustomers.toString()}
        />
        <MetricCard
          icon="✓"
          label="Redeemed Cards"
          value={redeemedCardsCount.toString()}
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-white border border-gray-200 p-6">
        <h3 className="text-lg font-light text-black mb-4">Recent Gift Cards</h3>
        <div className="space-y-3">
          {recentCards && recentCards.length > 0 ? (
            recentCards.map((card: any) => (
              <div key={card.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex-1">
                  <p className="font-mono text-sm font-light text-black">{card.code}</p>
                  <p className="text-xs text-gray-500">
                    {card.customer?.name || card.customer?.email || 'Unknown'} • {new Date(card.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-light text-black">
                    ${card.remaining_balance.toFixed(2)} / ${card.amount.toFixed(2)}
                  </p>
                  <span
                    className={`inline-block px-2 py-0.5 text-xs font-semibold rounded ${
                      card.status === 'issued'
                        ? 'bg-gray-100 text-gray-800'
                        : card.status === 'redeemed'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {card.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-8">No gift cards issued yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm font-light text-gray-600">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900 font-semibold">{value}</dd>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  color
}: {
  title: string;
  value: string;
  subtitle: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
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
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-white border border-gray-200 p-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl">{icon}</span>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-light text-black">{value}</p>
        </div>
      </div>
    </div>
  );
}
