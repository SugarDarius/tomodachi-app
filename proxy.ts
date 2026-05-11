import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { auth } from '~/lib/auth/server'

const authCheck = auth.middleware({
  loginUrl: '/auth/sign-in',
})

/**
 * 👉🏻 Workaround to make server actions inside `/dashboard` work correctly.
 * On a side note it's very disappointing from the Neon Auth lib to not support this out of the box,
 * but it was worth to test Neon auth in a real-world application, but yeah it's still under beta \__(-_-)__/
 *
 * Neon Auth middleware proxies `get-session` using the incoming `Request`. For POSTs it
 * reads `request.text()` to forward upstream, which consumes the body. Next.js Server Actions
 * POST the encoded action payload on the same URL — if the body is read here, the action
 * sees an empty payload and the client gets a non-RSC response ("unexpected response").
 *
 * Skip this proxy for action POSTs; each action still enforces auth in its own `authorize`.
 */
export default async function proxy(req: NextRequest) {
  if (req.method === 'POST' && req.headers.get('next-action') !== null) {
    return NextResponse.next()
  }

  return authCheck(req)
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/((?!_next/static|_next/image|favicon.ico|.well-known/workflow/).*)',
  ],
}
