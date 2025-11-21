'use client';

import { useState, useEffect } from 'react';
import type { Database } from '@/lib/database.types';

type BusinessApplication = Database['public']['Tables']['business_applications']['Row'];

interface ApplicationsListProps {
  initialApplications: BusinessApplication[];
  onDataUpdate: () => void; // Callback to refresh data in parent server component
}

export default function ApplicationsList({ initialApplications, onDataUpdate }: ApplicationsListProps) {
  const [applications, setApplications] = useState<BusinessApplication[]>(initialApplications);
  const [loading, setLoading] = useState(false);

  // Update applications state if initialApplications changes
  useEffect(() => {
    setApplications(initialApplications);
  }, [initialApplications]);

  const handleApplicationAction = async (appId: string, status: 'approved' | 'rejected', rejectionReason?: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          applicationId: appId,
          status,
          rejectionReason
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${status} application`);
      }

      const responseData = await response.json();

      if (status === 'approved' && responseData.credentials) {
        alert(`✅ Application approved!\n\nBusiness: ${responseData.business.name}\nOwner Email: ${responseData.credentials.email}\nTemporary Password: ${responseData.credentials.tempPassword}\n\nShare these credentials with the business owner. They should change the password on first login.`);
      } else {
        alert(`Application ${status} successfully!`);
      }

      onDataUpdate(); // Refresh data after action
    } catch (err: any) {
      console.error(`Error ${status} application:`, err);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const approveApplication = async (appId: string) => {
    if (confirm('Are you sure you want to approve this application?')) {
      await handleApplicationAction(appId, 'approved');
    }
  };

  const rejectApplication = async (appId: string) => {
    const reason = prompt('Please provide a reason for rejection (optional):');
    if (confirm('Are you sure you want to reject this application?')) {
      await handleApplicationAction(appId, 'rejected', reason || undefined);
    }
  };

  const deleteApplication = async (appId: string) => {
    if (!confirm('Are you sure you want to delete this application?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/applications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: appId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete application');
      }

      alert('✅ Application deleted successfully!');
      onDataUpdate(); // Refresh data after action
    } catch (err: any) {
      console.error('Error deleting application:', err);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const cleanupTestData = async () => {
    if (!confirm('⚠️ WARNING: This will delete ALL pending applications and pending invites.\n\nAre you sure?')) {
      return;
    }

    if (prompt('Type DELETE to confirm:') !== 'DELETE') {
      alert('Cleanup cancelled.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/cleanup-test-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to clean up test data');
      }

      alert('✅ Test data cleaned up successfully!');
      onDataUpdate(); // Refresh data after action
    } catch (err: any) {
      console.error('Error cleaning up test data:', err);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {applications.length > 0 && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={cleanupTestData}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
            disabled={loading}
          >
            🗑️ Clean Up All Pending
          </button>
        </div>
      )}
      {applications.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No pending applications</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div key={app.id} className="border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{app.business_name}</h3>
                  <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Contact:</span>
                      <span className="ml-2 font-medium">{app.contact_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <span className="ml-2 font-medium">{app.contact_email}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Phone:</span>
                      <span className="ml-2 font-medium">{app.phone || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">IBAN:</span>
                      <span className="ml-2 font-medium font-mono text-xs">{app.iban}</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500" suppressHydrationWarning>
                    Applied: {new Date(app.created_at || 0).toLocaleString()}
                  </div>
                </div>
                <div className="ml-4 flex gap-2 flex-col">
                  <div className="flex gap-2">
                    <button
                      onClick={() => approveApplication(app.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                      disabled={loading}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => rejectApplication(app.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                      disabled={loading}
                    >
                      Reject
                    </button>
                  </div>
                  <button
                    onClick={() => deleteApplication(app.id)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium"
                    disabled={loading}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
