'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { AppLists } from './app-lists'
import { usePathname } from 'next/navigation'
import { Command, LayoutGrid } from 'lucide-react'

import { authClient } from '~/lib/auth/client'
import { type ContactsList } from '~/schema'

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarSeparator,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroupLabel,
  SidebarGroup,
} from '~/components/ui/sidebar'
import { Skeleton } from '~/components/ui/skeleton'
import { CreateContactListDialog } from '~/components/contacts-lists/create-contact-list-dialog'

import { AppUser } from './app-user'

const { useSession } = authClient

export function AppSidebar({
  getContactsListsPromise,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  getContactsListsPromise: Promise<ContactsList[]>
}) {
  const { data } = useSession()
  const pathname = usePathname()

  return (
    <Sidebar variant='inset' {...props}>
      <SidebarHeader>
        <div className='flex items-center gap-2 font-medium'>
          <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-foreground text-background'>
            <Command className='size-4' />
          </div>
          <div className='grid flex-1 text-left text-sm leading-tight'>
            <span className='truncate font-medium'>Tomodochi Inc.</span>
            <span className='truncate text-xs'>A Resend challenge</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/dashboard'}
                className='data-active:bg-accent-foreground/10 transition-all duration-150 ease-in-out hover:bg-accent-foreground/10'
              >
                <Link href='/dashboard'>
                  <LayoutGrid className='size-4' />
                  dashboard
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
          <CreateContactListDialog />
        </SidebarGroup>
        <SidebarSeparator />
        <Suspense
          fallback={
            <SidebarGroup className='group-data-[collapsible=icon]:hidden'>
              <SidebarGroupLabel>Contacts lists</SidebarGroupLabel>
              <SidebarMenu>
                <div className='flex flex-col flex-1 gap-0.5'>
                  <Skeleton className='w-full h-8 bg-foreground/10' />
                  <Skeleton className='w-full h-8 bg-foreground/10' />
                  <Skeleton className='w-full h-8 bg-foreground/10' />
                  <Skeleton className='w-full h-8 bg-foreground/10' />
                  <Skeleton className='w-full h-8 bg-foreground/10' />
                  <Skeleton className='w-full h-8 bg-foreground/10' />
                </div>
              </SidebarMenu>
            </SidebarGroup>
          }
        >
          <AppLists getContactsListsPromise={getContactsListsPromise} />
        </Suspense>
      </SidebarContent>
      <SidebarFooter>
        {data ? (
          <AppUser
            user={{
              name: data.user.name,
              email: data.user.email,
            }}
          />
        ) : null}
      </SidebarFooter>
    </Sidebar>
  )
}
