import { start } from 'workflow/api'
import { array, object, string, urlString, number } from 'decoders'
import { createSafeRouteHandler } from '@sugardarius/anzen'

import { type ColumnMapping, contactImports } from '~/schema'

import { db } from '~/lib/db'
import { auth } from '~/lib/auth/server'

import { contactImportWorkflow } from '~/workflows/contact-import'

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
          email: object({ value: string, positionIndex: number }),
          first_name: object({ value: string, positionIndex: number }),
          last_name: object({ value: string, positionIndex: number }),
        }),
        varying: array(object({ value: string, positionIndex: number })),
      }).refineType<ColumnMapping>(),
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
    const run = await start(contactImportWorkflow, [
      {
        importId: contactImportId,
      },
    ])

    return Response.json(
      {
        importId: contactImportId,
        workflowRunId: run.runId,
      },
      { status: 200 }
    )
  }
)
