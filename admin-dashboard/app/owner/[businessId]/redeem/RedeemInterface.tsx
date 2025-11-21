'use client';

import { useState } from 'react';

interface GiftCard {
  id: string;
  code: string;
  amount: number;
  remaining_balance: number;
  currency: string;
  status: string;
  expires_at: string;
  customer: {
    email: string;
    name: string | null;
  };
}

export default function RedeemInterface({
  businessId,
}: {
  businessId: string;
}) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [giftCard, setGiftCard] = useState<GiftCard | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [partialAmount, setPartialAmount] = useState('');

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError('');
    setSuccess('');
    setGiftCard(null);

    try {
      const response = await fetch('/api/owner/gift-cards/lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          businessId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gift card not found');
      }

      setGiftCard(data.giftCard);
    } catch (err: any) {
      setError(err.message || 'Failed to lookup gift card');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (fullRedeem: boolean) => {
    if (!giftCard) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const redemptionAmount = fullRedeem
        ? giftCard.remaining_balance
        : parseFloat(partialAmount) || 0;

      if (redemptionAmount <= 0 || redemptionAmount > giftCard.remaining_balance) {
        setError('Invalid redemption amount');
        setLoading(false);
        return;
      }

      const newBalance = giftCard.remaining_balance - redemptionAmount;
      const isFullyRedeemed = newBalance === 0;

      const response = await fetch('/api/owner/gift-cards/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          giftCardId: giftCard.id,
          businessId,
          amount: redemptionAmount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Redemption failed');
      }

      const updatedBalance =
        typeof data.remainingBalance === 'number'
          ? data.remainingBalance
          : newBalance;
      const fullyRedeemed = data.status === 'redeemed' || updatedBalance === 0;

      setSuccess(
        `Successfully redeemed $${redemptionAmount.toFixed(2)}! ${
          fullyRedeemed
            ? 'Card fully redeemed.'
            : `Remaining balance: $${updatedBalance.toFixed(2)}`
        }`
      );

      // Reset form
      setCode('');
      setGiftCard(null);
      setPartialAmount('');
    } catch (err: any) {
      setError(`Redemption failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      {/* Lookup Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Enter Gift Card Code</h3>
        <form onSubmit={handleLookup} className="space-y-4">
          <div>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="GIFT-XXXX-XXXX"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-lg text-gray-900 placeholder-gray-400"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {loading ? 'Looking up...' : 'Lookup Gift Card'}
          </button>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <span className="flex-1 text-red-700">{error}</span>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <span className="text-xl">✓</span>
          <span className="flex-1 text-gray-800">{success}</span>
        </div>
      )}

      {/* Gift Card Details */}
      {giftCard && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Gift Card Details</h3>
              <p className="text-gray-600 mt-1 font-mono text-sm">{giftCard.code}</p>
            </div>
            <span
              className={`px-3 py-1 text-xs font-semibold rounded-full ${
                giftCard.status === 'issued'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {giftCard.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Original Amount</p>
              <p className="text-2xl font-bold text-gray-900">
                ${giftCard.amount.toFixed(2)}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-xs font-medium text-blue-500 uppercase mb-1">Current Balance</p>
              <p className="text-2xl font-bold text-blue-600">
                ${giftCard.remaining_balance.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Customer</p>
            <p className="font-semibold text-gray-900">
              {giftCard.customer.name || 'Unknown'}
            </p>
            <p className="text-sm text-gray-600">{giftCard.customer.email}</p>
          </div>

          {giftCard.status === 'issued' && giftCard.remaining_balance > 0 && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Partial Redemption Amount (optional)
                </label>
                <input
                  type="number"
                  value={partialAmount}
                  onChange={(e) => setPartialAmount(e.target.value)}
                  placeholder={`Max: $${giftCard.remaining_balance.toFixed(2)}`}
                  step="0.01"
                  min="0"
                  max={giftCard.remaining_balance}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleRedeem(false)}
                  disabled={loading || !partialAmount || parseFloat(partialAmount) <= 0}
                  className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  {loading ? 'Processing...' : 'Redeem Partial'}
                </button>
                <button
                  onClick={() => handleRedeem(true)}
                  disabled={loading}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  {loading ? 'Processing...' : 'Redeem Full Amount'}
                </button>
              </div>
              <p className="text-xs text-gray-500 text-center">
                Full redemption will mark the card as fully redeemed
              </p>
            </div>
          )}

          {(giftCard.status === 'redeemed' || giftCard.remaining_balance === 0) && (
            <div className="bg-gray-100 p-4 rounded-lg text-center">
              <p className="text-gray-600 font-medium">This gift card has been fully redeemed</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
