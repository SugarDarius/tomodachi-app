import { realtime } from '~/lib/realtime'

/**
 * Get the realtime channel for a contact import.
 */
const getContactImportRealtimeChannel = ({
  importId,
}: {
  importId: string
}) => {
  return realtime.channel(`contact-import:${importId}`)
}

/**
 * Emit a done event for a contact import.
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
  const channel = getContactImportRealtimeChannel({ importId })
  await channel.emit('contactImport.done', payload)
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
  const channel = getContactImportRealtimeChannel({ importId })
  await channel.emit('contactImport.tick', payload)
}
