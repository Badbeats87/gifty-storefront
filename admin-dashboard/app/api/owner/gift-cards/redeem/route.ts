import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getBusinessByIdForUser } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { giftCardId, amount, businessId } = await request.json();

  if (!giftCardId || !amount || !businessId) {
    return NextResponse.json(
      { error: 'giftCardId, amount, and businessId are required' },
      { status: 400 }
    );
  }

  const redemptionAmount = Number(amount);

  if (Number.isNaN(redemptionAmount) || redemptionAmount <= 0) {
    return NextResponse.json(
      { error: 'Invalid redemption amount' },
      { status: 400 }
    );
  }

  const business = await getBusinessByIdForUser(businessId, session.email);

  if (!business) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const supabase = getServiceSupabase();

  const { data: giftCard, error: fetchError } = await supabase
    .from('gift_cards')
    .select(
      `
        *,
        customer:customers(email, name)
      `
    )
    .eq('id', giftCardId)
    .eq('business_id', businessId)
    .maybeSingle();

  if (fetchError || !giftCard) {
    return NextResponse.json(
      { error: 'Gift card not found' },
      { status: 404 }
    );
  }

  if (giftCard.remaining_balance <= 0) {
    return NextResponse.json(
      { error: 'Gift card already redeemed' },
      { status: 400 }
    );
  }

  if (redemptionAmount > giftCard.remaining_balance) {
    return NextResponse.json(
      { error: 'Amount exceeds remaining balance' },
      { status: 400 }
    );
  }

  const newBalance = giftCard.remaining_balance - redemptionAmount;
  const isFullyRedeemed = newBalance === 0;

  const updateData: Record<string, any> = {
    remaining_balance: newBalance,
    updated_at: new Date().toISOString(),
  };

  if (isFullyRedeemed) {
    updateData.status = 'redeemed';
    updateData.redeemed_at = new Date().toISOString();
    updateData.redeemed_by = business.name;
  } else {
    updateData.status = 'partially_redeemed';
  }

  const { error: updateError } = await supabase
    .from('gift_cards')
    .update(updateData)
    .eq('id', giftCard.id);

  if (updateError) {
    return NextResponse.json(
      { error: 'Failed to update gift card' },
      { status: 500 }
    );
  }

  // Send redemption confirmation email to customer
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey && giftCard.customer?.email) {
      const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gift Card Redemption Confirmation</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; margin: 0; padding: 0; background-color: #f9fafb; }
    .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; margin-bottom: 20px; font-weight: 500; }
    .details-box { background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 15px 20px; margin: 20px 0; border-radius: 4px; }
    .details-box div { display: flex; justify-content: space-between; margin-bottom: 10px; }
    .details-box div:last-child { margin-bottom: 0; }
    .amount { font-size: 24px; font-weight: bold; color: #10b981; }
    .info-text { color: #555; margin: 15px 0; line-height: 1.8; }
    .footer { background-color: #f9fafb; padding: 30px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✓ Redemption Confirmed</h1>
    </div>
    <div class="content">
      <div class="greeting">Thank you, ${giftCard.customer?.name || 'Valued Customer'}!</div>
      <div class="info-text">Your gift card has been successfully redeemed at <strong>${business.name}</strong>.</div>
      <div class="details-box">
        <div>
          <strong>Redeemed Amount:</strong>
          <span class="amount">$${redemptionAmount.toFixed(2)}</span>
        </div>
        <div>
          <strong>Remaining Balance:</strong>
          <span style="color: ${newBalance > 0 ? '#667eea' : '#999'}; font-weight: bold;">$${newBalance.toFixed(2)}</span>
        </div>
      </div>
      ${isFullyRedeemed ? '<div class="info-text" style="background-color: #f3e8ff; padding: 15px; border-radius: 4px;"><strong>✨ Card Fully Redeemed</strong><p style="margin: 8px 0 0 0;">Thank you for using your gift card! We hope you enjoyed your experience.</p></div>' : '<div class="info-text">Your gift card still has a remaining balance available for future use.</div>'}
      <div class="info-text">
        <strong>Questions?</strong> Contact ${business.name} directly or reach out to our support team.
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

      const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: giftCard.customer.email,
          subject: isFullyRedeemed ? `Your Gift Card Has Been Fully Redeemed at ${business.name}` : `Your Gift Card Redemption Confirmation from ${business.name}`,
          html: emailHtml,
        }),
      });

      if (response.ok) {
        console.log(`✅ Redemption email sent to ${giftCard.customer.email}`);
      } else {
        console.warn('⚠️  Redemption email sending failed:', await response.text());
      }
    }
  } catch (emailError) {
    console.error('Error sending redemption email:', emailError);
    // Continue anyway - the redemption is processed, just email failed
  }

  return NextResponse.json({
    success: true,
    remainingBalance: newBalance,
    status: isFullyRedeemed ? 'redeemed' : 'partially_redeemed',
  });
}
