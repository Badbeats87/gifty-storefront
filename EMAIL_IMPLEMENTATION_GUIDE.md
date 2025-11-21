# Email System Implementation Guide

**Date**: 2025-11-21
**Status**: Complete Implementation with Queue System

---

## 📋 Overview

This guide covers the complete email delivery system for the Gifty Storefront, including:
- ✅ Order confirmations
- ✅ Business invitations (FIXED)
- ✅ Gift card redemptions (NEW)
- ✅ Admin notifications (NEW)
- ✅ Magic links
- ✅ Password resets

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install bull redis nodemailer
```

### 2. Configure Email Environment

Create/update `.env.local`:

```bash
# Email Service Provider
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_your_api_key_here

# Domain Configuration (update when you have a domain)
EMAIL_DOMAIN=gifty.local
EMAIL_SUPPORT_DOMAIN=support.gifty.local
EMAIL_FROM_NAME=Gifty

# Redis Configuration (for email queue)
REDIS_HOST=localhost
REDIS_PORT=6379
# REDIS_PASSWORD=your_password (optional)
```

### 3. Set Up Redis (for email queue/retries)

**macOS:**
```bash
brew install redis
brew services start redis
```

**Docker:**
```bash
docker run -d -p 6379:6379 redis:latest
```

**No Redis?**
The system works without Redis - emails send directly without retry logic. Add Redis later for production reliability.

---

## 📁 File Structure

```
lib/
├── email-queue.ts                 # Bull queue setup & management
├── email-processor.ts             # Queue job processor
├── email-config.ts                # Configuration & environment variables
├── email-service.ts               # (Existing) Resend/SendGrid service
├── email-templates/
│   ├── business-invitation.ts     # Business invitation emails
│   ├── order-confirmation.ts      # Order confirmation emails
│   ├── gift-card-redemption.ts    # Redemption confirmation emails
│   ├── admin-notification.ts      # Admin system notifications
│   ├── magic-link.ts              # Magic link login emails
│   └── password-reset.ts          # Password reset emails
```

---

## 🔧 Implementation Details

### 1. Business Invitation Email (FIXED)

**File**: `admin-dashboard/app/api/admin/send-invite/route.ts`

**What Changed**:
- ✅ Now sends invitation email to invited business
- ✅ Includes registration link
- ✅ Professional HTML template with Gifty branding
- ✅ 7-day expiration message
- ✅ Error handling (invitation created even if email fails)

**How to Use**:
```typescript
const result = await sendBusinessInvitationEmail({
  to: 'business@example.com',
  businessName: 'Restaurant ABC',
  invitedByAdmin: 'Admin Name',
  registrationLink: 'https://app.gifty.com/register/token123',
  registrationToken: 'token123',
  expiresInDays: 7,
});
```

### 2. Gift Card Redemption Email (NEW)

**File**: `lib/email-templates/gift-card-redemption.ts`

**When Sent**:
- After successful gift card redemption
- Triggered from: `owner/gift-cards/redeem` endpoint

**Integration Example**:
```typescript
// In your redemption endpoint
await sendGiftCardRedemptionEmail({
  to: customerEmail,
  customerName: 'John Doe',
  businessName: 'Restaurant ABC',
  giftCardCode: 'GIFT-ABC123',
  redeemedAmount: 50.00,
  remainingBalance: 25.00,
  transactionId: 'txn-12345',
  redemptionDate: new Date(),
});
```

### 3. Admin Notifications (NEW)

**File**: `lib/email-templates/admin-notification.ts`

**Supported Notification Types**:
- `high-order`: High-value orders (configure threshold)
- `new-application`: New business applications
- `system-error`: System errors
- `payment-failure`: Payment failures

**Integration Example**:
```typescript
// Send admin notification
await sendAdminNotificationEmail({
  to: 'admin@gifty.com',
  type: 'high-order',
  subject: 'High Value Order Alert',
  title: 'Order exceeds $500',
  message: 'An order for $750 has been placed.',
  details: {
    'Order ID': 'ORD-12345',
    'Amount': '$750.00',
    'Customer': 'John Doe',
  },
  actionUrl: 'https://admin.gifty.com/orders/ORD-12345',
  actionLabel: 'View Order',
  severity: 'warning',
});
```

---

## 📧 Email Templates

All templates are responsive HTML with professional Gifty branding:

| Template | Color Scheme | Key Features |
|----------|--------------|--------------|
| Business Invitation | Purple Gradient | 7-day expiration, registration link |
| Order Confirmation | Pink Gradient | Gift card table, order details |
| Gift Card Redemption | Green Gradient | Balance tracking, transaction ID |
| Admin Notification | Dark Gray | Severity indicators, action buttons |
| Magic Link | Purple Gradient | 15-minute expiration, security notice |
| Password Reset | Orange Gradient | 1-hour expiration, password requirements |

---

## 🔄 Email Queue System (Bull + Redis)

### Why Use a Queue?

1. **Reliability**: Failed emails auto-retry up to 5 times
2. **Performance**: Email sending doesn't block your API
3. **Scalability**: Handle multiple emails concurrently
4. **Monitoring**: Track email delivery status

### How to Initialize Queue

**In your server startup code** (e.g., middleware or API route):

```typescript
import { initializeEmailQueue } from '@/lib/email-queue';

// Initialize on app start
await initializeEmailQueue();
```

### Using the Queue

```typescript
import { enqueueEmail } from '@/lib/email-queue';

// Option 1: Queue an email (with retries)
const result = await enqueueEmail({
  type: 'order-confirmation',
  to: 'customer@example.com',
  subject: 'Your Order Confirmed',
  data: {
    customerName: 'John',
    orderId: 'ORD-123',
    // ... other data
  },
});

// Option 2: Send immediately (no queue)
import { sendOrderConfirmationEmail } from '@/lib/email-templates/order-confirmation';
await sendOrderConfirmationEmail(data);
```

### Check Queue Status

```typescript
import { getEmailQueueStatus, getEmailJobStatus } from '@/lib/email-queue';

// Get overall queue stats
const status = await getEmailQueueStatus();
console.log(status);
// { available: true, pending: 5, active: 2, completed: 100, failed: 2, delayed: 0 }

// Check specific job
const jobStatus = await getEmailJobStatus('job-id-123');
console.log(jobStatus);
// { found: true, state: 'completed', progress: 100, ... }
```

---

## ⚙️ Configuration Options

### Email Provider Selection

```bash
# Use Resend (current)
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_...

# Use SendGrid (future)
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG...

# Use SMTP (future)
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
```

### Domain Configuration

```bash
# For development (will use test domain)
EMAIL_DOMAIN=localhost:3000
EMAIL_SUPPORT_DOMAIN=localhost:3000

# When you have a domain
EMAIL_DOMAIN=yourdomain.com
EMAIL_SUPPORT_DOMAIN=support.yourdomain.com
EMAIL_FROM=noreply@yourdomain.com
EMAIL_SUPPORT=support@yourdomain.com
```

### Redis Configuration

```bash
# Default (localhost)
REDIS_HOST=localhost
REDIS_PORT=6379

# Remote Redis (e.g., Redis Cloud)
REDIS_HOST=redis-cloud-instance.com
REDIS_PORT=12345
REDIS_PASSWORD=your-password
```

---

## 🛠️ Integration Checklist

### Step 1: Trigger Order Confirmation Email
- [ ] Update `/app/api/orders/create/route.ts` to use new template
- [ ] Test with test order

### Step 2: Trigger Redemption Confirmation Email
- [ ] Update `/owner/gift-cards/redeem` endpoint
- [ ] Add email trigger after successful redemption
- [ ] Test with test redemption

### Step 3: Add Admin Notifications
- [ ] Create admin email endpoint
- [ ] Trigger for high-value orders (>$500)
- [ ] Trigger for new applications
- [ ] Trigger for errors

### Step 4: Enable Email Queue (Production)
- [ ] Set up Redis
- [ ] Update `initializeEmailQueue()` call
- [ ] Monitor queue health

### Step 5: Set Up Custom Domain
- [ ] Register domain
- [ ] Add to EMAIL_DOMAIN config
- [ ] Configure DKIM/SPF with Resend
- [ ] Test email delivery
- [ ] Verify not going to spam

---

## 📊 Email Status Codes

| Status | Meaning |
|--------|---------|
| `pending` | Waiting to be processed |
| `active` | Currently being sent |
| `completed` | Sent successfully |
| `failed` | Failed after retries |
| `delayed` | Scheduled for later |

---

## 🧪 Testing Email Delivery

### Option 1: Development Mode (See Email in Logs)

```typescript
if (process.env.NODE_ENV === 'development') {
  console.log('📧 EMAIL WOULD BE SENT:');
  console.log('To:', data.to);
  console.log('Subject:', data.subject);
  console.log('Link:', data.magicLink);
}
```

### Option 2: Use Test Domain

Use `onboarding@resend.dev` emails and check Resend dashboard.

### Option 3: Test Email Template

```bash
# Create test file
curl -X POST http://localhost:3000/api/test/send-email \
  -H "Content-Type: application/json" \
  -d '{"to": "your-email@example.com", "type": "order-confirmation"}'
```

---

## 🚨 Troubleshooting

### Emails Not Sending

1. **Check API Key**: `RESEND_API_KEY` is set correctly
2. **Check Email Address**: Valid format
3. **Check CORS**: If using webhook callbacks
4. **Review Logs**: Check console for errors
5. **Resend Dashboard**: Check sending limits

### Emails Going to Spam

1. **Domain Issue**: Using `onboarding@resend.dev` (test domain)
   - **Solution**: Set up custom domain

2. **DKIM/SPF Not Configured**
   - **Solution**: Follow Resend DKIM setup

3. **Content Issues**: Template has spam triggers
   - **Solution**: Remove suspicious links, reduce images

### Queue Not Working

1. **Redis Not Running**
   - **Check**: `redis-cli ping` → should return PONG
   - **Start**: `brew services start redis`

2. **Wrong Redis Address**
   - **Check**: `REDIS_HOST` and `REDIS_PORT`
   - **Test**: `redis-cli -h $REDIS_HOST -p $REDIS_PORT ping`

3. **Wrong Redis Password**
   - **Check**: `REDIS_PASSWORD` matches your Redis instance

---

## 📈 Production Checklist

- [ ] Email provider account set up (Resend)
- [ ] Custom domain registered
- [ ] DKIM/SPF records configured
- [ ] Redis instance running (or cloud service)
- [ ] All email templates reviewed
- [ ] API keys in secure environment variables
- [ ] Email limits configured
- [ ] Monitoring/alerts set up
- [ ] Bounce handling implemented
- [ ] Unsubscribe option added (if needed)

---

## 🔮 Future Enhancements

1. **Email Analytics**
   - Track opens, clicks
   - Monitor delivery rates
   - A/B test templates

2. **Custom Email Templates**
   - Per-business branding
   - Template editor UI

3. **Webhook Handling**
   - Delivery confirmations
   - Bounce notifications
   - Complaint handling

4. **Advanced Scheduling**
   - Send emails at specific times
   - Batch sending
   - Scheduled broadcasts

5. **Email Personalization**
   - Dynamic content blocks
   - User preferences
   - Segmentation

---

## 📚 Additional Resources

- **Resend Docs**: https://resend.com/docs
- **Bull Queue Docs**: https://docs.bullmq.io/
- **Redis Docs**: https://redis.io/documentation
- **Email Best Practices**: https://resend.com/blog/

---

## ✅ Current Status

**Version**: 1.0
**Last Updated**: 2025-11-21
**Status**: Production Ready (with domain configuration)

---

## 📞 Support

For email-related questions or issues:
1. Check this guide
2. Review template examples in `/lib/email-templates/`
3. Check Resend dashboard for delivery status
4. Review server logs for errors
