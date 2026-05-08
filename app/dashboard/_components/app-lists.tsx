'use client'

import { use } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Contact2 } from 'lucide-react'

import { type ContactsList } from '~/schema'
import { capitalize } from '~/utils/chars'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '~/components/ui/sidebar'

export function AppLists({
  getContactsListsPromise,
}: {
  getContactsListsPromise: Promise<ContactsList[]>
}) {
  const lists = use(getContactsListsPromise)
  const pathname = usePathname()

  return (
    <SidebarGroup className='group-data-[collapsible=icon]:hidden'>
      <SidebarGroupLabel>Contacts lists</SidebarGroupLabel>
      <SidebarMenu className='gap-0.5'>
        {lists.map((list) => (
          <SidebarMenuItem key={list.id}>
            <SidebarMenuButton
              className='cursor-pointer items-center gap-2 data-active:bg-accent-foreground/10 transition-all duration-150 ease-in-out hover:bg-accent-foreground/10'
              asChild
              isActive={pathname === `/dashboard/${list.id}`}
            >
              <Link href={`/dashboard/${list.id}`}>
                <Contact2 className='size-4' />
                {capitalize(list.name)}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
