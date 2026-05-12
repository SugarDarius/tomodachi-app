'use client'

import { useMemo } from 'react'

import {
  type Contact,
  type ColumnMapping,
  type CanonicalContactField,
} from '~/schema'

import { formatDateAsEnUs } from '~/utils/format-date'

import { type ColumnDef, TableColumnHeader } from '~/components/kibo-ui/table'

const getCanonicalAccessorKey = (key: CanonicalContactField) => {
  return key === 'email'
    ? 'email'
    : key === 'first_name'
      ? 'firstName'
      : 'lastName'
}

export function useDynamicColumns({ columnMap }: { columnMap: ColumnMapping }) {
  return useMemo(() => {
    const { canonical, varying } = columnMap

    const storedColumns = [
      ...Object.entries(canonical).map(([key, meta]) => ({
        accessorKey: getCanonicalAccessorKey(key as CanonicalContactField),
        value: meta.value,
        positionIndex: meta.positionIndex,
      })),
      ...varying.map(({ value, positionIndex }) => ({
        accessorKey: `varyingFields.${value}`,
        value,
        positionIndex,
      })),
    ].sort((a, b) => a.positionIndex - b.positionIndex)

    const columns: ColumnDef<Contact>[] = [
      ...storedColumns.map(
        (meta) =>
          ({
            id: meta.value,
            accessorKey: meta.accessorKey,
            header: ({ column }) => (
              <TableColumnHeader column={column} title={meta.value} />
            ),
          }) as ColumnDef<Contact>
      ),
      {
        id: 'createdAt',
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <TableColumnHeader column={column} title='Created At' />
        ),
        cell: ({ row }) => formatDateAsEnUs(row.original.createdAt),
      },
      {
        id: 'updatedAt',
        accessorKey: 'updatedAt',
        header: ({ column }) => (
          <TableColumnHeader
            column={column}
            title='Updated At'
            className='justify-end'
          />
        ),
        cell: ({ row }) => formatDateAsEnUs(row.original.updatedAt),
      },
    ]

    return columns
  }, [columnMap])
}
