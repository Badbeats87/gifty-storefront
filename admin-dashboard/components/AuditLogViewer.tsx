'use client';

import { useState, useEffect } from 'react';

interface AuditLog {
  id: string;
  admin_user_id: string;
  action_type: string;
  resource_type: string;
  resource_id: string | null;
  resource_name: string | null;
  details: Record<string, any> | null;
  status: 'success' | 'failed';
  error_message: string | null;
  ip_address: string | null;
  created_at: string;
  admin_user?: { username: string; email: string } | null;
}

const ACTION_TYPE_COLORS: Record<string, string> = {
  CREATE: 'bg-blue-100 text-blue-800',
  UPDATE: 'bg-yellow-100 text-yellow-800',
  DELETE: 'bg-red-100 text-red-800',
  APPROVE: 'bg-green-100 text-green-800',
  REJECT: 'bg-red-100 text-red-800',
  LOGIN: 'bg-purple-100 text-purple-800',
  LOGOUT: 'bg-gray-100 text-gray-800',
};

const RESOURCE_TYPE_ICONS: Record<string, string> = {
  BUSINESS: '🏢',
  ORDER: '📦',
  GIFT_CARD: '🎁',
  USER: '👤',
  INVITE: '✉️',
  LOGIN: '🔐',
};

export default function AuditLogViewer({ limit = 20 }: { limit?: number }) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/audit/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ limit, status: filter === 'all' ? null : filter }),
        });

        if (!response.ok) throw new Error('Failed to fetch audit logs');
        const data = await response.json();
        setLogs(data);
      } catch (error) {
        console.error('Error fetching audit logs:', error);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [filter, limit]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getActionColor = (actionType: string) => {
    return ACTION_TYPE_COLORS[actionType] || 'bg-gray-100 text-gray-800';
  };

  const getResourceIcon = (resourceType: string) => {
    return RESOURCE_TYPE_ICONS[resourceType] || '📋';
  };

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.status === filter;
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Operation History</h2>
            <p className="text-sm text-gray-500 mt-1">All administrative operations tracked</p>
          </div>
          <div className="flex gap-2">
            {(['all', 'success', 'failed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="divide-y divide-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No {filter !== 'all' ? filter : ''} operations found
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="hover:bg-gray-50 transition">
              <button
                onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                className="w-full text-left px-6 py-4 flex items-start gap-4"
              >
                {/* Icon */}
                <div className="text-2xl pt-1">{getResourceIcon(log.resource_type)}</div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(log.action_type)}`}>
                      {log.action_type}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {log.resource_type}
                    </span>
                    {log.status === 'failed' && (
                      <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                        Failed
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-900">
                    {log.resource_name || `ID: ${log.resource_id || 'N/A'}`}
                  </p>

                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>{log.admin_user?.username || 'Unknown'}</span>
                    <span>•</span>
                    <span>{formatDate(log.created_at)}</span>
                    {log.ip_address && (
                      <>
                        <span>•</span>
                        <span>{log.ip_address}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Expand Icon */}
                <div className="text-gray-400 pt-1">
                  <svg
                    className={`w-5 h-5 transition-transform ${expandedId === log.id ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              </button>

              {/* Expanded Details */}
              {expandedId === log.id && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Admin</p>
                      <p className="font-medium text-gray-900">{log.admin_user?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Status</p>
                      <p className={`font-medium ${log.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                      </p>
                    </div>
                    {log.error_message && (
                      <div className="col-span-2">
                        <p className="text-gray-500">Error</p>
                        <p className="font-mono text-xs bg-red-50 p-2 rounded border border-red-200 text-red-700 mt-1">
                          {log.error_message}
                        </p>
                      </div>
                    )}
                    {log.details && (
                      <div className="col-span-2">
                        <p className="text-gray-500 mb-2">Details</p>
                        <pre className="font-mono text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {!loading && filteredLogs.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
          Showing {filteredLogs.length} operation{filteredLogs.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
