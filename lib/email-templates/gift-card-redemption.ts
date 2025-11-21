
import { getEmailConfig } from '../email-config';

export interface GiftCardRedemptionData {
  to: string;
  customerName: string;
  businessName: string;
  giftCardCode: string;
  redeemedAmount: number;
  remainingBalance: number;
  transactionId: string;
  redemptionDate: Date;
}

export async function sendGiftCardRedemptionEmail(data: GiftCardRedemptionData) {
  const config = getEmailConfig();

  const html = generateRedemptionHTML({
    customerName: data.customerName,
    businessName: data.businessName,
    giftCardCode: data.giftCardCode,
    redeemedAmount: data.redeemedAmount,
    remainingBalance: data.remainingBalance,
    transactionId: data.transactionId,
    redemptionDate: data.redemptionDate,
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
        subject: `Gift Card Redeemed - ${data.businessName} ✅`,
        html,
      }),
    });

    if (response.ok) {
      console.log(`✅ Gift card redemption email sent to ${data.to}`);
      return { success: true };
    } else {
      const error = await response.text();
      console.error(`❌ Failed to send redemption email:`, error);
      return { success: false, error };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error sending redemption email:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

interface HTMLParams {
  customerName: string;
  businessName: string;
  giftCardCode: string;
  redeemedAmount: number;
  remainingBalance: number;
  transactionId: string;
  redemptionDate: Date;
}

function generateRedemptionHTML(params: HTMLParams): string {
  const formattedDate = params.redemptionDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const hasBalance = params.remainingBalance > 0;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gift Card Redeemed</title>
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
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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
      margin-bottom: 20px;
      line-height: 1.8;
      color: #555;
    }
    .details-box {
      background-color: #f0fdf4;
      border: 2px solid #10b981;
      padding: 20px;
      margin: 25px 0;
      border-radius: 6px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      font-size: 15px;
    }
    .detail-row:last-child {
      margin-bottom: 0;
    }
    .detail-label {
      font-weight: 500;
      color: #059669;
    }
    .detail-value {
      text-align: right;
      color: #333;
    }
    .amount {
      font-size: 18px;
      font-weight: bold;
    }
    .code {
      font-family: 'Courier New', monospace;
      background-color: #f5f5f5;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .balance-info {
      background-color: ${hasBalance ? '#fef3c7' : '#fecaca'};
      border-left: 4px solid ${hasBalance ? '#f59e0b' : '#ef4444'};
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .balance-info strong {
      color: ${hasBalance ? '#d97706' : '#dc2626'};
    }
    .transaction-id {
      font-size: 12px;
      color: #999;
      text-align: center;
      margin: 20px 0;
      padding: 10px 0;
      border-top: 1px solid #eee;
      font-family: 'Courier New', monospace;
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
      <h1>✅ Gift Card Redeemed</h1>
      <p>Transaction Complete</p>
    </div>

    <div class="content">
      <div class="greeting">Thank you, ${params.customerName}!</div>

      <div class="message">
        <p>Your gift card at <strong>${params.businessName}</strong> has been successfully redeemed.</p>
      </div>

      <div class="details-box">
        <div class="detail-row">
          <span class="detail-label">Gift Card Code:</span>
          <span class="detail-value"><span class="code">${params.giftCardCode}</span></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Business:</span>
          <span class="detail-value">${params.businessName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Amount Redeemed:</span>
          <span class="detail-value amount">$${params.redeemedAmount.toFixed(2)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date & Time:</span>
          <span class="detail-value">${formattedDate}</span>
        </div>
      </div>

      ${
        hasBalance
          ? `
      <div class="balance-info">
        <strong>💰 Balance Remaining:</strong> $${params.remainingBalance.toFixed(2)}<br>
        <p style="margin: 8px 0 0 0; font-size: 14px;">You can use this gift card again for additional purchases.</p>
      </div>
      `
          : `
      <div class="balance-info">
        <strong>🎉 Full Balance Used!</strong><br>
        <p style="margin: 8px 0 0 0; font-size: 14px;">Thank you for using your entire gift card. We hope you enjoyed your experience!</p>
      </div>
      `
      }

      <div class="message">
        <p><strong>What happens next?</strong></p>
        <ul>
          <li>Your redemption has been recorded</li>
          <li>The merchant has been notified</li>
          ${hasBalance ? '<li>You can return anytime to use your remaining balance</li>' : '<li>Enjoy your purchase!'}
        </ul>
      </div>

      <div class="message">
        <p><strong>Need help?</strong> If you have any questions about this transaction, please contact the merchant directly or reach out to our support team.</p>
      </div>

      <div class="transaction-id">
        Transaction ID: ${params.transactionId}
      </div>
    </div>

    <div class="footer">
      <p><strong>Gifty</strong> - Gift Card Management Made Simple</p>
      <p>© ${new Date().getFullYear()} Gifty. All rights reserved.</p>
      <p>Keep this email for your records.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
