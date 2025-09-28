# Testing Plan for outTime System

## Overview
This document outlines the testing plan for the outTime employee shift tracking system. The tests cover all major functionality areas including employee interactions, admin dashboard, database operations, and integration with Telegram.

## Test Environment
- Supabase project with all tables and RLS policies
- Telegram bot configured with webhook
- Web admin dashboard deployed
- Edge Functions deployed and configured

## Test Cases

### 1. Employee Functionality

#### 1.1 Normal Day Flow
**Objective**: Verify complete day flow from start to finish
**Steps**:
1. Employee receives pre-start reminder
2. Employee opens WebApp and submits plan
3. Employee starts shift via Telegram
4. Employee starts lunch break via Telegram
5. Employee ends lunch break via Telegram
6. Employee receives pre-end reminder
7. Employee opens WebApp and submits report
8. Employee finishes shift via Telegram

**Expected Results**:
- Shift, work intervals, break intervals, and daily report are created
- No exceptions are generated
- Audit logs are recorded for all actions

#### 1.2 Late Start
**Objective**: Verify late start handling
**Steps**:
1. Skip pre-start reminder
2. Wait 15 minutes past planned start time
3. Start shift via Telegram

**Expected Results**:
- Exception of type "late" is created
- Exception remains after shift completion

#### 1.3 No Report
**Objective**: Verify missing report handling
**Steps**:
1. Complete shift normally
2. Do not submit end-of-day report
3. Wait 2 hours past planned end time

**Expected Results**:
- Exception of type "no_report" is created

#### 1.4 Auto Lunch
**Objective**: Verify auto lunch break
**Steps**:
1. Start shift
2. Do not interact with lunch buttons
3. Wait for system to auto-create break

**Expected Results**:
- Planned lunch break is created with source "auto"
- Break interval matches schedule template

#### 1.5 Double Shift
**Objective**: Verify handling of multiple shifts per day
**Steps**:
1. Create two shifts for the same employee on the same day
2. Complete both shifts normally

**Expected Results**:
- Both shifts are processed independently
- Reports are associated with correct shifts

#### 1.6 Night Shift
**Objective**: Verify night shift handling
**Steps**:
1. Create shift with planned end on next day
2. Complete shift normally

**Expected Results**:
- Report is associated with start date
- All intervals are correctly recorded

#### 1.7 Status Changes
**Objective**: Verify status handling
**Steps**:
1. Set employee status to "vacation"
2. Verify no reminders are sent
3. Set employee status to "active"
4. Verify reminders resume

**Expected Results**:
- No reminders sent during vacation
- Reminders resume when status changes to active

#### 1.8 File Attachments
**Objective**: Verify file attachment handling
**Steps**:
1. Upload attachment with report
2. Access attachment via signed URL in admin

**Expected Results**:
- Attachment is uploaded to Storage
- Signed URL provides access to file
- TTL policy applies (90 days)

### 2. Admin Dashboard

#### 2.1 Authentication
**Objective**: Verify admin authentication
**Steps**:
1. Access admin dashboard without login
2. Login with valid credentials
3. Access protected routes

**Expected Results**:
- Redirected to login page when not authenticated
- Access granted after successful login
- Protected routes accessible

#### 2.2 Dashboard Views
**Objective**: Verify dashboard components
**Steps**:
1. Access dashboard
2. View exception statistics
3. View today's exceptions
4. View employee status cards

**Expected Results**:
- All dashboard components load correctly
- Data is displayed accurately
- Charts and tables show correct information

#### 2.3 Reports Section
**Objective**: Verify reports functionality
**Steps**:
1. Access reports section
2. Filter by date range
3. Filter by search term
4. Export to CSV

**Expected Results**:
- Reports are filtered correctly
- CSV export contains correct data
- Export format is valid

#### 2.4 Employee Management
**Objective**: Verify employee management
**Steps**:
1. Generate employee invite
2. View active invites
3. View employee list
4. Check employee statuses

**Expected Results**:
- Invite is generated with unique code
- Invite appears in active list
- Employee list shows correct information
- Statuses are displayed correctly

#### 2.5 Schedule Management
**Objective**: Verify schedule templates
**Steps**:
1. Create new schedule template
2. View schedule templates
3. Check template details

**Expected Results**:
- Template is created successfully
- Template appears in list
- Template details are correct

#### 2.6 Settings Management
**Objective**: Verify company settings
**Steps**:
1. Access company settings
2. Modify company name
3. Change timezone
4. Save settings

**Expected Results**:
- Settings are saved correctly
- Changes are reflected in UI
- Database is updated

### 3. Security

#### 3.1 RLS Policies
**Objective**: Verify Row Level Security
**Steps**:
1. Login as admin from company A
2. Attempt to access company B's data
3. Login as admin from company B
4. Attempt to access company A's data

**Expected Results**:
- Admin from company A cannot see company B's data
- Admin from company B cannot see company A's data
- RLS policies are enforced

#### 3.2 Telegram initData Verification
**Objective**: Verify Telegram authentication
**Steps**:
1. Make request to Edge Function without initData
2. Make request with invalid initData
3. Make request with valid initData

**Expected Results**:
- Requests without initData are rejected (403)
- Requests with invalid initData are rejected (403)
- Requests with valid initData are processed

#### 3.3 Storage Security
**Objective**: Verify Storage security
**Steps**:
1. Attempt to access file without authentication
2. Attempt to access file from different company
3. Access file with proper permissions

**Expected Results**:
- Unauthenticated access is denied
- Cross-company access is denied
- Proper access is granted

### 4. Performance

#### 4.1 Delivery Rate
**Objective**: Verify Telegram delivery rate
**Steps**:
1. Monitor Telegram message delivery
2. Check for rate limiting errors
3. Verify batch processing

**Expected Results**:
- High delivery rate (>95%)
- No rate limiting errors
- Proper batch processing with jitter

#### 4.2 CTR on Buttons
**Objective**: Verify button click-through rates
**Steps**:
1. Monitor callback responses
2. Track button clicks
3. Calculate CTR

**Expected Results**:
- Reasonable CTR on reminder buttons
- Proper tracking of interactions

#### 4.3 Business Metrics
**Objective**: Verify business metrics
**Steps**:
1. Track % of shifts with reports
2. Monitor average lateness
3. Track report completion time

**Expected Results**:
- High % of shifts with reports (>80%)
- Low average lateness
- Reasonable report completion times

## Automated Tests

### Database Tests
- Schema validation
- RLS policy testing
- Index performance testing

### API Tests
- Edge Function endpoint testing
- Authentication flow testing
- Data validation testing

### UI Tests
- Component rendering tests
- Form validation tests
- Navigation tests

## Manual Tests

### Integration Tests
- End-to-end flow testing
- Cross-component interaction testing
- Error handling testing

### User Acceptance Tests
- Admin user workflow testing
- Employee user workflow testing
- Edge case scenario testing

## Test Data

### Sample Data
- 3 companies with different configurations
- 10 employees per company
- Various schedule templates
- Historical data for reporting

### Test Accounts
- Admin accounts for each company
- Test employee Telegram accounts
- Service accounts for automation

## Test Execution

### Schedule
- Daily: Automated unit tests
- Weekly: Integration tests
- Monthly: Full system testing
- As needed: Regression tests for bug fixes

### Reporting
- Test results dashboard
- Failure tracking
- Performance metrics
- Coverage reports

## Conclusion
This comprehensive testing plan ensures that all aspects of the outTime system are thoroughly tested before deployment. Regular execution of these tests will help maintain system quality and catch issues early.