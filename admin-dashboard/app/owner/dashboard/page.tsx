import { requireAuth, getBusinessForUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function OwnerDashboardPage() {
  // Require authentication
  const user = await requireAuth();

  // Get the business for this user
  const business = await getBusinessForUser(user.email);

  if (!business) {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-yellow-900 mb-2">
            No Business Found
          </h2>
          <p className="text-gray-800">
            Your account is not linked to a business yet. Please contact support.
          </p>
        </div>
      </div>
    );
  }

  // Redirect to the specific business dashboard
  redirect(`/owner/${business.id}/dashboard`);
}
