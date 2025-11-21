'use client';

import { useState, useEffect, useRef } from 'react';

interface ConsoleEvent {
  id: string;
  timestamp: Date;
  type: 'order' | 'login' | 'error' | 'approval' | 'system';
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  metadata?: Record<string, any>;
}

interface SystemHealth {
  dbLatency: number;
  errorRate: number;
  activeUsers: number;
  ordersPerMinute: number;
  status: 'healthy' | 'warning' | 'critical';
}

const SEVERITY_COLORS = {
  info: 'text-blue-600 bg-blue-50 border-blue-200',
  warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  error: 'text-red-600 bg-red-50 border-red-200',
  success: 'text-green-600 bg-green-50 border-green-200',
};

const SEVERITY_ICONS = {
  info: 'ℹ️',
  warning: '⚠️',
  error: '❌',
  success: '✅',
};

export default function RealtimeConsole() {
  const [events, setEvents] = useState<ConsoleEvent[]>([]);
  const [health, setHealth] = useState<SystemHealth>({
    dbLatency: 0,
    errorRate: 0,
    activeUsers: 0,
    ordersPerMinute: 0,
    status: 'healthy',
  });
  const [isLive, setIsLive] = useState(true);
  const [filter, setFilter] = useState<'all' | 'order' | 'error' | 'login'>('all');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest event
  useEffect(() => {
    if (isLive && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events, isLive]);

  // Fetch real-time data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/monitoring/realtime', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) throw new Error('Failed to fetch realtime data');
        const data = await response.json();

        // Update health metrics
        setHealth(data.health);

        // Add new events to stream
        if (data.events && data.events.length > 0) {
          setEvents(prev => {
            const combined = [...prev, ...data.events];
            // Keep only last 100 events
            return combined.slice(-100);
          });
        }
      } catch (error) {
        console.error('Error fetching realtime data:', error);
      }
    };

    // Initial fetch
    fetchData();

    // Poll every 3 seconds
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true;
    return event.type === filter;
  });

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'critical':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return '🟢';
      case 'warning':
        return '🟡';
      case 'critical':
        return '🔴';
      default:
        return '⚪';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Real-time Console</h2>
          <p className="text-sm text-gray-500 mt-1">Live monitoring dashboard</p>
        </div>
        <button
          onClick={() => setIsLive(!isLive)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition ${
            isLive
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {isLive ? '🔴 LIVE' : '⏸️ PAUSED'}
        </button>
      </div>

      {/* System Health Metrics */}
      <div className={`px-6 py-4 border-b border-gray-200 grid grid-cols-4 gap-4 ${getHealthColor(health.status)}`}>
        <div className="text-center">
          <p className="text-2xl font-bold">{health.dbLatency}ms</p>
          <p className="text-xs text-gray-600 mt-1">DB Latency</p>
          {health.dbLatency > 500 && <p className="text-xs text-red-600 font-semibold mt-1">⚠️ Slow</p>}
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">{health.errorRate.toFixed(1)}%</p>
          <p className="text-xs text-gray-600 mt-1">Error Rate</p>
          {health.errorRate > 5 && <p className="text-xs text-red-600 font-semibold mt-1">⚠️ High</p>}
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">{health.activeUsers}</p>
          <p className="text-xs text-gray-600 mt-1">Active Users</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">{health.ordersPerMinute}</p>
          <p className="text-xs text-gray-600 mt-1">Orders/min</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-6 py-3 border-b border-gray-200 flex gap-2">
        {(['all', 'order', 'error', 'login'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1) + 's'}
          </button>
        ))}
      </div>

      {/* Event Stream */}
      <div
        ref={scrollRef}
        className="h-80 overflow-y-auto bg-gray-50 font-mono text-sm"
        style={{ background: '#0f172a' }}
      >
        {filteredEvents.length === 0 ? (
          <div className="p-4 text-gray-400 text-center">
            No events yet. Waiting for live data...
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {filteredEvents.map((event, index) => (
              <div
                key={`${event.id}-${index}-${event.timestamp}`}
                className={`p-2 rounded border ${SEVERITY_COLORS[event.severity]} text-xs`}
                style={{
                  borderLeft: `3px solid`,
                  color: event.severity === 'error' ? '#dc2626' :
                         event.severity === 'warning' ? '#d97706' :
                         event.severity === 'success' ? '#16a34a' : '#2563eb',
                  background: event.severity === 'error' ? '#fef2f2' :
                             event.severity === 'warning' ? '#fffbeb' :
                             event.severity === 'success' ? '#f0fdf4' : '#eff6ff',
                }}
              >
                <div className="flex items-start gap-2">
                  <span>{SEVERITY_ICONS[event.severity]}</span>
                  <div className="flex-1">
                    <span className="font-mono text-xs">
                      [{new Date(event.timestamp).toLocaleTimeString()}]
                    </span>
                    <span className="ml-2 font-semibold">{event.type.toUpperCase()}</span>
                    <p className="mt-1">{event.message}</p>
                    {event.metadata && (
                      <p className="text-xs opacity-70 mt-1">
                        {JSON.stringify(event.metadata).substring(0, 100)}...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-600 flex justify-between">
        <span>
          {getHealthIcon(health.status)} System Status: {health.status.toUpperCase()}
        </span>
        <span>{filteredEvents.length} events | Updates every 3s</span>
      </div>
    </div>
  );
}
