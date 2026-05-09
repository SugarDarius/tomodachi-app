import { array, object, string, urlString } from 'decoders'
import { createSafeRouteHandler } from '@sugardarius/anzen'

import { contactImports } from '~/schema'

import { db } from '~/lib/db'
import { auth } from '~/lib/auth/server'

export const POST = createSafeRouteHandler(
  {
    id: 'api/contacts/import',
    body: object({
      listId: string,
      blobUrl: urlString,
      originalFilename: string,
      contentType: string,
      columnMap: object({
        canonical: object({
          email: string,
          firstName: string,
          lastName: string,
        }),
        varying: array(string),
      }),
    }),
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
  async ({ auth, body }) => {
    const inserted = await db
      .insert(contactImports)
      .values({
        tenantId: auth.tenantId,
        listId: body.listId,
        blobUrl: body.blobUrl,
        originalFilename: body.originalFilename,
        contentType: body.contentType,
        columnMap: body.columnMap,
        ingestionStatus: 'running',
      })
      .returning({ insertedId: contactImports.id })

    const contactImportId = inserted[0].insertedId
    if (!contactImportId) {
      return new Response('Failed to create contact import', { status: 500 })
    }

    // START IMPORT WORKFLOW

    return Response.json(
      {
        contactImportId,
      },
      { status: 200 }
    )
  }
)
