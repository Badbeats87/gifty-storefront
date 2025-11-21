'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const response = await fetch('/api/admin/logout', {
        method: 'POST',
      });

      if (response.ok) {
        router.push('/login');
        router.refresh();
      } else {
        console.error('Logout failed');
        setLoggingOut(false);
      }
    } catch (error) {
      console.error('Logout error:', error);
      setLoggingOut(false);
    }
  };

  // Don't show admin navigation on business owner pages
  if (pathname.startsWith('/owner/')) {
    return null;
  }

  // Don't show admin navigation on login/register pages
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
    return null;
  }

  const navItems = [
    { href: '/', label: 'Dashboard', icon: '📊' },
    { href: '/businesses', label: 'Businesses', icon: '🏢' },
    { href: '/finance', label: 'Finance', icon: '💰' },
    { href: '/cards', label: 'Cards', icon: '🎫' },
    { href: '/monitoring', label: 'Monitoring', icon: '🔍' },
    { href: '/database', label: 'Database', icon: '🗄️' },
    { href: '/architecture', label: 'Architecture', icon: '📐' },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo/Brand */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-white font-bold text-sm">
              G
            </div>
            <h1 className="text-lg font-light tracking-wider text-black">GIFTY</h1>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  text-sm font-light transition-colors
                  ${
                    isActive(item.href)
                      ? 'text-black border-b border-black'
                      : 'text-gray-600 hover:text-black'
                  }
                `}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* User Info with Logout */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-light text-black">Admin User</p>
              <p className="text-xs font-light text-gray-600">Platform Manager</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white font-light text-sm">
                A
              </div>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="px-3 py-1.5 text-xs font-light text-gray-600 hover:text-black transition-colors border border-gray-200 rounded hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loggingOut ? 'Signing out...' : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
