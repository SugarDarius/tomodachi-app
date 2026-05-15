'use client'

import Link from 'next/link'
import NumberFlow, { continuous } from '@number-flow/react'
import { CheckCircle } from 'lucide-react'

import { cn } from '~/lib/utils'
import { Button } from '~/components/ui/button'

import { type ContactImportJob } from '~/schema'
import { ImportStepper } from '../../_components/import-stepper'
import { useImportContactsJob } from '../_hooks/use-import-contacts-job'

const DynamicNumberValue = ({ value }: { value: number }) => {
  return (
    <NumberFlow
      value={value}
      willChange
      plugins={[continuous]}
      locales='en-US'
      format={{
        notation: 'compact',
        compactDisplay: 'short',
        roundingMode: 'trunc',
      }}
    />
  )
}

const Terminal = ({
  fileName,
  status,
  stats,
}: {
  fileName: string
  status: 'running' | 'completed' | 'failed'
  stats: {
    numberOfInspectedRows: number
    numberOfIngestedRows: number
    numberOfSkippedRows: number
    totalByteSize: number
  }
}) => {
  return (
    <div className='flex flex-col w-4/5 max-w-2xl rounded-lg border-border overflow-hidden shadow-2xl flex-none'>
      <div className='bg-muted px-4 py-3 flex items-center gap-2 border-b border-border'>
        <div className='flex gap-2'>
          <div className='w-3 h-3 rounded-full bg-red-500/80' />
          <div className='w-3 h-3 rounded-full bg-orange-500/80' />
          <div className='w-3 h-3 rounded-full bg-green-500/80' />
        </div>
        <span className='ml-3 text-xs text-muted-foreground font-mono'>
          import/{fileName}
        </span>
      </div>
      <div className='flex flex-col gap-2 bg-background p-4 sm:p-6 font-mono text-sm min-h-[280px]'>
        <span>$ Importing contact from {fileName}…</span>
        <span className='text-cyan-500/80'>[STATUS] {status}</span>
        <span className='text-muted-foreground'>
          [PROGRESS] inspected rows:{' '}
          <DynamicNumberValue value={stats.numberOfInspectedRows} />
        </span>
        <span className='text-muted-foreground'>
          [PROGRESS] ingested rows:{' '}
          <DynamicNumberValue value={stats.numberOfIngestedRows} />
        </span>
        <span className='text-muted-foreground'>
          [PROGRESS] skipped rows:{' '}
          <DynamicNumberValue value={stats.numberOfSkippedRows} />
        </span>
        {status === 'completed' ? (
          <span className='text-green-500/80'>Import completed</span>
        ) : null}
        {status === 'failed' ? (
          <span className='text-red-500/80'>
            Import failed. Please try again.
          </span>
        ) : null}
      </div>
    </div>
  )
}

export function ImportContactsJob({
  importId,
  listId,
  initialContactImportJob,
}: {
  importId: string
  listId: string
  initialContactImportJob: ContactImportJob
}) {
  const { status, fileName, stats } = useImportContactsJob({
    listId,
    importId,
    initialContactImportJob,
  })

  const disabled = status !== 'completed'

  return (
    <div className='flex flex-col gap-4 overflow-hidden flex-1'>
      <div className='flex flex-1 flex-col items-center justify-center overflow-hidden gap-8'>
        <Terminal fileName={fileName} status={status} stats={stats} />
        <Button
          asChild
          disabled={disabled}
          variant={status === 'failed' ? 'destructive' : 'outline'}
          size={'lg'}
          className={cn(
            disabled &&
              'cursor-not-allowed hover:bg-destructive/20 dark:hover:bg-destructive/40'
          )}
        >
          <Link
            href={`/dashboard/${listId}`}
            aria-disabled={disabled}
            onClick={(e) => {
              if (disabled) {
                e.preventDefault()
              }
            }}
          >
            {status === 'completed' ? (
              <CheckCircle className='size-4 text-green-500/80' />
            ) : null}
            View contacts
          </Link>
        </Button>
      </div>
      <div className='flex flex-col gap-2 flex-none px-4'>
        <ImportStepper step='import' importCompleted={status === 'completed'} />
      </div>
    </div>
  )
}
