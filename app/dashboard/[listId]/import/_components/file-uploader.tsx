'use client'

import { useCallback } from 'react'
import { toast } from 'sonner'

import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from '~/components/kibo-ui/dropzone'
import { Spinner } from '~/components/ui/spinner'

import {
  useFileUploader,
  type FileUploaderStatus,
} from '../_hooks/use-file-uploader'

import { ImportColumnsMapper } from './import-columns-mapper'
import { ImportStepper } from './import-stepper'

const getFileUploaderStep = (status: FileUploaderStatus) => {
  switch (status) {
    case 'idle':
    case 'uploading':
      return 'upload'
    case 'reading_preview':
    case 'mapping':
      return 'mapping'
    default:
      return 'upload'
  }
}

export function FileUploader({ listId }: { listId: string }) {
  const {
    status,
    headPreview,
    columnMapping,
    handleFileChange,
    updateColumnMapping,
  } = useFileUploader({ listId })

  const handleFileDrop = useCallback(
    (files: File[]) => {
      const file = files[0]
      if (!file) {
        return
      }
      handleFileChange(file)
    },
    [handleFileChange]
  )

  const handleFileError = useCallback((error: Error) => {
    console.error(error.message)
    toast.error('Failed to upload file. Please try again.')
  }, [])

  const step = getFileUploaderStep(status)

  return (
    <div className='flex flex-col gap-4 overflow-hidden flex-1'>
      <div className='flex flex-1 flex-col items-center justify-center overflow-hidden'>
        {status === 'idle' ? (
          <Dropzone
            maxFiles={1}
            accept={{ 'text/csv': ['.csv'] }}
            maxSize={1024 * 1024 * 1024} // 1GB
            minSize={1024}
            onDrop={handleFileDrop}
            onError={handleFileError}
            className='flex size-4/5'
          >
            <DropzoneEmptyState />
            <DropzoneContent />
          </Dropzone>
        ) : null}
        {status === 'uploading' || status === 'reading_preview' ? (
          <div className='flex items-center justify-center size-4/5'>
            <div className='flex items-center gap-2 text-muted-foreground text-sm'>
              <Spinner className='size-4' />
              {status === 'uploading' ? 'Uploading file…' : 'Reading preview…'}
            </div>
          </div>
        ) : null}
        {status === 'mapping' &&
        headPreview !== null &&
        columnMapping !== null ? (
          <div className='flex flex-col gap-2 flex-1 overflow-hidden w-4/5'>
            <ImportColumnsMapper
              headPreview={headPreview}
              columnMapping={columnMapping}
              onUpdateColumnMapping={updateColumnMapping}
              onImportContacts={() => {}}
            />
          </div>
        ) : null}
      </div>
      <div className='flex flex-col gap-2 flex-none px-4'>
        <ImportStepper step={step} />
      </div>
    </div>
  )
}
