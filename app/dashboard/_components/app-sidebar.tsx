import { Suspense } from 'react'

import { Command } from 'lucide-react'

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarSeparator,
  SidebarMenu,
  SidebarMenuItem,
  SidebarGroupLabel,
  SidebarGroup,
} from '~/components/ui/sidebar'
import { Skeleton } from '~/components/ui/skeleton'
import { CreateContactListDialog } from '~/components/contacts-lists/create-contact-list-dialog'

import { AppDashboardMenuButton } from './app-dashboard-menu-button'
import { AppLists } from './app-lists'
import { AppUser } from './app-user'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
              <AppDashboardMenuButton />
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
          <AppLists />
        </Suspense>
      </SidebarContent>
      <SidebarFooter>
        <AppUser />
      </SidebarFooter>
    </Sidebar>
  )
}
