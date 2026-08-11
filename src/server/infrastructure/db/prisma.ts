import { PrismaPg } from '@prisma/adapter-pg'

import { PrismaClient } from '@/generated/prisma/client'
import { getEnv } from '@/server/env'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export function getPrisma(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma

  const adapter = new PrismaPg({ connectionString: getEnv().DATABASE_URL })
  globalForPrisma.prisma = new PrismaClient({ adapter })

  return globalForPrisma.prisma
}
