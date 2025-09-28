#!/bin/bash

# outTime Startup Script

echo "🚀 Starting outTime System Setup..."

# Check if required tools are installed
echo "Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Try to install Supabase CLI if not present
if ! command -v supabase &> /dev/null; then
    echo "⚠️  Supabase CLI is not installed. Attempting to install..."
    npm install -g supabase-cli
    if ! command -v supabase &> /dev/null; then
        echo "❌ Failed to install Supabase CLI. Please install it manually:"
        echo "   npm install -g supabase-cli"
        exit 1
    fi
fi

echo "✅ All prerequisites found"

# Install dependencies
echo "Installing dependencies..."
npm install

# Check if environment variables are set
echo "Checking environment variables..."
if [ -f .env ]; then
    echo "✅ .env file found"
else
    echo "⚠️  .env file not found. Copying .env.example to .env"
    cp .env.example .env
    echo "Please update the .env file with your configuration values"
fi

# Start development server
echo "Starting development server..."
echo "Access the admin dashboard at http://localhost:5173"
npm run dev