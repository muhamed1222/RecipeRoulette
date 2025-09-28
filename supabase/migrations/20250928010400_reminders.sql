-- Setup reminder system with batching and jitter for outTime system

-- Create indexes for efficient reminder queries
CREATE INDEX IF NOT EXISTS idx_reminder_planned_at ON reminder(planned_at);
CREATE INDEX IF NOT EXISTS idx_reminder_sent_at ON reminder(sent_at);
CREATE INDEX IF NOT EXISTS idx_reminder_employee_id ON reminder(employee_id);
CREATE INDEX IF NOT EXISTS idx_reminder_type ON reminder(type);

-- Create a materialized view for upcoming reminders to improve query performance
DROP MATERIALIZED VIEW IF EXISTS upcoming_reminders;
CREATE MATERIALIZED VIEW upcoming_reminders AS
SELECT 
  r.id,
  r.employee_id,
  r.type,
  r.planned_at,
  r.sent_at,
  e.telegram_user_id,
  e.full_name,
  e.status as employee_status
FROM reminder r
JOIN employee e ON r.employee_id = e.id
WHERE r.sent_at IS NULL
AND e.status = 'active'
AND r.planned_at >= NOW() - INTERVAL '1 hour'
AND r.planned_at <= NOW() + INTERVAL '24 hours'
ORDER BY r.planned_at;

-- Create index for the materialized view
CREATE INDEX IF NOT EXISTS idx_upcoming_reminders_planned_at ON upcoming_reminders(planned_at);
CREATE INDEX IF NOT EXISTS idx_upcoming_reminders_employee_id ON upcoming_reminders(employee_id);

-- Refresh the materialized view periodically
-- This would typically be done by a cron job or the scheduler function

-- Example of how to refresh the materialized view:
-- REFRESH MATERIALIZED VIEW upcoming_reminders;

-- Create a function to get reminders that need to be sent
CREATE OR REPLACE FUNCTION get_pending_reminders(batch_size INTEGER DEFAULT 25)
RETURNS TABLE (
  id UUID,
  employee_id UUID,
  type TEXT,
  planned_at TIMESTAMPTZ,
  telegram_user_id TEXT,
  full_name TEXT
)
LANGUAGE sql
AS $$
  SELECT 
    ur.id,
    ur.employee_id,
    ur.type,
    ur.planned_at,
    ur.telegram_user_id,
    ur.full_name
  FROM upcoming_reminders ur
  WHERE ur.sent_at IS NULL
  AND ur.employee_status = 'active'
  AND ur.planned_at <= NOW() + INTERVAL '10 minutes'
  ORDER BY ur.planned_at
  LIMIT batch_size;
$$;

-- Create a function to mark reminders as sent
CREATE OR REPLACE FUNCTION mark_reminders_as_sent(reminder_ids UUID[])
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE reminder 
  SET sent_at = NOW()
  WHERE id = ANY(reminder_ids);
  
  -- Refresh the materialized view to reflect changes
  REFRESH MATERIALIZED VIEW upcoming_reminders;
END;
$$;

-- These functions would be used by the scheduler/tick Edge Function
-- to efficiently batch and send reminders with jitter
