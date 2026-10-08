/**
 * Prints which database dev or tests would use, without connecting to it:
 *
 *   npm run db:check        # env files as `next dev` / Payload CLI load them
 *   npm run db:check:test   # .env.test, as Vitest / Playwright load it
 *
 * Runs the same guard as payload.config.ts and exits non-zero when it blocks.
 * Only host, port and database name are printed — never the connection string.
 */
import nextEnv from '@next/env'

import { assertSafeDatabase, describeDatabaseTarget } from '../src/utilities/assertSafeDatabase'
import { loadLocalTestEnv } from '../tests/helpers/localTestDatabase'

const isTest = process.argv.includes('--test')
const LABELS = { development: '[dev-db]', test: '[test-db]', production: '[prod-db]' }
let label = isTest ? LABELS.test : LABELS.development

try {
  if (isTest) {
    loadLocalTestEnv()
  } else {
    // Same call the Payload CLI makes; `next dev` resolves the same files
    nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== 'production', {
      info: () => {},
      error: console.error,
    })
  }

  const { environment, target } = assertSafeDatabase(process.env.DATABASE_URL)
  label = LABELS[environment]

  console.log(`${label} ${describeDatabaseTarget(target)}`)
} catch (error) {
  console.error(`${label} ${(error as Error).message}`)
  process.exit(1)
}
