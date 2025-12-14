# Mandarin SRS

A production-grade Mandarin learning platform using Next.js 14 with spaced repetition for pinyin typing practice.

## Features

- **Pinyin Typing Practice**: See Chinese characters and type the correct pinyin with tone marks
- **Spaced Repetition**: SM-2 algorithm for optimal learning intervals
- **Progress Tracking**: Monitor your learning journey with detailed statistics
- **Modern Stack**: Next.js 14, TypeScript, Supabase, Drizzle ORM

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Drizzle
- **State Management**: Zustand
- **Data Fetching**: React Query
- **Authentication**: Supabase Auth

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- pnpm 8.x or higher
- Supabase account (for database and auth)

### Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd mandarin-srs
```

2. Run the setup script:

```bash
./scripts/setup.sh
```

3. Configure environment variables:

```bash
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

4. Set up the database:

```bash
pnpm db:push
pnpm db:seed
```

5. Start the development server:

```bash
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

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

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Fix ESLint errors
- `pnpm format` - Format code with Prettier
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm test` - Run tests
- `pnpm db:generate` - Generate database migrations
- `pnpm db:push` - Push schema to database
- `pnpm db:seed` - Seed database with initial data

## Key Features

### Pinyin Input System

- Real-time pinyin validation
- Tone mark selector (1-5)
- Keyboard shortcuts for quick tone selection
- Support for both numeric and tone mark formats

### Spaced Repetition

- SM-2 algorithm implementation
- Adaptive review intervals
- Progress tracking per character
- Review queue management

## Development

This project uses:

- **TypeScript** for type safety
- **ESLint** for code quality
- **Prettier** for code formatting
- **Husky** for git hooks
- **Commitlint** for commit message validation

## Documentation

- [Architecture](./docs/ARCHITECTURE.md)
- [Database Schema](./docs/DATABASE.md)
- [SRS Algorithm](./docs/SRS_ALGORITHM.md)
- [API Documentation](./docs/API.md)

## License

MIT
