#!/bin/bash

# Helper script to URL-encode a database password
# Usage: ./scripts/encode-password.sh "your-password-here"

if [ -z "$1" ]; then
  echo "Usage: ./scripts/encode-password.sh \"your-password-here\""
  exit 1
fi

PASSWORD="$1"
ENCODED=$(node -e "console.log(encodeURIComponent('$PASSWORD'))")

echo ""
echo "✅ Encoded password:"
echo "$ENCODED"
echo ""
echo "📋 Your DATABASE_URL should be:"
echo "DATABASE_URL=postgresql://postgres:${ENCODED}@db.kunqvklwntfaovoxghxl.supabase.co:5432/postgres"
echo ""

