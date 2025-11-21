# Email Setup Guide

The storefront now sends order confirmation emails with gift card codes. Here's how to set it up.

## Option 1: Resend (Recommended for Development)

**Resend** is the easiest to set up for testing and has a generous free tier.

### Steps:

1. **Create account**: https://resend.com
2. **Get API Key**:
   - Go to Dashboard → API Keys
   - Create a new API key
3. **Add to .env.local**:
   ```
   EMAIL_PROVIDER=resend
   RESEND_API_KEY=re_xxxxxxxxxxxx
   EMAIL_FROM=orders@yourdomain.com
   ```
4. **Verify sender email** (for production):
   - Resend sandbox allows any email during development
   - For production, verify your domain at https://resend.com/domains

### Testing:
- Emails will be sent immediately when orders are created
- Check Resend dashboard for delivery status

---

## Option 2: SendGrid

**SendGrid** is great for production with excellent delivery rates.

### Steps:

1. **Create account**: https://sendgrid.com
2. **Get API Key**:
   - Go to Settings → API Keys
   - Create a new API Key with "Mail Send" permissions
3. **Add to .env.local**:
   ```
   EMAIL_PROVIDER=sendgrid
   SENDGRID_API_KEY=SG.xxxxxxxxxxxx
   EMAIL_FROM=orders@yourdomain.com
   ```
4. **Verify sender email**:
   - Go to Settings → Sender Authentication
   - Verify your sending domain or single sender

### Testing:
- Use SendGrid's Mail Send Test (built-in)
- Monitor deliverability in dashboard

---

## Option 3: SMTP (Self-Hosted)

For using your own mail server (Gmail, Mailgun, etc.), update the code in `lib/email-service.ts` to implement the SMTP provider.

### Coming Soon:
- Support for Nodemailer SMTP configuration
- Will allow custom SMTP servers

---

## Email Configuration Variables

Add these to your `.env.local`:

```bash
# Required
EMAIL_PROVIDER=resend                    # or "sendgrid"
EMAIL_FROM=orders@gifty.com             # Sender email address

# Provider-specific
RESEND_API_KEY=re_xxxxxxxxxxxx          # For Resend
SENDGRID_API_KEY=SG.xxxxxxxxxxxx        # For SendGrid
```

---

## Testing Emails Locally

### Quick Test:

1. Make sure `.env.local` is configured
2. Complete a test order in the checkout flow
3. Check your email inbox

### With Test Mode:

To test without actually sending emails, temporarily modify `lib/email-service.ts`:

```typescript
// At the top of sendOrderConfirmationEmail():
if (process.env.NODE_ENV !== 'production') {
  console.log('TEST MODE: Would send email to', data.email);
  console.log('Gift Cards:', data.giftCards);
  return { success: true };
}
```

---

## Email Template

The email includes:
- ✅ Order confirmation with ID
- ✅ All gift card codes in a table
- ✅ Business names and amounts
- ✅ Order total
- ✅ Usage instructions
- ✅ Professional branding

---

## Production Checklist

- [ ] Set up custom domain with email provider
- [ ] Verify sender email address
- [ ] Test email with real test orders
- [ ] Set up SPF/DKIM records (if using custom domain)
- [ ] Configure reply-to address
- [ ] Set up webhook for bounce/complaint handling
- [ ] Monitor email delivery metrics
- [ ] Update `EMAIL_FROM` to your branded domain

---

## Troubleshooting

### Email not sending?
1. Check `.env.local` has `EMAIL_PROVIDER` and API key
2. Check dev server console for errors
3. Verify API key is valid and active
4. Check provider's dashboard for delivery status

### Using wrong domain?
- Update `EMAIL_FROM` in `.env.local`
- Verify the domain is configured in your email provider

### Emails going to spam?
- Add SPF record: `v=spf1 include:sendgrid.net ~all` (for SendGrid)
- Add DKIM authentication
- Verify sender domain
- Check email provider's best practices

---

## Future Enhancements

- [ ] Custom email templates per business
- [ ] Resend email rendering in React
- [ ] Email preview on confirmation page
- [ ] Webhook-based retries for failed emails
- [ ] Email tracking and analytics
