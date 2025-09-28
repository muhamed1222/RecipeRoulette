# Deployment Guide for outTime

This guide will walk you through deploying the outTime system to a real Supabase project and making it fully functional.

## Prerequisites

1. A Supabase account (free tier is sufficient)
2. A Telegram account
3. Node.js and npm installed
4. A hosting platform for the frontend (Vercel recommended)

## Step 1: Create a Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Click "New Project"
3. Fill in your project details:
   - Name: outTime
   - Database password: Set a secure password
   - Region: Choose the region closest to you
4. Click "Create new project"
5. Wait for the project to be created (this may take a few minutes)

## Step 2: Get Supabase Credentials

1. In your Supabase project dashboard, go to "Project Settings" → "API"
2. Copy the following values:
   - Project URL (SUPABASE_URL)
   - Service Role Key (SUPABASE_SERVICE_ROLE_KEY)

## Step 3: Configure Environment Variables

Update your [.env](file:///Users/kelemetovmuhamed/Documents/RecipeRoulette/.env) file with the values from Step 2:

```env
SUPABASE_URL=your_actual_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_actual_supabase_service_role_key
```

## Step 4: Set Up the Database

### Recommended: Supabase CLI + миграции

1. Авторизуйтесь и свяжите проект:
   ```bash
   supabase login
   supabase link --project-ref lmpmkszgwwwqvbdhxest --password <ВАШ_ПАРОЛЬ>
   ```
2. Примените миграции (создадут схемы, storage, политики и функции за один шаг):
   ```bash
   SUPABASE_DB_PASSWORD=<ВАШ_ПАРОЛЬ> supabase db push --password "$SUPABASE_DB_PASSWORD"
   ```

### Альтернатива: SQL Editor

Если CLI недоступен, выполните файлы из `supabase/migrations` через SQL Editor в том же порядке. Скрипты идемпотентны, повторный запуск безопасен.

## Step 5: (Optional) Ручные SQL скрипты

Файлы `setup-*.sql` дублируют содержимое миграций и пригодятся для точечного редактирования или отладки. В штатном процессе после `supabase db push` их запуск не требуется.

## Step 9: Create a Telegram Bot

You've already created a Telegram bot with the token: `7702024149:AAEwYiA7qqhWkKIDpC-OQrfiHclX-sJ6gC4`
The bot username is: [@outtimeagency_bot](https://t.me/outtimeagency_bot)

If you need to make any changes to your bot:

1. Open Telegram and search for [@BotFather](https://t.me/BotFather)
2. Start a chat with BotFather
3. Send `/setcommands` to BotFather and set the following commands:
   ```
   start - Начать смену
   lunch - Перерыв на обед
   report - Отправить отчет
   ```

## Step 10: Deploy Edge Functions

### Method 1: Automated Deployment (Using Supabase CLI)

1. Run the deployment script:
   ```bash
   chmod +x deploy-functions.sh
   ./deploy-functions.sh
   ```

   This will deploy all four Edge Functions to your Supabase project:
   - `tg` - Telegram webhook handler
   - `webapp` - WebApp form submissions
   - `scheduler` - Cron job for reminders (runs every 5 minutes)
   - `admin` - Employee invite generation

### Method 2: Manual Deployment (Through Supabase Dashboard)

If you encounter issues with the automated deployment, you can deploy the functions manually by following the instructions in [MANUAL-DEPLOY.md](MANUAL-DEPLOY.md).

## Step 11: Set Up Function Environment Variables

After deploying the functions, you need to set up environment variables for each function:

1. Run the environment setup script to see the required variables:
   ```bash
   node setup-function-env.js
   ```

2. Follow the instructions to set up the environment variables in the Supabase dashboard:
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
   - TELEGRAM_BOT_TOKEN
   - TELEGRAM_BOT_USERNAME
   - TZ_DEFAULT

## Step 12: Set Up Scheduler Cron Job

The scheduler function needs to be set up to run every 5 minutes:

```bash
supabase functions schedule scheduler --project-ref lmpmkszgwwwqvbdhxest --cron "*/5 * * * *"
```

## Step 13: Set Up Telegram Webhook

1. Deploy your frontend application first (see Step 14)
2. Update your [.env](file:///Users/kelemetovmuhamed/Documents/RecipeRoulette/.env) file with your deployed frontend URL:
   ```env
   WEBAPP_BASE_URL=https://your-deployed-app.vercel.app
   ```

3. Run the webhook setup script:
   ```bash
   chmod +x setup-webhook.sh
   ./setup-webhook.sh
   ```

## Step 14: Deploy the Web Admin Dashboard

### Option 1: Deploy to Vercel (Recommended)

1. Sign up for a [Vercel](https://vercel.com/) account
2. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```

3. Deploy your application:
   ```bash
   vercel
   ```

4. Follow the prompts to configure your deployment
5. Update your WEBAPP_BASE_URL in the [.env](file:///Users/kelemetovmuhamed/Documents/RecipeRoulette/.env) file with the deployed URL

### Option 2: Deploy to Netlify

1. Sign up for a [Netlify](https://netlify.com/) account
2. Install the Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

3. Deploy your application:
   ```bash
   netlify deploy
   ```

## Step 15: Configure Authentication

1. In your Supabase project dashboard, go to "Authentication" → "Providers"
2. Enable "Email" provider
3. Optionally enable other providers (Google, GitHub, etc.)

## Step 16: Test the System

1. Access your deployed admin dashboard
2. Sign up for an account
3. Create a company
4. Generate an employee invite
5. Open Telegram and interact with your bot
6. Test all functionality

## Troubleshooting

### Common Issues

1. **Edge Functions not working**: Check that all environment variables are set correctly in the Supabase dashboard

2. **Telegram bot not responding**: Verify the webhook is set correctly:
   ```bash
   curl "https://api.telegram.org/botYOUR_BOT_TOKEN/getWebhookInfo"
   ```

3. **Database connection errors**: Verify your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are correct

4. **Frontend not loading**: Check browser console for errors and verify environment variables

### Useful Commands

1. Check function logs:
   ```bash
   npx supabase functions logs --project-ref lmpmkszgwwwqvbdhxest
   ```

2. Reset local development:
   ```bash
   npx supabase db reset
   ```

3. Check local development status:
   ```bash
   npx supabase status
   ```

## Next Steps

1. Set up monitoring and alerting
2. Configure custom domain for your frontend
3. Set up automated backups
4. Review and adjust security settings
5. Test with a small group of users before full rollout

## Support

For issues or questions, please check the [README.md](file:///Users/kelemetovmuhamed/Documents/RecipeRoulette/README.md) file or open an issue on the repository.
