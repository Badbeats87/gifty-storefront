import { getServiceSupabase } from '@/lib/supabaseAdmin';
import RefreshButton from './RefreshButton';
import AuditLogViewer from '@/components/AuditLogViewer';
import RealtimeConsole from '@/components/RealtimeConsole';

interface DatabaseStats {
  total_businesses: number;
  total_customers: number;
  total_gift_cards: number;
  total_redemptions: number;
  active_sessions: number;
  pending_applications: number;
}

interface SystemHealth {
  database: 'healthy' | 'warning' | 'error';
  api: 'healthy' | 'warning' | 'error';
  overall: 'healthy' | 'warning' | 'error';
}

interface TableInfo {
  name: string;
  row_count: number;
  description: string;
}

interface EdgeFunctionInfo {
  name: string;
  description: string;
  endpoint: string;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MonitoringPage() {
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

  // Gather detailed table statistics
  const tables = [
    { name: 'businesses', description: 'Business accounts and profiles' },
    { name: 'customers', description: 'Gift card recipients' },
    { name: 'gift_cards', description: 'Issued gift cards' },
    { name: 'redemptions', description: 'Gift card redemption transactions' },
    { name: 'business_applications', description: 'New business signup requests' },
    { name: 'business_invites', description: 'Business invitation tokens' },
    { name: 'auth_sessions', description: 'Active user sessions' },
    { name: 'magic_links', description: 'Passwordless login tokens' },
  ];

  const tableStatsPromises = tables.map(async (table) => {
    try {
      const { count, error } = await supabase
        .from(table.name)
        .select('*', { count: 'exact', head: true });

      return {
        name: table.name,
        row_count: count || 0,
        description: table.description,
      };
    } catch (error) {
      return {
        name: table.name,
        row_count: 0,
        description: table.description,
      };
    }
  });

  const tableStats: TableInfo[] = await Promise.all(tableStatsPromises);

  // Calculate total records
  const totalRecords = tableStats.reduce((sum, table) => sum + table.row_count, 0);

  // Gather database statistics
  const [
    businessesResult,
    customersResult,
    giftCardsResult,
    redemptionsResult,
    sessionsResult,
    applicationsResult,
    activeBusinesses,
    expiredSessions,
    usedMagicLinks,
    pendingInvites,
  ] = await Promise.all([
    supabase.from('businesses').select('id', { count: 'exact', head: true }),
    supabase.from('customers').select('id', { count: 'exact', head: true }),
    supabase.from('gift_cards').select('id', { count: 'exact', head: true }),
    supabase.from('redemptions').select('id', { count: 'exact', head: true }),
    supabase.from('auth_sessions').select('id', { count: 'exact', head: true }).gt('expires_at', new Date().toISOString()),
    supabase.from('business_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('businesses').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('auth_sessions').select('id', { count: 'exact', head: true }).lt('expires_at', new Date().toISOString()),
    supabase.from('magic_links').select('id', { count: 'exact', head: true }).eq('used', true),
    supabase.from('business_invites').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  const stats: DatabaseStats = {
    total_businesses: businessesResult.count || 0,
    total_customers: customersResult.count || 0,
    total_gift_cards: giftCardsResult.count || 0,
    total_redemptions: redemptionsResult.count || 0,
    active_sessions: sessionsResult.count || 0,
    pending_applications: applicationsResult.count || 0,
  };

  // Additional metrics
  const additionalMetrics = {
    active_businesses: activeBusinesses.count || 0,
    expired_sessions: expiredSessions.count || 0,
    used_magic_links: usedMagicLinks.count || 0,
    pending_invites: pendingInvites.count || 0,
  };

  // Recent activity
  const { data: recentGiftCards } = await supabase
    .from('gift_cards')
    .select('code, amount, created_at, status, business:businesses(name)')
    .order('created_at', { ascending: false })
    .limit(10);

  const { data: recentRedemptions } = await supabase
    .from('redemptions')
    .select('redeemed_amount, redeemed_at, gift_card:gift_cards(code, business:businesses(name))')
    .order('redeemed_at', { ascending: false })
    .limit(10);

  const { data: recentApplications } = await supabase
    .from('business_applications')
    .select('business_name, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  // Gift card status breakdown
  const { data: giftCardsByStatus } = await supabase
    .from('gift_cards')
    .select('status');

  const statusCounts = (giftCardsByStatus || []).reduce((acc: any, card: any) => {
    acc[card.status] = (acc[card.status] || 0) + 1;
    return acc;
  }, {});

  // Edge Functions information
  const edgeFunctions: EdgeFunctionInfo[] = [
    { name: 'approve-business-application', description: 'Approves/rejects business applications', endpoint: '/functions/v1/approve-business-application' },
    { name: 'issue-gift-card', description: 'Creates new gift cards', endpoint: '/functions/v1/issue-gift-card' },
    { name: 'redeem-gift-card', description: 'Processes gift card redemptions', endpoint: '/functions/v1/redeem-gift-card' },
    { name: 'validate-gift-card', description: 'Validates gift card status', endpoint: '/functions/v1/validate-gift-card' },
    { name: 'send-business-invite', description: 'Sends business invitation emails', endpoint: '/functions/v1/send-business-invite' },
    { name: 'payment-webhook', description: 'Handles payment gateway webhooks', endpoint: '/functions/v1/payment-webhook' },
  ];

  // Environment variables check
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;

  const envVars = [
    { name: 'SUPABASE_URL', value: supabaseUrl, critical: true },
    { name: 'SUPABASE_ANON_KEY', value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, critical: true },
    { name: 'SERVICE_ROLE_KEY', value: serviceRoleKey, critical: true },
    { name: 'RESEND_API_KEY', value: process.env.RESEND_API_KEY, critical: false },
    { name: 'WIX_API_KEY', value: process.env.WIX_API_KEY, critical: false },
    { name: 'NODE_ENV', value: process.env.NODE_ENV, critical: true },
  ];

  // System health check
  const systemHealth: SystemHealth = {
    database: dbHealth,
    api: dbHealth,
    overall: dbHealth,
  };

  const totalResponseTime = Date.now() - startTime;

  return (
    <div className="p-8 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light text-black mb-2">System Monitoring</h1>
            <p className="text-gray-600">Comprehensive system health and operational metrics</p>
          </div>
          <RefreshButton />
        </div>

        {/* Real-time Console */}
        <RealtimeConsole />

        {/* Health Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <HealthCard
            title="Database"
            status={systemHealth.database}
            responseTime={`${dbResponseTime}ms`}
          />
          <HealthCard
            title="API Services"
            status={systemHealth.api}
            responseTime={`${totalResponseTime}ms`}
          />
          <HealthCard
            title="Overall System"
            status={systemHealth.overall}
            responseTime="Online"
          />
        </div>

        {/* Quick Stats */}
        <div className="bg-white border border-gray-200 p-6">
          <h3 className="text-lg font-light text-black mb-4">Quick Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <StatItem label="Total Records" value={totalRecords} icon="📊" color="blue" />
            <StatItem label="Active Businesses" value={additionalMetrics.active_businesses} icon="🏢" color="green" />
            <StatItem label="Customers" value={stats.total_customers} icon="👥" color="purple" />
            <StatItem label="Gift Cards" value={stats.total_gift_cards} icon="🎁" color="orange" />
            <StatItem label="Active Sessions" value={stats.active_sessions} icon="🔐" color="blue" />
            <StatItem label="Pending Apps" value={stats.pending_applications} icon="📋" color="yellow" />
          </div>
        </div>

        {/* Database Tables Overview */}
        <div className="bg-white border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-light text-black">Database Tables</h3>
            <p className="text-sm text-gray-500 mt-1">Schema and row counts for all tables</p>
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tableStats.map((table) => {
                  const percentage = totalRecords > 0 ? ((table.row_count / totalRecords) * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={table.name} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm font-light text-black">{table.name}</span>
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
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                <tr>
                  <td className="px-6 py-4 font-light text-black" colSpan={2}>
                    Total Records
                  </td>
                  <td className="px-6 py-4 text-right font-light text-black">
                    {totalRecords.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right font-light text-gray-600">
                    100%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Gift Card Status Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 p-6">
            <h3 className="text-lg font-light text-black mb-4">Gift Card Status Distribution</h3>
            <div className="space-y-3">
              {Object.entries(statusCounts).map(([status, count]: [string, any]) => (
                <StatusBar
                  key={status}
                  label={status}
                  value={count}
                  total={stats.total_gift_cards}
                />
              ))}
              {Object.keys(statusCounts).length === 0 && (
                <p className="text-center text-gray-500 py-4">No gift cards issued yet</p>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <h3 className="text-lg font-light text-black mb-4">Session & Auth Statistics</h3>
            <div className="space-y-4">
              <MetricRow
                label="Active Sessions"
                value={stats.active_sessions}
                subtitle="Currently logged in"
                color="green"
              />
              <MetricRow
                label="Expired Sessions"
                value={additionalMetrics.expired_sessions}
                subtitle="Cleanup pending"
                color="gray"
              />
              <MetricRow
                label="Used Magic Links"
                value={additionalMetrics.used_magic_links}
                subtitle="Successful logins"
                color="blue"
              />
              <MetricRow
                label="Pending Invites"
                value={additionalMetrics.pending_invites}
                subtitle="Awaiting acceptance"
                color="yellow"
              />
            </div>
          </div>
        </div>

        {/* Supabase Edge Functions */}
        <div className="bg-white border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-light text-black">Supabase Edge Functions</h3>
            <p className="text-sm text-gray-500 mt-1">Deno serverless functions deployed on Supabase</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-light text-gray-600 uppercase tracking-wider">
                    Function Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-light text-gray-600 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-light text-gray-600 uppercase tracking-wider">
                    Endpoint
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-light text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {edgeFunctions.map((func) => (
                  <tr key={func.name} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm font-light text-black">{func.name}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {func.description}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                      {func.endpoint}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        Deployed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Environment Variables */}
        <div className="bg-white border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-light text-black">Environment Configuration</h3>
            <p className="text-sm text-gray-500 mt-1">API keys and environment variables status</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {envVars.map((envVar) => (
                <EnvironmentVar
                  key={envVar.name}
                  name={envVar.name}
                  isSet={!!envVar.value}
                  critical={envVar.critical}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 p-6">
            <h3 className="text-lg font-light text-black mb-4">Performance Metrics</h3>
            <div className="space-y-3">
              <PerformanceBar
                label="Database Query"
                value={dbResponseTime}
                max={2000}
                unit="ms"
              />
              <PerformanceBar
                label="Page Load Time"
                value={totalResponseTime}
                max={3000}
                unit="ms"
              />
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <h3 className="text-lg font-light text-black mb-4">System Information</h3>
            <div className="space-y-3 text-sm">
              <InfoRow label="Environment" value={process.env.NODE_ENV || 'development'} />
              <InfoRow label="Framework" value="Next.js 16.0.3 (Turbopack)" />
              <InfoRow label="Database" value="Supabase PostgreSQL" />
              <InfoRow label="Runtime" value="Deno Edge Functions" />
              <InfoRow label="Supabase Project" value="kppdvozuesiycwdacqgf" />
              <InfoRow
                label="Last Check"
                value={new Date().toLocaleString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              />
            </div>
          </div>
        </div>

        {/* Recent Activity - Expanded */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Gift Cards */}
          <div className="bg-white border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-light text-black">Recent Gift Cards</h3>
              <p className="text-sm text-gray-500 mt-1">Last 10 issued cards</p>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {recentGiftCards && recentGiftCards.length > 0 ? (
                  recentGiftCards.map((card: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div className="flex-1">
                        <p className="font-mono text-sm font-light text-black">{card.code}</p>
                        <p className="text-xs text-gray-500">
                          {card.business?.name || 'Unknown'} • {new Date(card.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-black">
                          ${card.amount.toFixed(2)}
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          card.status === 'issued' ? 'bg-green-100 text-gray-800' :
                          card.status === 'redeemed' ? 'bg-gray-100 text-gray-700' :
                          'bg-yellow-100 text-gray-800'
                        }`}>
                          {card.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">No recent activity</p>
                )}
              </div>
            </div>
          </div>

          {/* Recent Redemptions */}
          <div className="bg-white border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-light text-black">Recent Redemptions</h3>
              <p className="text-sm text-gray-500 mt-1">Last 10 transactions</p>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {recentRedemptions && recentRedemptions.length > 0 ? (
                  recentRedemptions.map((redemption: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div className="flex-1">
                        <p className="font-mono text-sm font-light text-black">
                          {redemption.gift_card?.code || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {redemption.gift_card?.business?.name || 'Unknown'} • {new Date(redemption.redeemed_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-sm font-semibold text-black">
                        ${redemption.redeemed_amount.toFixed(2)}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">No recent redemptions</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Business Applications */}
        <div className="bg-white border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-light text-black">Recent Business Applications</h3>
            <p className="text-sm text-gray-500 mt-1">Latest signup requests</p>
          </div>
          <div className="p-6">
            <div className="space-y-2">
              {recentApplications && recentApplications.length > 0 ? (
                recentApplications.map((app: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-light text-black">{app.business_name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(app.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded ${
                      app.status === 'pending' ? 'bg-gray-100 text-gray-800' :
                      app.status === 'approved' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">No recent applications</p>
              )}
            </div>
          </div>
        </div>

        {/* System Alerts */}
        <div className="bg-white border border-gray-200 p-6">
          <h3 className="text-lg font-light text-black mb-4">System Alerts</h3>
          <div className="space-y-2">
            {systemHealth.database === 'error' && (
              <Alert type="error" message="Database connection issues detected" />
            )}
            {systemHealth.database === 'warning' && (
              <Alert type="warning" message={`Database response time is elevated (${dbResponseTime}ms)`} />
            )}
            {stats.pending_applications > 5 && (
              <Alert type="info" message={`${stats.pending_applications} pending applications require review`} />
            )}
            {additionalMetrics.expired_sessions > 100 && (
              <Alert type="info" message={`${additionalMetrics.expired_sessions} expired sessions need cleanup`} />
            )}
            {systemHealth.overall === 'healthy' && dbResponseTime < 500 && (
              <Alert type="success" message="All systems operational - Performance optimal" />
            )}
          </div>
        </div>

        {/* Operation History / Audit Logs */}
        <div className="mt-8">
          <AuditLogViewer limit={25} />
        </div>
      </div>
    </div>
  );
}

function HealthCard({
  title,
  status,
  responseTime,
}: {
  title: string;
  status: 'healthy' | 'warning' | 'error';
  responseTime: string;
}) {
  const statusLabel = {
    healthy: 'Healthy',
    warning: 'Warning',
    error: 'Error',
  };

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
      <div className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 text-sm font-light">
        {statusLabel[status]}
      </div>
      <p className="text-sm text-gray-600 mt-3">Response: {responseTime}</p>
    </div>
  );
}

function StatItem({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'text-black',
    green: 'text-black',
    purple: 'text-black',
    orange: 'text-black',
    yellow: 'text-yellow-600',
  };

  return (
    <div className="text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className={`text-2xl font-bold ${colorClasses[color] || 'text-gray-900'}`}>{value.toLocaleString()}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
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

function MetricRow({
  label,
  value,
  subtitle,
  color,
}: {
  label: string;
  value: number;
  subtitle: string;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm font-light text-black">{label}</p>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
      <div className="text-2xl font-light text-black">
        {value.toLocaleString()}
      </div>
    </div>
  );
}

function PerformanceBar({
  label,
  value,
  max,
  unit,
}: {
  label: string;
  value: number;
  max: number;
  unit: string;
}) {
  const percentage = Math.min((value / max) * 100, 100);
  const color =
    percentage < 50 ? 'bg-black' : percentage < 75 ? 'bg-gray-400' : 'bg-gray-600';

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="font-light text-black">
          {value}{unit}
        </span>
      </div>
      <div className="w-full h-2 bg-gray-200 overflow-hidden">
        <div className={`h-full ${color} transition-all duration-300`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

function EnvironmentVar({
  name,
  isSet,
  critical,
}: {
  name: string;
  isSet: boolean;
  critical: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50">
      <div className="flex-1">
        <p className="text-sm font-mono font-light text-black">{name}</p>
        <p className="text-xs text-gray-500">{critical ? 'Critical' : 'Optional'}</p>
      </div>
      <div className="flex items-center gap-2">
        {isSet ? (
          <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-light bg-gray-100 text-gray-800">
            ✓ Set
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-light bg-gray-100 text-gray-800">
            {critical ? '✗ Missing' : '- Not Set'}
          </span>
        )}
      </div>
    </div>
  );
}

function Alert({ type, message }: { type: 'success' | 'info' | 'warning' | 'error'; message: string }) {
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
