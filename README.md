# outTime

A free-tier employee shift tracking system that integrates with Telegram bots and provides a web admin dashboard.

## Features

- Employee shift tracking (start/break/finish)
- Daily reporting through Telegram WebApp
- Automated reminders via Telegram
- Web admin dashboard for managers
- Built entirely on Supabase free tier

## Architecture

### Database (Supabase PostgreSQL)
- Company management
- Employee scheduling
- Shift tracking
- Work intervals and breaks
- Daily reports
- Exception handling
- Reminders system

### Backend (Supabase Edge Functions)
- `/tg/webhook` - Telegram bot webhook handler
- `/webapp/submit` - WebApp form submissions
- `/scheduler/tick` - Cron job for reminders (every 5 minutes)
- `/admin/invite` - Employee invite generation

### Frontend
- Telegram WebApp for employees
- Web admin dashboard (React + Vite)
- Supabase Auth for admin authentication

## Setup

1. Create a Supabase project
2. Set up the database schema using the SQL files
3. Deploy Edge Functions
4. Create a Telegram bot and set webhook
5. Configure environment variables
6. Deploy web admin dashboard to Vercel

## Deployment

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

## Database Setup

If you're having trouble with the Supabase CLI, you can manually set up the database using the instructions in [setup-database-instructions.md](setup-database-instructions.md).

## Environment Variables

See [.env.example](.env.example) for required environment variables.

## Supabase Functions

All functions are located in the `supabase/functions` directory:

- `tg/webhook.ts` - Handles Telegram bot interactions
- `webapp/submit.ts` - Processes WebApp form submissions
- `scheduler/tick.ts` - Runs every 5 minutes to send reminders
- `admin/invite.ts` - Generates employee invites

## Database Schema

The database schema is defined in [shared/schema.ts](shared/schema.ts) and includes:

- Company management
- Admin users with roles (owner, admin, viewer)
- Employee records with Telegram integration
- Employee invite system
- Schedule templates
- Employee schedules
- Shift tracking
- Work intervals
- Break intervals
- Daily reports
- Exception tracking
- Reminder system
- Audit logging

## RLS Policies

Row Level Security policies are defined in [server/rls-policies.sql](server/rls-policies.sql) to ensure data isolation between companies.

## Free Tier Considerations

- Storage TTL for attachments (90 days)
- Client-side image compression
- Batching with jitter for Telegram notifications
- No paid brokers/queues/workers