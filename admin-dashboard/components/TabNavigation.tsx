'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter

interface TabNavigationProps {
  initialTab: 'businesses' | 'applications' | 'invites' | 'sendInvite';
  businessCount: number;
  applicationCount: number;
  inviteCount: number;
}

export default function TabNavigation({
  initialTab,
  businessCount,
  applicationCount,
  inviteCount,
}: TabNavigationProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const router = useRouter(); // Initialize useRouter

  // Sync activeTab with initialTab when the prop changes (when URL changes from server)
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleTabClick = (tab: 'businesses' | 'applications' | 'invites' | 'sendInvite') => {
    setActiveTab(tab);
    router.push(`?tab=${tab}`); // Use router.push for navigation
  };

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => handleTabClick('businesses')}
            className={`px-6 py-4 text-sm font-medium border-b-2 ${
              activeTab === 'businesses'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Businesses ({businessCount})
          </button>
          <button
            onClick={() => handleTabClick('applications')}
            className={`px-6 py-4 text-sm font-medium border-b-2 ${
              activeTab === 'applications'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pending Applications ({applicationCount})
          </button>
          <button
            onClick={() => handleTabClick('invites')}
            className={`px-6 py-4 text-sm font-medium border-b-2 ${
              activeTab === 'invites'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Invitations ({inviteCount})
          </button>
          <button
            onClick={() => handleTabClick('sendInvite')}
            className={`px-6 py-4 text-sm font-medium border-b-2 ${
              activeTab === 'sendInvite'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Send Invite
          </button>
        </nav>
      </div>
    </div>
  );
}