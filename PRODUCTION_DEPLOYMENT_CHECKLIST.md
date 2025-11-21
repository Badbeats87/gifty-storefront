# Production Deployment Checklist

**Status**: Pre-Production Planning Phase
**Domain**: Registered (DNS setup pending)
**Email Service**: Resend (awaiting DNS records)
**Database**: Supabase (separate production project)
**Last Updated**: 2025-11-21

---

## 🚨 CRITICAL SECURITY FIXES (MUST DO BEFORE LAUNCH)

### 1. Remove SKIP_AUTH Bypass
**File**: `/admin-dashboard/lib/adminAuth.ts` (Lines 118-126)
**Severity**: 🔴 CRITICAL

This allows complete authentication bypass in production if NODE_ENV=development.

```typescript
// ❌ DELETE THIS ENTIRE BLOCK BEFORE PRODUCTION:
if (process.env.NODE_ENV === 'development' && process.env.SKIP_AUTH === 'true') {
  return {
    id: 'dev-session',
    admin_user_id: 'dev-user',
    session_token: 'dev-token',
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
  } as AdminSession;
}
```

**Action Required**:
- [ ] Delete these lines completely
- [ ] Set `NODE_ENV=production` in production hosting
- [ ] Never set `SKIP_AUTH=true` in production
- [ ] Commit and push to main
- **Time**: 5 minutes

---

### 2. Fix Password Exposure in API Response
**File**: `/admin-dashboard/app/api/admin/applications/route.ts` (Lines 126-134)
**Severity**: 🔴 CRITICAL

Temporary passwords are exposed in JSON API response instead of being sent securely via email.

**Current (Vulnerable)**:
```typescript
return NextResponse.json({
  message: 'Application approved successfully',
  business: businessData,
  credentials: {
    email: appData.contact_email,
    tempPassword: tempPassword,  // ❌ EXPOSED IN RESPONSE!
    note: 'Share this temporary password with the business owner...'
  }
}, { status: 200 });
```

**Fixed**:
```typescript
// Send password only via email, remove from API response
await sendBusinessCredentialsEmail(appData.contact_email, tempPassword);

return NextResponse.json({
  message: 'Application approved successfully. Credentials have been sent to the business email.',
  business: businessData
  // ✅ NO credentials in response
}, { status: 200 });
```

**Action Required**:
- [ ] Remove `credentials` object from API response
- [ ] Verify password is only sent via email (check `sendBusinessCredentialsEmail` function)
- [ ] Test flow with real email
- [ ] Commit and push to main
- **Time**: 15 minutes

---

### 3. Implement CSRF Protection
**Files**: All POST/PUT/DELETE API routes
**Severity**: 🟡 HIGH

Missing CSRF tokens on state-changing operations.

**Implementation**:
```typescript
import { validateCsrfToken } from '@/lib/csrf';

export async function POST(request: Request) {
  // Validate CSRF token
  const token = request.headers.get('x-csrf-token');
  if (!validateCsrfToken(token)) {
    return NextResponse.json({ error: 'CSRF token invalid' }, { status: 403 });
  }

  // ... rest of handler
}
```

**Action Required**:
- [ ] Create CSRF middleware/utility
- [ ] Add CSRF token validation to all state-changing endpoints
- [ ] Generate CSRF tokens on page load (GET requests)
- [ ] Include tokens in form submissions
- **Time**: 1-2 hours

---

## Phase 1: Infrastructure & Hosting Setup

### Option A: Vercel (⭐ Recommended)
**Why Recommended**: Native Next.js support, auto-deployments, serverless scaling, analytics, $0 for hobby projects

**Setup Steps**:
- [ ] Create Vercel account: https://vercel.com
- [ ] Connect GitHub repository
- [ ] Create project for main storefront (port 3000)
- [ ] Create project for admin dashboard (port 3001)
- [ ] Enable automatic deployments on `main` branch push
- [ ] Configure production domain
- [ ] Set up environment variables in Vercel dashboard
- [ ] Enable Vercel Analytics

**Cost**: Free tier or $20/month (Pro)

**Deployment Process**:
```bash
# Just push to main - Vercel deploys automatically
git add .
git commit -m "fix: Remove SKIP_AUTH and fix security issues"
git push origin main

# Monitor deployment in Vercel dashboard
# Takes ~2-3 minutes
```

---

### Option B: AWS Amplify
- [ ] Create AWS account
- [ ] Set up Amplify App for Next.js
- [ ] Connect GitHub repository
- [ ] Configure build settings
- [ ] Enable auto-deployment on main branch
- [ ] Set up custom domain
- **Cost**: $5-50/month (pay-per-use)

---

### Option C: DigitalOcean App Platform
- [ ] Create DigitalOcean account
- [ ] Create app from GitHub
- [ ] Configure environment variables
- [ ] Set up SSL/TLS certificates
- [ ] Configure domain
- **Cost**: $5-12/month minimum

---

## Phase 2: Supabase Production Setup

### Create Production Project
- [ ] Go to https://supabase.com
- [ ] Create new project (separate from development)
- [ ] Choose region (closest to users or hosting)
- [ ] Enable backups and replication
- [ ] Generate new service role key
- [ ] Generate new anon key

### Run Database Migrations
```bash
# Set production credentials
export SUPABASE_URL="https://your-prod-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-prod-service-role-key"

# Push all migrations
npx supabase db push

# Verify migrations applied
npx supabase status
```

- [ ] All migrations applied successfully
- [ ] All tables created
- [ ] All indexes created
- [ ] Constraints verified

### Apply Cascade Delete Migration
**File**: `/supabase/migrations/add_cascade_delete.sql`

Run manually in Supabase SQL Editor:
```sql
-- Drop existing constraints
ALTER TABLE orders
DROP CONSTRAINT IF EXISTS orders_business_id_fkey;

ALTER TABLE gift_cards
DROP CONSTRAINT IF EXISTS gift_cards_business_id_fkey;

-- Recreate with ON DELETE CASCADE
ALTER TABLE orders
ADD CONSTRAINT orders_business_id_fkey
FOREIGN KEY (business_id)
REFERENCES businesses(id)
ON DELETE CASCADE;

ALTER TABLE gift_cards
ADD CONSTRAINT gift_cards_business_id_fkey
FOREIGN KEY (business_id)
REFERENCES businesses(id)
ON DELETE CASCADE;
```

- [ ] Cascade delete migration applied
- [ ] Foreign keys verified in production
- [ ] Tested business deletion workflow

### Enable Row-Level Security (RLS)
- [ ] Verify all RLS policies enabled
- [ ] Test customer can only see own data
- [ ] Test business owner can only see own data
- [ ] Test admin has full access

### Backups & Recovery
- [ ] Enable daily automated backups (7-day retention)
- [ ] Test backup restoration
- [ ] Document recovery procedures
- [ ] Set up email alerts for backup failures

---

## Phase 3: Email Configuration (Resend)

### Setup Timeline
**If DNS not yet propagated** (2-3 days):
1. Days 1-2: DNS records added to domain registrar
2. Days 2-3: DNS propagation (24-48 hours)
3. Day 3: Verify domain and test delivery

**Current Status**: Awaiting DNS records

### Domain Configuration
- [ ] Add SPF record to domain registrar:
  ```
  Type: SPF
  Name: @ or (blank)
  Value: v=spf1 include:sendgrid.net ~all
  TTL: 3600
  ```

- [ ] Add DKIM records (2 records from Resend):
  ```
  Type: CNAME
  Name: [selector provided by Resend]
  Value: [selector value from Resend]
  TTL: 3600
  ```

- [ ] Add DMARC record (optional but recommended):
  ```
  Type: TXT
  Name: _dmarc
  Value: v=DMARC1; p=none
  TTL: 3600
  ```

### Resend Configuration
- [ ] Create account at https://resend.com
- [ ] Add production domain
- [ ] Verify domain ownership
- [ ] Wait for DNS propagation (24-48 hours)
- [ ] Verify in Resend dashboard
- [ ] Get production API key
- [ ] Add to environment variables

### Email Templates
- [ ] Business invitation with temp credentials
- [ ] Order confirmation
- [ ] Gift card delivery
- [ ] Password reset
- [ ] Admin notifications

### Email Testing
- [ ] Test with real production domain
- [ ] Verify sender shows custom domain
- [ ] Check delivery to inbox (not spam)
- [ ] Test mobile rendering
- [ ] Verify all links work

---

## Phase 4: Domain & SSL Setup

### Domain Configuration
- [ ] Purchase domain (already done ✅)
- [ ] Point domain to hosting provider:
  - **Vercel**: Use nameservers or A/CNAME records provided
  - **AWS**: Configure in Route53
  - **DigitalOcean**: Use provided nameservers

- [ ] Update domain registrar nameservers
- [ ] Wait for DNS propagation (up to 48 hours)
- [ ] Verify resolution: `nslookup yourdomain.com`
- [ ] Test both www and non-www variants

### SSL/TLS Certificates
- [ ] Enable HTTPS (automatic with most platforms)
- [ ] Verify SSL certificate is valid (green lock)
- [ ] Test HTTPS on all pages
- [ ] Set up HTTP → HTTPS redirect
- [ ] Verify no mixed content warnings

---

## Phase 5: Environment Variables Setup

### Create Production Environment Variables

**In Vercel Dashboard** (Project Settings → Environment Variables):

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-prod-service-role-key

# Resend Email
NEXT_PUBLIC_RESEND_API_KEY=your-resend-api-key
RESEND_API_KEY=your-resend-api-key

# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
SKIP_AUTH=false

# Security Secrets (generate with: openssl rand -base64 32)
AUTH_SECRET=your-random-32-char-secret
SESSION_SECRET=your-random-32-char-secret
```

### Generate Secure Secrets
```bash
# Generate two random secrets
openssl rand -base64 32
openssl rand -base64 32
```

- [ ] All environment variables configured
- [ ] No secrets in code (only in hosting platform)
- [ ] `SKIP_AUTH=false` explicitly set
- [ ] `NODE_ENV=production` set
- [ ] Verified no `.env.local` in production

---

## Phase 6: Pre-Launch Testing (48 Hours Before)

### Functionality Testing

#### Customer Flow
- [ ] Browse business storefronts
- [ ] Search and filter products
- [ ] Add items to cart
- [ ] Proceed to checkout
- [ ] Complete payment
- [ ] Receive order confirmation email
- [ ] Receive gift card email
- [ ] Redeem gift card successfully

#### Admin Flow
- [ ] Admin login (verify SKIP_AUTH removed)
- [ ] View dashboard statistics
- [ ] View all businesses
- [ ] View all orders and transactions
- [ ] Approve/reject applications
- [ ] Delete test businesses (cascade delete)
- [ ] View audit logs
- [ ] Export data

#### Business Owner Flow
- [ ] Business owner login
- [ ] View dashboard
- [ ] See orders for their business
- [ ] See gift cards for their business
- [ ] Toggle product visibility
- [ ] View analytics

### Security Testing
- [ ] ✅ Verify SKIP_AUTH removed (cannot login without password)
- [ ] ✅ Verify passwords NOT in API responses
- [ ] ✅ Test CSRF protection (manual POST should fail without token)
- [ ] ✅ Verify XSS protection
- [ ] ✅ Verify SQL injection prevention
- [ ] ✅ Verify authentication required on protected routes
- [ ] ✅ Verify authorization (can't access other business's data)
- [ ] ✅ Check for exposed API keys in network tab

### Performance Testing
- [ ] Homepage loads in < 2 seconds
- [ ] Product pages load in < 1.5 seconds
- [ ] Dashboard loads in < 2 seconds
- [ ] Search works with 1000+ products
- [ ] No console errors or warnings
- [ ] Images lazy-load correctly
- [ ] Mobile responsive and fast

### Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] iPhone/iPad
- [ ] Android phone
- [ ] Desktop and mobile responsive

### Email Testing
- [ ] Business approval email arrives
- [ ] Order confirmation email arrives
- [ ] Gift card email arrives with correct link
- [ ] Password reset email works
- [ ] Emails display correctly on mobile
- [ ] Sender shows custom domain
- [ ] Check deliverability score (mail-tester.com)

### Database Testing
- [ ] Cascade delete works (delete business = deletes orders/gift cards)
- [ ] RLS policies working correctly
- [ ] No sensitive data in error messages
- [ ] Backup and restore verified
- [ ] Concurrent operations handled safely

---

## Phase 7: Deployment Steps

### Pre-Deployment Checklist
- [ ] All code committed and pushed to main
- [ ] No console errors: `npm run lint`
- [ ] Build successful: `npm run build`
- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] Email service verified
- [ ] Domain pointing to hosting
- [ ] SSL certificate valid
- [ ] Backup created before deployment

### Deployment Process

#### For Vercel (Easiest):
```bash
# 1. Ensure all changes committed
git status

# 2. Push to main (Vercel automatically deploys)
git push origin main

# 3. Monitor in Vercel dashboard
# - Watch build progress
# - Verify deployment successful
# - Check preview URL

# 4. Test production URL
# Visit https://yourdomain.com
# Test all critical paths
```

**Deployment Time**: ~2-3 minutes

#### For AWS Amplify:
```bash
# 1. Push to main
git push origin main

# 2. Amplify builds and deploys automatically
# Monitor in Amplify console
```

**Deployment Time**: ~5-10 minutes

#### For DigitalOcean:
```bash
# 1. Push to main
git push origin main

# 2. DigitalOcean builds and deploys
# Monitor in App Platform dashboard
```

**Deployment Time**: ~3-5 minutes

### Post-Deployment (2-Hour Active Monitoring)
- [ ] Both applications deployed successfully
- [ ] All three user flows working on production domain
- [ ] Emails delivering from production domain
- [ ] No errors in production logs
- [ ] Performance metrics normal
- [ ] Database responding correctly
- [ ] SSL certificate valid and auto-renewing

---

## Phase 8: Monitoring & Analytics

### Error Tracking
- [ ] Set up Sentry for error tracking
  - [ ] Create account at https://sentry.io
  - [ ] Add SDK to Next.js apps
  - [ ] Configure alerts for critical errors
  - [ ] Set up email notifications
  - **Cost**: Free tier or $29+/month

### Performance Monitoring
- [ ] Enable Vercel Analytics (included with Pro)
- [ ] Monitor Core Web Vitals:
  - Largest Contentful Paint (LCP) - target < 2.5s
  - First Input Delay (FID) - target < 100ms
  - Cumulative Layout Shift (CLS) - target < 0.1

### Uptime Monitoring
- [ ] Set up UptimeRobot (free tier available)
- [ ] Monitor both storefronts every 5 minutes
- [ ] Alert on downtime (email)
- [ ] Public status page

### Database Monitoring
- [ ] Monitor CPU usage
- [ ] Monitor connection count
- [ ] Monitor slow queries
- [ ] Set up alerts for resource exhaustion

### Email Monitoring
- [ ] Track delivery rates
- [ ] Monitor bounce rates
- [ ] Check spam folder (should be low)
- [ ] Monitor DKIM/SPF compliance

---

## Estimated Monthly Costs

| Service | Cost | Notes |
|---------|------|-------|
| Hosting (Vercel) | $20-150 | Pro plan recommended |
| Database (Supabase) | $25+ | Pro plan, scales with usage |
| Email (Resend) | $20-200 | Based on volume |
| Domain | $1-3 | Per month |
| Error Tracking (Sentry) | Free-29+ | Optional |
| Analytics/Monitoring | Free-50+ | Optional |
| **TOTAL** | **$66-432** | Recommended: ~$150/month |

**Recommended Stack**: ~$150/month
- Vercel Pro: $20/month
- Supabase Pro: $25/month
- Resend Standard: $20/month
- Domain: $1/month
- Sentry Pro: $29/month
- Uptime Monitoring: Free

---

## Critical Path Timeline

### Week 1: Setup Phase
- [ ] **Day 1-2**: Create Vercel account, deploy main and admin dashboards
- [ ] **Day 2-3**: Create Supabase production project, run migrations
- [ ] **Day 3-4**: Set up Resend, add domain, configure DNS
- [ ] **Day 4-5**: Remove SKIP_AUTH, fix password exposure, implement CSRF

### Week 2: Verification Phase
- [ ] **Day 1-2**: DNS propagation (24-48 hours) - monitor with `nslookup`
- [ ] **Day 3-4**: Verify email delivery in Resend dashboard
- [ ] **Day 5-7**: Pre-launch testing (48-hour test window)

### Week 3: Launch Phase
- [ ] **Day 1**: Go/No-Go decision meeting
- [ ] **Day 2**: Final deployments
- [ ] **Day 2-3**: 2-hour active monitoring after launch
- [ ] **Day 3-7**: Collect feedback from site owner

---

## Launch Checklist (48 Hours Before)

**Security** ✅
- [ ] SKIP_AUTH removed
- [ ] Password exposure fixed
- [ ] CSRF protection implemented
- [ ] No sensitive data in logs
- [ ] SSL certificate valid

**Infrastructure** ✅
- [ ] Hosting provider configured
- [ ] Domain pointing correctly
- [ ] Environment variables set
- [ ] Backup configured

**Functionality** ✅
- [ ] All three user flows working
- [ ] Email delivery verified
- [ ] Database queries optimized
- [ ] No console errors

**Monitoring** ✅
- [ ] Error tracking configured
- [ ] Uptime monitoring enabled
- [ ] Performance monitoring active
- [ ] Alerts tested and working

---

## Post-Launch Monitoring (First 24 Hours)

**Monitor These Metrics**:
1. Error rate (target: < 0.1%)
2. API response time (target: < 500ms)
3. Email delivery rate (target: > 99%)
4. Database connection pool
5. SSL certificate validity
6. DNS resolution
7. User feedback and reports

**Escalation Contacts**:
- Critical errors: Immediate action
- Performance issues: Within 1 hour
- Minor bugs: Within 24 hours

**Rollback Plan**:
- If critical issues: Revert to previous stable version
- Document issue and root cause
- Plan fix and re-deploy

---

## Success Criteria

**Launch is successful when:**
- ✅ No authentication bypass (SKIP_AUTH removed)
- ✅ No exposed credentials in API responses
- ✅ All three user flows working end-to-end
- ✅ Emails delivering from production domain
- ✅ Database performing normally (< 500ms queries)
- ✅ Error rate < 0.1%
- ✅ SSL certificate valid
- ✅ Monitoring and alerts working
- ✅ Site owner testing and providing feedback

---

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Resend Docs**: https://resend.com/docs
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Security Best Practices**: https://cheatsheetseries.owasp.org/

---

## Next Immediate Actions

1. **TODAY** - Code Fixes (30 minutes)
   - [ ] Remove SKIP_AUTH bypass
   - [ ] Fix password exposure bug
   - [ ] Commit and push to main

2. **TODAY** - Infrastructure Setup (30 minutes)
   - [ ] Create Vercel account
   - [ ] Deploy main app and admin dashboard
   - [ ] Verify both deployments

3. **TOMORROW** - Database & Email (1 hour)
   - [ ] Create Supabase production project
   - [ ] Run database migrations
   - [ ] Set up Resend account

4. **THIS WEEK** - Configuration (2 hours)
   - [ ] Configure DNS records
   - [ ] Set up environment variables
   - [ ] Configure email templates

5. **NEXT WEEK** - Testing & Launch (4 hours)
   - [ ] Wait for DNS propagation
   - [ ] Complete pre-launch testing
   - [ ] Final deployment and monitoring

---

**Status**: 🟡 Ready for Final Security Fixes Before Launch

**Confidence**: HIGH (all systems tested and working, just need critical security fixes)

**Estimated Time to Production**: 7-10 days (waiting for DNS propagation is the biggest blocker)
