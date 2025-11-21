import { NextResponse } from 'next/server';
import { verifyPassword } from '@/lib/password';
import { createSession, setSessionCookie } from '@/lib/session';
import { getServiceSupabase } from '@/lib/supabaseAdmin';
import {
  rateLimitMiddleware,
  recordAttempt,
  resetRateLimit,
  getClientIp,
} from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const clientIp = getClientIp(request);

    // Apply rate limiting
    const rateLimit = await rateLimitMiddleware(request, normalizedEmail);
    if (rateLimit.limited && rateLimit.response) {
      return rateLimit.response;
    }

    const supabase = getServiceSupabase();

    // 1. Check if business exists and is active
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, contact_email, contact_name, status')
      .ilike('contact_email', normalizedEmail)
      .eq('status', 'active')
      .maybeSingle();

    if (businessError || !business) {
      // Record failed attempt
      recordAttempt(clientIp, 'ip');
      recordAttempt(normalizedEmail, 'email');

      console.warn('Login attempt for unknown or inactive business:', normalizedEmail);

      // Generic error to prevent user enumeration
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // 2. Get credentials
    const { data: credentials, error: credError } = await supabase
      .from('business_credentials')
      .select('*')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (credError || !credentials) {
      // No credentials found - user needs to set up password
      recordAttempt(clientIp, 'ip');
      recordAttempt(normalizedEmail, 'email');

      return NextResponse.json(
        {
          error: 'Password not set',
          code: 'PASSWORD_NOT_SET',
          message: 'Please set up your password first or use the password reset link.',
        },
        { status: 401 }
      );
    }

    // 3. Check if account is locked
    if (credentials.account_locked_until) {
      const lockedUntil = new Date(credentials.account_locked_until);
      if (lockedUntil > new Date()) {
        const minutesRemaining = Math.ceil(
          (lockedUntil.getTime() - Date.now()) / 1000 / 60
        );

        return NextResponse.json(
          {
            error: 'Account temporarily locked',
            message: `Too many failed login attempts. Account is locked for ${minutesRemaining} more minute${minutesRemaining !== 1 ? 's' : ''}.`,
            lockedUntil: lockedUntil.toISOString(),
          },
          { status: 423 } // 423 Locked
        );
      }
    }

    // 4. Verify password
    const isValidPassword = await verifyPassword(password, credentials.password_hash);

    if (!isValidPassword) {
      // Record failed attempt
      recordAttempt(clientIp, 'ip');
      recordAttempt(normalizedEmail, 'email');

      // Increment failed login attempts in database
      await supabase.rpc('increment_failed_login_attempts', {
        user_email: normalizedEmail,
      });

      // Get updated attempt count
      const { data: updatedCred } = await supabase
        .from('business_credentials')
        .select('failed_login_attempts, account_locked_until')
        .eq('email', normalizedEmail)
        .single();

      if (updatedCred?.account_locked_until) {
        return NextResponse.json(
          {
            error: 'Account locked',
            message: 'Too many failed login attempts. Your account has been temporarily locked for 30 minutes.',
          },
          { status: 423 }
        );
      }

      const remainingAttempts = 10 - (updatedCred?.failed_login_attempts || 0);

      return NextResponse.json(
        {
          error: 'Invalid email or password',
          ...(remainingAttempts <= 3 && remainingAttempts > 0 && {
            message: `Invalid email or password. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining before account lockout.`,
          }),
        },
        { status: 401 }
      );
    }

    // 5. Successful login - reset failed attempts
    await supabase.rpc('reset_failed_login_attempts', {
      user_email: normalizedEmail,
    });

    // Reset rate limits
    resetRateLimit(clientIp, 'ip');
    resetRateLimit(normalizedEmail, 'email');

    // 6. Create session
    const session = await createSession(normalizedEmail);
    await setSessionCookie(session.session_token);

    console.log('✅ Successful password login:', normalizedEmail);

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        email: normalizedEmail,
        businessId: business.id,
        businessName: business.name,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to log in. Please try again.' },
      { status: 500 }
    );
  }
}
