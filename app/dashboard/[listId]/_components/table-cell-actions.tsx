'use client'

import { useEffect } from 'react'

import { Checkbox } from '~/components/ui/checkbox'

import { useTableRowsStore } from '../_stores/table-rows'

export function TableHeaderCellAction() {
  const { allSelected, selectAll, unSelectAll } = useTableRowsStore()

  const handleCheckedChange = (checked: boolean) => {
    if (checked) {
      selectAll()
    } else {
      unSelectAll()
    }
  }

  return (
    <div className='flex items-center px-2'>
      <Checkbox checked={allSelected} onCheckedChange={handleCheckedChange} />
    </div>
  )
}

export function TableRowCellAction({ id }: { id: string }) {
  const { isRowSelected, toggleRow, registerRow } = useTableRowsStore()

  const checked = isRowSelected(id)

  const handleCheckedChange = (checked: boolean) => {
    toggleRow(id, checked)
  }

  useEffect(() => {
    registerRow(id)
  }, [id, registerRow])

  return (
    <div className='flex items-center px-2'>
      <Checkbox
        checked={checked}
        onCheckedChange={handleCheckedChange}
        onClick={(e) => {
          e.stopPropagation()
        }}
      />
    </div>
  )
}
