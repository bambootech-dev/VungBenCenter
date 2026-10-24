import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

import {
  APPROVED_LOCAL_DATABASES,
  assertSafeDatabase,
  DATABASE_ENVIRONMENT_VARIABLE,
  type DatabaseTarget,
  describeDatabaseTarget,
  parseDatabaseTarget,
} from '../../src/utilities/assertSafeDatabase'

export { type DatabaseTarget, describeDatabaseTarget }

// Tests reset the users table, so they may only ever touch the local docker
// container `vbc-test-db`. Never print the full connection string or password.
export const LOCAL_TEST_DATABASE = {
  hostnames: ['127.0.0.1', 'localhost'],
  port: '54329',
  database: APPROVED_LOCAL_DATABASES.test,
}

const parseDatabaseUrl = (url: string): DatabaseTarget => {
  try {
    return parseDatabaseTarget(url)
  } catch {
    throw new Error('[test-db] DATABASE_URL is not a valid URL.')
  }
}

export const assertLocalTestDatabaseUrl = (url: string | undefined): DatabaseTarget => {
  if (!url) {
    throw new Error('[test-db] DATABASE_URL is missing from .env.test.')
  }

  const target = parseDatabaseUrl(url)
  const described = describeDatabaseTarget(target)

  if (!LOCAL_TEST_DATABASE.hostnames.includes(target.hostname)) {
    throw new Error(`[test-db] Refusing to run: hostname is not local (${described}).`)
  }

  if (target.port !== LOCAL_TEST_DATABASE.port) {
    throw new Error(
      `[test-db] Refusing to run: port must be ${LOCAL_TEST_DATABASE.port} (${described}).`,
    )
  }

  if (target.database !== LOCAL_TEST_DATABASE.database) {
    throw new Error(
      `[test-db] Refusing to run: database must be ${LOCAL_TEST_DATABASE.database} (${described}).`,
    )
  }

  return target
}

/**
 * Asks the connected Postgres server which database it is, as a second check
 * after the URL guard (inside the container the server port is 5432).
 */
export const assertConnectedToLocalTestDatabase = async (db: unknown): Promise<void> => {
  const pool = (db as { pool?: { query: (sql: string) => Promise<{ rows: unknown[] }> } }).pool

  if (!pool) {
    throw new Error('[test-db] Could not access the Postgres pool to verify the database.')
  }

  const { rows } = await pool.query('SELECT current_database() AS database')
  const { database } = rows[0] as { database: string }

  if (database !== LOCAL_TEST_DATABASE.database) {
    throw new Error(`[test-db] Connected to unexpected database (database=${database}).`)
  }
}

/**
 * Loads .env.test only (never .env) and verifies it points at the local test
 * database before anything can connect to it.
 */
export const loadLocalTestEnv = (cwd = process.cwd()): DatabaseTarget => {
  const testEnvPath = path.resolve(cwd, '.env.test')

  if (!fs.existsSync(testEnvPath)) {
    throw new Error('[test-db] Missing .env.test — copy .env.test.example first.')
  }

  const testEnv = dotenv.parse(fs.readFileSync(testEnvPath))

  // Validate the file itself so nothing can fall back to .env or the shell
  const target = assertLocalTestDatabaseUrl(testEnv.DATABASE_URL)

  if (testEnv.ALLOW_TEST_DB_RESET !== 'true') {
    throw new Error('[test-db] Refusing to run: set ALLOW_TEST_DB_RESET=true in .env.test.')
  }

  // Same runtime guard as payload.config.ts, in its test mode
  assertSafeDatabase(testEnv.DATABASE_URL, { NODE_ENV: 'test' })

  Object.assign(process.env, testEnv)
  // Marks child processes (e.g. `next dev` started by Playwright, which forces
  // NODE_ENV=development) as tests, so payload.config.ts only accepts vbc_test
  process.env[DATABASE_ENVIRONMENT_VARIABLE] = 'test'

  return target
}
