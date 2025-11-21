import { NextResponse } from 'next/server';
import { verifyMagicLink, createSession, setSessionCookie } from '@/lib/session';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(
        new URL('/owner/login?error=invalid_token', request.url)
      );
    }

    // Verify the magic link token
    const email = await verifyMagicLink(token);

    if (!email) {
      return NextResponse.redirect(
        new URL('/owner/login?error=invalid_or_expired_token', request.url)
      );
    }

    // Create session
    const session = await createSession(email);

    // Create redirect response
    const response = NextResponse.redirect(
      new URL('/owner/dashboard', request.url)
    );

    // Set session cookie in the response
    response.cookies.set('gifty_session', session.session_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error verifying magic link:', error);
    return NextResponse.redirect(
      new URL('/owner/login?error=verification_failed', request.url)
    );
  }
}
