import { getPrisma } from '@/server/infrastructure/db/prisma'

export async function listImportRuns(take = 10) {
  return getPrisma().importRun.findMany({
    where: { trigger: 'SCHEDULED' },
    orderBy: { startedAt: 'desc' },
    take,
    select: {
      id: true,
      startedAt: true,
      invoiceKind: true,
      status: true,
      importedCount: true,
      duplicateCount: true,
      rangeFrom: true,
      rangeTo: true,
    },
  })
}
