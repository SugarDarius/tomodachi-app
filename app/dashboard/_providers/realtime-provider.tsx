'use client'

import { RealtimeProvider as UpstashRealtimeProvider } from '@upstash/realtime/client'

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  return <UpstashRealtimeProvider>{children}</UpstashRealtimeProvider>
}
