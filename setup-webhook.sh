#!/bin/bash

# Set up Telegram bot webhook

echo "Setting up Telegram bot webhook..."

# Load environment variables from .env file if it exists
if [ -f .env ]; then
  # shellcheck disable=SC1091
  set -o allexport
  source .env
  set +o allexport
fi

# Check if required environment variables are set
if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
  echo "Warning: TELEGRAM_BOT_TOKEN not set in environment. Using default value."
  export TELEGRAM_BOT_TOKEN="7702024149:AAEwYiA7qqhWkKIDpC-OQrfiHclX-sJ6gC4"
fi

if [ -z "$WEBAPP_BASE_URL" ]; then
  echo "Error: Please set WEBAPP_BASE_URL environment variable"
  echo "This should be your deployed frontend URL (e.g., https://your-app.vercel.app)"
  echo "You can do this by running:"
  echo "  export WEBAPP_BASE_URL=https://your-app.vercel.app"
  echo ""
  echo "Or by creating a .env file with your variables and sourcing it:"
  echo "  source .env"
  exit 1
fi

# Webhook URL
WEBHOOK_URL="$WEBAPP_BASE_URL/functions/v1/tg"

echo "Current webhook URL: $WEBHOOK_URL"

# Check current webhook info
echo "Checking current webhook configuration..."
curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo" | jq '.'

echo ""
echo "Setting Telegram bot webhook to: $WEBHOOK_URL"

# Set webhook
RESPONSE=$(curl -s -F "url=$WEBHOOK_URL" \
     -F "allowed_updates=[\"message\",\"callback_query\"]" \
     "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook")

echo "Webhook setup response:"
echo $RESPONSE | jq '.'

if echo $RESPONSE | jq -e '.ok == true' > /dev/null; then
  echo ""
  echo "✅ Webhook setup complete!"
  echo "Note: Make sure your Edge Functions are deployed before using the bot"
else
  echo ""
  echo "❌ Webhook setup failed!"
  echo "Please check the error message above"
fi
