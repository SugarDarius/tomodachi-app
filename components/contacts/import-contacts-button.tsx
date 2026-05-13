'use client'

import { Button } from '~/components/ui/button'
import { Spinner } from '~/components/ui/spinner'

import { useImportContacts } from './import-contacts-provider'
import { ImportContactsDialog } from './import-contacts-dialog'

export function ImportContactsButton({
  listId,
  appearance = 'default',
}: {
  listId: string
  appearance?: 'default' | 'icon'
}) {
  const { isListImportBusy } = useImportContacts()

  if (isListImportBusy(listId)) {
    return (
      <Button
        variant='outline'
        disabled
        size={appearance === 'default' ? 'default' : 'icon'}
      >
        <Spinner data-icon='inline-start' />
        {appearance === 'default' ? 'Importing...' : null}
      </Button>
    )
  }

  return <ImportContactsDialog listId={listId} appearance={appearance} />
}
