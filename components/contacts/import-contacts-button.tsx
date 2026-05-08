'use client'

import { useImportContacts } from './import-contacts-provider'
import { ImportContactsDialog } from './import-contacts-dialog'
import { Button } from '~/components/ui/button'
import { Spinner } from '../ui/spinner'

export function ImportContactsButton({ listId }: { listId: string }) {
  const { importContacts, importing } = useImportContacts()

  if (importing[listId]) {
    return (
      <Button variant='outline' disabled className=''>
        <Spinner data-icon='inline-start' />
        Importing...
      </Button>
    )
  }

  const handleImport = (files: File[]) => {
    importContacts(files, { listId })
  }

  return <ImportContactsDialog onImport={handleImport} />
}
