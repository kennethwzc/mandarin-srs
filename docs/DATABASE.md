# Database Schema

## Overview

The database uses PostgreSQL via Supabase with Drizzle ORM for type-safe queries.

## Tables

### users

Extends Supabase auth.users with additional profile information.

### lessons

Organized learning content grouped into lessons.

### characters

Chinese characters with pinyin and meanings.

### user_progress

SRS algorithm state for each user-character pair.

### review_history

Historical record of all review attempts.

## Schema Details

See `lib/db/schema.ts` for the complete schema definition.

## Migrations

Migrations are generated using Drizzle Kit:

```bash
pnpm db:generate
pnpm db:push
```

## Seeding

Initial data can be seeded using:

```bash
pnpm db:seed
```
