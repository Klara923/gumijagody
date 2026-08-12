import { getPrisma } from '@/server/infrastructure/db/prisma'

export async function listContractors() {
  const contractors = await getPrisma().contractor.findMany({
    orderBy: { name: 'asc' },
    include: {
      defaultCategory: { select: { id: true, name: true } },
      _count: { select: { documents: true } },
    },
  })

  return contractors.map((contractor) => ({
    id: contractor.id,
    name: contractor.name,
    nip: contractor.nip,
    defaultCategory: contractor.defaultCategory
      ? { id: contractor.defaultCategory.id, name: contractor.defaultCategory.name }
      : null,
    documentsCount: contractor._count.documents,
  }))
}
