import { NextResponse } from 'next/server';
import { createMagicLink } from '@/lib/session';
import { getServiceSupabase } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const supabase = getServiceSupabase();
    const { data: businesses } = await supabase
      .from('businesses')
      .select('id, name, contact_email, contact_name, status')
      .ilike('contact_email', normalizedEmail)
      .eq('status', 'active');

    if (!businesses || businesses.length === 0) {
      console.warn('Magic link requested for unknown or inactive business contact', normalizedEmail);
      return NextResponse.json({
        success: true,
        message: 'Magic link sent! Check your email.',
      });
    }

    // Use the first active business if multiple exist
    const business = businesses[0];

    // Generate magic link token
    const token = await createMagicLink(normalizedEmail);

    // Create magic link URL
    const magicLinkUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/verify?token=${token}`;

    // Try Resend first (recommended - works independently of Wix)
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
            subject: `Your ${business.name} Login Link`,
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Login to Your Dashboard</h1>
                  </div>
                  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${business.contact_name || 'there'},</p>
                    <p style="font-size: 16px; margin-bottom: 25px;">Click the button below to securely log into your <strong>${business.name}</strong> dashboard:</p>
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${magicLinkUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.25);">Open Dashboard →</a>
                    </div>
                    <div style="background: white; border-left: 4px solid #667eea; padding: 15px; margin: 25px 0; border-radius: 4px;">
                      <p style="margin: 0; font-size: 14px; color: #666;">
                        <strong>Security Note:</strong> This link expires in 15 minutes and can only be used once.
                      </p>
                    </div>
                    <p style="font-size: 14px; color: #666; margin-top: 25px;">
                      Or copy and paste this URL into your browser:<br>
                      <a href="${magicLinkUrl}" style="color: #667eea; word-break: break-all; font-size: 12px;">${magicLinkUrl}</a>
                    </p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">
                    <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">
                      If you didn't request this login link, you can safely ignore this email.
                    </p>
                  </div>
                </body>
              </html>
            `,
          }),
        });

        if (response.ok) {
          console.log('✅ Magic link email sent via Resend to:', normalizedEmail);
          emailSent = true;
        } else {
          const errorData = await response.json();
          console.error('❌ Resend API error:', errorData);
        }
      } catch (emailError) {
        console.error('Failed to send email via Resend:', emailError);
      }
    }

    // Fall back to Wix email (if Resend didn't work)
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
              subject: `Your ${business.name} login link`,
              magicLink: magicLinkUrl,
              expiresInMinutes: 15,
              buttonText: 'Open dashboard',
            }),
          });
          console.log('📧 Attempted to send email via Wix function');
        } catch (emailError) {
          console.error('Failed to send email via Wix:', emailError);
        }
      }
    }

    // In development, log the magic link
    if (process.env.NODE_ENV === 'development') {
      console.log('=== MAGIC LINK ===');
      console.log(`Email: ${email}`);
      console.log(`Link: ${magicLinkUrl}`);
      console.log('==================');
    }

    return NextResponse.json({
      success: true,
      message: 'Magic link sent! Check your email.',
      // In development, return the link
      ...(process.env.NODE_ENV === 'development' && { magicLink: magicLinkUrl }),
    });
  } catch (error) {
    console.error('Error creating magic link:', error);
    return NextResponse.json(
      { error: 'Failed to send magic link' },
      { status: 500 }
    );
  }
}
