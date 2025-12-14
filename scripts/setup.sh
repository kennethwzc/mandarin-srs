#!/bin/bash

# Project Setup Script
# Run this after cloning the repository

set -e

echo "🚀 Setting up Mandarin SRS project..."

# Check Node.js version
required_node_version=20
current_node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)

if [ "$current_node_version" -lt "$required_node_version" ]; then
    echo "❌ Node.js version $required_node_version or higher is required"
    echo "   Current version: $(node -v)"
    exit 1
fi

# Check pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

# Install dependencies
echo "📥 Installing dependencies..."
pnpm install

# Copy environment file
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from .env.example..."
    cp .env.example .env.local
    echo "⚠️  Please edit .env.local with your Supabase credentials"
else
    echo "ℹ️  .env.local already exists"
fi

# Setup Husky hooks
echo "🪝 Setting up Git hooks..."
pnpm prepare

# Run type check
echo "📘 Running type check..."
pnpm typecheck

echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Edit .env.local with your Supabase credentials"
echo "   2. Run 'pnpm db:push' to create database schema"
echo "   3. Run 'pnpm db:seed' to populate initial data"
echo "   4. Run 'pnpm dev' to start development server"
echo ""
echo "🎯 This is a PINYIN INPUT app - no audio functionality"
echo "   Users will type pinyin with tone marks to learn characters"

