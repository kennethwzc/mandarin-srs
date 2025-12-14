/**
 * Database seed script
 * Populates the database with initial data
 * Run with: pnpm db:seed
 */

// import { db } from './client'
// import * as schema from './schema'

async function seed() {
  // eslint-disable-next-line no-console
  console.log('Seeding database...')

  // TODO: Implement seed data
  // This will create initial lessons and characters

  // eslint-disable-next-line no-console
  console.log('Seed completed!')
}

seed()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(() => {
    process.exit(0)
  })
