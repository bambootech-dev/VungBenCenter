import { postgresAdapter } from '@payloadcms/db-postgres'
import sharp from 'sharp'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'

import { Lessons } from './collections/Lessons'
import { Media } from './collections/Media'
import { Users } from './collections/Users'
import { assertSafeDatabase } from './utilities/assertSafeDatabase'
import { getServerSideURL } from './utilities/getURL'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Throws before postgresAdapter is created if DATABASE_URL is not allowed here
const { url: databaseURL } = assertSafeDatabase(process.env.DATABASE_URL)

export default buildConfig({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
  },
  db: postgresAdapter({
    pool: {
      connectionString: databaseURL,
    },
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  collections: [Users, Media, Lessons],
  cors: [getServerSideURL()].filter(Boolean),
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
