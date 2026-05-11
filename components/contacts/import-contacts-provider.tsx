'use client'

import { useRouter } from 'next/navigation'
import { createContext, useCallback, useContext, useRef, useState } from 'react'

import { upload } from '@vercel/blob/client'
import { object, string } from 'decoders'

import { ColumnMapping } from '~/schema'
import {
  type CreateContactImportResponseBody,
  type ContactImportProgress,
  type PreviewResult,
} from '~/lib/csv/contact-import'
import { previewCsvHead } from '~/lib/csv/head'
import { autoDetectColumnMapping, countEmailMappings } from '~/lib/csv/columns'
import { useRealtime } from '~/lib/realtime-client'

/**
 * Context provider for importing contacts.
 * Globally shared and distributed across the app to:
 *
 * - import contacts from a csv file
 * - track current import session
 * - handle errors and progress
 * - notify user in the UI
 */

/**
 * Track status of the import process.
 */
type ImportStep =
  | 'idle'
  | 'reading_preview'
  | 'mapping'
  | 'uploading_blob'
  | 'registering_job'
  | 'streaming_progress'
  | 'completed'
  | 'error'

/**
 * Active contact import state.
 */
export type ActiveContactImportState = {
  /**
   * The list id that the contact import is associated with.
   */
  listId: string
  /**
   * The file that is being imported.
   */
  file: File
  /**
   * The preview of the file.
   */
  preview: PreviewResult
  /**
   * The column mapping for the file.
   */
  columnMap: ColumnMapping
  /**
   * The current step of the import process.
   */
  step: Exclude<ImportStep, 'idle'>
  /**
   * The unique identifier for the contact import.
   */
  importId?: string
  /**
   * The progress of the import process.
   */
  progress?: ContactImportProgress
  /**
   * The error message if the import process failed.
   */
  errorMessage?: string
}

export type ImportContactsContextType = {
  /**
   * The active contact import state or null if no import is active.
   */
  activeContactImport: ActiveContactImportState | null
  /**
   * Prepare a new contact import.
   */
  prepareContactImport: (params: {
    listId: string
    file: File
  }) => Promise<void>
  /**
   * Set the column mapping for the active contact import.
   */
  setActiveContactImportColumnMapping: (columnMapping: ColumnMapping) => void

  /**
   * Submit the active contact import.
   */
  submitActiveContactImport: () => Promise<void>
  /**
   * Dismiss the active contact import.
   */
  dismissContactImport: (listId: string) => void

  /**
   * Check if a list is currently importing contacts.
   */
  isListImportBusy: (listId: string) => boolean
}

const ImportContactsContext = createContext<ImportContactsContextType | null>(
  null
)

/**
 * Empty retuning component that listens to realtime events for the active contact import.
 * Using a component instead of a hook to avoid re-rendering the parent component when the realtime events are received.
 */
function ImportContactsRealtime({
  importId,
  setActiveContactImport,
}: {
  importId: string
  setActiveContactImport: React.Dispatch<
    React.SetStateAction<ActiveContactImportState | null>
  >
}) {
  const router = useRouter()
  const lastRefreshAtRef = useRef<number>(0)

  useRealtime({
    channels: [`contact-imports:${importId}`],
    events: ['contactImport.tick', 'contactImport.done'],
    onData: ({ event, data }) => {
      switch (event) {
        case 'contactImport.tick': {
          const {
            numberOfInspectedRows,
            numberOfIngestedRows,
            numberOfSkippedRows,
            cursorByte,
            totalByteSize,
          } = data

          setActiveContactImport((prev) =>
            prev
              ? {
                  ...prev,
                  progress: {
                    numberOfInspectedRows: numberOfInspectedRows,
                    numberOfIngestedRows: numberOfIngestedRows,
                    numberOfSkippedRows: numberOfSkippedRows,
                    cursorByte: cursorByte,
                    totalByteSize: totalByteSize,
                  },
                }
              : prev
          )
          if (numberOfIngestedRows > 0) {
            const now = Date.now()
            if (now - lastRefreshAtRef.current > 1200) {
              lastRefreshAtRef.current = now
              router.refresh()
            }
          }
          break
        }
        case 'contactImport.done': {
          const { ingestionStatus, lastError } = data

          if (ingestionStatus === 'failed') {
            setActiveContactImport((prev) =>
              prev
                ? {
                    ...prev,
                    step: 'error',
                    errorMessage: lastError ?? 'Import failed.',
                  }
                : prev
            )
            return
          }

          setActiveContactImport((prev) =>
            prev
              ? {
                  ...prev,
                  step: 'completed',
                  errorMessage: undefined,
                }
              : prev
          )
          lastRefreshAtRef.current = Date.now()
          router.refresh()
        }
      }
    },
  })

  return null
}

export function ImportContactsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [activeContactImport, setActiveContactImport] =
    useState<ActiveContactImportState | null>(null)
  const activeContactImportRef = useRef(activeContactImport)

  // Store the active contact import in a ref to avoid re-rendering the component when the state changes.
  // eslint-disable-next-line react-hooks/refs
  activeContactImportRef.current = activeContactImport

  const dismissContactImport = useCallback((listId: string) => {
    setActiveContactImport((prev) => (prev?.listId === listId ? null : prev))
  }, [])

  const prepareContactImport = useCallback(
    async ({ listId, file }: { listId: string; file: File }) => {
      setActiveContactImport({
        listId,
        file,
        preview: {
          headers: [],
          sampleRows: [],
          fileSizeBytes: file.size,
          sampleBytes: 0,
          sampleRowCount: 0,
        },
        columnMap: {
          canonical: {
            email: '',
            first_name: '',
            last_name: '',
          },
          varying: [],
        },
        step: 'reading_preview',
        errorMessage: undefined,
      })

      try {
        const preview = await previewCsvHead(file)
        const columnMap = autoDetectColumnMapping(preview.headers)

        setActiveContactImport({
          listId,
          file,
          preview,
          columnMap,
          step: 'mapping',
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)

        setActiveContactImport({
          listId,
          file,
          preview: {
            headers: [],
            sampleRows: [],
            fileSizeBytes: file.size,
            sampleBytes: 0,
            sampleRowCount: 0,
          },
          columnMap: {
            canonical: {
              email: '',
              first_name: '',
              last_name: '',
            },
            varying: [],
          },
          step: 'error',
          errorMessage: message,
        })
      }
    },
    []
  )

  const setActiveContactImportColumnMapping = useCallback(
    (next: ColumnMapping) => {
      setActiveContactImport((prev) =>
        prev ? { ...prev, columnMap: next, errorMessage: undefined } : prev
      )
    },
    []
  )

  const submitActiveContactImport = useCallback(async () => {
    // Create a snapshot of the active contact import to avoid race conditions.
    const snapshot = activeContactImportRef.current
    if (!snapshot || snapshot.step !== 'mapping') {
      return
    }

    // Ensure that there is exactly one email mapping.
    if (countEmailMappings(snapshot.columnMap) !== 1) {
      setActiveContactImport({
        ...snapshot,
        step: 'error',
        errorMessage: 'Map exactly one CSV column to Email before importing.',
      })
      return
    }

    setActiveContactImport({
      ...snapshot,
      step: 'uploading_blob',
      errorMessage: undefined,
    })

    let blobUrl: string
    try {
      const uploaded = await upload(snapshot.file.name, snapshot.file, {
        access: 'private',
        handleUploadUrl: '/api/contacts/import/blob-upload',
        // Use multipart upload for large files (> 95MB | ~1M+ rows)
        multipart: snapshot.file.size > 95 * 1024 * 1024,
        contentType: snapshot.file.type || 'text/csv',
      })
      blobUrl = uploaded.url
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(message)
      setActiveContactImport((prev) =>
        prev && prev.listId === snapshot.listId
          ? {
              ...prev,
              step: 'error',
              errorMessage: `Upload failed: ${message}`,
            }
          : prev
      )
      return
    }

    setActiveContactImport((prev) =>
      prev && prev.listId === snapshot.listId
        ? {
            ...prev,
            step: 'registering_job',
            errorMessage: undefined,
          }
        : prev
    )

    let apiBody: CreateContactImportResponseBody
    try {
      const res = await fetch('/api/contacts/import', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          listId: snapshot.listId,
          blobUrl,
          originalFilename: snapshot.file.name,
          contentType: snapshot.file.type || 'text/csv',
          columnMap: snapshot.columnMap,
        }),
      })

      if (!res.ok) {
        // TODO: add better error handling here
        console.error(res.statusText)
        setActiveContactImport((prev) =>
          prev && prev.listId === snapshot.listId
            ? {
                ...prev,
                step: 'error',
                errorMessage: `Could not start import: ${res.statusText}`,
              }
            : prev
        )
        return
      }

      apiBody = object({
        importId: string,
        workflowRunId: string,
      })
        .refineType<CreateContactImportResponseBody>()
        .verify(await res.json())
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setActiveContactImport((prev) =>
        prev && prev.listId === snapshot.listId
          ? {
              ...prev,
              step: 'error',
              errorMessage: `Could not start import: ${message}`,
            }
          : prev
      )
      return
    }

    setActiveContactImport((prev) =>
      prev && prev.listId === snapshot.listId
        ? {
            ...prev,
            step: 'streaming_progress',
            importId: apiBody.importId,
            progress: {
              numberOfInspectedRows: 0,
              numberOfIngestedRows: 0,
              numberOfSkippedRows: 0,
              cursorByte: 0,
              totalByteSize: snapshot.file.size,
            },
          }
        : prev
    )
  }, [])

  const isListImportBusy = useCallback(
    (listId: string) => {
      if (!activeContactImport || activeContactImport.listId !== listId) {
        return false
      }

      return (
        activeContactImport.step === 'uploading_blob' ||
        activeContactImport.step === 'registering_job' ||
        activeContactImport.step === 'streaming_progress'
      )
    },
    [activeContactImport]
  )

  return (
    <ImportContactsContext.Provider
      value={{
        activeContactImport,
        prepareContactImport,
        setActiveContactImportColumnMapping,
        submitActiveContactImport,
        dismissContactImport,
        isListImportBusy,
      }}
    >
      {activeContactImport && activeContactImport.importId ? (
        <ImportContactsRealtime
          importId={activeContactImport.importId}
          setActiveContactImport={setActiveContactImport}
        />
      ) : null}
      {children}
    </ImportContactsContext.Provider>
  )
}

export function useImportContacts(): ImportContactsContextType {
  const ctx = useContext(ImportContactsContext)
  if (ctx === undefined || ctx === null || typeof ctx !== 'object') {
    throw new Error(
      '`useImportContacts` must be used within an `<ImportContactsProvider />`'
    )
  }
  return ctx
}
