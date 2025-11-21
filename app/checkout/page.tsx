'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import { processMockPayment, validateCardNumber, validateExpiryDate, validateCvc } from '@/lib/mock-payment';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, itemCount, subtotal, clearCart } = useCart();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    state: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shipping = 0;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      setError('Last name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!formData.address.trim()) {
      setError('Address is required');
      return false;
    }
    if (!formData.city.trim()) {
      setError('City is required');
      return false;
    }
    if (!formData.state.trim()) {
      setError('State/Province is required');
      return false;
    }
    if (!validateCardNumber(formData.cardNumber)) {
      setError('Invalid card number');
      return false;
    }
    if (!validateExpiryDate(formData.cardExpiry)) {
      setError('Invalid card expiry (use MM/YY format)');
      return false;
    }
    if (!validateCvc(formData.cardCvc)) {
      setError('Invalid CVC (3-4 digits)');
      return false;
    }
    return true;
  };

  const handleCompleteOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;
    if (items.length === 0) {
      setError('Your cart is empty');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Process mock payment
      const paymentResponse = await processMockPayment({
        amount: total,
        currency: 'USD',
        cardNumber: formData.cardNumber,
        cardExpiry: formData.cardExpiry,
        cardCvc: formData.cardCvc,
        email: formData.email,
      });

      if (!paymentResponse.success) {
        setError(paymentResponse.message);
        setIsProcessing(false);
        return;
      }

      // Create order in Supabase
      const orderResponse = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
          shippingInfo: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            address: formData.address,
            city: formData.city,
            state: formData.state,
          },
          paymentInfo: {
            transactionId: paymentResponse.transactionId,
            amount: total,
          },
        }),
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create order');
      }

      const orderData = await orderResponse.json();

      // Clear cart and redirect to confirmation
      clearCart();
      router.push(`/order-confirmation/${orderData.orderId}?email=${encodeURIComponent(formData.email)}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred while processing your order';
      setError(message);
      setIsProcessing(false);
    }
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
          <h1 className="text-5xl font-light text-black mb-3 tracking-tight">Checkout</h1>
          <p className="text-gray-600 font-light">Complete your purchase</p>
        </div>
      </div>

      {/* Checkout Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded">
                <p className="text-red-800 text-sm font-light">{error}</p>
              </div>
            )}
            <form onSubmit={handleCompleteOrder} className="space-y-8">
              {/* Shipping Information */}
              <div className="border border-gray-200 p-8">
                <h2 className="text-lg font-light text-black mb-6 uppercase tracking-widest">Shipping Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="col-span-1 border border-gray-200 px-4 py-3 focus:outline-none focus:ring-1 focus:ring-black transition font-light text-sm"
                  />
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="col-span-1 border border-gray-200 px-4 py-3 focus:outline-none focus:ring-1 focus:ring-black transition font-light text-sm"
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="col-span-2 border border-gray-200 px-4 py-3 focus:outline-none focus:ring-1 focus:ring-black transition font-light text-sm"
                  />
                  <input
                    type="text"
                    name="address"
                    placeholder="Street Address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="col-span-2 border border-gray-200 px-4 py-3 focus:outline-none focus:ring-1 focus:ring-black transition font-light text-sm"
                  />
                  <input
                    type="text"
                    name="city"
                    placeholder="City"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="col-span-1 border border-gray-200 px-4 py-3 focus:outline-none focus:ring-1 focus:ring-black transition font-light text-sm"
                  />
                  <input
                    type="text"
                    name="state"
                    placeholder="State / Province"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="col-span-1 border border-gray-200 px-4 py-3 focus:outline-none focus:ring-1 focus:ring-black transition font-light text-sm"
                  />
                </div>
              </div>

              {/* Payment Information */}
              <div className="border border-gray-200 p-8">
                <h2 className="text-lg font-light text-black mb-6 uppercase tracking-widest">Payment Method</h2>
                <div className="space-y-6">
                  <div className="border border-gray-200 p-4">
                    <label className="flex items-center gap-4 cursor-pointer">
                      <input type="radio" name="payment" defaultChecked className="w-4 h-4" />
                      <div className="flex-1">
                        <p className="font-light text-black text-sm">Credit Card</p>
                        <p className="text-xs text-gray-600 font-light">Visa, Mastercard, American Express</p>
                      </div>
                    </label>
                  </div>

                  {/* Card Details */}
                  <div className="space-y-4">
                    <input
                      type="text"
                      name="cardNumber"
                      placeholder="Card Number (demo: use 4532015112830366)"
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      className="w-full border border-gray-200 px-4 py-3 focus:outline-none focus:ring-1 focus:ring-black transition font-light text-sm"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        name="cardExpiry"
                        placeholder="MM/YY (demo: 12/25)"
                        value={formData.cardExpiry}
                        onChange={handleInputChange}
                        className="border border-gray-200 px-4 py-3 focus:outline-none focus:ring-1 focus:ring-black transition font-light text-sm"
                      />
                      <input
                        type="text"
                        name="cardCvc"
                        placeholder="CVC (demo: 123)"
                        value={formData.cardCvc}
                        onChange={handleInputChange}
                        className="border border-gray-200 px-4 py-3 focus:outline-none focus:ring-1 focus:ring-black transition font-light text-sm"
                      />
                    </div>
                  </div>

                  {/* Demo Info */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-blue-800 text-xs font-light">
                      ℹ️ This is a demo checkout with a mock payment processor. Use the demo card details above to test the flow.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons - Inside Form */}
              <div className="space-y-3 mt-8">
                <button
                  type="submit"
                  disabled={isProcessing || items.length === 0}
                  className="w-full bg-black text-white py-3 font-light tracking-wider uppercase text-sm hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Processing...' : 'Complete Purchase'}
                </button>
                <Link href="/cart" className="w-full bg-white border border-gray-200 text-black py-3 font-light tracking-wider uppercase text-sm hover:bg-gray-50 transition text-center block">
                  Back to Cart
                </Link>
              </div>
            </form>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="border border-gray-200 p-6 sticky top-24">
              <h2 className="text-lg font-light text-black mb-6 tracking-tight">Order Summary</h2>

              {/* Order Items */}
              <div className="mb-8 pb-8 border-b border-gray-200 space-y-4">
                {items.length > 0 ? (
                  items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-2xl">
                        {item.image}
                      </div>
                      <div className="flex-1">
                        <p className="font-light text-black text-sm">{item.name}</p>
                        <p className="text-xs text-gray-600 font-light">${item.price} × {item.quantity}</p>
                      </div>
                      <p className="font-light text-black text-sm">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600 text-sm font-light">Your cart is empty</p>
                )}
              </div>

              {/* Pricing Breakdown */}
              <div className="space-y-3 mb-8 pb-8 border-b border-gray-200">
                <div className="flex justify-between text-sm font-light">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-black">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-light">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-black">Free</span>
                </div>
                <div className="flex justify-between text-sm font-light">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-black">${tax.toFixed(2)}</span>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between mb-8 pb-8 border-b border-gray-200">
                <span className="font-light text-black">Total</span>
                <span className="text-lg font-light text-black">
                  ${total.toFixed(2)}
                </span>
              </div>

              {/* Security Note */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-start gap-3 text-xs text-gray-600 font-light">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Bank-level security protects your information</span>
                </div>
              </div>
            </div>
          </div>
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
