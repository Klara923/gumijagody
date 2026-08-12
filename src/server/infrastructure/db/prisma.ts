import { PrismaPg } from '@prisma/adapter-pg'

import { PrismaClient } from '@/generated/prisma/client'
import { getEnv } from '@/server/env'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

/**
 * Neon copies `channel_binding=require` into pooled URLs. node-pg does not
 * support SCRAM-SHA-256-PLUS, so that flag fails auth with 28P01 even when
 * the password is correct. Vercel serverless can also omit TLS SNI; Neon then
 * returns the same password error unless the endpoint id is in the password.
 */
export function sanitizeDatabaseUrl(connectionString: string): string {
  let url: URL
  try {
    url = new URL(connectionString)
  } catch {
    return connectionString
  }

  url.searchParams.delete('channel_binding')

  const host = url.hostname
  if (host.endsWith('.neon.tech')) {
    if (!url.searchParams.get('sslmode')) {
      url.searchParams.set('sslmode', 'require')
    }

    const endpointId = host.split('.')[0]?.replace(/-pooler$/, '')
    const password = url.password
    if (endpointId && password && !password.startsWith('endpoint=')) {
      url.password = `endpoint=${endpointId};${password}`
    }
  }

  return url.toString()
}

export function getPrisma(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma

  const adapter = new PrismaPg({ connectionString: sanitizeDatabaseUrl(getEnv().DATABASE_URL) })
  globalForPrisma.prisma = new PrismaClient({ adapter })

  return globalForPrisma.prisma
}
