import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['node-cron', 'ws', '@neondatabase/serverless'],
}

export default nextConfig
