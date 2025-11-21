import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    const {
      adminUserId,
      actionType,
      resourceType,
      resourceId,
      resourceName,
      details,
      ipAddress,
      userAgent,
    } = await request.json();

    // Validate required fields
    if (!adminUserId || !actionType || !resourceType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('audit_logs')
      .insert([
        {
          admin_user_id: adminUserId,
          action_type: actionType,
          resource_type: resourceType,
          resource_id: resourceId,
          resource_name: resourceName,
          details: details || null,
          ip_address: ipAddress,
          user_agent: userAgent,
          status: 'success',
        },
      ])
      .select();

    if (error) {
      console.error('Error logging audit event:', error);
      return NextResponse.json(
        { error: 'Failed to log audit event' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in audit log endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
