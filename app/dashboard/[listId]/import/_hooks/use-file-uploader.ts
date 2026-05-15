'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { upload } from '@vercel/blob/client'

import { type ColumnMapping } from '~/schema'

import {
  type CreateContactImportResponseBody,
  type PreviewResult,
} from '~/lib/csv/contact-import'
import { previewCsvHead } from '~/lib/csv/head'
import { autoDetectColumnMapping } from '~/lib/csv/columns'
import { useImportContactsJob } from './use-import-contacts-job'

const useFileUpload = ({
  onFileUploaded,
  onFileUploadError,
}: {
  onFileUploaded: (blobUrl: string, file: File) => void
  onFileUploadError: (error: unknown) => void
}) => {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<unknown | null>(null)

  const uploadFile = useCallback(
    (file: File) => {
      if (uploading) {
        return
      }

      setUploading(true)

      upload(file.name, file, {
        access: 'private',
        handleUploadUrl: '/api/contacts/import/blob-upload',
        // Use multipart upload for large files (> 95MB | ~1M+ rows)
        multipart: file.size > 95 * 1024 * 1024,
        contentType: file.type || 'text/csv',
      })
        .then((blobResult) => {
          onFileUploaded(blobResult.url, file)
        })
        .catch((err) => {
          setError(err)
          onFileUploadError(err)
        })
        .finally(() => {
          setUploading(false)
        })
    },
    [uploading, onFileUploaded, onFileUploadError]
  )

  return {
    uploading,
    error,
    uploadFile,
  } as const
}

/** track status of the file uploader */
export type FileUploaderStatus =
  | 'idle'
  | 'uploading'
  | 'reading_preview'
  | 'mapping'
  | 'starting_import_job'
  | 'error'

export type FileUploaderState = {
  /**
   * The list id that the file uploader is associated with.
   */
  listId: string
  /**
   * The file that is being uploaded.
   */
  file: File | null
  /**
   * The status of the file uploader.
   */
  status: FileUploaderStatus
  /**
   * Blob URL of the uploaded file.
   */
  blobUrl: string | null
  /**
   * The preview of the file.
   */
  headPreview: PreviewResult | null
  /**
   * The column mapping of the file.
   */
  columnMapping: ColumnMapping | null
}

/**
 * Hook manage file uploader state and actions.
 *
 * - File upload into blob storage (Vercel Blob) - async
 * - File head parsing for preview and column mapping - async
 * - Start contact import workflow
 */
export function useFileUploader({ listId }: { listId: string }) {
  const router = useRouter()

  const [uploaderState, setUploaderState] = useState<FileUploaderState>({
    listId,
    file: null,
    status: 'idle',
    blobUrl: null,
    headPreview: null,
    columnMapping: null,
  })

  const readPreview = useCallback(async (file: File) => {
    setUploaderState((prev) => ({
      ...prev,
      status: 'reading_preview',
    }))

    try {
      const headPreview = await previewCsvHead(file)
      const columnMapping = autoDetectColumnMapping(headPreview.headers)

      setUploaderState((prev) => ({
        ...prev,
        headPreview,
        columnMapping,
        status: 'mapping',
      }))
    } catch (err) {
      console.error(err)
      toast.error('Failed to read preview')

      setUploaderState((prev) => ({
        ...prev,
        headPreview: null,
        columnMapping: null,
        status: 'error',
      }))
    }
  }, [])

  const onFileUploaded = useCallback(
    (blobUrl: string, file: File) => {
      toast.success('File uploaded successfully')
      setUploaderState((prev) => ({
        ...prev,
        blobUrl,
        status: 'reading_preview',
      }))
      void readPreview(file)
    },
    [readPreview]
  )

  const onFileUploadError = useCallback((err: unknown) => {
    console.error(err)
    toast.error('Failed to upload file')
    setUploaderState((prev) => ({
      ...prev,
      status: 'error',
    }))
  }, [])

  const { uploadFile } = useFileUpload({
    onFileUploaded,
    onFileUploadError,
  })

  const updateColumnMapping = useCallback((columnMapping: ColumnMapping) => {
    setUploaderState((prev) => ({
      ...prev,
      columnMapping,
    }))
  }, [])

  const handleFileChange = useCallback(
    (file: File) => {
      setUploaderState((prev) => ({
        ...prev,
        file,
        status: 'uploading',
      }))
      uploadFile(file)
      toast.info(`Uploading file ${file.name}…`)
    },
    [uploadFile]
  )

  const onImportJobStarted = useCallback(
    (importJob: CreateContactImportResponseBody) => {
      // REDIRECT TO IMPORT JOB PAGE
      router.push(`/dashboard/${listId}/import/${importJob.importId}`)
    },
    [listId, router]
  )

  const onImportJobError = useCallback((error: unknown) => {
    console.error(error)
    toast.error('Failed to start import job')
    setUploaderState((prev) => ({
      ...prev,
      status: 'error',
    }))
  }, [])

  const { startImport } = useImportContactsJob({
    listId,
    onImportJobStarted,
    onImportJobError,
  })

  const startImportJob = useCallback(() => {
    if (
      uploaderState.columnMapping === null ||
      uploaderState.blobUrl === null ||
      uploaderState.file === null
    ) {
      toast.error(
        'Please complete the import process before starting the import job'
      )
      return
    }
    setUploaderState((prev) => ({
      ...prev,
      status: 'starting_import_job',
    }))
    startImport({
      blobUrl: uploaderState.blobUrl,
      originalFilename: uploaderState.file.name,
      contentType: uploaderState.file.type || 'text/csv',
      columnMap: uploaderState.columnMapping,
    })
  }, [
    startImport,
    uploaderState.blobUrl,
    uploaderState.file,
    uploaderState.columnMapping,
  ])

  return {
    status: uploaderState.status,
    columnMapping: uploaderState.columnMapping,
    headPreview: uploaderState.headPreview,
    handleFileChange,
    updateColumnMapping,
    startImportJob,
  } as const
}
