'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import type { Database } from '@/lib/database.types';

type Business = Database['public']['Tables']['businesses']['Row'];

interface BusinessesTableProps {
  initialBusinesses: Business[];
  onDataUpdate: () => void; // Callback to refresh data in parent server component
}

export default function BusinessesTable({ initialBusinesses, onDataUpdate }: BusinessesTableProps) {
  const [businesses, setBusinesses] = useState<Business[]>(initialBusinesses);
  const [selectedBusinessIds, setSelectedBusinessIds] = useState<string[]>([]);
  const businessSelectAllRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setBusinesses(initialBusinesses);
  }, [initialBusinesses]);

  useEffect(() => {
    setSelectedBusinessIds((prev) => {
      const filtered = prev.filter((id) => businesses.some((biz) => biz.id === id));
      return filtered.length === prev.length ? prev : filtered;
    });
  }, [businesses]);

  useEffect(() => {
    if (businessSelectAllRef.current) {
      businessSelectAllRef.current.indeterminate =
        selectedBusinessIds.length > 0 && selectedBusinessIds.length < businesses.length;
    }
  }, [businesses, selectedBusinessIds]);

  // Filter businesses based on search term
  const filteredBusinesses = businesses.filter((business) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      business.name.toLowerCase().includes(searchLower) ||
      (business.contact_email?.toLowerCase().includes(searchLower) || false) ||
      (business.slug?.toLowerCase().includes(searchLower) || false)
    );
  });

  const allFilteredBusinessesSelected = filteredBusinesses.length > 0 && filteredBusinesses.every((biz) => selectedBusinessIds.includes(biz.id));

  const toggleVisibility = async (businessId: string, currentVisibility: boolean) => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/businesses/toggle-visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, isVisible: !currentVisibility }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to toggle visibility');
      }

      alert(`✅ Business is now ${!currentVisibility ? 'visible' : 'hidden'} on the storefront!`);
      onDataUpdate(); // Trigger data refresh in parent
    } catch (err: any) {
      console.error('Error toggling visibility:', err);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteBusiness = async (businessId: string) => {
    if (!confirm('⚠️ Are you sure you want to DELETE this business?\n\nThis will also delete:\n- All associated gift cards\n- All transaction history\n- This action CANNOT be undone!')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/businesses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessIds: [businessId] }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete business');
      }

      alert('✅ Business deleted successfully!');
      onDataUpdate(); // Trigger data refresh in parent
    } catch (err: any) {
      console.error('Error deleting business:', err);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const bulkDeleteBusinesses = async () => {
    if (selectedBusinessIds.length === 0) {
      return;
    }

    if (
      !confirm(
        `⚠️ Delete ${selectedBusinessIds.length} selected business(es)?\n\nThis will also remove related gift cards and transaction history.`
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/businesses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessIds: selectedBusinessIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete selected businesses');
      }

      setSelectedBusinessIds([]);
      alert('✅ Selected businesses deleted successfully!');
      onDataUpdate(); // Trigger data refresh in parent
    } catch (err: any) {
      console.error('Error deleting selected businesses:', err);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search businesses by name, email, or slug..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black text-sm"
        />
        {searchTerm && (
          <p className="text-sm text-gray-600 mt-2">
            Found {filteredBusinesses.length} of {businesses.length} businesses
          </p>
        )}
      </div>
      <div className="overflow-x-auto">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-600">
            {selectedBusinessIds.length === 0
              ? 'No businesses selected'
              : `${selectedBusinessIds.length} business(es) selected`}
          </p>
          <button
            onClick={bulkDeleteBusinesses}
            disabled={selectedBusinessIds.length === 0 || loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Delete Selected
          </button>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3">
                <input
                  ref={businessSelectAllRef}
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  onChange={() => {
                    if (allFilteredBusinessesSelected) {
                      setSelectedBusinessIds([]);
                    } else {
                      const newSelection = filteredBusinesses.map((biz) => biz.id);
                      setSelectedBusinessIds([...selectedBusinessIds.filter(id => !filteredBusinesses.map(b => b.id).includes(id)), ...newSelection]);
                    }
                  }}
                  checked={allFilteredBusinessesSelected}
                  disabled={filteredBusinesses.length === 0 || loading}
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Business
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Wix Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Visible
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredBusinesses.length > 0 ? (
            filteredBusinesses.map((business) => (
              <tr key={business.id}>
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    checked={selectedBusinessIds.includes(business.id)}
                    onChange={() =>
                      setSelectedBusinessIds((prev) =>
                        prev.includes(business.id)
                          ? prev.filter((id) => id !== business.id)
                          : [...prev, business.id]
                      )
                    }
                    disabled={loading}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{business.name}</div>
                  <div className="text-sm text-gray-500">{business.slug}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {business.contact_email || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${business.status === 'active' ? 'bg-green-100 text-green-800' :
                    business.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {business.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {business.wix_product_id ? '✓' : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => toggleVisibility(business.id, business.is_visible || false)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                      business.is_visible
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    disabled={loading}
                  >
                    {business.is_visible ? '👁️ Visible' : '🚫 Hidden'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(business.created_at || 0).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/businesses/${business.id}`}
                      className="text-blue-600 hover:text-blue-900 font-medium"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => deleteBusiness(business.id)}
                      className="text-red-600 hover:text-red-900"
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-600">
                  No businesses found matching "{searchTerm}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
