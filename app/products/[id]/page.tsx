'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useCart } from '@/lib/cart-context';
import { getProductById } from '@/lib/products';

export default function ProductDetail({ params }: { params: { id: string } }) {
  const { addItem, itemCount } = useCart();
  const [selectedAmount, setSelectedAmount] = useState('50');
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch product from Supabase by ID
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const foundProduct = await getProductById(params.id);
        if (foundProduct) {
          setProduct({
            id: foundProduct.id,
            name: foundProduct.name,
            image: foundProduct.image,
            category: 'Business',
            rating: foundProduct.rating,
            reviews: foundProduct.reviews,
            description: foundProduct.name + ' - Premium Gift Cards',
            amounts: ['25', '50', '100', '150'],
          });
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [params.id]);

  const priceMap: { [key: string]: number } = {
    '25': 25,
    '50': 50,
    '100': 100,
    '150': 150,
  };

  const handleAddToCart = () => {
    if (!product) return;
    const price = priceMap[selectedAmount];
    addItem({
      id: product.id, // Use actual business_id, not name
      name: product.name,
      price,
      quantity: 1,
      image: product.image,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 font-light">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-light mb-4">Product not found</p>
          <Link href="/products" className="text-black font-light hover:text-gray-600">
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

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
      <div className="bg-white border-b border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <Link href="/products" className="inline-flex items-center gap-2 text-black hover:text-gray-600 transition mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-light">Back to Products</span>
          </Link>
          <p className="text-xs text-gray-600 uppercase tracking-widest font-light">{product.category}</p>
        </div>
      </div>

      {/* Product Content */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          {/* Product Image */}
          <div className="flex items-center justify-center">
            <div className="relative w-full aspect-square bg-gray-100 rounded overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center text-9xl group-hover:scale-110 transition-transform duration-300">
                {product.image}
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col justify-between">
            <div>
              <h1 className="text-4xl font-light text-black mb-4 tracking-tight">{product.name}</h1>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-6">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-3.5 h-3.5 text-gray-300 fill-current"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-xs text-gray-600 font-light">{product.rating}</span>
                <span className="text-xs text-gray-500 font-light">({product.reviews})</span>
              </div>

              <p className="text-base text-gray-600 leading-relaxed mb-8 font-light">
                {product.description}
              </p>

              {/* Amount Selector */}
              <div className="mb-8">
                <label className="block text-xs font-light text-black uppercase tracking-widest mb-4">
                  Select Amount
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {product.amounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setSelectedAmount(amount)}
                      className={`py-3 px-2 rounded font-light transition-all duration-200 text-sm ${
                        selectedAmount === amount
                          ? 'bg-black text-white'
                          : 'bg-gray-100 text-black hover:bg-gray-200'
                      }`}
                    >
                      ${amount}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Display */}
              <div className="mb-8 pb-8 border-b border-gray-200">
                <p className="text-xs text-gray-600 mb-2 font-light">Total Price</p>
                <p className="text-4xl font-light text-black">
                  ${priceMap[selectedAmount]}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleAddToCart}
                className="w-full bg-black text-white py-3 font-light tracking-wider uppercase text-sm hover:bg-gray-800 transition"
              >
                Add ${priceMap[selectedAmount]} to Cart
              </button>
              <Link href="/products" className="w-full bg-white border border-gray-200 text-black py-3 font-light tracking-wider uppercase text-sm hover:bg-gray-50 transition text-center block">
                Continue Shopping
              </Link>
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
