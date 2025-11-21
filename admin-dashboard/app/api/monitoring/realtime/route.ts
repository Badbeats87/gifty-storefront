import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    const supabase = getServiceSupabase();

    // Fetch recent orders (last 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, created_at, total_amount, status')
      .gte('created_at', tenMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(10);

    // Fetch recent failed audit logs (errors, failed logins, etc.)
    // Handle case where table doesn't exist yet
    let failures: any[] = [];
    const failuresQuery = await supabase
      .from('audit_logs')
      .select('id, action_type, resource_type, error_message, created_at')
      .eq('status', 'failed')
      .gte('created_at', tenMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!failuresQuery.error) {
      failures = failuresQuery.data || [];
    }

    // Fetch recent logins
    const { data: logins, error: loginsError } = await supabase
      .from('admin_sessions')
      .select('id, admin_user_id, created_at')
      .gte('created_at', tenMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(10);

    // Fetch recent approvals
    const { data: approvals, error: approvalsError } = await supabase
      .from('audit_logs')
      .select('id, action_type, resource_name, created_at')
      .eq('action_type', 'APPROVE')
      .gte('created_at', tenMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(10);

    // Calculate health metrics
    const allOrders = orders || [];
    const errorCount = (failures || []).length;
    const totalEvents = allOrders.length + errorCount + (logins || []).length;

    const errorRate = totalEvents > 0 ? (errorCount / totalEvents) * 100 : 0;
    const ordersPerMinute = allOrders.length; // Approximate from last 10 min

    // Determine system status
    let systemStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (errorRate > 10 || ordersPerMinute > 50) {
      systemStatus = 'warning';
    }
    if (errorRate > 20 || ordersPerMinute > 100) {
      systemStatus = 'critical';
    }

    // Build events stream
    const events: any[] = [];

    // Add order events
    if (allOrders.length > 0) {
      allOrders.forEach((order: any) => {
        events.push({
          id: `order-${order.id}`,
          timestamp: new Date(order.created_at),
          type: 'order',
          message: `Order placed: $${(order.total_amount || 0).toFixed(2)} - ${order.status}`,
          severity: order.status === 'completed' ? 'success' : 'info',
          metadata: { orderId: order.id, amount: order.total_amount, status: order.status },
        });
      });
    }

    // Add error events
    if (failures && failures.length > 0) {
      failures.forEach((failure: any) => {
        events.push({
          id: `error-${failure.id}`,
          timestamp: new Date(failure.created_at),
          type: 'error',
          message: `${failure.action_type} failed on ${failure.resource_type}: ${failure.error_message || 'Unknown error'}`,
          severity: 'error',
          metadata: { actionType: failure.action_type, resourceType: failure.resource_type },
        });
      });
    }

    // Add login events
    if (logins && logins.length > 0) {
      logins.forEach((login: any) => {
        events.push({
          id: `login-${login.id}`,
          timestamp: new Date(login.created_at),
          type: 'logins',
          message: `Admin logged in`,
          severity: 'info',
          metadata: { adminUserId: login.admin_user_id },
        });
      });
    }

    // Add approval events
    if (approvals && approvals.length > 0) {
      approvals.forEach((approval: any) => {
        events.push({
          id: `approval-${approval.id}`,
          timestamp: new Date(approval.created_at),
          type: 'approval',
          message: `Business approved: ${approval.resource_name}`,
          severity: 'success',
          metadata: { resourceName: approval.resource_name },
        });
      });
    }

    // Sort events by timestamp (most recent first)
    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return NextResponse.json({
      health: {
        dbLatency: Math.random() * 200, // Simulated - should be real DB latency
        errorRate: errorRate,
        activeUsers: Math.floor(Math.random() * 10) + 1, // Simulated
        ordersPerMinute: ordersPerMinute,
        status: systemStatus,
      },
      events: events.slice(0, 20), // Return latest 20 events
    });
  } catch (error) {
    console.error('Error fetching realtime data:', error);
    return NextResponse.json(
      {
        health: {
          dbLatency: 0,
          errorRate: 0,
          activeUsers: 0,
          ordersPerMinute: 0,
          status: 'healthy',
        },
        events: [],
      },
      { status: 500 }
    );
  }
}
