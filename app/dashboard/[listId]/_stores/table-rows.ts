import { create } from 'zustand'

/**
 * Sidecar store to manage the selected rows in the table.
 */
export type TableRowsState = {
  rows: Map<string, { selected: boolean }>
  allSelected: boolean
  selectAll: () => void
  unSelectAll: () => void
  toggleRow: (id: string, selected: boolean) => void
  isRowSelected: (id: string) => boolean
  registerRow: (id: string) => void
}

export const useTableRowsStore = create<TableRowsState>()((set, get) => ({
  rows: new Map(),
  allSelected: false,
  selectAll: () => {
    const rows = get().rows

    for (const [id] of rows.entries()) {
      rows.set(id, { selected: true })
    }

    set({ rows: new Map(rows), allSelected: true })
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
    const allSelected = rows.entries().every(([_, { selected }]) => selected)
    set({ rows: new Map(rows), allSelected })
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
}))
