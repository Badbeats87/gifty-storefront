import { getBusinessByIdForUser, requireAuth } from '@/lib/auth';
import { notFound } from 'next/navigation';
import RedeemInterface from './RedeemInterface';

export default async function RedeemPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const session = await requireAuth();
  const { businessId } = await params;
  const business = await getBusinessByIdForUser(businessId, session.email);

  if (!business) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Redeem Gift Card</h2>
        <p className="text-gray-600 mt-1">
          Enter or scan a gift card code to redeem it
        </p>
      </div>

      <RedeemInterface businessId={businessId} />
    </div>
  );
}
