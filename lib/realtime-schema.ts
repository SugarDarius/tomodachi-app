import z from 'zod/v4'

/**
 * Shared Upstash Realtime event schema (server + workflow REST emit).
 */
export const realtimeSchema = {
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
