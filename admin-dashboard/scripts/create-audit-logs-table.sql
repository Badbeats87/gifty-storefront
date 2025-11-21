-- Create audit_logs table for comprehensive operation tracking
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Operation details
  admin_user_id UUID NOT NULL,
  action_type VARCHAR(50) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'LOGIN', 'LOGOUT', etc.
  resource_type VARCHAR(50) NOT NULL, -- 'BUSINESS', 'ORDER', 'GIFT_CARD', 'USER', 'INVITE', etc.
  resource_id UUID,
  resource_name VARCHAR(255),

  -- Change tracking
  details JSONB, -- Stores before/after values, reasons, etc.
  status VARCHAR(20) NOT NULL DEFAULT 'success', -- 'success' or 'failed'
  error_message TEXT,

  -- Request context
  ip_address INET,
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Indexing for common queries
  CONSTRAINT fk_admin_user FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE CASCADE
);

-- Create indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_user_id ON audit_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON audit_logs(resource_id);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Policy: Service role can insert audit logs
CREATE POLICY "Service role can insert audit logs" ON audit_logs
  FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail of all administrative operations';
COMMENT ON COLUMN audit_logs.action_type IS 'Type of action performed (CREATE, UPDATE, DELETE, APPROVE, REJECT, LOGIN, etc.)';
COMMENT ON COLUMN audit_logs.resource_type IS 'Type of resource affected (BUSINESS, ORDER, GIFT_CARD, USER, INVITE, etc.)';
COMMENT ON COLUMN audit_logs.details IS 'JSON object storing operation details, before/after values, and metadata';
COMMENT ON COLUMN audit_logs.status IS 'Whether the operation succeeded or failed';
