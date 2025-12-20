# System Architecture

## Overview

This is a Mandarin learning platform focused on pinyin typing practice using spaced repetition.

## Core Features

### Pinyin Input System

- Users see a Chinese character
- Users type the pinyin pronunciation
- Users select the correct tone (1-5)
- Real-time pinyin input with tone support

### Spaced Repetition

- SM-2 algorithm for optimal review timing
- Four review states: new, learning, review, relearning
- Adaptive difficulty based on user performance

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Drizzle
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Authentication**: Supabase Auth
- **Deployment**: Vercel

## Key Design Decisions

### Why Pinyin Typing (No Audio)?

1. **Simpler MVP**: Removes audio generation/storage complexity
2. **Active Learning**: Typing engages users more than passive listening
3. **Tone Practice**: Forces users to think about tones explicitly
4. **Scalability**: No audio storage costs

### Tone Input Methods

1. **Tone Selector**: Click buttons (1-5) to add tone marks
2. **Keyboard Shortcuts**: Press 1-5 to quickly add tones
3. **Numeric Input**: Support both "ni3" and "nǐ" formats

## Directory Structure

```
/app                    # Next.js App Router pages
  /(marketing)          # Public marketing pages
  /(auth)               # Authentication pages
  /(app)                # Protected app pages
  /api                  # API routes

/components
  /ui                   # shadcn/ui components
  /features             # Feature-specific components
  /layouts              # Layout components
  /providers            # React context providers

/lib
  /db                   # Database schema and queries
  /supabase             # Supabase client setup
  /stores               # Zustand stores
  /utils                # Utility functions
  /hooks                # Custom React hooks

/types                  # TypeScript type definitions
/docs                   # Documentation
/scripts                # Setup and utility scripts
```

## Data Flow

1. User types pinyin → `PinyinInput` component
2. User selects tone → `ToneSelector` component
3. User submits answer → `ReviewCard` component
4. Answer validated → `pinyin-utils.ts`
5. Review submitted → API route `/api/reviews/submit`
6. SRS algorithm updates → `srs-algorithm.ts`
7. Database updated → Drizzle ORM
8. UI updates → React Query cache invalidation
