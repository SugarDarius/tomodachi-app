'use client'

import { Check, ChevronsUpDown, LogOut, Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { SignOutButton } from '~/components/auth/sign-out-button'

import { cn } from '~/lib/utils'

import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '~/components/ui/sidebar'

export function AppUser({
  user,
}: {
  user: {
    name: string
    email: string
  }
}) {
  const { isMobile } = useSidebar()
  const { theme, setTheme } = useTheme()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer'
            >
              <Avatar className='h-8 w-8 rounded-lg'>
                <AvatarImage alt={user.name} />
                <AvatarFallback className='rounded-lg'>
                  {user.name.charAt(0) + user.name.charAt(1)}
                </AvatarFallback>
              </Avatar>
              <div className='grid flex-1 text-left text-sm leading-tight'>
                <span className='truncate font-medium'>{user.name}</span>
                <span className='truncate text-xs'>{user.email}</span>
              </div>
              <ChevronsUpDown className='ml-auto size-4' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
            side={isMobile ? 'bottom' : 'top'}
            align='end'
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className='p-0 font-normal'>
                <div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm'>
                  <Avatar className='h-8 w-8 rounded-lg'>
                    <AvatarImage alt={user.name} />
                    <AvatarFallback className='rounded-lg'>
                      {user.name.charAt(0) + user.name.charAt(1)}
                    </AvatarFallback>
                  </Avatar>
                  <div className='grid flex-1 text-left text-sm leading-tight'>
                    <span className='truncate font-medium' title={user.name}>
                      {user.name}
                    </span>
                    <span className='truncate text-xs' title={user.email}>
                      {user.email}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />
            <DropdownMenuLabel className='text-muted-foreground text-xs'>
              Theme
            </DropdownMenuLabel>
            <DropdownMenuItem
              className='justify-between'
              onClick={() => setTheme('light')}
            >
              <span className='flex items-center gap-1.5'>
                <Sun />
                Light
              </span>
              <Check
                className={cn(
                  'size-4',
                  theme !== 'light' && 'text-transparent'
                )}
              />
            </DropdownMenuItem>
            <DropdownMenuItem
              className='justify-between'
              onClick={() => setTheme('dark')}
            >
              <span className='flex items-center gap-1.5'>
                <Moon />
                Dark
              </span>
              <Check
                className={cn('size-4', theme !== 'dark' && 'text-transparent')}
              />
            </DropdownMenuItem>
            <DropdownMenuItem
              className='justify-between'
              onClick={() => setTheme('system')}
            >
              <span className='flex items-center gap-1.5'>
                <Monitor />
                System
              </span>
              <Check
                className={cn(
                  'size-4',
                  theme !== 'system' && 'text-transparent'
                )}
              />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <SignOutButton className='w-full'>
                <LogOut className='size-4' />
                Log out
              </SignOutButton>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
