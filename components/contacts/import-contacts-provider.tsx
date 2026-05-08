'use client'

import { createContext, useCallback, useContext, useState } from 'react'

/**
 * Context provider for importing contacts.
 * Globally shared and distributed across the app to:
 *
 * - import contacts from a csv file
 * - track current import session
 * - handle errors and progress
 * - notify user in the UI
 */

export type ImportContactsContextType = {
  /**
   * Main function to call for importing contacts
   * for a given list id
   */
  importContacts: (files: File[], params: { listId: string }) => void
  /**
   * Dictionary of list ids and their importing status
   */
  importing: Record<string, boolean>
}

const ImportContactsContext = createContext<ImportContactsContextType>({
  importContacts: () => {},
  importing: {},
})

export function ImportContactsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  // TODO: update with some stored data from the db / realtime
  const [importing, setImporting] = useState<Record<string, boolean>>({})

  const importContacts = useCallback(
    async (files: File[], { listId }: { listId: string }) => {
      setImporting((prev) => ({ ...prev, [listId]: true }))
    },
    []
  )

  return (
    <ImportContactsContext.Provider value={{ importContacts, importing }}>
      {children}
    </ImportContactsContext.Provider>
  )
}

export function useImportContacts() {
  const ctx = useContext(ImportContactsContext)
  if (!ctx) {
    throw new Error(
      '`useImportContacts` must be used within an `<ImportContactsProvider />`'
    )
  }
  return ctx
}
