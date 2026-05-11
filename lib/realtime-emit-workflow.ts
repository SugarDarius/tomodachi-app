import z from 'zod/v4'

import { env } from '~/env'
import { realtimeSchema } from '~/lib/realtime-schema'

/**
 * AI generated workaround to make Upstash realtime events work in Workflow.
 */

type JsonPrimitive = string | number | boolean | null

function serializeRedisArg(value: unknown): JsonPrimitive {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value
  }
  if (value === null) {
    return 'null'
  }
  return JSON.stringify(value)
}

function findEventSchema(event: string): z.ZodType | undefined {
  let current: unknown = realtimeSchema
  for (const key of event.split('.')) {
    if (!current || typeof current !== 'object') {
      return undefined
    }
    current = (current as Record<string, unknown>)[key]
  }
  if (
    current &&
    typeof current === 'object' &&
    'parse' in current &&
    typeof (current as { parse: unknown }).parse === 'function'
  ) {
    return current as z.ZodType
  }
  return undefined
}

function decodeUpstashValue(raw: unknown): unknown {
  if (raw === null || raw === undefined) {
    return raw
  }
  if (typeof raw === 'number') {
    return raw
  }
  if (typeof raw === 'string') {
    try {
      return Buffer.from(raw, 'base64').toString('utf8')
    } catch {
      return raw
    }
  }
  return raw
}

type UpstashWireResponse =
  | { result: unknown; error?: string }
  | Array<{ result: unknown; error?: string }>

async function postUpstash(
  pathSegments: string[],
  body: unknown,
  syncToken?: string | null
): Promise<{ decoded: unknown; syncToken: string | null }> {
  const baseUrl = env.UPSTASH_REDIS_REST_URL.replace(/\/$/, '')
  const url = [baseUrl, ...pathSegments].join('/')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`,
    'Upstash-Encoding': 'base64',
  }
  if (syncToken) {
    headers['upstash-sync-token'] = syncToken
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  const nextSync = res.headers.get('upstash-sync-token')
  const rawText = await res.text()
  let parsed: UpstashWireResponse
  try {
    parsed = JSON.parse(rawText) as UpstashWireResponse
  } catch {
    throw new Error(
      `Upstash Redis: invalid JSON response: ${rawText.slice(0, 200)}`
    )
  }

  if (!res.ok) {
    const errMsg =
      typeof parsed === 'object' &&
      parsed !== null &&
      !Array.isArray(parsed) &&
      'error' in parsed
        ? String((parsed as { error?: string }).error)
        : rawText.slice(0, 200)
    throw new Error(`Upstash Redis HTTP ${res.status}: ${errMsg}`)
  }

  if (Array.isArray(parsed)) {
    for (const entry of parsed) {
      if (entry.error) {
        throw new Error(`Upstash Redis pipeline: ${entry.error}`)
      }
    }
    const decoded = parsed.map((entry) => decodeUpstashValue(entry.result))
    return { decoded, syncToken: nextSync }
  }

  if (parsed.error) {
    throw new Error(`Upstash Redis: ${parsed.error}`)
  }

  return { decoded: decodeUpstashValue(parsed.result), syncToken: nextSync }
}

/**
 * Matches `@upstash/realtime` server `emit`: XADD + PUBLISH (no Redis SDK — safe in Workflow vm).
 */
async function emitRealtimeChannelEvent({
  channel,
  event,
  data,
}: {
  channel: string
  event: string
  data: unknown
}) {
  const schema = findEventSchema(event)
  if (schema) {
    z.parse(schema, data)
  }

  const entries = { data, event, channel }
  const xaddCommand: JsonPrimitive[] = [
    'XADD',
    channel,
    '*',
    ...Object.entries(entries).flatMap(([k, v]) => [k, serializeRedisArg(v)]),
  ]

  const { decoded: streamId, syncToken } = await postUpstash([], xaddCommand)

  const payload = {
    data,
    event,
    channel,
    id: String(streamId),
  }

  const publishCommand = [
    'publish',
    channel,
    serializeRedisArg(payload),
  ] as JsonPrimitive[]

  await postUpstash(['pipeline'], [publishCommand], syncToken)
}

const contactImportChannel = (importId: string) => `contact-import:${importId}`

/**
 * Emit contact import completion from Workflow steps (`fetch` + Upstash REST only — no `@upstash/redis`).
 */
export async function emitContactImportDone({
  importId,
  payload,
}: {
  importId: string
  payload: {
    ingestionStatus: 'completed' | 'failed'
    lastError: string | null
  }
}) {
  await emitRealtimeChannelEvent({
    channel: contactImportChannel(importId),
    event: 'contactImport.done',
    data: payload,
  })
}

export async function emitContactImportTick({
  importId,
  payload,
}: {
  importId: string
  payload: {
    numberOfInspectedRows: number
    numberOfIngestedRows: number
    numberOfSkippedRows: number
    cursorByte: number
    totalByteSize: number | null
    ingestionStatus: 'running' | 'completed' | 'failed'
  }
}) {
  await emitRealtimeChannelEvent({
    channel: contactImportChannel(importId),
    event: 'contactImport.tick',
    data: payload,
  })
}
