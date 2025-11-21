# Monitoring & Audit Logging Setup Guide

This guide covers the monitoring and audit logging systems that have been implemented in the admin dashboard.

## ✅ Completed Implementation

### 1. Real-time Monitoring Console (`components/RealtimeConsole.tsx`)
- **Location**: `admin-dashboard/components/RealtimeConsole.tsx`
- **Features**:
  - Live event stream showing orders, errors, logins, and approvals (last 10 minutes)
  - System health metrics:
    - Database latency (simulated - see note below)
    - Error rate percentage
    - Active users count (simulated)
    - Orders per minute
  - Live/Paused toggle to control event streaming
  - Event filtering by type (All, Orders, Errors, Logins)
  - 3-second polling interval
  - Auto-scrolls when new events arrive
  - Color-coded status indicator (🟢 healthy, 🟡 warning, 🔴 critical)

**Integrated into**: `app/monitoring/page.tsx`

### 2. Audit Log Viewer (`components/AuditLogViewer.tsx`)
- **Location**: `admin-dashboard/components/AuditLogViewer.tsx`
- **Features**:
  - View all admin operations (approvals, rejections, deletions, etc.)
  - Filter by status (All, Success, Failed)
  - Expandable rows showing:
    - Admin who performed the action
    - Operation status and error messages
    - Detailed metadata (before/after values)
  - Color-coded by action type (CREATE, UPDATE, DELETE, APPROVE, REJECT, LOGIN)
  - Resource type icons for visual identification
  - IP address and timestamp tracking
  - Configurable result limit (default 20)

**Integrated into**: `app/monitoring/page.tsx`

### 3. Order History Filter (`components/OrderHistoryFilter.tsx`)
- **Location**: `admin-dashboard/components/OrderHistoryFilter.tsx`
- **Features**:
  - Date range filtering (Today, Week, Month, All)
  - Displays orders with:
    - Order date and time
    - Customer name
    - Business name
    - Order amount
    - Order status
  - Color-coded status badges
  - Loading and empty states

**Integrated into**: `app/finance/page.tsx`

### 4. Audit Logging Infrastructure

#### Database Schema
- **Table**: `audit_logs`
- **Location**: `admin-dashboard/scripts/create-audit-logs-table.sql`
- **Fields**:
  - `id` (UUID primary key)
  - `admin_user_id` - Admin who performed the action
  - `action_type` - CREATE, UPDATE, DELETE, APPROVE, REJECT, LOGIN, LOGOUT, REVOKE
  - `resource_type` - BUSINESS, APPLICATION, ORDER, GIFT_CARD, etc.
  - `resource_id` - ID of the affected resource
  - `resource_name` - Human-readable name of the resource
  - `details` (JSONB) - Before/after values for complex changes
  - `status` - 'success' or 'failed'
  - `error_message` - Error details if status is 'failed'
  - `ip_address` - Client IP address
  - `user_agent` - Browser/client info
  - `created_at`, `updated_at` - Timestamps

#### Audit Logger Utility (`lib/auditLogger.ts`)
- **Function**: `logAuditEvent(params)`
- **Parameters**:
  - `actionType`: The operation type (CREATE, DELETE, APPROVE, etc.)
  - `resourceType`: The type of resource affected
  - `resourceId`: The ID of the affected resource (optional)
  - `resourceName`: Human-readable name (optional)
  - `details`: Additional metadata (optional)
  - `ipAddress`: Client IP (optional - extracted from request headers)
  - `userAgent`: Browser info (optional - extracted from request headers)
  - `status`: 'success' or 'failed' (default: 'success')
  - `errorMessage`: Error details if failed (optional)
  - `adminUserId`: Direct admin user ID (for login events before session exists)

**Helper Functions**:
- `getClientIpFromRequest(request)` - Extract IP from request headers
- `getUserAgentFromRequest(request)` - Extract user agent from request headers

#### API Endpoints

**POST `/api/audit/log`**
- Create a new audit log entry
- Called by `logAuditEvent()` utility
- Request body includes all audit log fields
- Does NOT require authentication (called internally from other endpoints)

**POST `/api/audit/logs`**
- Fetch audit logs with optional filtering
- Request body: `{ limit?: number, status?: 'success' | 'failed' }`
- Response: Array of audit log entries with admin user details
- Gracefully returns empty array if `audit_logs` table doesn't exist yet

**POST `/api/monitoring/realtime`**
- Fetch real-time monitoring data
- Response includes:
  - `health`: System metrics (latency, error rate, active users, orders/min, status)
  - `events`: Array of recent events (orders, errors, logins, approvals)
- Data aggregated from last 10 minutes

### 5. Integrated Audit Logging

The following API routes now automatically log operations:

#### Admin Operations
- **`POST /api/admin/applications`** - Application approval ✅
  - Logs: APPROVE action with status and error tracking
- **`POST /api/admin/applications`** - Application rejection ✅
  - Logs: REJECT action with rejection reason in details
- **`DELETE /api/admin/applications`** - Application deletion ✅
  - Logs: DELETE action for each application
- **`DELETE /api/admin/businesses`** - Business deletion ✅
  - Logs: DELETE action for each business
- **`POST /api/admin/login`** - Admin login ✅
  - Logs: LOGIN action with success/failure status
  - Includes IP address and user agent

## ⚠️ Manual Setup Required

### 1. Create the Audit Logs Table

The `audit_logs` table must be created in Supabase before the system can track operations.

**Steps**:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Click "New Query"
4. Copy the entire contents of `admin-dashboard/scripts/create-audit-logs-table.sql`
5. Paste into the SQL editor
6. Click "Run"

**SQL File Location**: `admin-dashboard/scripts/create-audit-logs-table.sql`

**What it creates**:
- `audit_logs` table with proper schema
- 5 performance indexes for common query patterns
- Row-Level Security (RLS) policies for admin access
- Service role bypass for automated logging

### 2. Verify the Monitoring Page

Once the audit_logs table is created:

1. Open the admin dashboard (typically `http://localhost:3001`)
2. Navigate to the Monitoring page
3. You should see:
   - Real-time Console with event stream (will show orders if any exist)
   - Operation History showing admin operations

### 3. Optional: Adjust Polling Interval

The RealtimeConsole polls for updates every 3 seconds. To change this:

**File**: `components/RealtimeConsole.tsx`
**Line**: 88
```typescript
// Change 3000 (milliseconds) to desired interval
const interval = setInterval(fetchData, 3000);
```

### 4. Optional: Integrate Logging into Additional Routes

The following routes have NOT been integrated yet but could benefit from logging:

- `POST /api/admin/send-invite` - Create invite (should log CREATE action)
- `POST /api/admin/invites` - Revoke invite (should log REVOKE action)
- `POST /api/auth/reset-password/verify` - Password reset (should log UPDATE action)
- `POST /api/owner/gift-cards/redeem` - Gift card redemption (should log UPDATE action)

**To add logging** to these routes:
1. Import the audit logger: `import { logAuditEvent, getClientIpFromRequest, getUserAgentFromRequest } from '@/lib/auditLogger';`
2. After successful operation, call:
```typescript
await logAuditEvent({
  actionType: 'CREATE',  // or appropriate action
  resourceType: 'INVITE',  // or appropriate type
  resourceId: resourceId,
  resourceName: resourceName,
  status: 'success',
  ipAddress: getClientIpFromRequest(request),
  userAgent: getUserAgentFromRequest(request),
});
```
3. For failed operations, call the same with `status: 'failed'` and `errorMessage`

## 📊 Monitoring Features Explained

### Real-time Console
- **DB Latency**: Shows database response time in milliseconds
  - ⚠️ Currently simulated (uses `Math.random() * 200`)
  - TODO: Integrate real database latency measurement
- **Error Rate**: Percentage of failed operations in the last 10 minutes
  - Green: < 10%
  - Yellow (warning): 10-20%
  - Red (critical): > 20%
- **Active Users**: Approximate count of admin users with active sessions
  - Currently simulated
- **Orders/min**: Orders processed in the last 10 minutes
  - Helps identify traffic spikes
- **System Status**: Overall health indicator based on error rate and throughput
  - 🟢 Healthy: All metrics normal
  - 🟡 Warning: Error rate 10-20% OR orders > 50/min
  - 🔴 Critical: Error rate > 20% OR orders > 100/min

### Operation History
Shows all admin operations with:
- **Action Type**: CREATE, UPDATE, DELETE, APPROVE, REJECT, LOGIN, LOGOUT
- **Status**: Success or Failed
- **Error Details**: Full error messages for failed operations
- **Metadata**: JSON view of operation details
- **Audit Trail**: Admin, timestamp, and IP address for compliance

## 🔍 Querying Audit Logs

You can query audit logs directly in Supabase SQL Editor:

```sql
-- Last 50 operations
SELECT * FROM audit_logs
ORDER BY created_at DESC
LIMIT 50;

-- Failed operations in last 24 hours
SELECT * FROM audit_logs
WHERE status = 'failed'
  AND created_at > now() - interval '24 hours'
ORDER BY created_at DESC;

-- Operations by specific admin
SELECT * FROM audit_logs
WHERE admin_user_id = 'user-id-here'
ORDER BY created_at DESC;

-- Business deletions
SELECT * FROM audit_logs
WHERE action_type = 'DELETE' AND resource_type = 'BUSINESS'
ORDER BY created_at DESC;

-- With admin user details
SELECT
  al.*,
  au.username,
  au.email
FROM audit_logs al
LEFT JOIN admin_users au ON al.admin_user_id = au.id
ORDER BY al.created_at DESC
LIMIT 50;
```

## 🚨 Known Limitations & TODOs

1. **DB Latency is Simulated**: Currently uses `Math.random() * 200` instead of real database latency
   - Should measure actual Supabase response time
   - Could use server timing or query execution metrics

2. **Active Users Count is Simulated**: Currently uses `Math.floor(Math.random() * 10) + 1`
   - Could query `admin_sessions` table and count active sessions
   - Need to account for session expiration

3. **Polling Instead of Real-time**: Uses 3-second polling interval
   - Consider WebSocket implementation for true real-time
   - Would reduce latency and server load

4. **Limited Route Integration**: Only admin operations and login are currently logged
   - Add logging to all data modification endpoints
   - Include business owner operations (gift card redemptions, etc.)

## 📝 Testing the System

### Step 1: Create Audit Log Table
```bash
# In Supabase SQL editor, run:
# admin-dashboard/scripts/create-audit-logs-table.sql
```

### Step 2: Test Admin Login
1. Go to admin login page
2. Enter admin credentials
3. Check Monitoring > Operation History
4. Should see LOGIN operation logged

### Step 3: Test Operation Logging
1. Approve a business application
2. Check Monitoring > Operation History
3. Should see APPROVE operation with application ID
4. Click to expand and view details

### Step 4: Monitor Real-time Events
1. Go to Monitoring page
2. Watch Real-time Console
3. As operations occur, events should appear in the stream
4. Toggle Live/Paused to control updates

## 📚 Related Files

- **Components**:
  - `components/RealtimeConsole.tsx` - Real-time event monitoring
  - `components/AuditLogViewer.tsx` - Audit log display
  - `components/OrderHistoryFilter.tsx` - Order history with date filtering

- **Utilities**:
  - `lib/auditLogger.ts` - Audit logging functions
  - `lib/queries/auditLogs.ts` - Supabase query functions
  - `lib/queries/orders.ts` - Order query functions

- **API Routes**:
  - `app/api/audit/log/route.ts` - Create audit log entries
  - `app/api/audit/logs/route.ts` - Fetch audit logs
  - `app/api/monitoring/realtime/route.ts` - Real-time monitoring data

- **Database**:
  - `scripts/create-audit-logs-table.sql` - Audit logs table schema

- **Pages**:
  - `app/monitoring/page.tsx` - Monitoring dashboard
  - `app/finance/page.tsx` - Finance dashboard with order history

## 🤝 Support

If you encounter issues:

1. **Audit logs table doesn't exist**: Run the SQL migration in Supabase
2. **No events appearing**: Check that operations are being performed (approvals, logins, deletions)
3. **Timestamps look wrong**: Verify Supabase timezone configuration
4. **High latency in console**: Consider adjusting polling interval or implementing WebSocket
