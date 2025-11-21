'use client';

import Link from 'next/link';
import { useCart } from '@/lib/cart-context';

export default function CartPage() {
  const { items, removeItem, updateQuantity, itemCount, subtotal } = useCart();

  const shipping = 0;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-white font-bold text-sm">
              G
            </div>
            <span className="text-lg font-light tracking-wider text-black">GIFTY</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/products" className="text-sm font-light text-black">
              SHOP
            </Link>
            <Link href="/cart" className="relative text-gray-700 hover:text-black transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-light">
                  {itemCount}
                </span>
              )}
            </Link>
            <Link href="/login" className="text-sm font-light text-black hover:text-gray-600 transition">
              LOGIN
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-5xl font-light text-black mb-3 tracking-tight">Shopping Cart</h1>
          <p className="text-gray-600 font-light">{itemCount} item{itemCount !== 1 ? 's' : ''} in your cart</p>
        </div>
      </div>

      {/* Cart Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {items.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-light text-black mb-2">Your cart is empty</h2>
            <p className="text-gray-600 font-light mb-8">Add some gift cards to get started!</p>
            <Link href="/products" className="inline-block px-8 py-3 bg-black text-white text-sm font-light tracking-wider hover:bg-gray-800 transition uppercase">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="border border-gray-200 p-6"
                  >
                    <div className="flex gap-6">
                      {/* Item Image */}
                      <div className="flex-shrink-0">
                        <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center text-4xl">
                          {item.image}
                        </div>
                      </div>

                      {/* Item Details */}
                      <div className="flex-1">
                        <h3 className="text-lg font-light text-black">{item.name}</h3>
                        <p className="text-sm text-gray-600 font-light mt-1">Gift Card: ${item.price}</p>

                        {/* Quantity Selector */}
                        <div className="mt-4 flex items-center gap-3">
                          <span className="text-sm font-light text-gray-700">Qty:</span>
                          <div className="flex items-center gap-3 bg-gray-100 rounded p-1">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="px-3 py-1 text-gray-600 hover:text-black font-light"
                            >
                              −
                            </button>
                            <span className="px-4 py-1 text-black font-light">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="px-3 py-1 text-gray-600 hover:text-black font-light"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Price & Remove */}
                      <div className="flex flex-col items-end justify-between">
                        <div className="text-right">
                          <p className="text-lg font-light text-black">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500 font-light mt-1">${item.price} each</p>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-gray-600 hover:text-black font-light text-sm mt-4 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Continue Shopping */}
              <Link href="/products" className="inline-flex items-center gap-2 mt-8 text-black hover:text-gray-600 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm font-light">Continue Shopping</span>
              </Link>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="border border-gray-200 p-6 sticky top-24">
                <h2 className="text-lg font-light text-black mb-6 tracking-tight">Order Summary</h2>

                <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-light">Subtotal</span>
                    <span className="font-light text-black">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-light">Shipping</span>
                    <span className="font-light text-black">Free</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-light">Tax</span>
                    <span className="font-light text-black">${tax.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-between mb-8 pb-8 border-b border-gray-200">
                  <span className="font-light text-black">Total</span>
                  <span className="text-lg font-light text-black">
                    ${total.toFixed(2)}
                  </span>
                </div>

                <Link href="/checkout" className="w-full bg-black text-white py-3 font-light tracking-wider uppercase text-sm hover:bg-gray-800 transition text-center block mb-3">
                  Proceed to Checkout
                </Link>

                <Link href="/products" className="w-full bg-white border border-gray-200 text-black py-3 font-light tracking-wider uppercase text-sm hover:bg-gray-50 transition text-center block">
                  Continue Shopping
                </Link>

                {/* Order Info */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-start gap-3 text-xs text-gray-600 font-light">
                    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Instant digital delivery to your email</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12 mt-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-black rounded flex items-center justify-center text-white text-xs font-bold">
                  G
                </div>
                <span className="text-sm font-light tracking-wider text-black">GIFTY</span>
              </div>
              <p className="text-xs text-gray-600 font-light">Premium gift cards.</p>
            </div>
            <div>
              <h4 className="text-xs font-light text-black uppercase tracking-widest mb-3">Shop</h4>
              <ul className="space-y-2 text-xs text-gray-600 font-light">
                <li><Link href="/products" className="hover:text-black transition">All Products</Link></li>
                <li><Link href="/products" className="hover:text-black transition">New</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-light text-black uppercase tracking-widest mb-3">Support</h4>
              <ul className="space-y-2 text-xs text-gray-600 font-light">
                <li><a href="#" className="hover:text-black transition">Contact</a></li>
                <li><a href="#" className="hover:text-black transition">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-light text-black uppercase tracking-widest mb-3">Legal</h4>
              <ul className="space-y-2 text-xs text-gray-600 font-light">
                <li><a href="#" className="hover:text-black transition">Privacy</a></li>
                <li><a href="#" className="hover:text-black transition">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-8 text-center text-xs text-gray-600 font-light">
            <p>&copy; 2024 Gifty. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
