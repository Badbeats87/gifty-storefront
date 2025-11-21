# Gifty Storefront

A custom Next.js e-commerce storefront for the Gifty gift card platform.

## Project Structure

```
gifty-storefront/
├── app/
│   ├── page.tsx                 # Home page with hero and featured products
│   ├── products/
│   │   ├── page.tsx             # Products catalog
│   │   └── [id]/
│   │       └── page.tsx         # Individual product detail page
│   ├── cart/
│   │   └── page.tsx             # Shopping cart
│   └── checkout/
│       └── page.tsx             # Checkout page
├── lib/                          # Utilities and shared code
├── components/                   # Reusable React components
├── public/                       # Static assets
└── package.json
```

## Key Pages

- **Home** (`/`) - Hero section + featured products
- **Catalog** (`/products`) - Browse all gift cards
- **Product Detail** (`/products/[id]`) - Individual product page
- **Cart** (`/cart`) - Shopping cart
- **Checkout** (`/checkout`) - Payment and shipping

## TODO / Features to Build

### Immediate Priority
- [ ] Connect to Supabase for products/orders
- [ ] Implement shopping cart state (Context or Zustand)
- [ ] Integrate Stripe payment
- [ ] Order confirmation page
- [ ] Design matching (CSS styling to match Wix site)

### Backend Integration
- [ ] Fetch products from `wix_products` table (or equivalent)
- [ ] Create orders in Supabase `orders` table
- [ ] Trigger gift card creation after payment
- [ ] Email notifications

### Features
- [ ] Product filtering/search
- [ ] User accounts (optional)
- [ ] Order history
- [ ] Recommended products

## Development

```bash
npm install
npm run dev
```

Then open http://localhost:3000 in your browser.

## Design Notes

Currently using Tailwind CSS with a basic blue/white theme. Ready to be styled to match your Wix site design. Share the Wix URL or design specs and we'll update the styling.
