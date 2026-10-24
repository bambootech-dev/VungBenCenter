/**
 * Server-only guard that runs before the Postgres adapter is created, so dev,
 * tests and the Payload CLI can never open a connection to a remote database
 * (for example Supabase production) by accident.
 *
 * Never logs or throws the full connection string, username or password.
 */

export type DatabaseEnvironment = 'development' | 'test' | 'production'

export type DatabaseTarget = {
  hostname: string
  port: string
  database: string
}

export const LOCAL_DATABASE_HOSTNAMES = ['localhost', '127.0.0.1', '::1']

export const APPROVED_LOCAL_DATABASES: Record<Exclude<DatabaseEnvironment, 'production'>, string> =
  {
    development: 'vbc_dev',
    test: 'vbc_test',
  }

// Set by tests/helpers/localTestDatabase.ts so `next dev` started by Playwright
// (which forces NODE_ENV=development) is still checked against the test database
export const DATABASE_ENVIRONMENT_VARIABLE = 'VBC_DATABASE_ENV'

// pg-connection-string lets these query parameters override the host or
// database in the URL, which would bypass a check on the hostname alone
const CONNECTION_OVERRIDE_PARAMS = ['host', 'hostaddr', 'port', 'database', 'dbname', 'db']

type GuardEnv = Partial<Record<string, string | undefined>>

export class UnsafeDatabaseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UnsafeDatabaseError'
  }
}

export const describeDatabaseTarget = ({ hostname, port, database }: DatabaseTarget) =>
  `host=${hostname || '(none)'} port=${port || '(none)'} database=${database || '(none)'}`

export const resolveDatabaseEnvironment = (env: GuardEnv = process.env): DatabaseEnvironment => {
  if (env.NODE_ENV === 'production') return 'production'
  if (env.NODE_ENV === 'test' || env[DATABASE_ENVIRONMENT_VARIABLE] === 'test') return 'test'
  return 'development'
}

const blocked = (environment: DatabaseEnvironment, target: DatabaseTarget | null, reason: string) => {
  const lines = ['Blocked unsafe database connection.', `Environment: ${environment}`]

  if (target) {
    lines.push(
      `Host: ${target.hostname || '(none)'}`,
      `Port: ${target.port || '(default)'}`,
      `Database: ${target.database || '(none)'}`,
    )
  }

  lines.push(reason)

  return new UnsafeDatabaseError(lines.join('\n'))
}

/** Extracts host, port and database name only. Throws without echoing the URL. */
export const parseDatabaseTarget = (url: string): DatabaseTarget => {
  let parsed: URL

  try {
    parsed = new URL(url)
  } catch {
    throw new UnsafeDatabaseError('DATABASE_URL is not a valid URL.')
  }

  if (parsed.protocol !== 'postgres:' && parsed.protocol !== 'postgresql:') {
    throw new UnsafeDatabaseError('DATABASE_URL must use the postgres:// or postgresql:// scheme.')
  }

  let database: string

  try {
    database = decodeURIComponent(parsed.pathname.replace(/^\//, ''))
  } catch {
    throw new UnsafeDatabaseError('DATABASE_URL has an invalid database name.')
  }

  return {
    hostname: parsed.hostname.replace(/^\[(.*)\]$/, '$1'),
    port: parsed.port,
    database,
  }
}

export const isLocalHostname = (hostname: string) => LOCAL_DATABASE_HOSTNAMES.includes(hostname)

/**
 * Returns the URL unchanged when it is safe for the current environment,
 * otherwise throws before any connection is attempted.
 */
export const assertSafeDatabase = (
  url: string | undefined,
  env: GuardEnv = process.env,
): { url: string; environment: DatabaseEnvironment; target: DatabaseTarget } => {
  const environment = resolveDatabaseEnvironment(env)

  if (!url) {
    throw blocked(environment, null, 'DATABASE_URL is missing.')
  }

  let target: DatabaseTarget

  try {
    target = parseDatabaseTarget(url)
  } catch (error) {
    throw blocked(environment, null, (error as Error).message)
  }

  const overrides = CONNECTION_OVERRIDE_PARAMS.filter((param) =>
    new URL(url).searchParams.has(param),
  )

  if (overrides.length > 0) {
    throw blocked(
      environment,
      target,
      `DATABASE_URL must not override the connection with query parameters (${overrides.join(', ')}).`,
    )
  }

  const local = isLocalHostname(target.hostname)

  if (environment === 'production') {
    if (local || env.ALLOW_REMOTE_DATABASE === 'true') {
      return { url, environment, target }
    }

    throw blocked(
      environment,
      target,
      'Remote databases in production require ALLOW_REMOTE_DATABASE=true in the deployment environment.',
    )
  }

  // ALLOW_REMOTE_DATABASE is deliberately ignored outside production
  const approvedDatabase = APPROVED_LOCAL_DATABASES[environment]

  if (!local || target.database !== approvedDatabase) {
    throw blocked(
      environment,
      target,
      `Development and tests may only use an approved local database (${environment} → ${approvedDatabase} on ${LOCAL_DATABASE_HOSTNAMES.join(', ')}).`,
    )
  }

  return { url, environment, target }
}
