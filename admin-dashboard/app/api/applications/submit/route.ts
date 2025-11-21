import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

interface ApplicationSubmissionRequest {
  inviteId: string;
  businessName: string;
  contactEmail: string;
  contactName: string;
  phone: string;
  iban: string;
  description: string;
  website: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export async function POST(request: Request) {
  try {
    const body: ApplicationSubmissionRequest = await request.json();

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Submit application to database
    const { data, error: submitError } = await supabase
      .from('business_applications')
      .insert({
        invite_id: body.inviteId,
        business_name: body.businessName,
        contact_email: body.contactEmail,
        contact_name: body.contactName,
        phone: body.phone,
        iban: body.iban,
        description: body.description,
        website: body.website,
        address: body.address,
        status: 'pending'
      })
      .select()
      .single();

    if (submitError) {
      throw submitError;
    }

    // Update invite status
    await supabase
      .from('business_invites')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', body.inviteId);

    // Send emails
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      await sendApplicationEmails({
        applicationId: data.id,
        businessName: body.businessName,
        contactName: body.contactName,
        contactEmail: body.contactEmail,
        businessDescription: body.description,
        website: body.website,
      }, apiKey);
    }

    return NextResponse.json({
      success: true,
      applicationId: data.id,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Application submission error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit application' },
      { status: 500 }
    );
  }
}

async function sendApplicationEmails(params: {
  applicationId: string;
  businessName: string;
  contactName: string;
  contactEmail: string;
  businessDescription: string;
  website: string;
}, apiKey: string) {
  const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@gifty.com';

  // Applicant confirmation email
  const applicantEmailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Received</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; margin: 0; padding: 0; background-color: #f9fafb; }
    .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; margin-bottom: 20px; font-weight: 500; }
    .details-box { background-color: #f0f4ff; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .info-text { color: #555; margin: 15px 0; line-height: 1.8; }
    .footer { background-color: #f9fafb; padding: 30px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✓ Application Received</h1>
    </div>
    <div class="content">
      <div class="greeting">Hi ${params.contactName},</div>
      <div class="info-text">
        Thank you for applying to join Gifty! We've received your application for <strong>${params.businessName}</strong> and are reviewing it.
      </div>
      <div class="details-box">
        <strong>📋 Application Details:</strong>
        <p style="margin: 8px 0 0 0;">
          <strong>Business Name:</strong> ${params.businessName}<br/>
          <strong>Website:</strong> ${params.website || 'Not provided'}<br/>
          <strong>Application ID:</strong> ${params.applicationId.slice(0, 8)}
        </p>
      </div>
      <div class="info-text">
        <strong>What happens next?</strong><br/>
        Our admin team will review your application and contact you within 2-3 business days. We'll send you login credentials once your application is approved.
      </div>
      <div class="info-text">
        <strong>Questions?</strong> Contact our support team at support@gifty.com
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

  // Admin notification email
  const adminEmailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Business Application</title>
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
      <h1>📋 New Business Application</h1>
    </div>
    <div class="content">
      <div class="alert">
        <p style="margin: 0; font-weight: 500;">A new business application requires review.</p>
      </div>
      <table class="details-table">
        <tr><td>Business Name:</td><td>${params.businessName}</td></tr>
        <tr><td>Contact Name:</td><td>${params.contactName}</td></tr>
        <tr><td>Email:</td><td>${params.contactEmail}</td></tr>
        <tr><td>Website:</td><td>${params.website || 'Not provided'}</td></tr>
        <tr><td>Application ID:</td><td>${params.applicationId}</td></tr>
      </table>
      <p style="color: #555; margin: 20px 0;"><strong>Description:</strong></p>
      <p style="color: #666; background-color: #f9fafb; padding: 15px; border-radius: 4px; margin: 10px 0;">${params.businessDescription || 'Not provided'}</p>
      <p style="color: #555; margin: 20px 0;">Review this application in your admin dashboard.</p>
    </div>
    <div class="footer">
      <p><strong>Gifty</strong> - Gift Card Management Made Simple</p>
      <p>© ${new Date().getFullYear()} Gifty. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    // Send to applicant
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: params.contactEmail,
        subject: 'Your Gifty Business Application has been Received',
        html: applicantEmailHtml,
      }),
    });

    // Send to admin
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: adminEmail,
        subject: `📋 New Application: ${params.businessName}`,
        html: adminEmailHtml,
      }),
    });

    console.log(`✅ Application confirmation emails sent for ${params.businessName}`);
  } catch (err) {
    console.error('Error sending application emails:', err);
  }
}
