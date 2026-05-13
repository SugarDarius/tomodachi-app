import { string, numeric, optional } from 'decoders'
import { createSafeRouteHandler } from '@sugardarius/anzen'

import { auth } from '~/lib/auth/server'
import { getContactsListMembersPaginated } from '~/app/dashboard/[listId]/_lib/contacts-list'

export const GET = createSafeRouteHandler(
  {
    id: 'api/contacts/get/[listId]',
    segments: {
      listId: string,
    },
    searchParams: {
      pageIndex: numeric,
      pageSize: numeric,
      searchQuery: optional(string),
    },
    authorize: async () => {
      const { data: session } = await auth.getSession()
      if (!session) {
        return new Response('Unauthorized', { status: 401 })
      }

      return {
        tenantId: session.user.id,
      }
    },
  },
  async ({ segments, searchParams }) => {
    const { listId } = segments
    const { pageIndex, pageSize, searchQuery } = searchParams

    const page = await getContactsListMembersPaginated({
      id: listId,
      pageIndex,
      pageSize,
      searchQuery,
    })

    return Response.json(page, { status: 200 })
  }
)
