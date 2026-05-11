import { handle } from '@upstash/realtime'

import { realtime } from '~/lib/realtime'
import { auth } from '~/lib/auth/server'

export const GET = handle({
  realtime,
  middleware: async () => {
    const { data: session } = await auth.getSession()
    if (!session) {
      return new Response('Unauthorized', { status: 401 })
    }

    // NOTE: we could complete by authorizing channels
  },
})
