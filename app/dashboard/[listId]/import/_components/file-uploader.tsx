'use client'

import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from '~/components/kibo-ui/dropzone'

import { ImportStepper } from './import-stepper'

export function FileUploader({ listId }: { listId: string }) {
  return (
    <div className='flex flex-col gap-4 overflow-hidden flex-1'>
      <div className='flex flex-1 flex-col items-center justify-center'>
        <Dropzone
          maxFiles={1}
          accept={{ 'text/csv': ['.csv'] }}
          maxSize={1024 * 1024 * 1024} // 1GB
          minSize={1024}
          className='flex size-4/5'
        >
          <DropzoneEmptyState />
          <DropzoneContent />
        </Dropzone>
      </div>
      <div className='flex flex-col gap-2 flex-none px-4'>
        <ImportStepper step='upload' />
      </div>
    </div>
  )
}
