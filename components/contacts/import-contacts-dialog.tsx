'use client'

import { useState, useMemo, useCallback } from 'react'
import { Upload, FileWarning } from 'lucide-react'

import { Button } from '~/components/ui/button'
import { Spinner } from '~/components/ui/spinner'
import { Label } from '~/components/ui/label'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '~/components/ui/sheet'
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
  { value: 'varying', label: 'Additional' },
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
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant='default'>
          <Upload className='size-4' />
          Import new contacts
        </Button>
      </SheetTrigger>
      <SheetContent className='w-4xl! max-w-4xl!'>
        <SheetHeader className='border-border border-b'>
          <SheetTitle>Import contacts</SheetTitle>
          <SheetDescription>
            Import new contacts from a CSV file.
          </SheetDescription>
        </SheetHeader>
        <div className='flex flex-col gap-2 p-4 flex-1'>
          {scoped === null ? (
            <div className='flex flex-1 justify-center items-center'>
              <Dropzone
                disabled={busy}
                maxFiles={1}
                accept={{ 'text/csv': ['.csv'] }}
                maxSize={1024 * 1024 * 1024} // 1GB
                minSize={1024}
                onDrop={handleDrop}
                onError={handleError}
                className='w-full h-full'
              >
                <DropzoneEmptyState />
                <DropzoneContent />
              </Dropzone>
            </div>
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
                    <p className='text-xs text-muted-foreground'>
                      Map the columns of the CSV file to the contact fields.
                      <br />
                      <span className='text-destructive inline-flex items-center gap-0.5'>
                        <FileWarning className='size-4' />
                        The email, first_name, and last_name columns are
                        required.
                        <br />
                        <span className='text-muted-foreground text-xs'>
                          The varying column is used to map additional columns
                          to the contact fields.
                        </span>
                      </span>
                    </p>
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
                      <thead className='bg-muted sticky top-0'>
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
                        {scoped.preview.sampleRows
                          .slice(0, 10)
                          .map((row, idx) => (
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
                    <div className='flex justify-end'>
                      <Button onClick={handleSubmit} disabled={busy}>
                        Start import
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </>
          )}
        </div>
        <SheetFooter className='border-0'>
          <SheetClose asChild>
            <Button type='button' variant='outline'>
              Close
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
