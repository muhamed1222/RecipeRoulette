-- Fix recursive RLS policies and add helper RPCs

-- Helper function to resolve current admin's company without triggering RLS recursion
create or replace function public.current_admin_company_id()
returns uuid
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_company_id uuid;
begin
  select a.company_id
  into v_company_id
  from admin_user a
  where a.id = auth.uid();

  return v_company_id;
end;
$$;

grant execute on function public.current_admin_company_id() to authenticated, service_role, anon;

-- RPC used by tooling/tests
create or replace function public.now()
returns timestamptz
language sql
stable
as $$
  select now();
$$;

grant execute on function public.now() to authenticated, service_role, anon;

-- Company policies
drop policy if exists read_company_same_admin on company;
drop policy if exists write_company_same_admin on company;
drop policy if exists update_company_same_admin on company;
create policy read_company_same_admin
  on company for select
  using (id = public.current_admin_company_id());
create policy write_company_same_admin
  on company for insert
  with check (id = public.current_admin_company_id());
create policy update_company_same_admin
  on company for update
  using (id = public.current_admin_company_id());

-- Admin user policies
drop policy if exists read_admin_user_same_company on admin_user;
drop policy if exists write_admin_user_same_company on admin_user;
drop policy if exists update_admin_user_same_company on admin_user;
create policy read_admin_user_same_company
  on admin_user for select
  using (
    company_id = public.current_admin_company_id()
    or id = auth.uid()
  );
create policy write_admin_user_same_company
  on admin_user for insert
  with check (company_id = public.current_admin_company_id());
create policy update_admin_user_same_company
  on admin_user for update
  using (company_id = public.current_admin_company_id());

-- Employee policies
drop policy if exists read_employee_same_company on employee;
drop policy if exists write_employee_same_company on employee;
drop policy if exists update_employee_same_company on employee;
create policy read_employee_same_company
  on employee for select
  using (company_id = public.current_admin_company_id());
create policy write_employee_same_company
  on employee for insert
  with check (company_id = public.current_admin_company_id());
create policy update_employee_same_company
  on employee for update
  using (company_id = public.current_admin_company_id());

-- Employee invite policies
drop policy if exists read_employee_invite_same_company on employee_invite;
drop policy if exists write_employee_invite_same_company on employee_invite;
drop policy if exists update_employee_invite_same_company on employee_invite;
create policy read_employee_invite_same_company
  on employee_invite for select
  using (company_id = public.current_admin_company_id());
create policy write_employee_invite_same_company
  on employee_invite for insert
  with check (company_id = public.current_admin_company_id());
create policy update_employee_invite_same_company
  on employee_invite for update
  using (company_id = public.current_admin_company_id());

-- Schedule template policies
drop policy if exists read_schedule_template_same_company on schedule_template;
drop policy if exists write_schedule_template_same_company on schedule_template;
drop policy if exists update_schedule_template_same_company on schedule_template;
create policy read_schedule_template_same_company
  on schedule_template for select
  using (company_id = public.current_admin_company_id());
create policy write_schedule_template_same_company
  on schedule_template for insert
  with check (company_id = public.current_admin_company_id());
create policy update_schedule_template_same_company
  on schedule_template for update
  using (company_id = public.current_admin_company_id());

-- Employee schedule policies
drop policy if exists read_employee_schedule_same_company on employee_schedule;
drop policy if exists write_employee_schedule_same_company on employee_schedule;
drop policy if exists update_employee_schedule_same_company on employee_schedule;
create policy read_employee_schedule_same_company
  on employee_schedule for select
  using (
    exists (
      select 1
      from employee e
      where e.id = employee_schedule.employee_id
        and e.company_id = public.current_admin_company_id()
    )
  );
create policy write_employee_schedule_same_company
  on employee_schedule for insert
  with check (
    exists (
      select 1
      from employee e
      where e.id = employee_schedule.employee_id
        and e.company_id = public.current_admin_company_id()
    )
  );
create policy update_employee_schedule_same_company
  on employee_schedule for update
  using (
    exists (
      select 1
      from employee e
      where e.id = employee_schedule.employee_id
        and e.company_id = public.current_admin_company_id()
    )
  );

-- Shift policies
drop policy if exists read_shift_same_company on shift;
drop policy if exists write_shift_same_company on shift;
drop policy if exists update_shift_same_company on shift;
create policy read_shift_same_company
  on shift for select
  using (
    exists (
      select 1
      from employee e
      where e.id = shift.employee_id
        and e.company_id = public.current_admin_company_id()
    )
  );
create policy write_shift_same_company
  on shift for insert
  with check (
    exists (
      select 1
      from employee e
      where e.id = shift.employee_id
        and e.company_id = public.current_admin_company_id()
    )
  );
create policy update_shift_same_company
  on shift for update
  using (
    exists (
      select 1
      from employee e
      where e.id = shift.employee_id
        and e.company_id = public.current_admin_company_id()
    )
  );

-- Work interval policies
drop policy if exists read_work_interval_same_company on work_interval;
drop policy if exists write_work_interval_same_company on work_interval;
drop policy if exists update_work_interval_same_company on work_interval;
create policy read_work_interval_same_company
  on work_interval for select
  using (
    exists (
      select 1
      from shift s
      join employee e on e.id = s.employee_id
      where s.id = work_interval.shift_id
        and e.company_id = public.current_admin_company_id()
    )
  );
create policy write_work_interval_same_company
  on work_interval for insert
  with check (
    exists (
      select 1
      from shift s
      join employee e on e.id = s.employee_id
      where s.id = work_interval.shift_id
        and e.company_id = public.current_admin_company_id()
    )
  );
create policy update_work_interval_same_company
  on work_interval for update
  using (
    exists (
      select 1
      from shift s
      join employee e on e.id = s.employee_id
      where s.id = work_interval.shift_id
        and e.company_id = public.current_admin_company_id()
    )
  );

-- Break interval policies
drop policy if exists read_break_interval_same_company on break_interval;
drop policy if exists write_break_interval_same_company on break_interval;
drop policy if exists update_break_interval_same_company on break_interval;
create policy read_break_interval_same_company
  on break_interval for select
  using (
    exists (
      select 1
      from shift s
      join employee e on e.id = s.employee_id
      where s.id = break_interval.shift_id
        and e.company_id = public.current_admin_company_id()
    )
  );
create policy write_break_interval_same_company
  on break_interval for insert
  with check (
    exists (
      select 1
      from shift s
      join employee e on e.id = s.employee_id
      where s.id = break_interval.shift_id
        and e.company_id = public.current_admin_company_id()
    )
  );
create policy update_break_interval_same_company
  on break_interval for update
  using (
    exists (
      select 1
      from shift s
      join employee e on e.id = s.employee_id
      where s.id = break_interval.shift_id
        and e.company_id = public.current_admin_company_id()
    )
  );

-- Daily report policies
drop policy if exists read_daily_report_same_company on daily_report;
drop policy if exists write_daily_report_same_company on daily_report;
drop policy if exists update_daily_report_same_company on daily_report;
create policy read_daily_report_same_company
  on daily_report for select
  using (
    exists (
      select 1
      from shift s
      join employee e on e.id = s.employee_id
      where s.id = daily_report.shift_id
        and e.company_id = public.current_admin_company_id()
    )
  );
create policy write_daily_report_same_company
  on daily_report for insert
  with check (
    exists (
      select 1
      from shift s
      join employee e on e.id = s.employee_id
      where s.id = daily_report.shift_id
        and e.company_id = public.current_admin_company_id()
    )
  );
create policy update_daily_report_same_company
  on daily_report for update
  using (
    exists (
      select 1
      from shift s
      join employee e on e.id = s.employee_id
      where s.id = daily_report.shift_id
        and e.company_id = public.current_admin_company_id()
    )
  );

-- Exception policies
drop policy if exists read_exception_same_company on exception;
drop policy if exists write_exception_same_company on exception;
drop policy if exists update_exception_same_company on exception;
create policy read_exception_same_company
  on exception for select
  using (
    exists (
      select 1
      from employee e
      where e.id = exception.employee_id
        and e.company_id = public.current_admin_company_id()
    )
  );
create policy write_exception_same_company
  on exception for insert
  with check (
    exists (
      select 1
      from employee e
      where e.id = exception.employee_id
        and e.company_id = public.current_admin_company_id()
    )
  );
create policy update_exception_same_company
  on exception for update
  using (
    exists (
      select 1
      from employee e
      where e.id = exception.employee_id
        and e.company_id = public.current_admin_company_id()
    )
  );

-- Reminder policies
drop policy if exists read_reminder_same_company on reminder;
drop policy if exists write_reminder_same_company on reminder;
drop policy if exists update_reminder_same_company on reminder;
create policy read_reminder_same_company
  on reminder for select
  using (
    exists (
      select 1
      from employee e
      where e.id = reminder.employee_id
        and e.company_id = public.current_admin_company_id()
    )
  );
create policy write_reminder_same_company
  on reminder for insert
  with check (
    exists (
      select 1
      from employee e
      where e.id = reminder.employee_id
        and e.company_id = public.current_admin_company_id()
    )
  );
create policy update_reminder_same_company
  on reminder for update
  using (
    exists (
      select 1
      from employee e
      where e.id = reminder.employee_id
        and e.company_id = public.current_admin_company_id()
    )
  );
