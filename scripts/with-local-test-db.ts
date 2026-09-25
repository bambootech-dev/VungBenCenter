/**
 * Runs a command against the local test database only:
 *
 *   npx tsx scripts/with-local-test-db.ts <command> [...args]
 *
 * - Loads .env.test through the guard in tests/helpers/localTestDatabase.ts
 *   (127.0.0.1/localhost, port 54329, database vbc_test) and stops otherwise.
 * - Refuses to run when an env file that Next.js / the Payload CLI load on
 *   their own exists here, so nothing can fall back to .env. Run it from a
 *   clean copy of the project without those files.
 * - Never prints the connection string or password.
 */
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

import { describeDatabaseTarget, loadLocalTestEnv } from '../tests/helpers/localTestDatabase'

const AUTO_LOADED_ENV_FILES = [
  '.env',
  '.env.local',
  '.env.development',
  '.env.development.local',
  '.env.production',
  '.env.production.local',
]

const [command, ...args] = process.argv.slice(2)

if (!command) {
  console.error('Usage: npx tsx scripts/with-local-test-db.ts <command> [...args]')
  process.exit(1)
}

const presentEnvFiles = AUTO_LOADED_ENV_FILES.filter((file) =>
  fs.existsSync(path.resolve(process.cwd(), file)),
)

if (presentEnvFiles.length > 0) {
  console.error(
    `[test-db] Refusing to run: ${presentEnvFiles.join(', ')} exists here and would be loaded automatically. Run from a clean copy without it.`,
  )
  process.exit(1)
}

const target = loadLocalTestEnv()

console.log(`[test-db] ${describeDatabaseTarget(target)}`)

const child = spawn(command, args, { env: process.env, stdio: 'inherit' })

child.on('exit', (code, signal) => {
  process.exit(signal ? 1 : (code ?? 1))
})
