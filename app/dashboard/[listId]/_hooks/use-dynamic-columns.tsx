'use client'

import { useMemo } from 'react'

import {
  type Contact,
  type ColumnMapping,
  type CanonicalContactField,
} from '~/schema'

import { formatDateAsEnUs } from '~/utils/format-date'
import { type ColumnDef, TableColumnHeader } from '~/components/kibo-ui/table'

import {
  TableHeaderCellAction,
  TableRowCellAction,
} from '../_components/table-cell-actions'

const getCanonicalAccessorKey = (key: CanonicalContactField) => {
  return key === 'email'
    ? 'email'
    : key === 'first_name'
      ? 'firstName'
      : 'lastName'
}

/**
 *  Builds dynamically the columns for the contacts table
 *  based on the column map.
 *
 * Users see the columns ordering than in their original CSV file.
 */
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
      {
        id: 'select',
        header: () => <TableHeaderCellAction />,
        cell: ({ row }) => <TableRowCellAction id={row.original.id} />,
      },
      {
        id: 'rowNumber',
        accessorKey: 'rowNumber',
        header: ({ column }) => <TableColumnHeader column={column} title='#' />,
        cell: ({ row }) => row.original.rowNumber,
      },
      ...storedColumns.map(
        (meta) =>
          ({
            id: meta.value,
            accessorKey: meta.accessorKey,
            header: ({ column }) => (
              <TableColumnHeader
                column={column}
                title={meta.value.toLowerCase()}
              />
            ),
          }) as ColumnDef<Contact>
      ),
      {
        id: 'createdAt',
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <TableColumnHeader column={column} title='created at' />
        ),
        cell: ({ row }) => formatDateAsEnUs(row.original.createdAt),
      },
      {
        id: 'updatedAt',
        accessorKey: 'updatedAt',
        header: ({ column }) => (
          <TableColumnHeader
            column={column}
            title='updated at'
            className='justify-end [&>button]:pr-0'
          />
        ),
        cell: ({ row }) => (
          <span className='inline-flex justify-end w-full'>
            {formatDateAsEnUs(row.original.updatedAt)}
          </span>
        ),
      },
    ]

    return columns
  }, [columnMap])
}
