import { getBusinessByIdForUser, requireAuth } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import LogoutButton from './LogoutButton';

export default async function BusinessLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ businessId: string }>;
}) {
  const session = await requireAuth();
  const { businessId } = await params;
  const business = await getBusinessByIdForUser(businessId, session.email);

  if (!business) {
    notFound();
  }

  const navigation = [
    { name: 'Dashboard', href: `/owner/${businessId}/dashboard`, icon: '📊' },
    { name: 'Gift Cards', href: `/owner/${businessId}/gift-cards`, icon: '🎁' },
    { name: 'Redeem', href: `/owner/${businessId}/redeem`, icon: '✓' },
    { name: 'Finance', href: `/owner/${businessId}/finance`, icon: '💰' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">
                {business.name}
              </h1>
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-gray-800 rounded">
                {business.status}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{session.email}</span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-2 px-1 py-4 text-sm font-medium text-gray-700 hover:text-blue-600 hover:border-b-2 hover:border-blue-600 transition-colors"
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
