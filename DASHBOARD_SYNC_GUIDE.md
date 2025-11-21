# Dashboard Consolidation & Sync Guide

**Last Updated:** November 21, 2025
**Status:** ✅ Synced and documented

## Overview

The `gifty-storefront` and `admin-dashboard` are both part of the same Supabase backend but serve different purposes:

- **Admin Dashboard** - Internal tool for managing businesses, gift cards, and orders (elevated access)
- **Storefront** - Public e-commerce interface for customers to browse and purchase gift cards

Both repos have a copy of `admin-dashboard/` to keep them independent and allow separate deployment.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Supabase Backend                            │
│                (kppdvozuesiycwdacqgf)                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Database Schema:                                           │ │
│  │ - businesses, business_applications, business_invites     │ │
│  │ - gift_cards, customers, transactions, admin_sessions     │ │
│  │                                                            │ │
│  │ Edge Functions:                                            │ │
│  │ - approve-business-application (Wix product creation)    │ │
│  │ - issue-gift-card, redeem-gift-card, validate-gift-card   │ │
│  │ - payment-webhook, send-business-invite, etc.             │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────┬────────────────────────────────┬────────────────┘
                 │                                │
    ┌────────────▼─────────────┐   ┌─────────────▼──────────────┐
    │  Admin Dashboard         │   │  Customer Storefront       │
    │ (gifty-storefront repo)  │   │ (gifty-storefront repo)    │
    │                          │   │                            │
    │ admin-dashboard/         │   │ app/                       │
    │  ├─ Query Functions ✅    │   │  ├─ pages/ (products)      │
    │  ├─ Auth (Server-only) ✅│   │  ├─ cart/                  │
    │  └─ Pages (Server) ✅    │   │  ├─ checkout/              │
    │                          │   │  └─ orders/                │
    │ Uses: Service Role Key   │   │                            │
    │ (Server-side only) ✅    │   │ Uses: Anon Key             │
    └──────────────────────────┘   │ (Client-side) ✅           │
                                   └────────────────────────────┘
```

---

## What's Synced

### ✅ Database Types (`database.types.ts`)
- **Location:** Both `admin-dashboard/lib/` and root `lib/`
- **Status:** Synchronized (Nov 21, 2025)
- **Content:** Complete Supabase-generated TypeScript types for all tables
- **Sync Method:** Auto-copied from admin-dashboard to storefront root

**Why:** Ensures type safety across both projects. Must match Supabase schema exactly.

### ✅ Supabase Configuration
- **Project URL:** `kppdvozuesiycwdacqgf.supabase.co` (both use same)
- **Admin Dashboard:** Uses `supabaseAdmin.ts` (server-only, service role key)
- **Storefront:** Uses `lib/supabase.ts` (client anon key)
- **Status:** Properly configured with correct permission levels

### ✅ Admin Dashboard Code
- **Location:** `/admin-dashboard` folder in both repos
- **Status:** Identical in both projects
- **Note:** Kept as copies intentionally for deployment independence

### ✅ Query Functions
- **Admin Dashboard:** `admin-dashboard/lib/queries/`
  - `businesses.ts` - Business CRUD operations
  - `giftCards.ts` - Gift card queries (admin view)
  - `transactions.ts` - Transaction history
- **Storefront:** Uses direct Supabase queries via client anon key
  - `lib/products.ts` - Fetches active businesses as products
  - No server-only queries needed (public catalog)

---

## Integration Points

### 1. Product Catalog (Storefront → Backend)
```
Customer Views Products
        ↓
app/products/page.tsx fetches from businesses table (via lib/supabase.ts, anon key)
        ↓
Displays as "Products" with emoji icons
```

### 2. Gift Card Purchase (Storefront)
```
Customer Adds to Cart → Checkout → Payment
        ↓
[TODO] Integrate Stripe payment (other dev working on this)
        ↓
[TODO] Call backend edge function: payment-webhook
        ↓
Backend creates gift_card entry + sends email
```

### 3. Business Management (Admin Dashboard)
```
Admin Reviews Applications
        ↓
admin-dashboard queries via getServiceSupabase() (service role)
        ↓
Admin approves → Calls edge function: approve-business-application
        ↓
Backend creates Wix products automatically
```

---

## Files That Must Stay In Sync

| File | Location | Purpose | Sync Method |
|------|----------|---------|-------------|
| `database.types.ts` | Both `admin-dashboard/lib/` and root `lib/` | TypeScript types | Manual copy when Supabase schema changes |
| `admin-dashboard/` | Both repos | Admin interface | Keep identical (separate deployments) |

---

## Development Workflow

### When Making Changes

**In Admin Dashboard:**
1. Make changes in `/admin-dashboard/`
2. Both repos use the same code (intentional duplication)
3. Update `database.types.ts` if database schema changes

**In Storefront:**
1. Changes to `app/` pages are independent
2. Don't modify `admin-dashboard/` unless fixing bugs that affect both
3. Keep `lib/` files in sync with admin-dashboard versions

### When Supabase Schema Changes

1. Regenerate types in Supabase dashboard
2. Update `admin-dashboard/lib/database.types.ts`
3. Copy to root `lib/database.types.ts`:
   ```bash
   cp admin-dashboard/lib/database.types.ts lib/database.types.ts
   ```

### Syncing Checklist

- [ ] Database types regenerated from Supabase
- [ ] `database.types.ts` copied to both locations
- [ ] Admin dashboard code is identical in both repos
- [ ] Environment variables match (same Supabase project)
- [ ] Tests pass in both repos

---

## Security Notes

### Admin Dashboard
- ✅ Uses server-only Supabase client (`supabaseAdmin.ts`)
- ✅ Service role key never exposed to client
- ✅ All pages check authentication before rendering
- ⚠️ Exception: Register page is public (client component, anon key only)

### Storefront
- ✅ Uses public anon key (safe for client)
- ✅ Row-level security (RLS) protects sensitive data
- ⚠️ Payment webhook needs to be secured with signature verification

---

## Troubleshooting

### Types Mismatch Error
```
Property 'X' does not exist on type 'Business'
```
**Solution:** Sync `database.types.ts` files:
```bash
cp admin-dashboard/lib/database.types.ts lib/database.types.ts
```

### Supabase Connection Issues
- Verify `.env.local` has correct `NEXT_PUBLIC_SUPABASE_URL`
- Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set
- Admin dashboard needs `SUPABASE_SERVICE_ROLE_KEY` (not NEXT_PUBLIC)

### Admin Dashboard Changes Not in Storefront
- Check if both copies are truly identical
- Run diff to see what differs:
  ```bash
  diff -r gifty-storefront/admin-dashboard GiftyV2/admin-dashboard
  ```

---

## Next Steps (Cart Integration)

Another dev is currently implementing:
- [ ] Cart context integration (lib/cart-context.tsx)
- [ ] Add to cart buttons
- [ ] Cart page functionality
- [ ] Checkout page integration

**Do not modify these files until cart work is complete:**
- `app/layout.tsx`
- `app/products/[id]/page.tsx`
- `app/cart/page.tsx`
- `app/checkout/page.tsx`

---

## References

- [Supabase Dashboard](https://supabase.com/dashboard/project/kppdvozuesiycwdacqgf)
- GiftyV2/CURRENT_WORK_STATUS.md - Admin dashboard development status
- GiftyV2/gifty-backend/ - Backend edge functions and migrations
