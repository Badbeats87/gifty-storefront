
import { getEmailConfig } from '../email-config';

export interface OrderConfirmationData {
  to: string;
  customerName: string;
  orderId: string;
  totalAmount: number;
  giftCards: Array<{
    code: string;
    businessName: string;
    amount: number;
  }>;
  orderDate: Date;
}

export async function sendOrderConfirmationEmail(data: OrderConfirmationData) {
  const config = getEmailConfig();

  const html = generateOrderConfirmationHTML({
    customerName: data.customerName,
    orderId: data.orderId,
    totalAmount: data.totalAmount,
    giftCards: data.giftCards,
    orderDate: data.orderDate,
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
        subject: `Your Gifty Order #${data.orderId} - Gift Cards Ready! 🎁`,
        html,
      }),
    });

    if (response.ok) {
      console.log(`✅ Order confirmation email sent to ${data.to}`);
      return { success: true };
    } else {
      const error = await response.text();
      console.error(`❌ Failed to send order confirmation:`, error);
      return { success: false, error };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error sending order confirmation:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

interface HTMLParams {
  customerName: string;
  orderId: string;
  totalAmount: number;
  giftCards: Array<{
    code: string;
    businessName: string;
    amount: number;
  }>;
  orderDate: Date;
}

function generateOrderConfirmationHTML(params: HTMLParams): string {
  const formattedDate = params.orderDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
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
      background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
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
    .order-info {
      background-color: #f9fafb;
      padding: 15px;
      border-radius: 6px;
      margin: 20px 0;
      font-size: 14px;
    }
    .order-info div {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    .order-info div:last-child {
      margin-bottom: 0;
    }
    .order-info strong {
      color: #666;
    }
    .gift-cards-table {
      width: 100%;
      border-collapse: collapse;
      margin: 25px 0;
    }
    .gift-cards-table th {
      background-color: #f9fafb;
      padding: 12px;
      text-align: left;
      font-weight: bold;
      border-bottom: 2px solid #eee;
      font-size: 14px;
    }
    .gift-cards-table td {
      padding: 15px 12px;
      border-bottom: 1px solid #eee;
    }
    .code {
      font-family: 'Courier New', monospace;
      background-color: #f5f5f5;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: bold;
    }
    .total-row {
      background-color: #f9fafb;
      font-weight: bold;
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
      <h1>🎁 Order Confirmed</h1>
      <p>Your gift cards are ready</p>
    </div>

    <div class="content">
      <div class="greeting">Thank you, ${params.customerName}!</div>

      <div class="order-info">
        <div>
          <strong>Order ID:</strong>
          <span>#${params.orderId}</span>
        </div>
        <div>
          <strong>Order Date:</strong>
          <span>${formattedDate}</span>
        </div>
        <div>
          <strong>Total:</strong>
          <span style="color: #ec4899; font-weight: bold;">$${params.totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <p style="color: #555; margin: 20px 0;">Your gift cards are ready to use. Here are your codes:</p>

      <table class="gift-cards-table">
        <thead>
          <tr>
            <th>Business</th>
            <th>Gift Card Code</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${params.giftCards
            .map(
              (card) => `
          <tr>
            <td>${card.businessName}</td>
            <td><span class="code">${card.code}</span></td>
            <td style="text-align: right;">$${card.amount.toFixed(2)}</td>
          </tr>
          `
            )
            .join('')}
          <tr class="total-row">
            <td colspan="2">Total</td>
            <td style="text-align: right;">$${params.totalAmount.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <div class="info-box">
        <strong>💡 How to use your gift cards:</strong>
        <p style="margin: 8px 0 0 0;">
          Present your gift card code at the participating business. The merchant will verify the code and process your purchase. Keep this email safe for reference.
        </p>
      </div>

      <div style="margin: 25px 0; padding: 15px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
        <strong style="color: #d97706;">⏰ Important:</strong>
        <p style="margin: 8px 0 0 0; color: #92400e;">
          Please check the expiration date with the merchant. Most gift cards are valid for 1-2 years from purchase date.
        </p>
      </div>

      <p style="color: #666; font-size: 14px; margin-top: 25px;">
        <strong>Questions?</strong> Contact our support team if you need any assistance with your gift cards.
      </p>
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
