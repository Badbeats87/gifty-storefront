import 'server-only';
import { getServiceSupabase } from '@/lib/supabaseAdmin';

export interface AuditLog {
  id: string;
  admin_user_id: string;
  action_type: string;
  resource_type: string;
  resource_id: string | null;
  resource_name: string | null;
  details: Record<string, any> | null;
  status: 'success' | 'failed';
  error_message: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  admin_user?: { username: string; email: string } | null;
}

/**
 * Fetches audit logs for a specific date range
 * @param startDate - Start date for filtering
 * @param endDate - End date for filtering
 * @returns Array of audit logs
 */
export async function getAuditLogsByDateRange(
  startDate: Date,
  endDate: Date
): Promise<AuditLog[]> {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from('audit_logs')
    .select(`
      *,
      admin_user:admin_users(username, email)
    `)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch audit logs: ${error.message}`);
  }

  return (data as AuditLog[]) || [];
}

/**
 * Fetches recent audit logs
 * @param limit - Number of logs to fetch
 * @returns Array of recent audit logs
 */
export async function getRecentAuditLogs(limit: number = 50): Promise<AuditLog[]> {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from('audit_logs')
    .select(`
      *,
      admin_user:admin_users(username, email)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch recent audit logs: ${error.message}`);
  }

  return (data as AuditLog[]) || [];
}

/**
 * Fetches audit logs by action type
 * @param actionType - Type of action to filter by
 * @param limit - Number of logs to fetch
 * @returns Array of audit logs
 */
export async function getAuditLogsByActionType(
  actionType: string,
  limit: number = 50
): Promise<AuditLog[]> {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from('audit_logs')
    .select(`
      *,
      admin_user:admin_users(username, email)
    `)
    .eq('action_type', actionType)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch audit logs: ${error.message}`);
  }

  return (data as AuditLog[]) || [];
}

/**
 * Fetches audit logs by admin user
 * @param adminUserId - Admin user ID
 * @param limit - Number of logs to fetch
 * @returns Array of audit logs
 */
export async function getAuditLogsByAdminUser(
  adminUserId: string,
  limit: number = 50
): Promise<AuditLog[]> {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from('audit_logs')
    .select(`
      *,
      admin_user:admin_users(username, email)
    `)
    .eq('admin_user_id', adminUserId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch audit logs: ${error.message}`);
  }

  return (data as AuditLog[]) || [];
}

/**
 * Fetches failed operations
 * @param limit - Number of logs to fetch
 * @returns Array of failed audit logs
 */
export async function getFailedAuditLogs(limit: number = 50): Promise<AuditLog[]> {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from('audit_logs')
    .select(`
      *,
      admin_user:admin_users(username, email)
    `)
    .eq('status', 'failed')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch failed audit logs: ${error.message}`);
  }

  return (data as AuditLog[]) || [];
}

/**
 * Get audit log statistics
 * @returns Statistics about audit logs
 */
export async function getAuditLogStats(): Promise<{
  totalLogs: number;
  successCount: number;
  failureCount: number;
  uniqueAdmins: number;
}> {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from('audit_logs')
    .select('id, status, admin_user_id');

  if (error) {
    throw new Error(`Failed to fetch audit log stats: ${error.message}`);
  }

  const logs = data as Array<{ id: string; status: string; admin_user_id: string }>;
  const totalLogs = logs.length;
  const successCount = logs.filter(l => l.status === 'success').length;
  const failureCount = logs.filter(l => l.status === 'failed').length;
  const uniqueAdmins = new Set(logs.map(l => l.admin_user_id)).size;

  return { totalLogs, successCount, failureCount, uniqueAdmins };
}
