import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabaseAdmin';
import { requireAdminAuth } from '@/lib/adminAuth';

export async function POST(request: Request) {
  try {
    await requireAdminAuth(); // Ensure only authenticated admins can access

    const supabase = getServiceSupabase();

    // Delete pending applications
    const { error: appError } = await supabase
      .from('business_applications')
      .delete()
      .eq('status', 'pending');

    if (appError) {
      console.error('Error deleting pending applications:', appError.message);
      throw new Error(`Failed to delete pending applications: ${appError.message}`);
    }

    // Delete pending invites
    const { error: inviteError } = await supabase
      .from('business_invites')
      .delete()
      .eq('status', 'pending');

    if (inviteError) {
      console.error('Error deleting pending invites:', inviteError.message);
      throw new Error(`Failed to delete pending invites: ${inviteError.message}`);
    }

    return NextResponse.json({ message: 'Test data cleaned up successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('API Error (POST /api/admin/cleanup-test-data):', error.message);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
