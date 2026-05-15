import { string } from 'decoders'
import { createSafeRouteHandler } from '@sugardarius/anzen'

import { auth } from '~/lib/auth/server'
import { getContactImportJob } from '~/app/dashboard/[listId]/import/[importId]/_lib/jobs'

export const GET = createSafeRouteHandler(
  {
    id: 'api/contacts/get/[listId]/imports/[importId]',
    segments: {
      listId: string,
      importId: string,
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
  async ({ segments }) => {
    const { importId, listId } = segments
    const contactImportJob = await getContactImportJob({ importId, listId })
    return Response.json(contactImportJob)
  }
)
