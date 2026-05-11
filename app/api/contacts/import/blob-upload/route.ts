import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'

import {
  constant,
  object,
  string,
  boolean,
  nullable,
  taggedUnion,
  optional,
} from 'decoders'
import { createSafeRouteHandler } from '@sugardarius/anzen'

import { auth } from '~/lib/auth/server'

// Hard cap for file upload max size in bytes.
const MAX_CSV_UPLOAD_BYTES = 1024 * 1024 * 1024
const ALLOWED_CONTENT_TYPES = [
  'text/csv',
  'application/csv',
  'application/vnd.ms-excel',
  'application/octet-stream', // some browsers send this for .csv
]

const generateClientTokenDecoder = object({
  type: constant('blob.generate-client-token'),
  payload: object({
    pathname: string,
    multipart: boolean,
    clientPayload: nullable(string),
  }),
})

const uploadCompletedDecoder = object({
  type: constant('blob.upload-completed'),
  payload: object({
    blob: object({
      url: string,
      downloadUrl: string,
      pathname: string,
      contentType: string,
      contentDisposition: string,
      etag: string,
    }),
    tokenPayload: optional(nullable(string)),
  }),
})

const bodyDecoder = taggedUnion('type', {
  generateClientTokenDecoder,
  uploadCompletedDecoder,
}).refineType<HandleUploadBody>()

export const POST = createSafeRouteHandler(
  {
    id: 'api/contacts/import/blob-upload',
    body: bodyDecoder,
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
      body,
      request: req,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_CSV_UPLOAD_BYTES,
          tokenPayload: JSON.stringify({ tenantId: auth.tenantId }),
        }
      },
      onUploadCompleted: async () => {
        // simple audit log
        console.log('upload completed')
      },
    })

    return Response.json(json)
  }
)
