import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServiceSupabase } from '@/lib/supabaseAdmin';

const ADMIN_SESSION_COOKIE_NAME = 'gifty_admin_session';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;

    // Delete session from database if it exists
    if (sessionToken) {
      const supabase = getServiceSupabase();
      await supabase
        .from('admin_sessions')
        .delete()
        .eq('session_token', sessionToken);
    }

    // Clear the session cookie
    const responseHeaders = new Headers();
    responseHeaders.append(
      'Set-Cookie',
      `${ADMIN_SESSION_COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 UTC; HttpOnly; SameSite=Lax`
    );

    return NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200, headers: responseHeaders }
    );
  } catch (error: any) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}
