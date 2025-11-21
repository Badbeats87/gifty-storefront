import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabaseAdmin';
import { generateToken } from '@/lib/session';
import { rateLimitMiddleware, getClientIp } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // Validate input
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const clientIp = getClientIp(request);

    // Apply rate limiting (use same middleware)
    const rateLimit = await rateLimitMiddleware(request, normalizedEmail);
    if (rateLimit.limited && rateLimit.response) {
      return rateLimit.response;
    }

    const supabase = getServiceSupabase();

    // Check if business exists and is active
    const { data: business } = await supabase
      .from('businesses')
      .select('id, name, contact_email, contact_name, status')
      .ilike('contact_email', normalizedEmail)
      .eq('status', 'active')
      .maybeSingle();

    // Always return success to prevent user enumeration
    if (!business) {
      console.warn('Password reset requested for unknown business:', normalizedEmail);
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.',
      });
    }

    // Generate password reset token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token in database
    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert({
        email: normalizedEmail,
        token,
        expires_at: expiresAt.toISOString(),
        ip_address: clientIp,
      });

    if (tokenError) {
      console.error('Failed to create password reset token:', tokenError);
      throw new Error('Failed to create reset token');
    }

    // Create reset link URL
    const resetLinkUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/owner/reset-password?token=${token}`;

    // Try Resend first
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';

    let emailSent = false;

    if (resendApiKey) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromEmail,
            to: normalizedEmail,
            subject: `Reset Your ${business.name} Password`,
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Password Reset Request</h1>
                  </div>
                  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${business.contact_name || 'there'},</p>
                    <p style="font-size: 16px; margin-bottom: 25px;">We received a request to reset the password for your <strong>${business.name}</strong> dashboard account.</p>
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${resetLinkUrl}" style="background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(245, 158, 11, 0.25);">Reset Password →</a>
                    </div>
                    <div style="background: white; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; border-radius: 4px;">
                      <p style="margin: 0; font-size: 14px; color: #666;">
                        <strong>Security Note:</strong> This link expires in 1 hour and can only be used once.
                      </p>
                    </div>
                    <p style="font-size: 14px; color: #666; margin-top: 25px;">
                      Or copy and paste this URL into your browser:<br>
                      <a href="${resetLinkUrl}" style="color: #f59e0b; word-break: break-all; font-size: 12px;">${resetLinkUrl}</a>
                    </p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">
                    <div style="background: #fef3c7; border: 1px solid #fcd34d; padding: 15px; margin: 20px 0; border-radius: 4px;">
                      <p style="margin: 0; font-size: 14px; color: #92400e;">
                        <strong>⚠️ Didn't request this?</strong><br>
                        If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
                      </p>
                    </div>
                  </div>
                </body>
              </html>
            `,
          }),
        });

        if (response.ok) {
          console.log('✅ Password reset email sent via Resend to:', normalizedEmail);
          emailSent = true;
        } else {
          const errorData = await response.json();
          console.error('❌ Resend API error:', errorData);
        }
      } catch (emailError) {
        console.error('Failed to send email via Resend:', emailError);
      }
    }

    // Fall back to Wix email (if configured)
    if (!emailSent) {
      const wixEmailUrl = process.env.WIX_SEND_EMAIL_URL;
      const wixEmailApiKey = process.env.WIX_EMAIL_API_KEY;

      if (wixEmailUrl) {
        try {
          await fetch(wixEmailUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(wixEmailApiKey && { Authorization: `Bearer ${wixEmailApiKey}` }),
            },
            body: JSON.stringify({
              to: normalizedEmail,
              name: business.contact_name || business.name,
              subject: `Reset your ${business.name} password`,
              magicLink: resetLinkUrl, // Reuse magic link template
              expiresInMinutes: 60,
              buttonText: 'Reset Password',
            }),
          });
          console.log('📧 Attempted to send password reset via Wix function');
        } catch (emailError) {
          console.error('Failed to send email via Wix:', emailError);
        }
      }
    }

    // In development, log the reset link
    if (process.env.NODE_ENV === 'development') {
      console.log('=== PASSWORD RESET LINK ===');
      console.log(`Email: ${email}`);
      console.log(`Link: ${resetLinkUrl}`);
      console.log('===========================');
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link.',
      // In development, return the link
      ...(process.env.NODE_ENV === 'development' && { resetLink: resetLinkUrl }),
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    );
  }
}
