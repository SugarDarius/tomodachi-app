'use client'

import {
  object,
  string,
  number,
  array,
  oneOf,
  flexDate,
  taggedUnion,
  constant,
  nullable,
} from 'decoders'

import { useSafeSWR } from '~/hooks/use-safe-swr'
import {
  type ContactImportJob,
  type ColumnMapping,
  type ContactImportErrorEntry,
} from '~/schema'

export function useImportContactsJob({
  listId,
  importId,
  initialContactImportJob,
}: {
  listId: string
  importId: string
  initialContactImportJob: ContactImportJob
}) {
  const { data: contactImportJob } = useSafeSWR<ContactImportJob>(
    `/api/contacts/get/${listId}/imports/${importId}`,
    object({
      id: string,
      tenantId: string,
      listId: string,
      blobUrl: string,
      originalFilename: string,
      contentType: string,
      errors: array(
        taggedUnion('kind', {
          skip: object({
            kind: constant('skip'),
            rowNumber: number,
            reason: string,
          }),
          fatal: object({
            kind: constant('fatal'),
            message: string,
          }),
        }).refineType<ContactImportErrorEntry>()
      ),
      columnMap: object({
        canonical: object({
          email: object({ value: string, positionIndex: number }),
          first_name: object({ value: string, positionIndex: number }),
          last_name: object({ value: string, positionIndex: number }),
        }),
        varying: array(object({ value: string, positionIndex: number })),
      }).refineType<ColumnMapping>(),
      ingestionStatus: oneOf(['running', 'completed', 'failed']),
      numberOfInspectedRows: number,
      numberOfIngestedRows: number,
      numberOfSkippedRows: number,
      totalByteSize: number,
      createdAt: flexDate,
      updatedAt: flexDate,
      completedAt: nullable(flexDate),
    }).refineType<ContactImportJob>(),
    {
      initialData: initialContactImportJob,
      revalidateOnFocus: true,
      // 👇🏻 Refresh interval to keep the data fresh (every 2 seconds)
      refreshInterval: 2 * 1000,
    }
  )

  return {
    status: contactImportJob.ingestionStatus,
    fileName: contactImportJob.originalFilename,
    stats: {
      numberOfInspectedRows: contactImportJob.numberOfInspectedRows,
      numberOfIngestedRows: contactImportJob.numberOfIngestedRows,
      numberOfSkippedRows: contactImportJob.numberOfSkippedRows,
      totalByteSize: contactImportJob.totalByteSize,
    },
  } as const
}
