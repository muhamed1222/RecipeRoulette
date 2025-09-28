# Manual Deployment Guide for outTime

Since we're having trouble with the Supabase CLI authentication, this guide will walk you through manually deploying the Edge Functions through the Supabase dashboard.

## Prerequisites

1. Your Supabase project (lmpmkszgwwwqvbdhxest) is created and accessible
2. You have the required environment variables in your [.env](file:///Users/kelemetovmuhamed/Documents/RecipeRoulette/.env) file:
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
   - TELEGRAM_BOT_TOKEN
   - TELEGRAM_BOT_USERNAME
   - TZ_DEFAULT

## Step 1: Deploy Edge Functions Manually

### 1.1 Access Your Supabase Dashboard

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project (lmpmkszgwwwqvbdhxest)

### 1.2 Deploy the `tg` Function (Telegram Webhook)

1. In the left sidebar, click on "Functions"
2. Click "Create Function"
3. Set the function name to `tg`
4. Set the function path to `tg`
5. Click "Create"
6. In the code editor, replace the default code with the contents of [supabase/functions/tg/webhook.ts](file:///Users/kelemetovmuhamed/Documents/RecipeRoulette/supabase/functions/tg/webhook.ts)
7. Click "Save"
8. Click "Deploy"

### 1.3 Deploy the `webapp` Function (WebApp Submissions)

1. In the left sidebar, click on "Functions"
2. Click "Create Function"
3. Set the function name to `webapp`
4. Set the function path to `webapp`
5. Click "Create"
6. In the code editor, replace the default code with the contents of [supabase/functions/webapp/submit.ts](file:///Users/kelemetovmuhamed/Documents/RecipeRoulette/supabase/functions/webapp/submit.ts)
7. Click "Save"
8. Click "Deploy"

### 1.4 Deploy the `scheduler` Function (Reminders)

1. In the left sidebar, click on "Functions"
2. Click "Create Function"
3. Set the function name to `scheduler`
4. Set the function path to `scheduler`
5. Click "Create"
6. In the code editor, replace the default code with the contents of [supabase/functions/scheduler/tick.ts](file:///Users/kelemetovmuhamed/Documents/RecipeRoulette/supabase/functions/scheduler/tick.ts)
7. Click "Save"
8. Click "Deploy"

### 1.5 Deploy the `admin` Function (Invite Generation)

1. In the left sidebar, click on "Functions"
2. Click "Create Function"
3. Set the function name to `admin`
4. Set the function path to `admin`
5. Click "Create"
6. In the code editor, replace the default code with the contents of [supabase/functions/admin/invite.ts](file:///Users/kelemetovmuhamed/Documents/RecipeRoulette/supabase/functions/admin/invite.ts)
7. Click "Save"
8. Click "Deploy"

## Step 2: Set Up Environment Variables for Each Function

For each of the four functions (`tg`, `webapp`, `scheduler`, `admin`), you need to set up the environment variables:

1. Click on the function name in the Functions list
2. Go to the "Settings" tab
3. In the "Environment Variables" section, add the following variables:
   - `SUPABASE_URL`: `https://lmpmkszgwwwqvbdhxest.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key (from .env file)
   - `TELEGRAM_BOT_TOKEN`: `7702024149:AAEwYiA7qqhWkKIDpC-OQrfiHclX-sJ6gC4`
   - `TELEGRAM_BOT_USERNAME`: `@outtimeagency_bot`
   - `TZ_DEFAULT`: `Europe/Amsterdam`
4. Click "Save"

## Step 3: Set Up the Scheduler Cron Job

1. In the left sidebar, click on "Functions"
2. Click on the `scheduler` function
3. Go to the "Settings" tab
4. In the "Schedule" section, set up the cron job:
   - Cron schedule: `*/5 * * * *` (runs every 5 minutes)
5. Click "Save"

## Step 4: Verify Function Deployment

After deploying all functions, you can verify they are working:

1. In the left sidebar, click on "Functions"
2. Check that all four functions show as "Deployed"
3. You can click on each function and go to the "Logs" tab to see deployment logs

## Step 5: Set Up Database Schema

### Если Supabase CLI уже работает

```bash
supabase link --project-ref lmpmkszgwwwqvbdhxest --password <ВАШ_ПАРОЛЬ>
SUPABASE_DB_PASSWORD=<ВАШ_ПАРОЛЬ> supabase db push --password "$SUPABASE_DB_PASSWORD"
```

Миграции в `supabase/migrations` создадут все необходимые объекты.

### Полностью вручную через SQL Editor

1. В левой панели откройте «SQL Editor»
2. Выполните файлы по порядку:
   - [setup-database.sql](file:///Users/kelemetовмuhamed/Documents/RecipeRoulette/setup-database.sql)
   - [setup-storage.sql](file:///Users/kelemetовмuhamed/Documents/RecipeRoulette/setup-storage.sql)
   - [setup-audit-logging.sql](file:///Users/kelemetовмuhamed/Documents/RecipeRoulette/setup-audit-logging.sql)
   - [setup-reminders.sql](file:///Users/kelemetовмuhamed/Documents/RecipeRoulette/setup-reminders.sql)
   - [setup-storage-ttl.sql](file:///Users/keleметовмuhamed/Documents/RecipeRoulette/setup-storage-ttl.sql)

## Step 6: Deploy the Web Admin Dashboard

1. Choose a hosting platform (Vercel recommended)
2. Deploy the frontend application from the project directory
3. Update the WEBAPP_BASE_URL in your environment variables with the deployed URL

## Step 7: Set Up Telegram Webhook

1. Update your [.env](file:///Users/kelemetovmuhamed/Documents/RecipeRoulette/.env) file with your deployed frontend URL:
   ```env
   WEBAPP_BASE_URL=https://your-deployed-app.vercel.app
   ```

2. Run the webhook setup script:
   ```bash
   chmod +x setup-webhook.sh
   ./setup-webhook.sh
   ```

## Troubleshooting

### Common Issues

1. **Functions not deploying**: Check that you've copied the correct code from the TypeScript files
2. **Environment variables not set**: Make sure you've set all required environment variables for each function
3. **Database setup errors**: Run the SQL files one at a time and check for errors
4. **Telegram webhook not working**: Verify the webhook URL is correct and the functions are deployed

### Useful Links

- [Supabase Functions Documentation](https://supabase.com/docs/guides/functions)
- [Supabase Edge Functions Examples](https://github.com/supabase/supabase/tree/master/examples/edge-functions)
- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)

## Next Steps

1. Test the system by accessing the admin dashboard
2. Create a company and generate an employee invite
3. Test the Telegram bot functionality
4. Verify that reminders are being sent
5. Test the WebApp forms for planning and reporting
