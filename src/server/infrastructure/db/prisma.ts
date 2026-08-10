import { PrismaPg } from '@prisma/adapter-pg'

import { PrismaClient } from '@/generated/prisma/client'
import { getEnv } from '@/server/env'

/**
 * W trybie deweloperskim Next.js przeładowuje moduły przy każdej zmianie pliku.
 * Bez cache'owania na `globalThis` każdy hot reload otwierałby nową pulę połączeń do Postgresa.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

/**
 * Klient tworzony leniwie: `next build` analizuje moduły bez dostępu do bazy,
 * więc instancjonowanie na poziomie importu wywracałoby budowanie produkcyjne.
 */
export function getPrisma(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma

  const adapter = new PrismaPg({ connectionString: getEnv().DATABASE_URL })
  globalForPrisma.prisma = new PrismaClient({ adapter })

  return globalForPrisma.prisma
}
