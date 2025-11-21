import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabaseAdmin';
import { hashPassword, validatePasswordStrength } from '@/lib/password';
import { createSession, setSessionCookie } from '@/lib/session';
import { getClientIp } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    // Validate input
    if (!token) {
      return NextResponse.json(
        { error: 'Reset token is required' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    // Validate password strength
    const validation = validatePasswordStrength(password);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: 'Password does not meet requirements',
          errors: validation.errors,
          suggestions: validation.suggestions,
        },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();
    const clientIp = getClientIp(request);

    // 1. Verify token
    const { data: resetToken, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (tokenError || !resetToken) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 401 }
      );
    }

    // Check if already used
    if (resetToken.used) {
      return NextResponse.json(
        { error: 'This reset link has already been used' },
        { status: 401 }
      );
    }

    // Check if expired
    if (new Date(resetToken.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This reset link has expired. Please request a new one.' },
        { status: 401 }
      );
    }

    const email = resetToken.email.toLowerCase();

    // 2. Check if business exists and is active
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, contact_email, status')
      .ilike('contact_email', email)
      .eq('status', 'active')
      .maybeSingle();

    if (businessError || !business) {
      console.error('Business not found for password reset:', email);
      return NextResponse.json(
        { error: 'Account not found or inactive' },
        { status: 404 }
      );
    }

    // 3. Hash the new password
    const passwordHash = await hashPassword(password);

    // 4. Update or create credentials
    const { data: existingCred } = await supabase
      .from('business_credentials')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingCred) {
      // Update existing credentials
      const { error: updateError } = await supabase
        .from('business_credentials')
        .update({
          password_hash: passwordHash,
          password_changed_at: new Date().toISOString(),
          failed_login_attempts: 0,
          account_locked_until: null,
        })
        .eq('email', email);

      if (updateError) {
        console.error('Failed to update credentials:', updateError);
        throw new Error('Failed to update password');
      }
    } else {
      // Create new credentials
      const { error: insertError } = await supabase
        .from('business_credentials')
        .insert({
          email,
          password_hash: passwordHash,
          password_changed_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Failed to create credentials:', insertError);
        throw new Error('Failed to create password');
      }
    }

    // 5. Mark reset token as used
    await supabase
      .from('password_reset_tokens')
      .update({
        used: true,
        used_at: new Date().toISOString(),
        ip_address: clientIp,
      })
      .eq('token', token);

    // 6. Create session (auto-login after password reset)
    const session = await createSession(email);
    await setSessionCookie(session.session_token);

    console.log('✅ Password reset successful for:', email);

    return NextResponse.json({
      success: true,
      message: 'Password reset successful',
      user: {
        email,
        businessId: business.id,
        businessName: business.name,
      },
    });
  } catch (error) {
    console.error('Password reset verification error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password. Please try again.' },
      { status: 500 }
    );
  }
}

// GET endpoint to validate token without resetting
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Verify token exists and is valid
    const { data: resetToken, error } = await supabase
      .from('password_reset_tokens')
      .select('email, expires_at, used')
      .eq('token', token)
      .maybeSingle();

    if (error || !resetToken) {
      return NextResponse.json(
        { valid: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    if (resetToken.used) {
      return NextResponse.json(
        { valid: false, error: 'Token already used' },
        { status: 401 }
      );
    }

    if (new Date(resetToken.expires_at) < new Date()) {
      return NextResponse.json(
        { valid: false, error: 'Token expired' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      valid: true,
      email: resetToken.email,
    });
  } catch (error) {
    console.error('Token validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate token' },
      { status: 500 }
    );
  }
}
