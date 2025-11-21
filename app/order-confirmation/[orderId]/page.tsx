'use client';

import Link from 'next/link';
import { use } from 'react';
import { useSearchParams } from 'next/navigation';

export default function OrderConfirmationPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

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
          <Link href="/products" className="text-sm font-light text-black">
            SHOP
          </Link>
        </div>
      </nav>

      {/* Confirmation Content */}
      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Success Message */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-6">✓</div>
          <h1 className="text-5xl font-light text-black mb-3 tracking-tight">Order Confirmed!</h1>
          <p className="text-lg text-gray-600 font-light mb-2">Thank you for your purchase</p>
          <p className="text-sm text-gray-500 font-light">Order ID: {orderId}</p>
        </div>

        {/* Email Confirmation */}
        {email && (
          <div className="mb-12 p-6 bg-blue-50 border border-blue-200 rounded">
            <p className="text-blue-800 text-sm font-light">
              A confirmation email with your gift card codes has been sent to <strong>{email}</strong>
            </p>
          </div>
        )}

        {/* Order Details Card */}
        <div className="border border-gray-200 p-8 mb-8">
          <h2 className="text-lg font-light text-black mb-6 uppercase tracking-widest">What's Next?</h2>
          <ul className="space-y-4 text-gray-700 font-light">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs">1</span>
              <span>Check your email for gift card codes and delivery instructions</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs">2</span>
              <span>Gift cards are instantly available for use or sharing</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs">3</span>
              <span>Recipients can redeem codes at participating businesses</span>
            </li>
          </ul>
        </div>

        {/* Security Note */}
        <div className="border border-gray-200 p-6 mb-12 bg-gray-50">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-gray-700 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-light text-gray-800 text-sm mb-1">Your gift cards are secure</p>
              <p className="text-xs text-gray-600 font-light">
                All transactions are protected with bank-level encryption. Your personal information is never shared.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href="/products"
            className="w-full bg-black text-white py-3 font-light tracking-wider uppercase text-sm hover:bg-gray-800 transition text-center block"
          >
            Continue Shopping
          </Link>
          <Link
            href="/"
            className="w-full bg-white border border-gray-200 text-black py-3 font-light tracking-wider uppercase text-sm hover:bg-gray-50 transition text-center block"
          >
            Back to Home
          </Link>
        </div>
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
                <li>
                  <Link href="/products" className="hover:text-black transition">
                    All Products
                  </Link>
                </li>
                <li>
                  <Link href="/products" className="hover:text-black transition">
                    New
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-light text-black uppercase tracking-widest mb-3">Support</h4>
              <ul className="space-y-2 text-xs text-gray-600 font-light">
                <li>
                  <a href="#" className="hover:text-black transition">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-black transition">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-light text-black uppercase tracking-widest mb-3">Legal</h4>
              <ul className="space-y-2 text-xs text-gray-600 font-light">
                <li>
                  <a href="#" className="hover:text-black transition">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-black transition">
                    Terms
                  </a>
                </li>
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
