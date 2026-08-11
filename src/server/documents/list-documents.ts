import { getPrisma } from '@/server/infrastructure/db/prisma'

import { DOCUMENT_INCLUDE, mapDocument } from './mapper'
import type { ListDocumentsQuery } from './schemas'

export async function listDocuments(query: ListDocumentsQuery) {
  const documents = await getPrisma().document.findMany({
    where: { stage: query.stage },
    orderBy: { issueDate: 'desc' },
    include: DOCUMENT_INCLUDE,
  })

  return documents.map(mapDocument)
}
