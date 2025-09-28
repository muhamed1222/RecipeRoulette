import { sql } from "drizzle-orm";
import { pgTable, text, uuid, timestamp, jsonb, primaryKey, integer, date, bigserial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Company table
export const company = pgTable("company", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  timezone: text("timezone").notNull().default('Europe/Amsterdam'),
  locale: text("locale").notNull().default('ru'),
  privacySettings: jsonb("privacy_settings").notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Admin User table
export const adminUser = pgTable("admin_user", {
  id: uuid("id").primaryKey().default(sql`auth.uid()`),
  companyId: uuid("company_id").notNull().references(() => company.id, { onDelete: "cascade" }),
  role: text("role").notNull().$type<"owner" | "admin" | "viewer">(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Employee table
export const employee = pgTable("employee", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull().references(() => company.id, { onDelete: "cascade" }),
  fullName: text("full_name").notNull(),
  position: text("position"),
  telegramUserId: text("telegram_user_id").unique(),
  status: text("status").notNull().default('active').$type<"active" | "inactive">(),
  tz: text("tz"), // if differs from company
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Employee Invite table
export const employeeInvite = pgTable("employee_invite", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull().references(() => company.id, { onDelete: "cascade" }),
  code: text("code").notNull().unique(),
  fullName: text("full_name"),
  position: text("position"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  usedByEmployee: uuid("used_by_employee").references(() => employee.id),
  usedAt: timestamp("used_at", { withTimezone: true }),
});

// Schedule Template table
export const scheduleTemplate = pgTable("schedule_template", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull().references(() => company.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  rules: jsonb("rules").notNull(), // {days:[1-5], work:{start:'10:00',end:'18:00'}, breaks:[{'14:00','15:00'}]}
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Employee Schedule table
export const employeeSchedule = pgTable("employee_schedule", {
  employeeId: uuid("employee_id").references(() => employee.id, { onDelete: "cascade" }),
  scheduleId: uuid("schedule_id").references(() => scheduleTemplate.id, { onDelete: "cascade" }),
  validFrom: date("valid_from").notNull(),
  validTo: date("valid_to"),
}, (table: any) => {
  return {
    pk: primaryKey({ columns: [table.employeeId, table.validFrom] })
  };
});

// Shift table
export const shift = pgTable("shift", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: uuid("employee_id").notNull().references(() => employee.id, { onDelete: "cascade" }),
  plannedStartAt: timestamp("planned_start_at", { withTimezone: true }).notNull(),
  plannedEndAt: timestamp("planned_end_at", { withTimezone: true }).notNull(),
  status: text("status").notNull().default('planned').$type<"planned" | "active" | "done" | "missed">(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Work Interval table
export const workInterval = pgTable("work_interval", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  shiftId: uuid("shift_id").notNull().references(() => shift.id, { onDelete: "cascade" }),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }),
  source: text("source").notNull().default('bot').$type<"bot" | "auto" | "admin">(),
});

// Break Interval table
export const breakInterval = pgTable("break_interval", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  shiftId: uuid("shift_id").notNull().references(() => shift.id, { onDelete: "cascade" }),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }),
  type: text("type").notNull().default('lunch'),
  source: text("source").notNull().default('auto').$type<"bot" | "auto" | "admin">(),
});

// Daily Report table
export const dailyReport = pgTable("daily_report", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  shiftId: uuid("shift_id").notNull().references(() => shift.id, { onDelete: "cascade" }),
  plannedItems: text("planned_items").array(),
  doneItems: text("done_items").array(),
  blockers: text("blockers"),
  tasksLinks: text("tasks_links").array(),
  timeSpent: jsonb("time_spent"), // {"taskLabel": minutes}
  attachments: jsonb("attachments"), // [{"name":"...", "path":"..."}, ...]
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
});

// Exception table
export const exception = pgTable("exception", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: uuid("employee_id").notNull().references(() => employee.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  kind: text("kind").notNull().$type<"late" | "no_report" | "short_day" | "long_break" | "no_show">(),
  severity: integer("severity").notNull().default(1),
  details: jsonb("details"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

// Reminder table
export const reminder = pgTable("reminder", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: uuid("employee_id").notNull().references(() => employee.id, { onDelete: "cascade" }),
  type: text("type").notNull().$type<"pre_start" | "lunch_start" | "lunch_end" | "pre_end" | "end_report">(),
  plannedAt: timestamp("planned_at", { withTimezone: true }).notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
});

// Audit Log table
export const auditLog = pgTable("audit_log", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  at: timestamp("at", { withTimezone: true }).defaultNow(),
  actor: text("actor").notNull(),   // 'tg:<user_id>' | 'admin:<auth.uid>'
  action: text("action").notNull(),  // 'start_shift' | 'submit_report' | ...
  entity: text("entity").notNull(),  // 'shift:uuid' ...
  payload: jsonb("payload"),
});

// Create insert schemas
export const insertCompanySchema = createInsertSchema(company);
export const insertAdminUserSchema = createInsertSchema(adminUser);
export const insertEmployeeSchema = createInsertSchema(employee);
export const insertEmployeeInviteSchema = createInsertSchema(employeeInvite);
export const insertScheduleTemplateSchema = createInsertSchema(scheduleTemplate);
export const insertEmployeeScheduleSchema = createInsertSchema(employeeSchedule);
export const insertShiftSchema = createInsertSchema(shift);
export const insertWorkIntervalSchema = createInsertSchema(workInterval);
export const insertBreakIntervalSchema = createInsertSchema(breakInterval);
export const insertDailyReportSchema = createInsertSchema(dailyReport);
export const insertExceptionSchema = createInsertSchema(exception);
export const insertReminderSchema = createInsertSchema(reminder);
export const insertAuditLogSchema = createInsertSchema(auditLog);

// Export types
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof company.$inferSelect;

export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type AdminUser = typeof adminUser.$inferSelect;

export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employee.$inferSelect;

export type InsertEmployeeInvite = z.infer<typeof insertEmployeeInviteSchema>;
export type EmployeeInvite = typeof employeeInvite.$inferSelect;

export type InsertScheduleTemplate = z.infer<typeof insertScheduleTemplateSchema>;
export type ScheduleTemplate = typeof scheduleTemplate.$inferSelect;

export type InsertEmployeeSchedule = z.infer<typeof insertEmployeeScheduleSchema>;
export type EmployeeSchedule = typeof employeeSchedule.$inferSelect;

export type InsertShift = z.infer<typeof insertShiftSchema>;
export type Shift = typeof shift.$inferSelect;

export type InsertWorkInterval = z.infer<typeof insertWorkIntervalSchema>;
export type WorkInterval = typeof workInterval.$inferSelect;

export type InsertBreakInterval = z.infer<typeof insertBreakIntervalSchema>;
export type BreakInterval = typeof breakInterval.$inferSelect;

export type InsertDailyReport = z.infer<typeof insertDailyReportSchema>;
export type DailyReport = typeof dailyReport.$inferSelect;

export type InsertException = z.infer<typeof insertExceptionSchema>;
export type Exception = typeof exception.$inferSelect;

export type InsertReminder = z.infer<typeof insertReminderSchema>;
export type Reminder = typeof reminder.$inferSelect;

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLog.$inferSelect;