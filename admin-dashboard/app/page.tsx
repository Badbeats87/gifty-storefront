import 'server-only';
import { requireAdminAuth } from '@/lib/adminAuth';
import { getGiftCardStats } from '@/lib/queries/giftCards';
import { getAllBusinesses } from '@/lib/queries/businesses';

export default async function Dashboard() {
  await requireAdminAuth(); // Ensure admin is authenticated

  const giftCardStats = await getGiftCardStats();
  const businesses = await getAllBusinesses();

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-light text-black mb-3 tracking-tight">Admin Dashboard</h1>
          <p className="text-gray-600 font-light">Quick insights into gift cards and businesses</p>
        </div>

        {/* Gift Card Statistics */}
        <div className="border border-gray-200 p-8 mb-8">
          <h2 className="text-lg font-light text-black mb-8 tracking-tight">Gift Card Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Issued" value={`$${giftCardStats.totalIssuedAmount.toFixed(2)}`} />
            <StatCard title="Total Redeemed" value={`$${giftCardStats.totalRedeemedAmount.toFixed(2)}`} />
            <StatCard title="Active Cards" value={giftCardStats.activeCardsCount.toLocaleString()} />
            <StatCard title="Fully Redeemed" value={giftCardStats.fullyRedeemedCardsCount.toLocaleString()} />
          </div>
        </div>

        {/* Business Overview */}
        <div className="border border-gray-200 p-8">
          <h2 className="text-lg font-light text-black mb-8 tracking-tight">Businesses ({businesses.length})</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white border-b border-gray-200">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-light text-black uppercase tracking-widest">Name</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-light text-black uppercase tracking-widest">Contact Email</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-light text-black uppercase tracking-widest">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {businesses.slice(0, 5).map((business) => ( // Display top 5 businesses
                  <tr key={business.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-light text-black">{business.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-light text-gray-600">{business.contact_email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-light text-gray-600">{new Date(business.created_at || 0).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {businesses.length > 5 && (
            <p className="text-sm font-light text-gray-600 mt-6">Showing 5 of {businesses.length} businesses. View all in the Businesses section.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Simple Stat Card component (can be moved to its own file later)
function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="border border-gray-200 p-6">
      <p className="text-xs font-light text-gray-600 uppercase tracking-widest mb-3">{title}</p>
      <p className="font-light text-3xl text-black">{value}</p>
    </div>
  );
}