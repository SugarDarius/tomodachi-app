'use client'

import { useCallback, useState } from 'react'
import { object, string } from 'decoders'

import { type ColumnMapping } from '~/schema'
import { type CreateContactImportResponseBody } from '~/lib/csv/contact-import'

export function useStartImportContactsJob({
  listId,
  onImportJobStarted,
  onImportJobError,
}: {
  listId: string
  onImportJobStarted: (importJob: CreateContactImportResponseBody) => void
  onImportJobError: (error: unknown) => void
}) {
  const [loading, setLoading] = useState(false)

  const startImport = useCallback(
    async ({
      blobUrl,
      originalFilename,
      contentType,
      columnMap,
    }: {
      blobUrl: string
      originalFilename: string
      contentType: string
      columnMap: ColumnMapping
    }) => {
      setLoading(true)
      try {
        const res = await fetch('/api/contacts/import', {
          method: 'POST',
          body: JSON.stringify({
            listId,
            blobUrl,
            originalFilename,
            contentType,
            columnMap,
          }),
        })

        if (!res.ok) {
          onImportJobError(
            new Error(`Failed to start import job: ${res.statusText}`)
          )
          return
        }

        const job = object({
          importId: string,
          workflowRunId: string,
        })
          .refineType<CreateContactImportResponseBody>()
          .verify(await res.json())

        onImportJobStarted(job)
      } catch (err) {
        onImportJobError(err)
      } finally {
        setLoading(false)
      }
    },
    [listId, onImportJobStarted, onImportJobError]
  )

  return {
    loading,
    startImport,
  } as const
}
