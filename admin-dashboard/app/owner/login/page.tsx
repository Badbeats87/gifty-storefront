'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (data.code === 'PASSWORD_NOT_SET') {
          setError('Password not set. Please use the "Forgot Password" link to set up your password.');
        } else if (response.status === 423) {
          setError(data.message || 'Account temporarily locked');
        } else {
          setError(data.message || data.error || 'Invalid email or password');
        }
        return;
      }

      // Successful login - redirect to business dashboard with businessId
      if (data.user && data.user.businessId) {
        router.push(`/owner/${data.user.businessId}/dashboard`);
        router.refresh();
      } else {
        setError('Could not determine your business. Please contact support.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError('Failed to log in. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-white font-bold text-sm">
              G
            </div>
            <span className="text-lg font-light tracking-wider text-black">GIFTY</span>
          </div>
          <h1 className="text-4xl font-light text-black mb-3 tracking-tight">
            Business Login
          </h1>
          <p className="text-sm text-gray-600 font-light">
            Sign in to manage your gift cards
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-6 mb-8">
          <div>
            <label htmlFor="email" className="block text-xs font-light text-black uppercase tracking-widest mb-3">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              autoComplete="email"
              className="w-full px-4 py-3 border border-gray-200 bg-white text-black placeholder-gray-400 font-light focus:outline-none focus:border-black transition-colors"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-light text-black uppercase tracking-widest mb-3">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                autoComplete="current-password"
                className="w-full px-4 py-3 border border-gray-200 bg-white text-black placeholder-gray-400 font-light focus:outline-none focus:border-black transition-colors pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <Link
              href="/owner/forgot-password"
              className="text-xs font-light text-gray-600 hover:text-black transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-black text-white text-sm font-light tracking-wider uppercase hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-light rounded flex items-start gap-3">
            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* Help Text */}
        <div className="border-t border-gray-200 pt-6 text-center">
          <p className="text-xs text-gray-600 font-light">
            Don't have access? Contact support to set up your business account.
          </p>
        </div>
      </div>
    </div>
  );
}
