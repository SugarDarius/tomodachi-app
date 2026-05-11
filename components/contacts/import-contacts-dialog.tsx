'use client'

import { useState } from 'react'
import { Upload } from 'lucide-react'

import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from '~/components/kibo-ui/dropzone'

export function ImportContactsDialog() {
  const [open, setOpen] = useState(false)

  const handleDrop = (files: File[]) => {
    const file = files[0]
    if (!file) {
      return
    }

    setOpen(false)
  }

  const handleError = (error: Error) => {
    console.error(error.message)
    // TODO: add toast notification here
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='default'>
          <Upload className='size-4' />
          Import new contacts
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-lg w-xl'>
        <DialogHeader>
          <DialogTitle>Import contacts</DialogTitle>
          <DialogDescription>
            Import new contacts from a CSV file.
          </DialogDescription>
        </DialogHeader>
        <div className='flex flex-col gap-2'>
          <Dropzone
            maxFiles={1}
            accept={{ 'text/csv': ['.csv'] }}
            maxSize={1024 * 1024 * 1024} // 1GB
            minSize={1024}
            onDrop={handleDrop}
            onError={handleError}
          >
            <DropzoneEmptyState />
            <DropzoneContent />
          </Dropzone>
        </div>
        <DialogFooter className='border-0'>
          <DialogClose asChild>
            <Button type='button' variant='outline'>
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
