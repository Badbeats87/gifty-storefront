import { NextResponse } from 'next/server';
import { getSession, deleteSession, clearSessionCookie } from '@/lib/session';

export async function POST() {
  try {
    const session = await getSession();

    if (session) {
      await deleteSession(session.session_token);
    }

    await clearSessionCookie();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging out:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}
