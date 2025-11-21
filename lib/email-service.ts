/**
 * Email Service
 * Sends emails with gift card codes and order confirmations
 * Supports multiple providers (Resend, SendGrid, etc.)
 */

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export interface GiftCardEmailData {
  customerName: string;
  email: string;
  orderId: string;
  giftCards: Array<{
    code: string;
    amount: number;
    businessName: string;
  }>;
  total: number;
}

/**
 * Send order confirmation email with gift card codes
 */
export async function sendOrderConfirmationEmail(data: GiftCardEmailData): Promise<{ success: boolean; error?: string }> {
  const emailProvider = process.env.EMAIL_PROVIDER || 'resend';

  try {
    if (emailProvider === 'resend') {
      return await sendViaResend(data);
    } else if (emailProvider === 'sendgrid') {
      return await sendViaSendGrid(data);
    } else if (emailProvider === 'smtp') {
      return await sendViaSMTP(data);
    } else {
      return { success: false, error: `Unknown email provider: ${emailProvider}` };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Email sending error:', message);
    return { success: false, error: message };
  }
}

/**
 * Send via Resend (https://resend.com)
 */
async function sendViaResend(data: GiftCardEmailData): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  const html = generateEmailHTML(data);

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'orders@gifty.com',
        to: data.email,
        subject: `Your Gifty Order #${data.orderId.slice(0, 8)} - Gift Cards Ready! 🎁`,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: JSON.stringify(error) };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Send via SendGrid (https://sendgrid.com)
 */
async function sendViaSendGrid(data: GiftCardEmailData): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'SENDGRID_API_KEY not configured' };
  }

  const html = generateEmailHTML(data);

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: data.email }],
          },
        ],
        from: {
          email: process.env.EMAIL_FROM || 'orders@gifty.com',
        },
        subject: `Your Gifty Order #${data.orderId.slice(0, 8)} - Gift Cards Ready! 🎁`,
        content: [
          {
            type: 'text/html',
            value: html,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Send via SMTP (for self-hosted solutions)
 */
async function sendViaSMTP(data: GiftCardEmailData): Promise<{ success: boolean; error?: string }> {
  // This would require nodemailer
  // For now, return a placeholder
  console.log('SMTP email sending not yet implemented. Please configure Resend or SendGrid.');
  return { success: false, error: 'SMTP not implemented' };
}

/**
 * Generate HTML email template
 */
function generateEmailHTML(data: GiftCardEmailData): string {
  const giftCardRows = data.giftCards
    .map(
      (card) => `
    <tr style="border-bottom: 1px solid #e0e0e0;">
      <td style="padding: 12px; text-align: left;">
        <strong>${card.businessName}</strong>
        <br>
        <span style="color: #666; font-size: 12px;">$${card.amount.toFixed(2)}</span>
      </td>
      <td style="padding: 12px; text-align: right; font-family: monospace; background: #f5f5f5;">
        <strong>${card.code}</strong>
      </td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #000; }
    .gift-card-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; }
    .cta-button { display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 10px; }
    .info-box { background: #f0f8ff; border-left: 4px solid #007bff; padding: 15px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🎁 GIFTY</div>
      <h1 style="margin: 0; font-size: 28px; color: #000;">Order Confirmed!</h1>
    </div>

    <div class="section">
      <p>Hi ${data.customerName},</p>
      <p>Thank you for your order! Your gift cards are ready to use or share. Find your codes below:</p>
    </div>

    <div class="section">
      <div class="section-title">Your Gift Cards</div>
      <table class="gift-card-table">
        <thead>
          <tr style="background: #f5f5f5; border-bottom: 2px solid #ddd;">
            <th style="padding: 12px; text-align: left; font-weight: bold;">Gift Card</th>
            <th style="padding: 12px; text-align: right; font-weight: bold;">Code</th>
          </tr>
        </thead>
        <tbody>
          ${giftCardRows}
        </tbody>
      </table>

      <div class="info-box">
        <strong>💡 How to use:</strong>
        <ul style="margin: 8px 0; padding-left: 20px;">
          <li>Share these codes with your gift recipients</li>
          <li>Each code can be redeemed at participating businesses</li>
          <li>Codes are valid for 1 year from purchase</li>
        </ul>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Order Summary</div>
      <table style="width: 100%; margin-bottom: 20px;">
        <tr>
          <td style="padding: 8px 0;">Order ID:</td>
          <td style="padding: 8px 0; text-align: right; font-family: monospace;">
            <strong>${data.orderId}</strong>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">Total:</td>
          <td style="padding: 8px 0; text-align: right;">
            <strong>$${data.total.toFixed(2)} USD</strong>
          </td>
        </tr>
      </table>
    </div>

    <div class="section">
      <p style="color: #666; font-size: 14px;">
        Questions? Contact us at support@gifty.com or visit our help center.
      </p>
    </div>

    <div class="footer">
      <p>© 2024 Gifty. All rights reserved.</p>
      <p style="margin-top: 10px; color: #bbb;">This email was sent to ${data.email}</p>
    </div>
  </div>
</body>
</html>
  `;
}
