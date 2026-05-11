'use client'

import { useState, useMemo, useCallback } from 'react'
import { Upload } from 'lucide-react'

import { Button } from '~/components/ui/button'
import { Spinner } from '~/components/ui/spinner'
import { Label } from '~/components/ui/label'
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
import { useImportContacts } from './import-contacts-provider'
import { type CanonicalContactField } from '~/schema'

type RoleOption = {
  value: 'email' | 'first_name' | 'last_name' | 'varying'
  label: string
}
const ROLE_OPTIONS: RoleOption[] = [
  { value: 'email', label: 'Email' },
  { value: 'first_name', label: 'First name' },
  { value: 'last_name', label: 'Last name' },
  { value: 'varying', label: 'Ignore' },
]

export function ImportContactsDialog({ listId }: { listId: string }) {
  const {
    activeContactImport,
    prepareContactImport,
    setActiveContactImportColumnMapping,
    submitActiveContactImport,
    dismissContactImport,
  } = useImportContacts()

  const [open, setOpen] = useState(false)

  const scoped = useMemo(
    () =>
      activeContactImport && activeContactImport.listId === listId
        ? activeContactImport
        : null,
    [activeContactImport, listId]
  )

  const busy = useMemo(
    () =>
      scoped !== null &&
      (scoped.step === 'uploading_blob' ||
        scoped.step === 'registering_job' ||
        scoped.step === 'streaming_progress'),
    [scoped]
  )

  const handleDrop = useCallback(
    async (files: File[]) => {
      const file = files[0]
      if (!file) {
        return
      }

      await prepareContactImport({ listId, file })
    },
    [listId, prepareContactImport]
  )

  const handleError = useCallback((error: Error) => {
    console.error(error.message)
    // TODO: add toast notification here
  }, [])

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next)
      if (!next) {
        dismissContactImport(listId)
      }
    },
    [listId, dismissContactImport]
  )

  const updateRole = useCallback(
    (header: string, role: RoleOption['value']) => {
      if (scoped !== null) {
        const canonical = { ...scoped.columnMap.canonical }
        const varying = [...scoped.columnMap.varying]

        if (role === 'varying') {
          varying.push(header)
        } else {
          if (role === 'email') {
            canonical.email = header
          } else if (role === 'first_name') {
            canonical.first_name = header
          } else if (role === 'last_name') {
            canonical.last_name = header
          }

          setActiveContactImportColumnMapping({
            canonical,
            varying,
          })
        }
      }
    },
    [scoped, setActiveContactImportColumnMapping]
  )

  const handleSubmit = useCallback(async () => {
    if (scoped !== null) {
      await submitActiveContactImport()
    }
  }, [scoped, submitActiveContactImport])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
          {scoped === null ? (
            <Dropzone
              disabled={busy}
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
          ) : (
            <>
              {scoped.step === 'reading_preview' ? (
                <div className='flex items-center gap-2 text-muted-foreground text-sm'>
                  <Spinner data-icon='inline-start' />
                  Parsing preview…
                </div>
              ) : null}

              {scoped.step === 'mapping' ||
              scoped.step === 'reading_preview' ? (
                <div className='flex flex-col gap-2'>
                  <p className='text-xs text-muted-foreground'>
                    File size{' '}
                    {(scoped.preview.fileSizeBytes / (1024 * 1024)).toFixed(2)}{' '}
                    MB · showing first {scoped.preview.sampleRows.length}{' '}
                    preview rows.
                  </p>
                  <div className='flex flex-col gap-2'>
                    <Label className='text-xs uppercase tracking-wide'>
                      Column mapping
                    </Label>
                    <div className='flex flex-col gap-2'>
                      {scoped.preview.headers.map((header) => (
                        <div
                          key={header}
                          className='grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-2 items-center'
                        >
                          <span
                            className='truncate font-mono text-xs'
                            title={header}
                          >
                            {header || '(unmapped column)'}
                          </span>
                          <select
                            className='border-input bg-background text-foreground h-9 rounded-md border px-2 text-sm'
                            value={
                              scoped.columnMap.canonical[
                                header as CanonicalContactField
                              ] ?? 'varying'
                            }
                            onChange={(e) =>
                              updateRole(
                                header,
                                e.target.value as RoleOption['value']
                              )
                            }
                          >
                            {ROLE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className='rounded-md border overflow-x-auto max-h-56 overflow-y-auto'>
                    <table className='w-full text-xs'>
                      <thead className='bg-muted/60 sticky top-0'>
                        <tr>
                          {scoped.preview.headers.map((h, colIdx) => (
                            <th
                              key={`${colIdx}:${h}`}
                              className='px-2 py-1 text-left font-medium'
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {scoped.preview.sampleRows.map((row, idx) => (
                          <tr key={idx} className='border-t'>
                            {scoped.preview.headers.map((h, colIdx) => (
                              <td
                                key={`${colIdx}:${h}`}
                                className='px-2 py-1 whitespace-nowrap'
                              >
                                {row[h] ?? ''}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {scoped.step === 'mapping' ? (
                    <Button onClick={handleSubmit} disabled={busy}>
                      Start import
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </>
          )}
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
