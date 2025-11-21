
import { getEmailConfig } from '../email-config';

export interface MagicLinkData {
  to: string;
  email: string;
  businessName: string;
  magicLink: string;
  expiresInMinutes: number;
}

export async function sendMagicLinkEmail(data: MagicLinkData) {
  const config = getEmailConfig();

  const html = generateMagicLinkHTML({
    businessName: data.businessName,
    magicLink: data.magicLink,
    expiresInMinutes: data.expiresInMinutes,
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
        subject: `Your ${data.businessName} Login Link`,
        html,
      }),
    });

    if (response.ok) {
      console.log(`✅ Magic link email sent to ${data.to}`);
      return { success: true };
    } else {
      const error = await response.text();
      console.error(`❌ Failed to send magic link email:`, error);
      return { success: false, error };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error sending magic link email:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

interface HTMLParams {
  businessName: string;
  magicLink: string;
  expiresInMinutes: number;
}

function generateMagicLinkHTML(params: HTMLParams): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login Link</title>
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
      font-size: 28px;
      font-weight: bold;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 16px;
      margin-bottom: 20px;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
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
    .info-box {
      background-color: #f0f4ff;
      border-left: 4px solid #667eea;
      padding: 15px 20px;
      margin: 25px 0;
      border-radius: 4px;
      font-size: 14px;
    }
    .warning-box {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px 20px;
      margin: 25px 0;
      border-radius: 4px;
      font-size: 14px;
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
      <h1>🔐 ${params.businessName} Login</h1>
    </div>

    <div class="content">
      <div class="greeting">Click the button below to log in to your ${params.businessName} account:</div>

      <div class="button-container">
        <a href="${params.magicLink}" class="button">Login Now →</a>
      </div>

      <p style="text-align: center; color: #666; font-size: 14px;">Or copy and paste this link:</p>

      <div class="link-text">${params.magicLink}</div>

      <div class="info-box">
        <strong>⏰ Security:</strong> This link expires in ${params.expiresInMinutes} minutes and can only be used once.
      </div>

      <div class="warning-box">
        <strong>🚨 Didn't request this email?</strong>
        <p style="margin: 8px 0 0 0;">
          If you didn't request a login link, you can safely ignore this email. Your account is secure.
        </p>
      </div>
    </div>

    <div class="footer">
      <p><strong>Gifty</strong> - Gift Card Management Made Simple</p>
      <p>© ${new Date().getFullYear()} Gifty. All rights reserved.</p>
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
