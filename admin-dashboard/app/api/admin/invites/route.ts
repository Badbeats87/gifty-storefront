import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabaseAdmin';
import { requireAdminAuth } from '@/lib/adminAuth';

export async function POST(request: Request) {
  try {
    await requireAdminAuth(); // Ensure only authenticated admins can access

    const { inviteIds } = await request.json();

    if (!inviteIds || !Array.isArray(inviteIds) || inviteIds.length === 0) {
      return NextResponse.json({ error: 'Invite IDs are required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    const { error } = await supabase
      .from('business_invites')
      .update({ status: 'revoked' })
      .in('id', inviteIds);

    if (error) {
      console.error('Error revoking invites:', error.message);
      return NextResponse.json({ error: `Failed to revoke invites: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ message: 'Invites revoked successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('API Error (POST /api/admin/invites):', error.message);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
