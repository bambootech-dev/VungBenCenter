// Integration tests reset the users table, so they must only ever run against
// the local test database configured in .env.test (never the .env used for dev/prod).
import { describeDatabaseTarget, loadLocalTestEnv } from './tests/helpers/localTestDatabase'

const target = loadLocalTestEnv()

console.log(`[test-db] ${describeDatabaseTarget(target)}`)
