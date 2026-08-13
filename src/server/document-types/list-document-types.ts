import { getPrisma } from '@/server/infrastructure/db/prisma'

export function formatDocumentTypeLabel(type: {
  name: string
  direction: 'RECEIVABLE' | 'PAYABLE'
}) {
  const direction = type.direction === 'RECEIVABLE' ? 'należność' : 'zobowiązanie'
  return `${type.name} (${direction})`
}

export async function listDocumentTypes() {
  const types = await getPrisma().documentType.findMany({
    orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    include: { _count: { select: { documents: true } } },
  })

  return types.map((type) => ({
    id: type.id,
    name: type.name,
    direction: type.direction,
    isSystem: type.isSystem,
    documentsCount: type._count.documents,
    label: formatDocumentTypeLabel(type),
  }))
}
