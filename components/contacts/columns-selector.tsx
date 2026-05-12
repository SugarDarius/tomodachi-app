'use client'

import {
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ChevronDownIcon,
} from 'lucide-react'

import { CanonicalContactField, ColumnMapping } from '~/schema'

import { cn } from '~/lib/utils'
import { type PreviewResult } from '~/lib/csv/contact-import'

import { Badge } from '~/components/ui/badge'
import { ScrollArea } from '~/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '~/components/ui/collapsible'
import { Button } from '~/components/ui/button'

export type ColumnRoleOption = {
  value: 'email' | 'first_name' | 'last_name' | 'varying'
  label: string
  required: boolean
}

const COLUMN_ROLE_OPTIONS: ColumnRoleOption[] = [
  { value: 'email', label: 'Email', required: true },
  { value: 'first_name', label: 'First name', required: true },
  { value: 'last_name', label: 'Last name', required: true },
  { value: 'varying', label: 'Additional', required: false },
]

/**
 * Returns the role value of a column mapping for a given header.
 */
const getColumnMapValue = (
  columnMap: ColumnMapping,
  header: string
): ColumnRoleOption['value'] => {
  const { canonical, varying } = columnMap
  if (canonical.email.value === header) {
    return 'email'
  }
  if (canonical.first_name.value === header) {
    return 'first_name'
  }
  if (canonical.last_name.value === header) {
    return 'last_name'
  }
  if (varying.some((v) => v.value === header)) {
    return 'varying'
  }

  return 'varying'
}

const REQUIRED_ROLES: CanonicalContactField[] = [
  'email',
  'first_name',
  'last_name',
]

const renderBytes = (bytes: number) => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(2)}${units[unitIndex]}`
}

const checkAllRequiredRolesMapped = (
  columnMap: ColumnMapping,
  requiredFields: CanonicalContactField[]
) => {
  return requiredFields.every(
    (field) => columnMap.canonical[field].value !== ''
  )
}

const getMappedRequiredRoles = (
  columnMap: ColumnMapping,
  requiredFields: CanonicalContactField[]
) => {
  return requiredFields.filter(
    (field) => columnMap.canonical[field].value !== ''
  )
}

const isRequiredRoleMapped = (
  columnMap: ColumnMapping,
  role: CanonicalContactField
) => {
  return columnMap.canonical[role].value !== ''
}

const isHeaderMappedAsRequiredRole = (
  columnMap: ColumnMapping,
  header: string
) => {
  // Canonical columns are required roles
  const idx = Object.values(columnMap.canonical).findIndex(
    ({ value }) => value === header
  )

  return idx !== -1
}

const isRoleAlreadyMapped = (columnMap: ColumnMapping, header: string) => {
  const isCanonical = Object.values(columnMap.canonical).some(
    ({ value }) => value === header
  )
  const isVarying = columnMap.varying.some(({ value }) => value === header)
  return isCanonical || isVarying
}

export function ColumnsSelector({
  busy,
  preview,
  columnMap,
  updateColumnRole,
  onImportContacts,
}: {
  busy: boolean
  preview: PreviewResult
  columnMap: ColumnMapping
  updateColumnRole: (
    header: string,
    role: ColumnRoleOption['value'],
    positionIndex: number
  ) => void
  onImportContacts: () => void
}) {
  const { fileSizeBytes, sampleRows, fileName, headers } = preview

  const allRequiredRolesMapped = checkAllRequiredRolesMapped(
    columnMap,
    REQUIRED_ROLES
  )
  const mappedRequiredRoles = getMappedRequiredRoles(columnMap, REQUIRED_ROLES)

  const fileSize = renderBytes(fileSizeBytes)
  const sample = sampleRows.slice(0, 10)

  const getSampleValues = (header: string, size: number) => {
    const values = sample.slice(0, size).map((row) => row[header])
    return values
  }

  return (
    <div className='flex flex-col gap-2 flex-1 overflow-hidden'>
      <div className='flex items-center justify-between p-4 rounded-lg bg-background border border-border/50 flex-non'>
        <div className='flex items-center gap-3'>
          <div className='flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10'>
            <FileSpreadsheet className='w-5 h-5 text-primary' />
          </div>
          <div className='flex-1 min-w-0'>
            <p className='font-medium text-sm truncate'>{fileName}</p>
            <p className='text-xs text-muted-foreground'>
              {fileSize} · showing {sample.length} first row
              {sample.length === 1 ? '' : 's'}.
            </p>
          </div>
        </div>
        <Button disabled={busy} onClick={onImportContacts}>
          Import contacts
        </Button>
      </div>

      <div className='flex flex-col p-4 border-b border-border/50 bg-background gap-2 flex-none'>
        <div className='flex items-center gap-2'>
          <span className='text-sm font-medium'>Required fields</span>
          <Badge
            variant={allRequiredRolesMapped ? 'default' : 'secondary'}
            className={cn(
              'text-xs',
              allRequiredRolesMapped &&
                'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20'
            )}
          >
            {mappedRequiredRoles.length} / {REQUIRED_ROLES.length}
          </Badge>
        </div>

        <div className='flex gap-2'>
          {REQUIRED_ROLES.map((role) => {
            const isMapped = isRequiredRoleMapped(columnMap, role)

            return (
              <div
                key={role}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                  isMapped
                    ? 'bg-emerald-500/15 text-emerald-600'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {isMapped ? (
                  <CheckCircle2 className='w-3.5 h-3.5' />
                ) : (
                  <AlertCircle className='w-3.5 h-3.5' />
                )}
                {role}
              </div>
            )
          })}
        </div>
      </div>

      <div className='flex-1 overflow-hidden'>
        <ScrollArea className='w-full h-full'>
          <div className='flex flex-col gap-2 p-4'>
            <div className='flex items-center gap-4 px-3 pb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider'>
              <span className='flex-1'>CSV Column</span>
              <span className='w-8' />
              <span className='w-48'>Maps to</span>
            </div>

            {headers.map((header, index) => {
              const isMappedAsRequired = isHeaderMappedAsRequiredRole(
                columnMap,
                header
              )

              return (
                <div
                  key={header}
                  className={cn(
                    'group flex items-center gap-4 p-3 rounded-xl border transition-all',
                    isMappedAsRequired
                      ? 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10'
                      : 'border-primary/30 bg-primary/5 hover:bg-primary/10'
                  )}
                >
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2'>
                      <code className='text-sm font-mono font-medium bg-muted/80 px-2 py-0.5 rounded'>
                        {header}
                      </code>
                    </div>
                    <p className='mt-1 text-xs text-muted-foreground truncate'>
                      {getSampleValues(header, 3).join(', ')}
                      {sample.length > 3 && '...'}
                    </p>
                  </div>

                  <ArrowRight
                    className={cn('w-4 h-4 shrink-0 transition-colors')}
                  />

                  <Select
                    value={getColumnMapValue(columnMap, header)}
                    onValueChange={(value) => {
                      updateColumnRole(
                        header,
                        value as ColumnRoleOption['value'],
                        index
                      )
                    }}
                  >
                    <SelectTrigger className={cn('w-48 h-9')}>
                      <SelectValue placeholder='Select field...' />
                    </SelectTrigger>
                    <SelectContent>
                      {COLUMN_ROLE_OPTIONS.map((opt) => {
                        const isAlreadyMapped = isRoleAlreadyMapped(
                          columnMap,
                          opt.value
                        )

                        return (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className='flex items-center gap-2'>
                              <span>{opt.label}</span>
                              {opt.required && (
                                <span className='text-xs text-emerald-600'>
                                  Required
                                </span>
                              )}
                              {isAlreadyMapped && (
                                <span className='text-xs text-muted-foreground'>
                                  (mapped)
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </div>

      <div className='flex-none border-t border-border/50 p-4'>
        <Collapsible className='group'>
          <CollapsibleTrigger asChild>
            <Button
              variant='ghost'
              className='group w-full group-data-[state=open]:rounded-bl-none group-data-[state=open]:rounded-br-none'
            >
              Preview data ({sample.length} rows)
              <ChevronDownIcon className='ml-auto group-data-[state=open]:rotate-180' />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className='flex flex-col'>
            <div className='border border-border/50 overflow-hidden max-h-56'>
              <div className='overflow-x-auto'>
                <table className='w-full text-xs'>
                  <thead className='bg-muted sticky top-0'>
                    <tr>
                      {preview.headers.map((h, colIdx) => (
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
                    {sample.map((row, idx) => (
                      <tr key={idx} className='border-t'>
                        {headers.map((h, colIdx) => (
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
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  )
}
