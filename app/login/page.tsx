'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function LoginPage() {
  const [userType, setUserType] = useState<'admin' | 'business' | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // Redirect to the appropriate admin-dashboard login page
    // Admin-dashboard typically runs on port 3001 in development
    const adminDashboardUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001';

    if (userType === 'admin') {
      window.location.href = `${adminDashboardUrl}/login`;
    } else {
      window.location.href = `${adminDashboardUrl}/owner/login`;
    }
  };

  const handleBack = () => {
    setUserType(null);
  };

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
          <Link href="/products" className="text-sm font-light text-black hover:text-gray-600 transition">
            Back to Store
          </Link>
        </div>
      </nav>

      {/* Login Selection */}
      <div className="max-w-2xl mx-auto px-6 py-16">
        {!userType ? (
          <div className="text-center mb-12">
            <h1 className="text-5xl font-light text-black mb-3 tracking-tight">Login</h1>
            <p className="text-gray-600 font-light mb-12">Choose your account type</p>

            <div className="grid md:grid-cols-2 gap-6 max-w-xl mx-auto">
              {/* Admin Login */}
              <button
                onClick={() => setUserType('admin')}
                className="border border-gray-200 p-8 hover:border-black transition group"
              >
                <div className="text-4xl mb-4">👨‍💼</div>
                <h3 className="text-xl font-light text-black mb-2">Admin</h3>
                <p className="text-sm text-gray-600 font-light">Manage platform</p>
              </button>

              {/* Business Login */}
              <button
                onClick={() => setUserType('business')}
                className="border border-gray-200 p-8 hover:border-black transition group"
              >
                <div className="text-4xl mb-4">🏪</div>
                <h3 className="text-xl font-light text-black mb-2">Business Owner</h3>
                <p className="text-sm text-gray-600 font-light">Manage gift cards</p>
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-md mx-auto">
            <button
              onClick={handleBack}
              className="mb-6 flex items-center gap-2 text-black hover:text-gray-600 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            <div className="border border-gray-200 p-8">
              <h2 className="text-2xl font-light text-black mb-6 tracking-tight">
                {userType === 'admin' ? 'Admin Login' : 'Business Owner Login'}
              </h2>

              <form onSubmit={handleLogin}>
                <button
                  type="submit"
                  className="w-full bg-black text-white py-3 font-light tracking-wider uppercase text-sm hover:bg-gray-800 transition"
                >
                  Proceed to Login
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                <p className="text-sm text-gray-600 font-light mb-3">
                  {userType === 'admin' ? "Need administrative access?" : "Business owner login"}
                </p>
                <p className="text-xs text-gray-500">
                  You'll be redirected to the admin portal
                </p>
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
                <li>
                  <Link href="/products" className="hover:text-black transition">
                    All Products
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
