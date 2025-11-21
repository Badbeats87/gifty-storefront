'use client';

import Link from 'next/link';
import { useCart } from '@/lib/cart-context';

export default function HomePage() {
  const { itemCount } = useCart();
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
            <Link href="/products" className="text-sm font-light text-gray-700 hover:text-black transition">
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
            <Link href="/login" className="text-sm font-light text-gray-700 hover:text-black transition">
              LOGIN
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen bg-gray-50 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <div className="text-9xl font-light text-gray-300">🎁</div>
        </div>

        <div className="relative text-center max-w-2xl mx-auto px-6 z-10">
          <h1 className="text-6xl md:text-7xl font-light text-black mb-6 tracking-tight">
            The Perfect Gift
          </h1>
          <p className="text-lg text-gray-600 mb-12 font-light leading-relaxed">
            Discover premium gift cards from your favorite brands. Instant delivery, zero hassle.
          </p>
          <Link
            href="/products"
            className="inline-block px-8 py-3 bg-black text-white text-sm font-light tracking-wider hover:bg-gray-800 transition"
          >
            EXPLORE GIFTS
          </Link>
        </div>
      </section>

      {/* Featured Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-light text-black mb-16 tracking-tight">Featured Collections</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Dining', icon: '🍽️' },
              { name: 'Wellness', icon: '🧘' },
              { name: 'Shopping', icon: '🛍️' },
            ].map((category, i) => (
              <Link
                key={i}
                href="/products"
                className="group"
              >
                <div className="relative h-80 bg-gray-100 rounded overflow-hidden mb-4">
                  <div className="absolute inset-0 flex items-center justify-center text-7xl group-hover:scale-110 transition-transform duration-300">
                    {category.icon}
                  </div>
                </div>
                <h3 className="text-xl font-light text-black group-hover:text-gray-600 transition">
                  {category.name}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <div className="w-12 h-12 rounded-full border border-black flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-light text-black mb-3">Instant Delivery</h3>
              <p className="text-sm text-gray-600 font-light">Gift cards sent immediately via email</p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-full border border-black flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-light text-black mb-3">Secure Payment</h3>
              <p className="text-sm text-gray-600 font-light">Bank-level encryption for all orders</p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-full border border-black flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-light text-black mb-3">Support</h3>
              <p className="text-sm text-gray-600 font-light">24/7 customer service available</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-black text-white">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-5xl md:text-6xl font-light mb-6 tracking-tight">
            Ready to Give?
          </h2>
          <p className="text-lg text-gray-300 mb-12 font-light">
            Browse our collection and send the perfect gift today.
          </p>
          <Link
            href="/products"
            className="inline-block px-8 py-3 bg-white text-black text-sm font-light tracking-wider hover:bg-gray-100 transition"
          >
            SHOP NOW
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-black rounded flex items-center justify-center text-white text-xs font-bold">
                  G
                </div>
                <span className="text-sm font-light tracking-wider text-black">GIFTY</span>
              </div>
              <p className="text-xs text-gray-600 font-light">Premium gift cards for everyone.</p>
            </div>
            <div>
              <h4 className="text-xs font-light text-black uppercase tracking-widest mb-4">Shop</h4>
              <ul className="space-y-2 text-xs text-gray-600 font-light">
                <li><Link href="/products" className="hover:text-black transition">All Products</Link></li>
                <li><Link href="/products" className="hover:text-black transition">New Arrivals</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-light text-black uppercase tracking-widest mb-4">Support</h4>
              <ul className="space-y-2 text-xs text-gray-600 font-light">
                <li><a href="#" className="hover:text-black transition">Contact</a></li>
                <li><a href="#" className="hover:text-black transition">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-light text-black uppercase tracking-widest mb-4">Legal</h4>
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
