/**
 * CSV parser worker.
 *
 * This web worker offload the main thread from the heavy CSV parsing.
 */

import { autoDetectColumnMapping } from './detect-columns'
import { batchParse } from './batch-parser'

const worker = self as unknown as Worker

export type ParseCommand = {
  type: 'parse'
  file: File
  listId: string
}
export type WorkerInput = ParseCommand

worker.addEventListener('message', (e: MessageEvent<WorkerInput>) => {
  if (e.data.type === 'parse') {
    const file = e.data.file

    batchParse(file, {
      batchSize: 1000,
      chunkSize: 1024 * 1024,
      onHeaderRowParsed: ({ headers }) => {
        const columnMapping = autoDetectColumnMapping(headers)

        console.log(columnMapping)
      },
      onEmitBuffer: ({ buffer, done }) => {
        console.log(buffer, done)
      },
      onParseError: (error) => {
        console.log(error)
      },
    })
  }
})
