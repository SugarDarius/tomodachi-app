import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
} from '~/components/ui/sidebar'

import { getContactsLists } from '../_lib/contacts-lists'
import { AppListItem } from './app-list-item'

export async function AppLists() {
  const lists = await getContactsLists()

  return (
    <SidebarGroup className='group-data-[collapsible=icon]:hidden'>
      <SidebarGroupLabel>Contacts lists</SidebarGroupLabel>
      <SidebarMenu className='gap-0.5'>
        {lists.map((list) => (
          <AppListItem key={list.id} list={list} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
