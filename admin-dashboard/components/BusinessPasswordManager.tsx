'use client';

import { useState } from 'react';

interface BusinessPasswordManagerProps {
  businessId: string;
  businessName: string;
  contactEmail: string;
}

export default function BusinessPasswordManager({
  businessId,
  businessName,
  contactEmail,
}: BusinessPasswordManagerProps) {
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateNewPassword = async () => {
    setLoading(true);
    setNewPassword('');
    setCopied(false);

    try {
      const response = await fetch('/api/admin/business-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: contactEmail,
          businessId: businessId,
          action: 'reset_password'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate password');
      }

      const data = await response.json();
      setNewPassword(data.tempPassword);
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(newPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-gray-200 p-6">
      <h3 className="text-lg font-light text-black mb-4">Login Credentials Management</h3>

      <div className="space-y-4">
        {/* Email Display */}
        <div>
          <label className="block text-sm font-light text-gray-600 mb-2">Owner Email</label>
          <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded font-mono text-sm text-gray-900">
            {contactEmail}
          </div>
        </div>

        {/* Password Generator */}
        <div>
          <button
            onClick={generateNewPassword}
            disabled={loading}
            className="px-4 py-2 bg-black text-white text-sm font-light hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Generating...' : '🔄 Generate New Password'}
          </button>
        </div>

        {/* Generated Password Display */}
        {newPassword && (
          <div className="bg-green-50 border border-green-200 p-4 rounded">
            <p className="text-sm font-light text-gray-600 mb-2">New Temporary Password:</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  readOnly
                  className="flex-1 px-3 py-2 bg-white border border-green-300 rounded font-mono text-sm text-gray-900 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                  title={showPassword ? 'Hide' : 'Show'}
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
              <button
                onClick={copyToClipboard}
                className={`px-3 py-2 rounded text-sm font-light transition-colors ${
                  copied
                    ? 'bg-green-600 text-white'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-green-700 mt-2">
              Share this password with the business owner. They should change it on first login.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
