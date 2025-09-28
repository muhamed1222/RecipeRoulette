-- RLS Policies for outTime system

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
CREATE POLICY read_company_same_admin
ON company FOR SELECT
USING (id = (SELECT company_id FROM admin_user WHERE id = auth.uid()));

CREATE POLICY write_company_same_admin
ON company FOR INSERT WITH CHECK (id = (SELECT company_id FROM admin_user WHERE id = auth.uid()));

CREATE POLICY update_company_same_admin
ON company FOR UPDATE USING (id = (SELECT company_id FROM admin_user WHERE id = auth.uid()));

-- Admin User policies
CREATE POLICY read_admin_user_same_company
ON admin_user FOR SELECT
USING (company_id = (SELECT company_id FROM admin_user WHERE id = auth.uid()));

CREATE POLICY write_admin_user_same_company
ON admin_user FOR INSERT WITH CHECK (company_id = (SELECT company_id FROM admin_user WHERE id = auth.uid()));

CREATE POLICY update_admin_user_same_company
ON admin_user FOR UPDATE USING (company_id = (SELECT company_id FROM admin_user WHERE id = auth.uid()));

-- Employee policies
CREATE POLICY read_employee_same_company
ON employee FOR SELECT
USING (company_id = (SELECT company_id FROM admin_user WHERE id = auth.uid()));

CREATE POLICY write_employee_same_company
ON employee FOR INSERT WITH CHECK (company_id = (SELECT company_id FROM admin_user WHERE id = auth.uid()));

CREATE POLICY update_employee_same_company
ON employee FOR UPDATE USING (company_id = (SELECT company_id FROM admin_user WHERE id = auth.uid()));

-- Employee Invite policies
CREATE POLICY read_employee_invite_same_company
ON employee_invite FOR SELECT
USING (company_id = (SELECT company_id FROM admin_user WHERE id = auth.uid()));

CREATE POLICY write_employee_invite_same_company
ON employee_invite FOR INSERT WITH CHECK (company_id = (SELECT company_id FROM admin_user WHERE id = auth.uid()));

CREATE POLICY update_employee_invite_same_company
ON employee_invite FOR UPDATE USING (company_id = (SELECT company_id FROM admin_user WHERE id = auth.uid()));

-- Schedule Template policies
CREATE POLICY read_schedule_template_same_company
ON schedule_template FOR SELECT
USING (company_id = (SELECT company_id FROM admin_user WHERE id = auth.uid()));

CREATE POLICY write_schedule_template_same_company
ON schedule_template FOR INSERT WITH CHECK (company_id = (SELECT company_id FROM admin_user WHERE id = auth.uid()));

CREATE POLICY update_schedule_template_same_company
ON schedule_template FOR UPDATE USING (company_id = (SELECT company_id FROM admin_user WHERE id = auth.uid()));

-- Employee Schedule policies
CREATE POLICY read_employee_schedule_same_company
ON employee_schedule FOR SELECT
USING (EXISTS (SELECT 1 FROM employee e JOIN admin_user a ON e.company_id = a.company_id WHERE e.id = employee_schedule.employee_id AND a.id = auth.uid()));

CREATE POLICY write_employee_schedule_same_company
ON employee_schedule FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM employee e JOIN admin_user a ON e.company_id = a.company_id WHERE e.id = employee_schedule.employee_id AND a.id = auth.uid()));

CREATE POLICY update_employee_schedule_same_company
ON employee_schedule FOR UPDATE USING (EXISTS (SELECT 1 FROM employee e JOIN admin_user a ON e.company_id = a.company_id WHERE e.id = employee_schedule.employee_id AND a.id = auth.uid()));

-- Shift policies
CREATE POLICY read_shift_same_company
ON shift FOR SELECT
USING (EXISTS (SELECT 1 FROM employee e JOIN admin_user a ON e.company_id = a.company_id WHERE e.id = shift.employee_id AND a.id = auth.uid()));

CREATE POLICY write_shift_same_company
ON shift FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM employee e JOIN admin_user a ON e.company_id = a.company_id WHERE e.id = shift.employee_id AND a.id = auth.uid()));

CREATE POLICY update_shift_same_company
ON shift FOR UPDATE USING (EXISTS (SELECT 1 FROM employee e JOIN admin_user a ON e.company_id = a.company_id WHERE e.id = shift.employee_id AND a.id = auth.uid()));

-- Work Interval policies
CREATE POLICY read_work_interval_same_company
ON work_interval FOR SELECT
USING (EXISTS (SELECT 1 FROM shift s JOIN employee e JOIN admin_user a ON s.employee_id = e.id AND e.company_id = a.company_id WHERE s.id = work_interval.shift_id AND a.id = auth.uid()));

CREATE POLICY write_work_interval_same_company
ON work_interval FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM shift s JOIN employee e JOIN admin_user a ON s.employee_id = e.id AND e.company_id = a.company_id WHERE s.id = work_interval.shift_id AND a.id = auth.uid()));

CREATE POLICY update_work_interval_same_company
ON work_interval FOR UPDATE USING (EXISTS (SELECT 1 FROM shift s JOIN employee e JOIN admin_user a ON s.employee_id = e.id AND e.company_id = a.company_id WHERE s.id = work_interval.shift_id AND a.id = auth.uid()));

-- Break Interval policies
CREATE POLICY read_break_interval_same_company
ON break_interval FOR SELECT
USING (EXISTS (SELECT 1 FROM shift s JOIN employee e JOIN admin_user a ON s.employee_id = e.id AND e.company_id = a.company_id WHERE s.id = break_interval.shift_id AND a.id = auth.uid()));

CREATE POLICY write_break_interval_same_company
ON break_interval FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM shift s JOIN employee e JOIN admin_user a ON s.employee_id = e.id AND e.company_id = a.company_id WHERE s.id = break_interval.shift_id AND a.id = auth.uid()));

CREATE POLICY update_break_interval_same_company
ON break_interval FOR UPDATE USING (EXISTS (SELECT 1 FROM shift s JOIN employee e JOIN admin_user a ON s.employee_id = e.id AND e.company_id = a.company_id WHERE s.id = break_interval.shift_id AND a.id = auth.uid()));

-- Daily Report policies
CREATE POLICY read_daily_report_same_company
ON daily_report FOR SELECT
USING (EXISTS (SELECT 1 FROM shift s JOIN employee e JOIN admin_user a ON s.employee_id = e.id AND e.company_id = a.company_id WHERE s.id = daily_report.shift_id AND a.id = auth.uid()));

CREATE POLICY write_daily_report_same_company
ON daily_report FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM shift s JOIN employee e JOIN admin_user a ON s.employee_id = e.id AND e.company_id = a.company_id WHERE s.id = daily_report.shift_id AND a.id = auth.uid()));

CREATE POLICY update_daily_report_same_company
ON daily_report FOR UPDATE USING (EXISTS (SELECT 1 FROM shift s JOIN employee e JOIN admin_user a ON s.employee_id = e.id AND e.company_id = a.company_id WHERE s.id = daily_report.shift_id AND a.id = auth.uid()));

-- Exception policies
CREATE POLICY read_exception_same_company
ON exception FOR SELECT
USING (EXISTS (SELECT 1 FROM employee e JOIN admin_user a ON e.company_id = a.company_id WHERE e.id = exception.employee_id AND a.id = auth.uid()));

CREATE POLICY write_exception_same_company
ON exception FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM employee e JOIN admin_user a ON e.company_id = a.company_id WHERE e.id = exception.employee_id AND a.id = auth.uid()));

CREATE POLICY update_exception_same_company
ON exception FOR UPDATE USING (EXISTS (SELECT 1 FROM employee e JOIN admin_user a ON e.company_id = a.company_id WHERE e.id = exception.employee_id AND a.id = auth.uid()));

-- Reminder policies
CREATE POLICY read_reminder_same_company
ON reminder FOR SELECT
USING (EXISTS (SELECT 1 FROM employee e JOIN admin_user a ON e.company_id = a.company_id WHERE e.id = reminder.employee_id AND a.id = auth.uid()));

CREATE POLICY write_reminder_same_company
ON reminder FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM employee e JOIN admin_user a ON e.company_id = a.company_id WHERE e.id = reminder.employee_id AND a.id = auth.uid()));

CREATE POLICY update_reminder_same_company
ON reminder FOR UPDATE USING (EXISTS (SELECT 1 FROM employee e JOIN admin_user a ON e.company_id = a.company_id WHERE e.id = reminder.employee_id AND a.id = auth.uid()));

-- Audit Log - No RLS policies (only insert via service role in Edge Functions)