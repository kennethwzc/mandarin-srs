#!/bin/bash

# Vercel CLI Deployment Script
# Run this to deploy via command line

echo "🚀 Deploying to Vercel..."
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    pnpm add -g vercel
fi

echo "🔐 This will prompt you to login to Vercel"
echo "✅ Make sure you have:"
echo "   - Vercel account created"
echo "   - Environment variables ready"
echo ""
echo "Press ENTER to continue..."
read

# Login to Vercel (if not already logged in)
vercel login

echo ""
echo "🏗️ Deploying to production..."
echo ""

# Deploy to production
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "⚠️ IMPORTANT: Set environment variables in Vercel dashboard:"
echo "   https://vercel.com/[your-org]/[your-project]/settings/environment-variables"
echo ""
echo "Required variables:"
echo "  - DATABASE_URL"
echo "  - NEXT_PUBLIC_SUPABASE_URL"
echo "  - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "  - SUPABASE_SERVICE_ROLE_KEY"
echo "  - NODE_ENV=production"
echo "  - NEXT_PUBLIC_APP_URL"
