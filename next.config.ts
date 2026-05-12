import type { NextConfig } from 'next'
import { withWorkflow } from 'workflow/next'

const nextConfig: NextConfig = {
  cacheComponents: true,
  reactStrictMode: true,
}

export default withWorkflow(nextConfig)
