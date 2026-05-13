import { create } from 'zustand'

/**
 * Sidecar store to manage the selected rows in the table.
 * Allows to trigger bulk actions on the selected rows like deleting.
 */
export type TableRowsState = {
  rows: Map<string, { selected: boolean }>
  allSelected: boolean
  selectAll: () => void
  unSelectAll: () => void
  toggleRow: (id: string, selected: boolean) => void
  isRowSelected: (id: string) => boolean
  registerRow: (id: string) => void
  getSelectedRowIds: () => string[]
}

export const useTableRowsStore = create<TableRowsState>()((set, get) => ({
  rows: new Map(),
  allSelected: false,
  numberOfSelectedRows: 0,
  selectAll: () => {
    const rows = get().rows

    for (const [id] of rows.entries()) {
      rows.set(id, { selected: true })
    }

    set({
      rows: new Map(rows),
      allSelected: true,
    })
  },
  unSelectAll: () => {
    const rows = get().rows

    for (const [id] of rows.entries()) {
      rows.set(id, { selected: false })
    }

    set({ rows: new Map(rows), allSelected: false })
  },
  toggleRow: (id: string, selected: boolean) => {
    const rows = get().rows
    const row = rows.get(id)

    if (row) {
      rows.set(id, { selected })
    }

    const numberOfSelectedRows = rows
      .entries()
      .reduce((acc, [, { selected }]) => (selected ? acc + 1 : acc), 0)

    set({
      rows: new Map(rows),
      allSelected: numberOfSelectedRows === rows.size,
    })
  },
  isRowSelected: (id: string) => {
    const rows = get().rows
    const row = rows.get(id)

    return row?.selected ?? false
  },
  registerRow: (id: string) => {
    const rows = get().rows

    if (!rows.has(id)) {
      rows.set(id, { selected: false })
      set({ rows: new Map(rows) })
    }
  },
  getSelectedRowIds: () => {
    const rows = get().rows

    return Array.from(rows.entries())
      .filter(([, { selected }]) => selected)
      .map(([id]) => id)
  },
}))
