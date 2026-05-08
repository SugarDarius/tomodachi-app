import { defineConfig } from 'drizzle-kit'

import { env } from '~/env'

export default defineConfig({
  schema: './schema.ts',
  out: './drizzle-migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.NEON_DATABASE_CONNECTION_STRING,
  },
})
