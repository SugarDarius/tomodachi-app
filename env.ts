import { createEnv } from '@t3-oss/env-core'
import { urlString, string, startsWith } from 'decoders'

export const env = createEnv({
  server: {
    NEON_DATABASE_CONNECTION_STRING: string,
    NEON_AUTH_BASE_URL: urlString,
    NEON_AUTH_COOKIE_SECRET: string,
    BLOB_READ_WRITE_TOKEN: startsWith('vercel_blob_rw_'),
  },
  clientPrefix: 'NEXT_PUBLIC_',
  client: {},
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
})
