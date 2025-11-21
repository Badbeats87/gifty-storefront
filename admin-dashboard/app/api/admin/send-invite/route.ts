import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import { getServiceSupabase } from '@/lib/supabaseAdmin';
import { randomBytes } from 'crypto';

export async function POST(request: Request) {
  try {
    await requireAdminAuth(); // Ensure only authenticated admins can access

    const { email, invitedBy, message } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Generate unique invite token
    const inviteToken = randomBytes(32).toString('hex');

    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create the business invite in the database
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('business_invites')
      .insert({
        email,
        invite_token: inviteToken,
        invited_by: invitedBy || 'admin',
        status: 'pending',
        expires_at: expiresAt.toISOString(),
        message: message || 'You are invited to join Gifty as a business partner!',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating business invite:', error);
      return NextResponse.json({ error: error.message || 'Failed to create invite' }, { status: 400 });
    }

    // Get the base URL for the registration link
    const baseUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001';
    const registrationUrl = `${baseUrl}/register/${inviteToken}`;

    // Send invitation email via Resend
    try {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        console.warn('⚠️  RESEND_API_KEY not configured, skipping email');
      } else {
        const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';

        const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Gifty</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; margin: 0; padding: 0; background-color: #f9fafb; }
    .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 32px; font-weight: bold; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; margin-bottom: 20px; font-weight: 500; }
    .message { margin-bottom: 25px; line-height: 1.8; color: #555; }
    .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; }
    .link-text { word-break: break-all; padding: 15px; background-color: #f5f5f5; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 12px; margin: 15px 0; color: #666; }
    .info-box { background-color: #f0f4ff; border-left: 4px solid #667eea; padding: 15px 20px; margin: 25px 0; border-radius: 4px; }
    .footer { background-color: #f9fafb; padding: 30px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎁 Welcome to Gifty</h1>
      <p>Gift Card Management Platform</p>
    </div>
    <div class="content">
      <div class="greeting">Welcome!</div>
      <div class="message">
        <p>You've been invited to join <strong>Gifty</strong> by <strong>${invitedBy || 'Admin'}</strong>.</p>
        <p>Get started by creating your account below.</p>
      </div>
      <div class="info-box">
        <strong>⏰ Important:</strong> This invitation link expires in <strong>7 days</strong>.
      </div>
      <div style="text-align: center; margin: 35px 0;">
        <a href="${registrationUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 6px; font-weight: bold;">Complete Registration →</a>
      </div>
      <div class="link-text">${registrationUrl}</div>
      <div class="message">
        <p><strong>Questions?</strong> Our support team is here to help.</p>
      </div>
    </div>
    <div class="footer">
      <p><strong>Gifty</strong> - Gift Card Management Made Simple</p>
      <p>© ${new Date().getFullYear()} Gifty. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
        `;

        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            from: fromEmail,
            to: email,
            subject: `Welcome to Gifty! 🎁`,
            html: emailHtml,
          }),
        });

        if (response.ok) {
          console.log('✅ Invitation email sent successfully to', email);
        } else {
          const error = await response.text();
          console.warn('⚠️  Email sending failed:', error);
        }
      }
    } catch (emailError) {
      console.error('Error sending invitation email:', emailError);
      // Continue anyway - the invite is created, just email failed
    }

    // Log admin action - send notification to other admins about new business invitation
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@gifty.com';
      const apiKey = process.env.RESEND_API_KEY;
      if (apiKey) {
        const adminNotificationHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Business Invitation Sent</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; margin: 0; padding: 0; background-color: #f9fafb; }
    .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); overflow: hidden; }
    .header { background-color: #1f2937; color: white; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: bold; }
    .content { padding: 30px; }
    .alert { background-color: #f0f4ff; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .details-table { width: 100%; margin: 25px 0; border-collapse: collapse; }
    .details-table td { padding: 10px; border-bottom: 1px solid #eee; }
    .details-table td:first-child { font-weight: 600; width: 35%; color: #666; background-color: #f9fafb; }
    .details-table tr:last-child td { border-bottom: none; }
    .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ℹ️ New Business Invitation</h1>
    </div>
    <div class="content">
      <div class="alert">
        <p style="margin: 0; font-weight: 500;">A new business invitation has been sent.</p>
      </div>
      <table class="details-table">
        <tr><td>Invited By:</td><td>${invitedBy || 'Admin'}</td></tr>
        <tr><td>Email:</td><td>${email}</td></tr>
        <tr><td>Status:</td><td>Pending</td></tr>
        <tr><td>Expires At:</td><td>${expiresAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
        ${message ? `<tr><td>Message:</td><td>${message}</td></tr>` : ''}
      </table>
      <p style="color: #555; margin: 20px 0;">Track this invitation in your admin dashboard.</p>
    </div>
    <div class="footer">
      <p><strong>Gifty</strong> - Gift Card Management Made Simple</p>
      <p>© ${new Date().getFullYear()} Gifty. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
        `;

        const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';

        const adminNotificationResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            from: fromEmail,
            to: adminEmail,
            subject: `ℹ️ New Business Invitation Sent to ${email}`,
            html: adminNotificationHtml,
          }),
        });

        if (adminNotificationResponse.ok) {
          console.log(`✅ Admin notification sent for invitation to ${email}`);
        } else {
          console.warn('⚠️  Admin notification sending failed:', await adminNotificationResponse.text());
        }
      }
    } catch (adminEmailError) {
      console.error('Error sending admin notification:', adminEmailError);
      // Continue anyway - admin notification is not critical
    }

    return NextResponse.json({
      success: true,
      invite: {
        id: data.id,
        email: data.email,
        token: inviteToken,
        expiresAt: data.expires_at,
        registrationUrl
      },
      message: 'Invitation created and email sent'
    }, { status: 200 });

  } catch (error: any) {
    console.error('API Error (POST /api/admin/send-invite):', error.message);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
