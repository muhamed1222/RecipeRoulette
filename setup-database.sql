-- Database setup script for outTime system

-- Create tables
-- Note: This assumes you're using the schema defined in shared/schema.ts

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Company table
CREATE TABLE IF NOT EXISTS company (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Europe/Amsterdam',
  locale TEXT NOT NULL DEFAULT 'ru',
  privacy_settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin User table
CREATE TABLE IF NOT EXISTS admin_user (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  company_id UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employee table
CREATE TABLE IF NOT EXISTS employee (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  position TEXT,
  telegram_user_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  tz TEXT, -- if differs from company
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employee Invite table
CREATE TABLE IF NOT EXISTS employee_invite (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  full_name TEXT,
  position TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used_by_employee UUID REFERENCES employee(id),
  used_at TIMESTAMPTZ
);

-- Schedule Template table
CREATE TABLE IF NOT EXISTS schedule_template (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rules JSONB NOT NULL, -- {days:[1-5], work:{start:'10:00',end:'18:00'}, breaks:[{'14:00','15:00'}]}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employee Schedule table
CREATE TABLE IF NOT EXISTS employee_schedule (
  employee_id UUID REFERENCES employee(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES schedule_template(id) ON DELETE CASCADE,
  valid_from DATE NOT NULL,
  valid_to DATE,
  PRIMARY KEY (employee_id, valid_from)
);

-- Shift table
CREATE TABLE IF NOT EXISTS shift (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employee(id) ON DELETE CASCADE,
  planned_start_at TIMESTAMPTZ NOT NULL,
  planned_end_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'done', 'missed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work Interval table
CREATE TABLE IF NOT EXISTS work_interval (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL REFERENCES shift(id) ON DELETE CASCADE,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  source TEXT NOT NULL DEFAULT 'bot' CHECK (source IN ('bot', 'auto', 'admin'))
);

-- Break Interval table
CREATE TABLE IF NOT EXISTS break_interval (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL REFERENCES shift(id) ON DELETE CASCADE,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  type TEXT NOT NULL DEFAULT 'lunch',
  source TEXT NOT NULL DEFAULT 'auto' CHECK (source IN ('bot', 'auto', 'admin'))
);

-- Daily Report table
CREATE TABLE IF NOT EXISTS daily_report (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL REFERENCES shift(id) ON DELETE CASCADE,
  planned_items TEXT[],
  done_items TEXT[],
  blockers TEXT,
  tasks_links TEXT[],
  time_spent JSONB, -- {"taskLabel": minutes}
  attachments JSONB, -- [{"name":"...", "path":"..."}, ...]
  submitted_at TIMESTAMPTZ
);

-- Exception table
CREATE TABLE IF NOT EXISTS exception (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employee(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('late', 'no_report', 'short_day', 'long_break', 'no_show')),
  severity INT NOT NULL DEFAULT 1,
  details JSONB,
  resolved_at TIMESTAMPTZ
);

-- Reminder table
CREATE TABLE IF NOT EXISTS reminder (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employee(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('pre_start', 'lunch_start', 'lunch_end', 'pre_end', 'end_report')),
  planned_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ
);

-- Audit Log table
CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  at TIMESTAMPTZ DEFAULT NOW(),
  actor TEXT NOT NULL,   -- 'tg:<user_id>' | 'admin:<auth.uid>'
  action TEXT NOT NULL,  -- 'start_shift' | 'submit_report' | ...
  entity TEXT NOT NULL,  -- 'shift:uuid' ...
  payload JSONB
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_shift_employee_planned ON shift(employee_id, planned_start_at);
CREATE INDEX IF NOT EXISTS idx_work_interval_shift_start ON work_interval(shift_id, start_at);
CREATE INDEX IF NOT EXISTS idx_break_interval_shift_start ON break_interval(shift_id, start_at);
CREATE INDEX IF NOT EXISTS idx_exception_employee_date ON exception(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_reminder_planned ON reminder(planned_at);
CREATE INDEX IF NOT EXISTS idx_daily_report_shift ON daily_report(shift_id);

-- Enable RLS on all tables except audit_log
ALTER TABLE company ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_invite ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_interval ENABLE ROW LEVEL SECURITY;
ALTER TABLE break_interval ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_report ENABLE ROW LEVEL SECURITY;
ALTER TABLE exception ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder ENABLE ROW LEVEL SECURITY;

-- Company policies
DROP POLICY IF EXISTS read_company_same_admin ON company;
CREATE POLICY read_company_same_admin
ON company FOR SELECT
USING (id = (SELECT company_id FROM admin_user WHERE id = auth.uid()));

DROP POLICY IF EXISTS write_company_same_admin ON company;
CREATE POLICY write_company_same_admin
ON company FOR INSERT
WITH CHECK (id = (SELECT company_id FROM admin_user WHERE id = auth.uid()));

DROP POLICY IF EXISTS update_company_same_admin ON company;
CREATE POLICY update_company_same_admin
ON company FOR UPDATE
USING (id = (SELECT company_id FROM admin_user WHERE id = auth.uid()));

-- Admin User policies
DROP POLICY IF EXISTS read_admin_user_same_company ON admin_user;
CREATE POLICY read_admin_user_same_company
ON admin_user FOR SELECT
USING (company_id = (SELECT company_id FROM admin_user WHERE id = auth.uid()));

DROP POLICY IF EXISTS write_admin_user_same_company ON admin_user;
CREATE POLICY write_admin_user_same_company
ON admin_user FOR INSERT
WITH CHECK (company_id = (SELECT company_id FROM admin_user WHERE id = auth.uid()));

DROP POLICY IF EXISTS update_admin_user_same_company ON admin_user;
CREATE POLICY update_admin_user_same_company
ON admin_user FOR UPDATE
USING (company_id = (SELECT company_id FROM admin_user WHERE id = auth.uid()));

-- Employee policies
DROP POLICY IF EXISTS read_employee_same_company ON employee;
CREATE POLICY read_employee_same_company
ON employee FOR SELECT
USING (company_id = (SELECT company_id FROM admin_user WHERE id = auth.uid()));

DROP POLICY IF EXISTS write_employee_same_company ON employee;
CREATE POLICY write_employee_same_company
ON employee FOR INSERT
WITH CHECK (company_id = (SELECT company_id FROM admin_user WHERE id = auth.uid()));

DROP POLICY IF EXISTS update_employee_same_company ON employee;
CREATE POLICY update_employee_same_company
ON employee FOR UPDATE
USING (company_id = (SELECT company_id FROM admin_user WHERE id = auth.uid()));

-- Employee Invite policies
DROP POLICY IF EXISTS read_employee_invite_same_company ON employee_invite;
CREATE POLICY read_employee_invite_same_company
ON employee_invite FOR SELECT
USING (company_id = (SELECT company_id FROM admin_user WHERE id = auth.uid()));

DROP POLICY IF EXISTS write_employee_invite_same_company ON employee_invite;
CREATE POLICY write_employee_invite_same_company
ON employee_invite FOR INSERT
WITH CHECK (company_id = (SELECT company_id FROM admin_user WHERE id = auth.uid()));

DROP POLICY IF EXISTS update_employee_invite_same_company ON employee_invite;
CREATE POLICY update_employee_invite_same_company
ON employee_invite FOR UPDATE
USING (company_id = (SELECT company_id FROM admin_user WHERE id = auth.uid()));

-- Schedule Template policies
DROP POLICY IF EXISTS read_schedule_template_same_company ON schedule_template;
CREATE POLICY read_schedule_template_same_company
ON schedule_template FOR SELECT
USING (company_id = (SELECT company_id FROM admin_user WHERE id = auth.uid()));

DROP POLICY IF EXISTS write_schedule_template_same_company ON schedule_template;
CREATE POLICY write_schedule_template_same_company
ON schedule_template FOR INSERT
WITH CHECK (company_id = (SELECT company_id FROM admin_user WHERE id = auth.uid()));

DROP POLICY IF EXISTS update_schedule_template_same_company ON schedule_template;
CREATE POLICY update_schedule_template_same_company
ON schedule_template FOR UPDATE
USING (company_id = (SELECT company_id FROM admin_user WHERE id = auth.uid()));

-- Employee Schedule policies
DROP POLICY IF EXISTS read_employee_schedule_same_company ON employee_schedule;
CREATE POLICY read_employee_schedule_same_company
ON employee_schedule FOR SELECT
USING (EXISTS (
  SELECT 1
  FROM employee e
  JOIN admin_user a ON e.company_id = a.company_id
  WHERE e.id = employee_schedule.employee_id
    AND a.id = auth.uid()
));

DROP POLICY IF EXISTS write_employee_schedule_same_company ON employee_schedule;
CREATE POLICY write_employee_schedule_same_company
ON employee_schedule FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1
  FROM employee e
  JOIN admin_user a ON e.company_id = a.company_id
  WHERE e.id = employee_schedule.employee_id
    AND a.id = auth.uid()
));

DROP POLICY IF EXISTS update_employee_schedule_same_company ON employee_schedule;
CREATE POLICY update_employee_schedule_same_company
ON employee_schedule FOR UPDATE
USING (EXISTS (
  SELECT 1
  FROM employee e
  JOIN admin_user a ON e.company_id = a.company_id
  WHERE e.id = employee_schedule.employee_id
    AND a.id = auth.uid()
));

-- Shift policies
DROP POLICY IF EXISTS read_shift_same_company ON shift;
CREATE POLICY read_shift_same_company
ON shift FOR SELECT
USING (EXISTS (
  SELECT 1
  FROM employee e
  JOIN admin_user a ON e.company_id = a.company_id
  WHERE e.id = shift.employee_id
    AND a.id = auth.uid()
));

DROP POLICY IF EXISTS write_shift_same_company ON shift;
CREATE POLICY write_shift_same_company
ON shift FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1
  FROM employee e
  JOIN admin_user a ON e.company_id = a.company_id
  WHERE e.id = shift.employee_id
    AND a.id = auth.uid()
));

DROP POLICY IF EXISTS update_shift_same_company ON shift;
CREATE POLICY update_shift_same_company
ON shift FOR UPDATE
USING (EXISTS (
  SELECT 1
  FROM employee e
  JOIN admin_user a ON e.company_id = a.company_id
  WHERE e.id = shift.employee_id
    AND a.id = auth.uid()
));

-- Work Interval policies
DROP POLICY IF EXISTS read_work_interval_same_company ON work_interval;
CREATE POLICY read_work_interval_same_company
ON work_interval FOR SELECT
USING (EXISTS (
  SELECT 1
  FROM shift s
  JOIN employee e ON s.employee_id = e.id
  JOIN admin_user a ON e.company_id = a.company_id
  WHERE s.id = work_interval.shift_id
    AND a.id = auth.uid()
));

DROP POLICY IF EXISTS write_work_interval_same_company ON work_interval;
CREATE POLICY write_work_interval_same_company
ON work_interval FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1
  FROM shift s
  JOIN employee e ON s.employee_id = e.id
  JOIN admin_user a ON e.company_id = a.company_id
  WHERE s.id = work_interval.shift_id
    AND a.id = auth.uid()
));

DROP POLICY IF EXISTS update_work_interval_same_company ON work_interval;
CREATE POLICY update_work_interval_same_company
ON work_interval FOR UPDATE
USING (EXISTS (
  SELECT 1
  FROM shift s
  JOIN employee e ON s.employee_id = e.id
  JOIN admin_user a ON e.company_id = a.company_id
  WHERE s.id = work_interval.shift_id
    AND a.id = auth.uid()
));

-- Break Interval policies
DROP POLICY IF EXISTS read_break_interval_same_company ON break_interval;
CREATE POLICY read_break_interval_same_company
ON break_interval FOR SELECT
USING (EXISTS (
  SELECT 1
  FROM shift s
  JOIN employee e ON s.employee_id = e.id
  JOIN admin_user a ON e.company_id = a.company_id
  WHERE s.id = break_interval.shift_id
    AND a.id = auth.uid()
));

DROP POLICY IF EXISTS write_break_interval_same_company ON break_interval;
CREATE POLICY write_break_interval_same_company
ON break_interval FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1
  FROM shift s
  JOIN employee e ON s.employee_id = e.id
  JOIN admin_user a ON e.company_id = a.company_id
  WHERE s.id = break_interval.shift_id
    AND a.id = auth.uid()
));

DROP POLICY IF EXISTS update_break_interval_same_company ON break_interval;
CREATE POLICY update_break_interval_same_company
ON break_interval FOR UPDATE
USING (EXISTS (
  SELECT 1
  FROM shift s
  JOIN employee e ON s.employee_id = e.id
  JOIN admin_user a ON e.company_id = a.company_id
  WHERE s.id = break_interval.shift_id
    AND a.id = auth.uid()
));

-- Daily Report policies
DROP POLICY IF EXISTS read_daily_report_same_company ON daily_report;
CREATE POLICY read_daily_report_same_company
ON daily_report FOR SELECT
USING (EXISTS (
  SELECT 1
  FROM shift s
  JOIN employee e ON s.employee_id = e.id
  JOIN admin_user a ON e.company_id = a.company_id
  WHERE s.id = daily_report.shift_id
    AND a.id = auth.uid()
));

DROP POLICY IF EXISTS write_daily_report_same_company ON daily_report;
CREATE POLICY write_daily_report_same_company
ON daily_report FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1
  FROM shift s
  JOIN employee e ON s.employee_id = e.id
  JOIN admin_user a ON e.company_id = a.company_id
  WHERE s.id = daily_report.shift_id
    AND a.id = auth.uid()
));

DROP POLICY IF EXISTS update_daily_report_same_company ON daily_report;
CREATE POLICY update_daily_report_same_company
ON daily_report FOR UPDATE
USING (EXISTS (
  SELECT 1
  FROM shift s
  JOIN employee e ON s.employee_id = e.id
  JOIN admin_user a ON e.company_id = a.company_id
  WHERE s.id = daily_report.shift_id
    AND a.id = auth.uid()
));

-- Exception policies
DROP POLICY IF EXISTS read_exception_same_company ON exception;
CREATE POLICY read_exception_same_company
ON exception FOR SELECT
USING (EXISTS (
  SELECT 1
  FROM employee e
  JOIN admin_user a ON e.company_id = a.company_id
  WHERE e.id = exception.employee_id
    AND a.id = auth.uid()
));

DROP POLICY IF EXISTS write_exception_same_company ON exception;
CREATE POLICY write_exception_same_company
ON exception FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1
  FROM employee e
  JOIN admin_user a ON e.company_id = a.company_id
  WHERE e.id = exception.employee_id
    AND a.id = auth.uid()
));

DROP POLICY IF EXISTS update_exception_same_company ON exception;
CREATE POLICY update_exception_same_company
ON exception FOR UPDATE
USING (EXISTS (
  SELECT 1
  FROM employee e
  JOIN admin_user a ON e.company_id = a.company_id
  WHERE e.id = exception.employee_id
    AND a.id = auth.uid()
));

-- Reminder policies
DROP POLICY IF EXISTS read_reminder_same_company ON reminder;
CREATE POLICY read_reminder_same_company
ON reminder FOR SELECT
USING (EXISTS (
  SELECT 1
  FROM employee e
  JOIN admin_user a ON e.company_id = a.company_id
  WHERE e.id = reminder.employee_id
    AND a.id = auth.uid()
));

DROP POLICY IF EXISTS write_reminder_same_company ON reminder;
CREATE POLICY write_reminder_same_company
ON reminder FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1
  FROM employee e
  JOIN admin_user a ON e.company_id = a.company_id
  WHERE e.id = reminder.employee_id
    AND a.id = auth.uid()
));

DROP POLICY IF EXISTS update_reminder_same_company ON reminder;
CREATE POLICY update_reminder_same_company
ON reminder FOR UPDATE
USING (EXISTS (
  SELECT 1
  FROM employee e
  JOIN admin_user a ON e.company_id = a.company_id
  WHERE e.id = reminder.employee_id
    AND a.id = auth.uid()
));

-- Create initial company and admin user (example)
-- INSERT INTO company (name) VALUES ('Example Company');
-- INSERT INTO admin_user (id, company_id, role) VALUES (auth.uid(), (SELECT id FROM company LIMIT 1), 'owner');
