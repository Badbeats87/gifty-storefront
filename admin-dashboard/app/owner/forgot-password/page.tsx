'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [devLink, setDevLink] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    setDevLink('');

    try {
      const response = await fetch('/api/auth/reset-password/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset link');
      }

      setSuccess(true);
      setDevLink(data.resetLink || '');
      setEmail('');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link. Please try again.');
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
            Reset Password
          </h1>
          <p className="text-sm text-gray-600 font-light">
            Enter your email and we'll send you a link to reset your password
          </p>
        </div>

        {!success ? (
          <>
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6 mb-8">
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

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-black text-white text-sm font-light tracking-wider uppercase hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
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
          </>
        ) : (
          <>
            {/* Success Message */}
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-green-800 font-light mb-1">Check your email!</h3>
                  <p className="text-gray-800 text-sm font-light">
                    If an account exists with this email, you will receive a password reset link shortly.
                  </p>
                  {devLink && (
                    <div className="mt-3 p-3 bg-white rounded border border-green-300">
                      <p className="text-xs text-green-800 font-light mb-1">Development link:</p>
                      <a href={devLink} className="text-xs text-green-600 underline break-all hover:text-green-800 font-light">
                        {devLink}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3 text-sm text-gray-600 font-light">
              <p className="flex items-start gap-2">
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>The link will expire in 1 hour</span>
              </p>
              <p className="flex items-start gap-2">
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Check your spam folder if you don't see the email</span>
              </p>
            </div>

            <button
              onClick={() => setSuccess(false)}
              className="w-full mt-6 px-6 py-3 bg-gray-100 text-black font-light hover:bg-gray-200 transition-colors"
            >
              Send Another Link
            </button>
          </>
        )}

        {/* Back to Login */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <Link
            href="/owner/login"
            className="text-sm font-light text-black hover:text-gray-600 transition-colors inline-flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
