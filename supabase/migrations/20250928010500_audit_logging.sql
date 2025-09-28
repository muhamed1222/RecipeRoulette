-- Setup audit logging functionality for outTime system

-- Create indexes for efficient audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_log_at ON audit_log(at);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(actor);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity);

-- Create a function to insert audit logs
-- This function would be called by the Edge Functions
CREATE OR REPLACE FUNCTION insert_audit_log(
  actor TEXT,
  action TEXT,
  entity TEXT,
  payload JSONB
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO audit_log (actor, action, entity, payload)
  VALUES (actor, action, entity, payload);
END;
$$;

-- Create a materialized view for audit log statistics
DROP MATERIALIZED VIEW IF EXISTS audit_log_stats;
CREATE MATERIALIZED VIEW audit_log_stats AS
SELECT 
  action,
  COUNT(*) as count,
  MIN(at) as first_occurrence,
  MAX(at) as last_occurrence
FROM audit_log
GROUP BY action
ORDER BY count DESC;

-- Create index for the materialized view
CREATE INDEX IF NOT EXISTS idx_audit_log_stats_action ON audit_log_stats(action);

-- Refresh the materialized view periodically
-- This would typically be done by a cron job

-- Example of how to refresh the materialized view:
-- REFRESH MATERIALIZED VIEW audit_log_stats;

-- Create a function to get recent audit logs
CREATE OR REPLACE FUNCTION get_recent_audit_logs(limit_count INTEGER DEFAULT 50)
RETURNS TABLE (
  id BIGINT,
  at TIMESTAMPTZ,
  actor TEXT,
  action TEXT,
  entity TEXT,
  payload JSONB
)
LANGUAGE sql
AS $$
  SELECT 
    al.id,
    al.at,
    al.actor,
    al.action,
    al.entity,
    al.payload
  FROM audit_log al
  ORDER BY al.at DESC
  LIMIT limit_count;
$$;

-- Create a function to get audit logs for a specific entity
CREATE OR REPLACE FUNCTION get_audit_logs_for_entity(entity_id TEXT)
RETURNS TABLE (
  id BIGINT,
  at TIMESTAMPTZ,
  actor TEXT,
  action TEXT,
  entity TEXT,
  payload JSONB
)
LANGUAGE sql
AS $$
  SELECT 
    al.id,
    al.at,
    al.actor,
    al.action,
    al.entity,
    al.payload
  FROM audit_log al
  WHERE al.entity = entity_id
  ORDER BY al.at DESC;
$$;

-- These functions would be used by the admin dashboard
-- to display audit logs and statistics
