import { Realtime, InferRealtimeEvents } from '@upstash/realtime'

import { redis } from '~/lib/redis'
import { realtimeSchema } from '~/lib/realtime-schema'

export const realtime = new Realtime({ schema: realtimeSchema, redis })

export type RealtimeEvents = InferRealtimeEvents<typeof realtime>
