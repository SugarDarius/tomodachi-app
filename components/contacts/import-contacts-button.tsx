'use client'

import { Button } from '~/components/ui/button'
import { Spinner } from '~/components/ui/spinner'
import { Kbd, KbdGroup } from '~/components/ui/kbd'

import { useImportContacts } from './import-contacts-provider'
import { ImportContactsDialog } from './import-contacts-dialog'

export function ImportContactsButton({
  listId,
  appearance = 'default',
  shortcut = true,
}: {
  listId: string
  appearance?: 'default' | 'icon'
  shortcut?: boolean
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
        <KbdGroup>
          <Kbd className='rounded-sm border border-border'>I</Kbd>
        </KbdGroup>
      </Button>
    )
  }

  return (
    <ImportContactsDialog
      listId={listId}
      appearance={appearance}
      shortcut={shortcut}
    />
  )
}
