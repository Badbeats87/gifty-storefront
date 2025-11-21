import 'server-only';
import { getAdminSession } from './adminAuth';

export interface AuditLogParams {
  actionType: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'LOGIN' | 'LOGOUT' | 'REVOKE';
  resourceType: string;
  resourceId?: string;
  resourceName?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status?: 'success' | 'failed';
  errorMessage?: string;
  adminUserId?: string; // For login events where session doesn't exist yet
}

/**
 * Logs an audit event for admin operations
 * This function runs in the background and does not block the main operation
 */
export async function logAuditEvent(params: AuditLogParams): Promise<void> {
  try {
    // Get admin_user_id from params (for login events) or from session
    let adminUserId = params.adminUserId;

    if (!adminUserId) {
      const session = await getAdminSession();
      adminUserId = session?.admin_user_id;
    }

    if (!adminUserId) {
      console.warn('Could not log audit event: No admin user ID found');
      return;
    }

    const auditData = {
      admin_user_id: adminUserId,
      action_type: params.actionType,
      resource_type: params.resourceType,
      resource_id: params.resourceId || null,
      resource_name: params.resourceName || null,
      details: params.details || null,
      ip_address: params.ipAddress || null,
      user_agent: params.userAgent || null,
      status: params.status || 'success',
      error_message: params.errorMessage || null,
    };

    // Call the audit logging API endpoint
    // This uses fetch with service role key to bypass auth
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/audit/log`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(auditData),
      }
    );

    if (!response.ok) {
      console.error(`Failed to log audit event: ${response.statusText}`);
    }
  } catch (error) {
    // Log errors but don't throw - audit logging should not block operations
    console.error('Error logging audit event:', error);
  }
}

/**
 * Extract client IP address from request headers
 */
export function getClientIpFromRequest(request: Request): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip');
  return ip || undefined;
}

/**
 * Extract user agent from request headers
 */
export function getUserAgentFromRequest(request: Request): string | undefined {
  return request.headers.get('user-agent') || undefined;
}
