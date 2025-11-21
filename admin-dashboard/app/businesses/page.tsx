import 'server-only';
import { requireAdminAuth } from '@/lib/adminAuth';
import { getAllBusinesses, getPendingApplications, getAllInvites } from '@/lib/queries/businesses';
import { revalidatePath } from 'next/cache';

// Import Client Components
import TabNavigation from '@/components/TabNavigation';
import BusinessesTable from '@/components/BusinessesTable';
import ApplicationsList from '@/components/ApplicationsList';
import InvitesTable from '@/components/InvitesTable';
import SendInviteForm from '@/components/SendInviteForm';

interface BusinessManagementPageProps {
  searchParams: Promise<{
    tab?: 'businesses' | 'applications' | 'invites' | 'sendInvite';
  }>;
}

export default async function BusinessManagement({ searchParams }: BusinessManagementPageProps) {
  await requireAdminAuth(); // Ensure admin is authenticated

  // Fetch all necessary data server-side
  const [businesses, applications, allInvites, params] = await Promise.all([
    getAllBusinesses(),
    getPendingApplications(),
    getAllInvites(),
    searchParams,
  ]);

  const activeTab = params.tab || 'businesses';

  // Function to revalidate the path, passed to client components to trigger data refresh
  const handleDataUpdate = async () => {
    'use server';
    revalidatePath('/businesses');
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-light text-black mb-3 tracking-tight">Business Management</h1>
          <p className="text-gray-600 font-light">Review applications, manage active businesses, and send invitations</p>
        </div>

        {/* Tabs - now a client component */}
        <TabNavigation
          initialTab={activeTab}
          businessCount={businesses.length}
          applicationCount={applications.length}
          inviteCount={allInvites.length}
        />

        {/* Conditional rendering of content based on activeTab */}
        {activeTab === 'businesses' && (
          <BusinessesTable initialBusinesses={businesses} onDataUpdate={handleDataUpdate} />
        )}
        {activeTab === 'applications' && (
          <ApplicationsList initialApplications={applications} onDataUpdate={handleDataUpdate} />
        )}
        {activeTab === 'invites' && (
          <InvitesTable initialInvites={allInvites} onDataUpdate={handleDataUpdate} />
        )}
        {activeTab === 'sendInvite' && (
          <SendInviteForm onInviteSent={handleDataUpdate} />
        )}
      </div>
    </div>
  );
}