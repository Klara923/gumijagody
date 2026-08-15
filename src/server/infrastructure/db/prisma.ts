import { neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaPg } from '@prisma/adapter-pg'
import ws from 'ws'

import { PrismaClient } from '@/generated/prisma/client'
import { getEnv } from '@/server/env'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

neonConfig.webSocketConstructor = ws

export function stripChannelBinding(connectionString: string): string {
  const [base, query] = connectionString.split('?')
  if (!query) return connectionString

  const params = query
    .split('&')
    .filter((part) => part.length > 0 && !part.startsWith('channel_binding='))

  return params.length > 0 ? `${base}?${params.join('&')}` : base
}

export function toNeonServerlessUrl(connectionString: string): string {
  return stripChannelBinding(connectionString).replace('-pooler.', '.')
}

export function getPrismaAdapterName(connectionString = getEnv().DATABASE_URL): 'neon' | 'pg' {
  return connectionString.includes('.neon.tech') ? 'neon' : 'pg'
}

export function getPrismaConnectUrl(connectionString = getEnv().DATABASE_URL): string {
  return getPrismaAdapterName(connectionString) === 'neon'
    ? toNeonServerlessUrl(connectionString)
    : stripChannelBinding(connectionString)
}

export function getPrisma(): PrismaClient {
  const cached = globalForPrisma.prisma
  if (cached?.categoryKeywordRule) return cached

  const connectionString = getPrismaConnectUrl()
  const adapter = connectionString.includes('.neon.tech')
    ? new PrismaNeon({ connectionString })
    : new PrismaPg({ connectionString })

  globalForPrisma.prisma = new PrismaClient({ adapter })
  return globalForPrisma.prisma
}
