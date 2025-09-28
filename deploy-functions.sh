#!/bin/bash

# Deploy Supabase Edge Functions

echo "Deploying outTime Edge Functions..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null && ! command -v npx &> /dev/null; then
    echo "❌ Neither Supabase CLI nor npx is installed."
    exit 1
fi

# Project reference for your Supabase project
PROJECT_REF="lmpmkszgwwwqvbdhxest"

echo "Deploying functions to project: $PROJECT_REF"

# Deploy Telegram webhook function
echo "Deploying tg function..."
if command -v supabase &> /dev/null; then
    supabase functions deploy tg --project-ref $PROJECT_REF
elif command -v npx &> /dev/null; then
    npx supabase functions deploy tg --project-ref $PROJECT_REF
else
    echo "❌ Cannot deploy tg function: Supabase CLI not available"
fi

# Deploy WebApp submit function
echo "Deploying webapp function..."
if command -v supabase &> /dev/null; then
    supabase functions deploy webapp --project-ref $PROJECT_REF
elif command -v npx &> /dev/null; then
    npx supabase functions deploy webapp --project-ref $PROJECT_REF
else
    echo "❌ Cannot deploy webapp function: Supabase CLI not available"
fi

# Deploy scheduler function
echo "Deploying scheduler function..."
if command -v supabase &> /dev/null; then
    supabase functions deploy scheduler --project-ref $PROJECT_REF
elif command -v npx &> /dev/null; then
    npx supabase functions deploy scheduler --project-ref $PROJECT_REF
else
    echo "❌ Cannot deploy scheduler function: Supabase CLI not available"
fi

# Deploy admin invite function
echo "Deploying admin function..."
if command -v supabase &> /dev/null; then
    supabase functions deploy admin --project-ref $PROJECT_REF
elif command -v npx &> /dev/null; then
    npx supabase functions deploy admin --project-ref $PROJECT_REF
else
    echo "❌ Cannot deploy admin function: Supabase CLI not available"
fi

echo "Setting up cron job for scheduler..."
if command -v supabase &> /dev/null; then
    supabase functions schedule scheduler --project-ref $PROJECT_REF --cron "*/5 * * * *"
elif command -v npx &> /dev/null; then
    npx supabase functions schedule scheduler --project-ref $PROJECT_REF --cron "*/5 * * * *"
else
    echo "❌ Cannot set up scheduler cron job: Supabase CLI not available"
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Set up environment variables for each function in the Supabase dashboard"
echo "2. Configure your Telegram bot webhook"
echo "3. Deploy your frontend application"