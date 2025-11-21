# Email System - Quick Start for Developers

Copy-paste code examples for common email tasks.

---

## 🚀 Setup (Do Once)

### 1. Install Packages
```bash
npm install bull redis nodemailer
```

### 2. Update .env.local
```bash
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_your_key_here
EMAIL_DOMAIN=localhost:3000
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 3. Start Redis
```bash
brew install redis && brew services start redis
```

---

## 📧 Send Emails (Copy & Paste)

### Business Invitation Email

```typescript
import { sendBusinessInvitationEmail } from '@/lib/email-templates/business-invitation';

// In your API route or action
const result = await sendBusinessInvitationEmail({
  to: 'business@example.com',
  businessName: 'Restaurant ABC',
  businessEmail: 'business@example.com',
  invitedByAdmin: 'Admin Name',
  registrationLink: 'https://app.gifty.com/register/token123',
  registrationToken: 'token123',
  expiresInDays: 7,
});

if (result.success) {
  console.log('✅ Email sent');
} else {
  console.error('❌ Error:', result.error);
}
```

### Gift Card Redemption Email

```typescript
import { sendGiftCardRedemptionEmail } from '@/lib/email-templates/gift-card-redemption';

// After successful redemption
const result = await sendGiftCardRedemptionEmail({
  to: 'customer@example.com',
  customerName: 'John Doe',
  businessName: 'Restaurant ABC',
  giftCardCode: 'GIFT-ABC123',
  redeemedAmount: 50.00,
  remainingBalance: 25.00,
  transactionId: 'txn-12345',
  redemptionDate: new Date(),
});
```

### Order Confirmation Email

```typescript
import { sendOrderConfirmationEmail } from '@/lib/email-templates/order-confirmation';

// After order is created
const result = await sendOrderConfirmationEmail({
  to: 'customer@example.com',
  customerName: 'John Doe',
  orderId: 'ORD-12345',
  totalAmount: 150.00,
  giftCards: [
    {
      code: 'GIFT-ABC123',
      businessName: 'Restaurant ABC',
      amount: 100.00,
    },
    {
      code: 'GIFT-XYZ789',
      businessName: 'Coffee Shop XYZ',
      amount: 50.00,
    },
  ],
  orderDate: new Date(),
});
```

### Admin Notification Email

```typescript
import { sendAdminNotificationEmail } from '@/lib/email-templates/admin-notification';

// High value order alert
const result = await sendAdminNotificationEmail({
  to: 'admin@gifty.com',
  type: 'high-order',
  subject: '⚠️ High Value Order Alert',
  title: 'Order exceeds $500',
  message: `A high-value order of $${totalAmount} has been placed.`,
  details: {
    'Order ID': orderId,
    'Amount': `$${totalAmount}`,
    'Customer': customerName,
    'Items': '2 gift cards',
  },
  actionUrl: `https://admin.gifty.com/orders/${orderId}`,
  actionLabel: 'View Order',
  severity: 'warning',
});

// New application alert
await sendAdminNotificationEmail({
  to: 'admin@gifty.com',
  type: 'new-application',
  subject: '📱 New Business Application',
  title: 'New application received',
  message: `${businessName} has applied to join Gifty.`,
  details: {
    'Business Name': businessName,
    'Contact Email': businessEmail,
    'Applied At': new Date().toLocaleDateString(),
  },
  actionUrl: `https://admin.gifty.com/applications`,
  actionLabel: 'Review Application',
  severity: 'info',
});

// Payment failure alert
await sendAdminNotificationEmail({
  to: 'admin@gifty.com',
  type: 'payment-failure',
  subject: '🔴 Payment Processing Failed',
  title: 'Payment failure detected',
  message: `Payment processing failed for ${businessName}.`,
  details: {
    'Business': businessName,
    'Amount': `$${amount}`,
    'Error': paymentError,
  },
  actionUrl: `https://admin.gifty.com/payments`,
  actionLabel: 'View Payments',
  severity: 'error',
});
```

### Magic Link Email

```typescript
import { sendMagicLinkEmail } from '@/lib/email-templates/magic-link';

// In your magic link endpoint
const result = await sendMagicLinkEmail({
  to: email,
  email: email,
  businessName: 'Your Business',
  magicLink: `https://app.gifty.com/auth/login?token=${token}`,
  expiresInMinutes: 15,
});
```

### Password Reset Email

```typescript
import { sendPasswordResetEmail } from '@/lib/email-templates/password-reset';

// In your password reset request
const result = await sendPasswordResetEmail({
  to: email,
  email: email,
  businessName: 'Your Business',
  resetLink: `https://app.gifty.com/reset-password?token=${resetToken}`,
  expiresInHours: 1,
});
```

---

## 🔄 Using the Email Queue (with retries)

```typescript
import { enqueueEmail } from '@/lib/email-queue';

// Queue an email (will retry up to 5 times)
const result = await enqueueEmail({
  type: 'order-confirmation',
  to: 'customer@example.com',
  subject: 'Order Confirmed',
  data: {
    customerName: 'John Doe',
    orderId: 'ORD-12345',
    totalAmount: 150.00,
    giftCards: [...],
    orderDate: new Date(),
  },
});

if (result.success) {
  console.log(`📧 Email queued: ${result.jobId}`);
}

// Check job status
import { getEmailJobStatus } from '@/lib/email-queue';

const status = await getEmailJobStatus(result.jobId);
console.log(status);
// { found: true, state: 'completed', progress: 100, ... }
```

---

## 📍 Where to Add Email Triggers

### 1. Order Confirmation
**File**: `/app/api/orders/create/route.ts`
```typescript
// After order is successfully created
if (order.id) {
  await sendOrderConfirmationEmail({
    to: order.customer_email,
    customerName: order.customer_name,
    orderId: order.id,
    totalAmount: order.total_amount,
    giftCards: order.gift_cards, // should be array
    orderDate: new Date(order.created_at),
  });
}
```

### 2. Gift Card Redemption
**File**: `/admin-dashboard/app/api/owner/gift-cards/redeem/route.ts`
```typescript
// After successful redemption
if (redemption.success) {
  await sendGiftCardRedemptionEmail({
    to: redemption.customer_email,
    customerName: redemption.customer_name,
    businessName: redemption.business_name,
    giftCardCode: redemption.gift_card_code,
    redeemedAmount: redemption.amount,
    remainingBalance: redemption.remaining_balance,
    transactionId: redemption.transaction_id,
    redemptionDate: new Date(),
  });
}
```

### 3. Admin Notifications
**File**: `/app/api/orders/create/route.ts` or business approval endpoint
```typescript
// High value order
if (order.total_amount > 500) {
  await sendAdminNotificationEmail({
    to: 'admin@gifty.com',
    type: 'high-order',
    subject: `High Value Order: $${order.total_amount}`,
    title: 'High Value Order Alert',
    message: `Order for $${order.total_amount} from ${order.customer_name}`,
    details: {
      'Order ID': order.id,
      'Amount': `$${order.total_amount}`,
      'Customer': order.customer_name,
    },
    actionUrl: `${adminUrl}/orders/${order.id}`,
    actionLabel: 'View Order',
    severity: 'warning',
  });
}
```

---

## 🧪 Test Email Sending

### Test in Terminal
```bash
# Test magic link
curl -X POST http://localhost:3002/api/auth/request-magic-link \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com"}'

# Test business invite
curl -X POST http://localhost:3002/api/admin/send-invite \
  -H "Content-Type: application/json" \
  -d '{
    "email": "business@example.com",
    "invitedBy": "Admin Name"
  }'
```

### Test in Code
```typescript
// Create a test API route: /api/test/send-email
import { sendBusinessInvitationEmail } from '@/lib/email-templates/business-invitation';

export async function GET() {
  const result = await sendBusinessInvitationEmail({
    to: process.env.TEST_EMAIL || 'your-email@example.com',
    businessName: 'Test Business',
    businessEmail: 'test@example.com',
    invitedByAdmin: 'Test Admin',
    registrationLink: 'http://localhost:3001/register/test-token',
    registrationToken: 'test-token',
    expiresInDays: 7,
  });

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  });
}

// Then visit: http://localhost:3002/api/test/send-email
```

---

## 🔍 Check Queue Status

```typescript
import { getEmailQueueStatus } from '@/lib/email-queue';

// Get queue stats
const status = await getEmailQueueStatus();
console.log(status);
// {
//   available: true,
//   pending: 5,
//   active: 2,
//   completed: 100,
//   failed: 0,
//   delayed: 0
// }
```

---

## 🆘 Error Handling

```typescript
// Example with proper error handling
try {
  const result = await sendOrderConfirmationEmail(emailData);

  if (!result.success) {
    console.warn('Email failed:', result.error);
    // Log to monitoring service
    // Don't fail the operation - order is already created
  }
} catch (error) {
  console.error('Email error:', error);
  // Still don't fail - email is not critical to order creation
}
```

---

## 📝 Environment Variables Reference

| Variable | Example | Required |
|----------|---------|----------|
| `EMAIL_PROVIDER` | `resend` | Yes |
| `RESEND_API_KEY` | `re_...` | Yes (for Resend) |
| `EMAIL_DOMAIN` | `gifty.com` | No (has default) |
| `EMAIL_SUPPORT_DOMAIN` | `support.gifty.com` | No (has default) |
| `EMAIL_FROM_NAME` | `Gifty` | No (has default) |
| `REDIS_HOST` | `localhost` | No (default: localhost) |
| `REDIS_PORT` | `6379` | No (default: 6379) |

---

## 🎯 Common Scenarios

### Scenario 1: Customer Purchases Gift Cards
```typescript
// 1. Create order
const order = await createOrder({ ... });

// 2. Send confirmation email
if (order.success) {
  await sendOrderConfirmationEmail({
    to: order.customer_email,
    customerName: order.customer_name,
    orderId: order.id,
    totalAmount: order.total_amount,
    giftCards: order.gift_cards,
    orderDate: new Date(),
  });
}

// 3. (Optional) Send admin notification if high value
if (order.total_amount > 500) {
  await sendAdminNotificationEmail({
    to: 'admin@gifty.com',
    type: 'high-order',
    // ... rest of data
  });
}
```

### Scenario 2: Business Gets Invited
```typescript
// 1. Create invite in database
const invite = await createBusinessInvite({
  email: businessEmail,
  token: generateToken(),
  // ... other fields
});

// 2. Send invitation email
if (invite.success) {
  await sendBusinessInvitationEmail({
    to: businessEmail,
    businessName: businessName,
    // ... rest of data
  });
}
```

### Scenario 3: Customer Redeems Gift Card
```typescript
// 1. Process redemption
const redemption = await processRedemption({
  giftCardId: cardId,
  amount: amount,
  // ... other data
});

// 2. Send confirmation email
if (redemption.success) {
  await sendGiftCardRedemptionEmail({
    to: redemption.customer_email,
    // ... rest of data
  });
}

// 3. Send admin notification (optional)
if (redemption.amount > 200) {
  await sendAdminNotificationEmail({
    to: 'admin@gifty.com',
    type: 'high-order',
    // ... rest of data
  });
}
```

---

## 📞 Getting Help

1. Check `EMAIL_IMPLEMENTATION_GUIDE.md` for detailed setup
2. Check `EMAIL_SYSTEM_SUMMARY.md` for architecture overview
3. Look at template examples in `lib/email-templates/`
4. Check Resend docs: https://resend.com/docs

---

**Last Updated**: 2025-11-21
**Status**: Ready to Use ✅
