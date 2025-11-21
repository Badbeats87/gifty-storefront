import { getServiceSupabase } from '@/lib/supabaseAdmin';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function BusinessDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const supabase = getServiceSupabase();

  // Fetch business details
  const { data: business, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', businessId)
    .single();

  if (error || !business) {
    notFound();
  }

  const navigation = [
    { name: 'Overview', href: `/businesses/${businessId}`, icon: '📊' },
    { name: 'Finance', href: `/businesses/${businessId}/finance`, icon: '💰' },
    { name: 'Gift Cards', href: `/businesses/${businessId}/gift-cards`, icon: '🎁' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/businesses"
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← Back to Businesses
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {business.name}
                </h1>
                <p className="text-xs text-gray-500">{business.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  business.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : business.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {business.status}
              </span>
            </div>
          </div>
        </div>
      </div>

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
