import { getEmailConfig } from '../email-config';

export interface BusinessInvitationData {
  to: string;
  businessName: string;
  businessEmail: string;
  invitedByAdmin: string;
  registrationLink: string;
  registrationToken: string;
  expiresInDays: number;
}

export async function sendBusinessInvitationEmail(data: BusinessInvitationData) {
  const config = getEmailConfig();

  const html = generateInvitationHTML({
    businessName: data.businessName,
    invitedByAdmin: data.invitedByAdmin,
    registrationLink: data.registrationLink,
    expiresInDays: data.expiresInDays,
  });

  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return { success: false, error: 'RESEND_API_KEY not configured' };
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: config.fromEmail,
        to: data.to,
        subject: `Welcome to Gifty! 🎁`,
        html,
      }),
    });

    if (response.ok) {
      console.log(`✅ Business invitation email sent to ${data.to}`);
      return { success: true };
    } else {
      const error = await response.text();
      console.error(`❌ Failed to send business invitation email:`, error);
      return { success: false, error };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error sending business invitation email:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

interface HTMLParams {
  businessName: string;
  invitedByAdmin: string;
  registrationLink: string;
  expiresInDays: number;
}

function generateInvitationHTML(params: HTMLParams): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Gifty</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f9fafb;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 32px;
      font-weight: bold;
    }
    .header p {
      margin: 10px 0 0 0;
      font-size: 16px;
      opacity: 0.9;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
      font-weight: 500;
    }
    .message {
      margin-bottom: 25px;
      line-height: 1.8;
      color: #555;
    }
    .info-box {
      background-color: #f0f4ff;
      border-left: 4px solid #667eea;
      padding: 15px 20px;
      margin: 25px 0;
      border-radius: 4px;
    }
    .info-box strong {
      color: #667eea;
    }
    .button-container {
      text-align: center;
      margin: 35px 0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 14px 40px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
      font-size: 16px;
      transition: opacity 0.3s;
    }
    .button:hover {
      opacity: 0.9;
    }
    .link-text {
      word-break: break-all;
      padding: 15px;
      background-color: #f5f5f5;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      margin: 15px 0;
      color: #666;
    }
    .footer {
      background-color: #f9fafb;
      padding: 30px;
      text-align: center;
      font-size: 12px;
      color: #999;
      border-top: 1px solid #eee;
    }
    .footer p {
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎁 Welcome to Gifty</h1>
      <p>Gift Card Management Platform</p>
    </div>

    <div class="content">
      <div class="greeting">Welcome, ${params.businessName}!</div>

      <div class="message">
        <p>You've been invited to join <strong>Gifty</strong> by <strong>${params.invitedByAdmin}</strong>.</p>
        <p>Gifty is a modern platform for managing and distributing gift cards to your customers. Get started by creating your account below.</p>
      </div>

      <div class="info-box">
        <strong>⏰ Important:</strong> This invitation link expires in <strong>${params.expiresInDays} days</strong>. Complete your registration before it expires.
      </div>

      <div class="button-container">
        <a href="${params.registrationLink}" class="button">Complete Registration →</a>
      </div>

      <div class="message">
        <p><strong>Didn't receive a clickable link?</strong> Copy and paste this URL into your browser:</p>
      </div>

      <div class="link-text">${params.registrationLink}</div>

      <div class="message">
        <p><strong>Getting Started with Gifty:</strong></p>
        <ul>
          <li>Create your account using the link above</li>
          <li>Set up your business profile</li>
          <li>Configure your payment methods</li>
          <li>Start creating and managing gift cards</li>
        </ul>
      </div>

      <div class="info-box">
        <strong>❓ Questions?</strong> Our support team is here to help. Reply to this email or contact us directly.
      </div>
    </div>

    <div class="footer">
      <p><strong>Gifty</strong> - Gift Card Management Made Simple</p>
      <p>© ${new Date().getFullYear()} Gifty. All rights reserved.</p>
      <p>If you didn't request this invitation, you can safely ignore this email.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
