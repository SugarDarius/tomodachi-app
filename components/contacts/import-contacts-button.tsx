'use client'

import { useImportContacts } from './import-contacts-provider'
import { ImportContactsDialog } from './import-contacts-dialog'
import { Button } from '~/components/ui/button'
import { Spinner } from '../ui/spinner'

export function ImportContactsButton({ listId }: { listId: string }) {
  const { isListImportBusy } = useImportContacts()

  if (isListImportBusy(listId)) {
    return (
      <Button variant='outline' disabled>
        <Spinner data-icon='inline-start' />
        Importing...
      </Button>
    )
  }

  return <ImportContactsDialog />
}
