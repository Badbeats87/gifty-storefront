import { getServiceSupabase } from '@/lib/supabaseAdmin';

interface TableStats {
  table_name: string;
  row_count: number;
  description: string;
}

interface DatabaseInfo {
  version: string;
  size: string;
  uptime: string;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DatabasePage() {
  const supabase = getServiceSupabase();
  const startTime = Date.now();

  // Database connectivity check
  let dbHealth: 'healthy' | 'warning' | 'error' = 'healthy';
  let dbResponseTime = 0;

  try {
    const dbStart = Date.now();
    const { error } = await supabase.from('businesses').select('id').limit(1);
    dbResponseTime = Date.now() - dbStart;

    if (error) {
      dbHealth = 'error';
    } else if (dbResponseTime > 1000) {
      dbHealth = 'warning';
    }
  } catch (error) {
    dbHealth = 'error';
  }

  // Define all tables with descriptions
  const tables = [
    { name: 'businesses', description: 'Business accounts and profiles' },
    { name: 'customers', description: 'Gift card recipients' },
    { name: 'gift_cards', description: 'Issued gift cards' },
    { name: 'transactions', description: 'Purchase and redemption transactions' },
    { name: 'gift_card_activity', description: 'Gift card activity audit log' },
    { name: 'business_applications', description: 'New business signup requests' },
    { name: 'business_invites', description: 'Business invitation tokens' },
    { name: 'auth_sessions', description: 'Active user sessions' },
    { name: 'magic_links', description: 'Passwordless login tokens' },
  ];

  // Fetch row counts for all tables
  const tableStatsPromises = tables.map(async (table) => {
    try {
      const { count, error } = await supabase
        .from(table.name)
        .select('*', { count: 'exact', head: true });

      return {
        table_name: table.name,
        row_count: count || 0,
        description: table.description,
      };
    } catch (error) {
      return {
        table_name: table.name,
        row_count: 0,
        description: table.description,
      };
    }
  });

  const tableStats: TableStats[] = await Promise.all(tableStatsPromises);

  // Calculate total records
  const totalRecords = tableStats.reduce((sum, table) => sum + table.row_count, 0);

  // Get detailed stats per table
  const [
    businessesTotal,
    customersTotal,
    giftCardsTotal,
    transactionsTotal,
    activityTotal,
    applicationsTotal,
    invitesTotal,
    sessionsTotal,
    magicLinksTotal,
  ] = await Promise.all([
    supabase.from('businesses').select('*', { count: 'exact', head: true }),
    supabase.from('customers').select('*', { count: 'exact', head: true }),
    supabase.from('gift_cards').select('*', { count: 'exact', head: true }),
    supabase.from('transactions').select('*', { count: 'exact', head: true }),
    supabase.from('gift_card_activity').select('*', { count: 'exact', head: true }),
    supabase.from('business_applications').select('*', { count: 'exact', head: true }),
    supabase.from('business_invites').select('*', { count: 'exact', head: true }),
    supabase.from('auth_sessions').select('*', { count: 'exact', head: true }),
    supabase.from('magic_links').select('*', { count: 'exact', head: true }),
  ]);

  // Additional detailed metrics
  const [
    activeBusinesses,
    activeSessions,
    expiredSessions,
    usedMagicLinks,
    unusedMagicLinks,
    purchaseTransactions,
    redemptionTransactions,
  ] = await Promise.all([
    supabase
      .from('businesses')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase
      .from('auth_sessions')
      .select('*', { count: 'exact', head: true })
      .gt('expires_at', new Date().toISOString()),
    supabase
      .from('auth_sessions')
      .select('*', { count: 'exact', head: true })
      .lt('expires_at', new Date().toISOString()),
    supabase
      .from('magic_links')
      .select('*', { count: 'exact', head: true })
      .eq('used', true),
    supabase
      .from('magic_links')
      .select('*', { count: 'exact', head: true })
      .eq('used', false),
    supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'purchase'),
    supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'redemption'),
  ]);

  // Get growth metrics (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [recentBusinesses, recentCustomers, recentGiftCards, recentTransactions] =
    await Promise.all([
      supabase
        .from('businesses')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString()),
      supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString()),
      supabase
        .from('gift_cards')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString()),
      supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString()),
    ]);

  // Database configuration
  const dbConfig = {
    project_id: process.env.NEXT_PUBLIC_SUPABASE_URL?.split('.')[0].replace('https://', '') || 'unknown',
    region: 'us-east-1',
    database_type: 'PostgreSQL',
    hosting: 'Supabase Cloud',
  };

  const totalResponseTime = Date.now() - startTime;

  return (
    <div className="p-8 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-light text-black mb-2">Database Management</h1>
          <p className="text-gray-600">Database health, statistics, and configuration</p>
        </div>

        {/* Health Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <HealthCard
            title="Connection Status"
            status={dbHealth}
            value={dbHealth === 'healthy' ? 'Connected' : dbHealth === 'warning' ? 'Slow' : 'Error'}
          />
          <MetricCard
            title="Response Time"
            value={`${dbResponseTime}ms`}
            subtitle={dbResponseTime < 100 ? 'Excellent' : dbResponseTime < 500 ? 'Good' : 'Slow'}
            color={dbResponseTime < 100 ? 'green' : dbResponseTime < 500 ? 'yellow' : 'red'}
          />
          <MetricCard
            title="Query Performance"
            value={`${totalResponseTime}ms`}
            subtitle="Page load time"
            color="blue"
          />
        </div>

        {/* Database Configuration */}
        <div className="bg-white border border-gray-200 p-6">
          <h3 className="text-lg font-light text-black mb-4">Database Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ConfigItem label="Project ID" value={dbConfig.project_id} />
            <ConfigItem label="Region" value={dbConfig.region} />
            <ConfigItem label="Type" value={dbConfig.database_type} />
            <ConfigItem label="Hosting" value={dbConfig.hosting} />
          </div>
        </div>

        {/* Quick Statistics */}
        <div className="bg-white border border-gray-200 p-6">
          <h3 className="text-lg font-light text-black mb-4">Database Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <QuickStat label="Total Records" value={totalRecords} icon="📊" />
            <QuickStat label="Tables" value={tables.length} icon="📋" />
            <QuickStat
              label="Businesses"
              value={businessesTotal.count || 0}
              icon="🏢"
            />
            <QuickStat label="Customers" value={customersTotal.count || 0} icon="👥" />
            <QuickStat label="Gift Cards" value={giftCardsTotal.count || 0} icon="🎁" />
            <QuickStat
              label="Transactions"
              value={transactionsTotal.count || 0}
              icon="💳"
            />
            <QuickStat label="Sessions" value={sessionsTotal.count || 0} icon="🔐" />
            <QuickStat
              label="Magic Links"
              value={magicLinksTotal.count || 0}
              icon="🔗"
            />
          </div>
        </div>

        {/* Table Statistics */}
        <div className="bg-white border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-light text-black">Table Statistics</h3>
            <p className="text-sm text-gray-500 mt-1">
              Row counts and distribution across all tables
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-light text-gray-600 uppercase tracking-wider">
                    Table Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-light text-gray-600 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-light text-gray-600 uppercase tracking-wider">
                    Row Count
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-light text-gray-600 uppercase tracking-wider">
                    % of Total
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-light text-gray-600 uppercase tracking-wider">
                    Distribution
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tableStats.map((table) => {
                  const percentage =
                    totalRecords > 0
                      ? ((table.row_count / totalRecords) * 100).toFixed(1)
                      : '0.0';
                  return (
                    <tr key={table.table_name} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm font-light text-black">
                          {table.table_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {table.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-light text-black">
                        {table.row_count.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600">
                        {percentage}%
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-full bg-gray-200 rounded h-2">
                          <div
                            className="bg-black h-2 rounded"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                <tr>
                  <td className="px-6 py-4 font-light text-black" colSpan={2}>
                    Total Records in Database
                  </td>
                  <td className="px-6 py-4 text-right font-light text-black">
                    {totalRecords.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right font-light text-gray-600">
                    100%
                  </td>
                  <td className="px-6 py-4"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Authentication & Sessions */}
          <div className="bg-white border border-gray-200 p-6">
            <h3 className="text-lg font-light text-black mb-4">
              Authentication & Sessions
            </h3>
            <div className="space-y-4">
              <DetailMetric
                label="Active Sessions"
                value={activeSessions.count || 0}
                total={sessionsTotal.count || 0}
                color="green"
              />
              <DetailMetric
                label="Expired Sessions"
                value={expiredSessions.count || 0}
                total={sessionsTotal.count || 0}
                color="gray"
              />
              <DetailMetric
                label="Used Magic Links"
                value={usedMagicLinks.count || 0}
                total={magicLinksTotal.count || 0}
                color="blue"
              />
              <DetailMetric
                label="Unused Magic Links"
                value={unusedMagicLinks.count || 0}
                total={magicLinksTotal.count || 0}
                color="yellow"
              />
            </div>
          </div>

          {/* Business Status */}
          <div className="bg-white border border-gray-200 p-6">
            <h3 className="text-lg font-light text-black mb-4">Business Status</h3>
            <div className="space-y-4">
              <DetailMetric
                label="Active Businesses"
                value={activeBusinesses.count || 0}
                total={businessesTotal.count || 0}
                color="green"
              />
              <DetailMetric
                label="Total Applications"
                value={applicationsTotal.count || 0}
                total={applicationsTotal.count || 0}
                color="blue"
              />
              <DetailMetric
                label="Total Invites"
                value={invitesTotal.count || 0}
                total={invitesTotal.count || 0}
                color="purple"
              />
              <div className="pt-2 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Avg customers per business:{' '}
                  <span className="font-light text-black">
                    {(
                      (customersTotal.count || 0) / (businessesTotal.count || 1)
                    ).toFixed(1)}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Transaction Breakdown */}
          <div className="bg-white border border-gray-200 p-6">
            <h3 className="text-lg font-light text-black mb-4">Transaction Breakdown</h3>
            <div className="space-y-4">
              <DetailMetric
                label="Purchase Transactions"
                value={purchaseTransactions.count || 0}
                total={transactionsTotal.count || 0}
                color="green"
              />
              <DetailMetric
                label="Redemption Transactions"
                value={redemptionTransactions.count || 0}
                total={transactionsTotal.count || 0}
                color="blue"
              />
              <div className="pt-2 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Redemption rate:{' '}
                  <span className="font-light text-black">
                    {(transactionsTotal.count || 0) > 0
                      ? ((redemptionTransactions.count || 0) / (transactionsTotal.count || 1) * 100).toFixed(1)
                      : '0.0'}%
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Growth Metrics (Last 30 Days) */}
        <div className="bg-white border border-gray-200 p-6">
          <h3 className="text-lg font-light text-black mb-4">
            Growth (Last 30 Days)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <GrowthCard
              label="New Businesses"
              value={recentBusinesses.count || 0}
              icon="🏢"
            />
            <GrowthCard
              label="New Customers"
              value={recentCustomers.count || 0}
              icon="👥"
            />
            <GrowthCard
              label="New Gift Cards"
              value={recentGiftCards.count || 0}
              icon="🎁"
            />
            <GrowthCard
              label="New Transactions"
              value={recentTransactions.count || 0}
              icon="💳"
            />
          </div>
        </div>

        {/* Database Maintenance */}
        <div className="bg-white border border-gray-200 p-6">
          <h3 className="text-lg font-light text-black mb-4">
            Maintenance Recommendations
          </h3>
          <div className="space-y-3">
            {expiredSessions.count && expiredSessions.count > 100 && (
              <Alert
                type="warning"
                message={`${expiredSessions.count} expired sessions should be cleaned up`}
              />
            )}
            {unusedMagicLinks.count && unusedMagicLinks.count > 50 && (
              <Alert
                type="info"
                message={`${unusedMagicLinks.count} unused magic links can be removed`}
              />
            )}
            {dbResponseTime > 500 && (
              <Alert
                type="warning"
                message={`Database response time is elevated (${dbResponseTime}ms)`}
              />
            )}
            {dbHealth === 'healthy' && dbResponseTime < 200 && (
              <Alert
                type="success"
                message="Database is healthy and performing optimally"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function HealthCard({
  title,
  status,
  value,
}: {
  title: string;
  status: 'healthy' | 'warning' | 'error';
  value: string;
}) {
  const statusIcon = {
    healthy: '✓',
    warning: '⚠',
    error: '✗',
  };

  return (
    <div className="bg-white border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-light text-black">{title}</h3>
        <span className="text-2xl">{statusIcon[status]}</span>
      </div>
      <div className="inline-flex items-center px-3 py-1 text-sm font-light bg-gray-100 text-gray-800">
        {value}
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  color: 'green' | 'yellow' | 'red' | 'blue';
}) {
  return (
    <div className="bg-white border border-gray-200 p-6">
      <h3 className="text-sm font-light text-gray-600">{title}</h3>
      <p className="text-3xl font-light text-black mt-2">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
}

function ConfigItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm font-light text-gray-600">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900 font-semibold font-mono">{value}</dd>
    </div>
  );
}

function QuickStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: string;
}) {
  return (
    <div className="text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-xl font-light text-black">{value.toLocaleString()}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function DetailMetric({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: 'green' | 'gray' | 'blue' | 'yellow' | 'purple';
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="font-light text-black">
          {value.toLocaleString()} {total > 0 && `(${percentage.toFixed(1)}%)`}
        </span>
      </div>
      {total > 0 && (
        <div className="w-full h-2 bg-gray-200 overflow-hidden">
          <div
            className="h-full bg-black transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}

function GrowthCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="text-4xl">{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-light text-black">{value}</p>
      </div>
    </div>
  );
}

function Alert({
  type,
  message,
}: {
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
}) {
  const icon = {
    success: '✓',
    info: 'ℹ',
    warning: '⚠',
    error: '✗',
  };

  return (
    <div className="bg-gray-50 border border-gray-200 p-3 flex items-center gap-3">
      <span className="text-xl">{icon[type]}</span>
      <span className="text-sm font-light text-black">{message}</span>
    </div>
  );
}
