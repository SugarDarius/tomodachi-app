'use client'

import { useState, useMemo, useCallback } from 'react'
import { Upload } from 'lucide-react'

import { Button } from '~/components/ui/button'
import { Spinner } from '~/components/ui/spinner'
import {
  Sheet,
  SheetContent,
  SheetDescription,
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
import {
  ColumnsSelector,
  type ColumnRoleOption,
  REQUIRED_ROLES,
} from './columns-selector'

export function ImportContactsDialog({
  listId,
  appearance = 'default',
}: {
  listId: string
  appearance?: 'default' | 'icon'
}) {
  const {
    activeContactImport,
    prepareContactImport,
    setActiveContactImportColumnMapping,
    submitActiveContactImport,
    dismissContactImport,
  } = useImportContacts()

  const [open, setOpen] = useState(false)

  const scoped =
    activeContactImport && activeContactImport.listId === listId
      ? activeContactImport
      : null

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
    (header: string, role: ColumnRoleOption['value'], index: number) => {
      if (scoped !== null) {
        const canonical = { ...scoped.columnMap.canonical }
        let varying = [...scoped.columnMap.varying]

        for (const key of REQUIRED_ROLES) {
          if (canonical[key].value === header) {
            canonical[key] = { value: '', positionIndex: 0 }
          }
        }
        varying = varying.filter((v) => v.value !== header)

        if (role === 'varying') {
          varying.push({ value: header, positionIndex: index })
        } else if (role === 'email') {
          canonical.email = { value: header, positionIndex: index }
        } else if (role === 'first_name') {
          canonical.first_name = { value: header, positionIndex: index }
        } else if (role === 'last_name') {
          canonical.last_name = { value: header, positionIndex: index }
        }

        setActiveContactImportColumnMapping({
          canonical,
          varying,
        })
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
        <Button
          variant='default'
          size={appearance === 'default' ? 'default' : 'icon'}
        >
          <Upload className='size-4' />
          {appearance === 'default' ? 'Import contacts' : null}
        </Button>
      </SheetTrigger>
      <SheetContent className='w-4xl! max-w-4xl!'>
        <SheetHeader className='border-border border-b'>
          <SheetTitle>Import contacts</SheetTitle>
          <SheetDescription>
            Import new contacts from a CSV file.
          </SheetDescription>
        </SheetHeader>
        <div className='flex flex-col gap-2 p-4 flex-1 overflow-hidden'>
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
                <div className='flex items-center gap-2 text-muted-foreground text-sm flex-1 justify-center'>
                  <Spinner data-icon='inline-start' />
                  Parsing preview…
                </div>
              ) : null}

              {scoped.step === 'mapping' ||
              scoped.step === 'reading_preview' ? (
                <ColumnsSelector
                  busy={busy}
                  preview={scoped.preview}
                  columnMap={scoped.columnMap}
                  updateColumnRole={updateRole}
                  onImportContacts={handleSubmit}
                />
              ) : null}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
