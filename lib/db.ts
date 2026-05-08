import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'

import { env } from '~/env'

const sql = neon(env.NEON_DATABASE_CONNECTION_STRING)
export const db = drizzle(sql)
