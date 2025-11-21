import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { sendOrderConfirmationEmail } from '@/lib/email-service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

interface OrderRequest {
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  shippingInfo: {
    firstName: string;
    lastName: string;
    email: string;
    address: string;
    city: string;
    state: string;
  };
  paymentInfo: {
    transactionId: string;
    amount: number;
  };
}

interface GiftCard {
  code: string;
  amount: number;
  businessName: string;
}

/**
 * Generate a unique gift card code
 */
function generateGiftCardCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 16; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(request: NextRequest) {
  try {
    const body: OrderRequest = await request.json();

    // Validate required fields
    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Order must contain at least one item' },
        { status: 400 }
      );
    }

    if (!body.shippingInfo || !body.paymentInfo) {
      return NextResponse.json(
        { error: 'Missing shipping or payment information' },
        { status: 400 }
      );
    }

    // Initialize Supabase client with service role (for backend operations)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create customer if not exists
    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('email', body.shippingInfo.email)
      .single();

    let customerId = customer?.id;

    if (!customerId) {
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert([
          {
            email: body.shippingInfo.email,
            name: `${body.shippingInfo.firstName} ${body.shippingInfo.lastName}`,
          },
        ])
        .select('id')
        .single();

      if (customerError) {
        console.error('Error creating customer:', customerError);
        return NextResponse.json(
          { error: 'Failed to create customer record' },
          { status: 500 }
        );
      }

      customerId = newCustomer?.id;
    }

    // Create order (with business_id from first item - typically only one business per order in this flow)
    const firstBusinessId = body.items[0]?.id;
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          customer_id: customerId,
          total_amount: body.paymentInfo.amount,
          currency: 'USD',
          status: 'completed',
          payment_transaction_id: body.paymentInfo.transactionId,
          shipping_address: `${body.shippingInfo.address}, ${body.shippingInfo.city}, ${body.shippingInfo.state}`,
          ...(firstBusinessId && { business_id: firstBusinessId }),
        },
      ])
      .select('id')
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }

    const orderId = order?.id;

    // Create gift cards for each item in the order
    const giftCards: GiftCard[] = [];
    const giftCardInserts = [];

    for (const item of body.items) {
      for (let i = 0; i < item.quantity; i++) {
        const code = generateGiftCardCode();

        giftCardInserts.push({
          code,
          amount: item.price,
          currency: 'USD',
          remaining_balance: item.price,
          status: 'issued',
          issued_at: new Date().toISOString(),
          order_id: orderId,
          customer_id: customerId,
          business_id: item.id,
        });

        giftCards.push({
          code,
          amount: item.price,
          businessName: item.name,
        });
      }
    }

    // Batch insert gift cards
    if (giftCardInserts.length > 0) {
      const { error: giftCardError } = await supabase
        .from('gift_cards')
        .insert(giftCardInserts);

      if (giftCardError) {
        console.error('Error creating gift cards:', giftCardError);
        // Don't fail the entire order if gift cards fail to insert
        // They can be regenerated
      }
    }

    // Send confirmation email with gift cards
    try {
      const emailResult = await sendOrderConfirmationEmail({
        customerName: `${body.shippingInfo.firstName} ${body.shippingInfo.lastName}`,
        email: body.shippingInfo.email,
        orderId,
        giftCards,
        total: body.paymentInfo.amount,
      });

      if (!emailResult.success) {
        console.warn('Email sending failed:', emailResult.error);
        // Don't fail the order if email fails - it's a non-critical operation
      }
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      // Continue anyway - order is already created
    }

    // Send admin notification for high-value orders (>$500)
    if (body.paymentInfo.amount >= 500) {
      try {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@gifty.com';
        const apiKey = process.env.RESEND_API_KEY;
        if (apiKey) {
          const adminEmailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>High Value Order Alert</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; margin: 0; padding: 0; background-color: #f9fafb; }
    .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); overflow: hidden; }
    .header { background-color: #1f2937; color: white; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: bold; }
    .content { padding: 30px; }
    .alert { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .alert-title { font-size: 18px; font-weight: bold; margin: 0 0 10px 0; color: #d97706; }
    .details-table { width: 100%; margin: 25px 0; border-collapse: collapse; }
    .details-table td { padding: 10px; border-bottom: 1px solid #eee; }
    .details-table td:first-child { font-weight: 600; width: 35%; color: #666; background-color: #f9fafb; }
    .details-table tr:last-child td { border-bottom: none; }
    .action-button { display: inline-block; background-color: #1f2937; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ High Value Order Alert</h1>
    </div>
    <div class="content">
      <div class="alert">
        <div class="alert-title">Order Amount: $${body.paymentInfo.amount.toFixed(2)}</div>
        <p style="margin: 10px 0 0 0;">An order exceeding the $500 threshold has been placed.</p>
      </div>
      <table class="details-table">
        <tr><td>Order ID:</td><td>${orderId}</td></tr>
        <tr><td>Amount:</td><td>$${body.paymentInfo.amount.toFixed(2)}</td></tr>
        <tr><td>Customer:</td><td>${body.shippingInfo.firstName} ${body.shippingInfo.lastName}</td></tr>
        <tr><td>Email:</td><td>${body.shippingInfo.email}</td></tr>
        <tr><td>Items:</td><td>${body.items.length} gift card(s)</td></tr>
        <tr><td>Transaction ID:</td><td>${body.paymentInfo.transactionId}</td></tr>
      </table>
      <p style="color: #555; margin: 20px 0;">Please review this order in your admin dashboard.</p>
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
              subject: `🚨 High Value Order: $${body.paymentInfo.amount.toFixed(2)} - Order #${orderId.slice(0, 8)}`,
              html: adminEmailHtml,
            }),
          });

          if (adminNotificationResponse.ok) {
            console.log(`✅ Admin notification sent for high-value order ${orderId}`);
          } else {
            console.warn('⚠️  Admin notification sending failed:', await adminNotificationResponse.text());
          }
        }
      } catch (adminEmailError) {
        console.error('Error sending admin notification:', adminEmailError);
        // Continue anyway - admin notification is not critical
      }
    }

    return NextResponse.json(
      {
        success: true,
        orderId,
        giftCards,
        orderDetails: {
          email: body.shippingInfo.email,
          totalAmount: body.paymentInfo.amount,
          transactionId: body.paymentInfo.transactionId,
          itemCount: body.items.reduce((sum, item) => sum + item.quantity, 0),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
