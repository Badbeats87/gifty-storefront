# Shopping Cart Integration Guide

This guide explains how to integrate the shopping cart state management into the storefront. The cart context is already created in `lib/cart-context.tsx`.

## Overview

The cart is implemented using React Context API with the following features:
- ✅ Add/remove items from cart
- ✅ Update quantities
- ✅ Automatic localStorage persistence
- ✅ Calculate totals and item count
- ✅ TypeScript support

## Step 1: Wrap App with CartProvider

Update `/Users/invision/gifty-storefront/app/layout.tsx` to wrap the app with CartProvider:

```tsx
import { CartProvider } from '@/lib/cart-context';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
```

## Step 2: Use Cart in Product Detail Page

Update `/Users/invision/gifty-storefront/app/products/[id]/page.tsx` to add items to cart:

```tsx
import { useCart } from '@/lib/cart-context';

export default function ProductDetail({ params }: { params: { id: string } }) {
  const { addItem } = useCart();

  // ... rest of component ...

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: priceMap[selectedAmount],
      quantity: 1,
      image: product.image || '🎁',
    });
    // Show success message
  };

  return (
    // ... replace the button with ...
    <button
      onClick={handleAddToCart}
      className="w-full bg-black text-white py-3 font-light tracking-wider uppercase text-sm hover:bg-gray-800 transition"
    >
      Add ${priceMap[selectedAmount]} to Cart
    </button>
  );
}
```

## Step 3: Update Cart Page to Use Real Data

Update `/Users/invision/gifty-storefront/app/cart/page.tsx`:

```tsx
import { useCart } from '@/lib/cart-context';

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal, itemCount } = useCart();

  // Replace hardcoded cartItems with: items
  // Replace removeItem button with: onClick={() => removeItem(item.id)}
  // Replace quantity buttons with:
  //   - onClick={() => updateQuantity(item.id, item.quantity - 1)}
  //   - onClick={() => updateQuantity(item.id, item.quantity + 1)}
  // Replace subtotal calculation with: subtotal

  // ... rest of component ...
}
```

## Step 4: Update Cart Icon in Navigation

Update all navigation bars to show real cart count:

```tsx
import { useCart } from '@/lib/cart-context';

// In your navigation component:
const { itemCount } = useCart();

// Replace hardcoded "0" with:
<span className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-light">
  {itemCount}
</span>
```

## Files to Update

1. **`app/layout.tsx`** - Wrap app with CartProvider (CRITICAL)
2. **`app/products/[id]/page.tsx`** - Add "Add to Cart" button functionality
3. **`app/cart/page.tsx`** - Replace hardcoded data with real cart items
4. **`app/products/page.tsx`** - Update cart icon count
5. **`app/checkout/page.tsx`** - Load cart items and calculate totals
6. **`app/page.tsx`** - Update cart icon count

## Available Cart Functions

```tsx
import { useCart } from '@/lib/cart-context';

// Inside a client component:
const {
  items,              // CartItem[] - all items in cart
  addItem,            // (item: CartItem) => void
  removeItem,         // (id: string) => void
  updateQuantity,     // (id: string, quantity: number) => void
  clearCart,          // () => void
  itemCount,          // number - total quantity of all items
  subtotal,           // number - total price
} = useCart();
```

## CartItem Interface

```tsx
interface CartItem {
  id: string;           // Product/business ID
  name: string;         // Product name
  price: number;        // Price per item
  quantity: number;     // Number of items
  image: string;        // Emoji or image URL
}
```

## Testing

1. Open a product detail page
2. Click "Add to Cart"
3. Check that cart icon shows count
4. Go to cart page and verify items appear
5. Refresh page - items should persist (localStorage)
6. Update quantities and remove items

## Troubleshooting

**Cart items disappear on refresh:**
- Make sure CartProvider is wrapping the app
- Check browser localStorage is enabled

**useCart hook error:**
- Ensure component uses 'use client' directive
- Ensure component is wrapped by CartProvider

**Items not updating:**
- Make sure you're calling useCart() inside a client component
- Check that the item ID matches when updating/removing
