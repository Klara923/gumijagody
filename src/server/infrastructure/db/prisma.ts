import { PrismaPg } from '@prisma/adapter-pg'

import { PrismaClient } from '@/generated/prisma/client'
import { getEnv } from '@/server/env'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

/**
 * Neon pooled URLs include `channel_binding=require`. node-pg does not support
 * SCRAM-SHA-256-PLUS, so that flag fails with 28P01 even when the password is
 * correct. Only the query flag is stripped — the userinfo is left untouched.
 */
export function sanitizeDatabaseUrl(connectionString: string): string {
  const [base, query] = connectionString.split('?')
  if (!query) return connectionString

  const params = query
    .split('&')
    .filter((part) => part.length > 0 && !part.startsWith('channel_binding='))

  return params.length > 0 ? `${base}?${params.join('&')}` : base
}

export function getPrisma(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma

  const adapter = new PrismaPg({ connectionString: sanitizeDatabaseUrl(getEnv().DATABASE_URL) })
  globalForPrisma.prisma = new PrismaClient({ adapter })

  return globalForPrisma.prisma
}
