'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useHotkeys } from 'react-hotkeys-hook'

import { Button } from '~/components/ui/button'
import { Kbd, KbdGroup } from '~/components/ui/kbd'
import { Upload } from 'lucide-react'

export function ImportContactsButton({
  listId,
  appearance = 'default',
  shortcut = true,
}: {
  listId: string
  appearance?: 'default' | 'icon'
  shortcut?: boolean
}) {
  const router = useRouter()
  useHotkeys(
    'I',
    (e) => {
      e.preventDefault()
      router.push(`/dashboard/${listId}/import`)
    },
    { enabled: shortcut }
  )

  return (
    <Button
      variant='default'
      size={appearance === 'default' ? 'default' : 'icon'}
      asChild
    >
      <Link href={`/dashboard/${listId}/import`}>
        <Upload className='size-4' />
        {appearance === 'default' ? (
          <>
            Import contacts
            <KbdGroup>
              <Kbd className='rounded-sm border border-border'>I</Kbd>
            </KbdGroup>
          </>
        ) : null}
      </Link>
    </Button>
  )
}
