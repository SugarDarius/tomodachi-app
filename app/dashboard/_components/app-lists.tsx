'use client'

import { use } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Contact2, MoreHorizontal } from 'lucide-react'

import { type ContactsList } from '~/schema'
import { capitalize } from '~/utils/chars'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from '~/components/ui/sidebar'
import { ContactListActionsMenu } from '~/components/contacts-lists/contact-list-actions-menu'

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
            <ContactListActionsMenu list={list}>
              <SidebarMenuAction
                showOnHover
                aria-label={`Open actions menu for ${list.name}`}
              >
                <MoreHorizontal />
              </SidebarMenuAction>
            </ContactListActionsMenu>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
