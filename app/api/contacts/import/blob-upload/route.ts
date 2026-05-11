import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'

import { unknown } from 'decoders'
import { createSafeRouteHandler } from '@sugardarius/anzen'

import { env } from '~/env'
import { auth } from '~/lib/auth/server'

// Hard cap for file upload max size in bytes.
const MAX_CSV_UPLOAD_BYTES = 1024 * 1024 * 1024
const ALLOWED_CONTENT_TYPES = [
  'text/csv',
  'application/csv',
  'application/vnd.ms-excel',
  'application/octet-stream', // some browsers send this for .csv
]

export const POST = createSafeRouteHandler(
  {
    id: 'api/contacts/import/blob-upload',
    body: unknown,
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
  async ({ auth, body }, req) => {
    const json = await handleUpload({
      body: body as HandleUploadBody,
      request: req,
      token: env.BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async () => {
        return {
          allowOverwrite: true,
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_CSV_UPLOAD_BYTES,
          tokenPayload: JSON.stringify({ tenantId: auth.tenantId }),
        }
      },
    })

    return Response.json(json)
  }
)
