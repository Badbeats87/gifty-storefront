'use client';

import { useState, useRef, useEffect } from 'react';
import type { Database } from '@/lib/database.types';

type BusinessInvite = Database['public']['Tables']['business_invites']['Row'];

interface InvitesTableProps {
  initialInvites: BusinessInvite[];
  onDataUpdate: () => void; // Callback to refresh data in parent server component
}

export default function InvitesTable({ initialInvites, onDataUpdate }: InvitesTableProps) {
  const [allInvites, setAllInvites] = useState<BusinessInvite[]>(initialInvites);
  const [selectedInviteIds, setSelectedInviteIds] = useState<string[]>([]);
  const inviteSelectAllRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAllInvites(initialInvites);
  }, [initialInvites]);

  useEffect(() => {
    const pendingInvites = allInvites.filter((invite) => invite.status === 'pending');
    setSelectedInviteIds((prev) => {
      const filtered = prev.filter((id) =>
        pendingInvites.some((invite) => invite.id === id)
      );
      return filtered.length === prev.length ? prev : filtered;
    });
  }, [allInvites]);

  useEffect(() => {
    const pendingInvites = allInvites.filter((invite) => invite.status === 'pending');
    if (inviteSelectAllRef.current) {
      inviteSelectAllRef.current.indeterminate =
        selectedInviteIds.length > 0 && selectedInviteIds.length < pendingInvites.length;
    }
  }, [allInvites, selectedInviteIds]);

  const pendingInvites = allInvites.filter((invite) => invite.status === 'pending');
  const allPendingInvitesSelected =
    pendingInvites.length > 0 && selectedInviteIds.length === pendingInvites.length;

  const revokeInvite = async (inviteId: string) => {
    if (!confirm('Are you sure you want to revoke this invitation?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteIds: [inviteId] }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to revoke invitation');
      }

      alert('✅ Invitation revoked successfully!');
      onDataUpdate(); // Refresh data in parent
    } catch (err: any) {
      console.error('Error revoking invitation:', err);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const bulkRevokeInvites = async () => {
    if (selectedInviteIds.length === 0) {
      return;
    }

    if (!confirm(`Revoke ${selectedInviteIds.length} selected pending invitation(s)?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteIds: selectedInviteIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to revoke selected invitations');
      }

      setSelectedInviteIds([]);
      alert('✅ Selected invitations revoked successfully!');
      onDataUpdate(); // Refresh data in parent
    } catch (err: any) {
      console.error('Error revoking selected invitations:', err);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="overflow-x-auto">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-600">
            {selectedInviteIds.length === 0
              ? 'No pending invites selected'
              : `${selectedInviteIds.length} invite(s) selected`}
          </p>
          <button
            onClick={bulkRevokeInvites}
            disabled={selectedInviteIds.length === 0 || loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Revoke Selected
          </button>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3">
                <input
                  ref={inviteSelectAllRef}
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  onChange={() => {
                    if (allPendingInvitesSelected) {
                      setSelectedInviteIds([]);
                    } else {
                      setSelectedInviteIds(pendingInvites.map((invite) => invite.id));
                    }
                  }}
                  checked={allPendingInvitesSelected}
                  disabled={pendingInvites.length === 0 || loading}
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Invited At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expires At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {allInvites.map((invite) => (
              <tr key={invite.id}>
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    checked={selectedInviteIds.includes(invite.id)}
                    disabled={invite.status !== 'pending' || loading}
                    onChange={() => {
                      if (invite.status !== 'pending') return;
                      setSelectedInviteIds((prev) =>
                        prev.includes(invite.id)
                          ? prev.filter((id) => id !== invite.id)
                          : [...prev, invite.id]
                      );
                    }}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                  {invite.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    invite.status === 'accepted' ? 'bg-green-100 text-green-800' :
                    invite.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {invite.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(invite.invited_at || 0).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(invite.expires_at || 0).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {invite.status === 'pending' && (
                    <button
                      onClick={() => revokeInvite(invite.id)}
                      className="text-red-600 hover:text-red-900"
                      disabled={loading}
                    >
                      Revoke
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
