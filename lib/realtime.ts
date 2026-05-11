import { Realtime, InferRealtimeEvents } from '@upstash/realtime'
import z from 'zod/v4'

import { redis } from '~/lib/redis'

const schema = {
  contactImport: {
    tick: z.object({
      numberOfInspectedRows: z.number(),
      numberOfIngestedRows: z.number(),
      numberOfSkippedRows: z.number(),
      cursorByte: z.number(),
      totalByteSize: z.number().nullable(),
      ingestionStatus: z.enum(['running', 'completed', 'failed']),
    }),
    done: z.object({
      ingestionStatus: z.enum(['completed', 'failed']),
      lastError: z.string().nullable(),
    }),
  },
}

export const realtime = new Realtime({ schema, redis })

export type RealtimeEvents = InferRealtimeEvents<typeof realtime>
