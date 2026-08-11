import { getPrisma } from '@/server/infrastructure/db/prisma'

import { DocumentError } from './errors'
import { DOCUMENT_INCLUDE, mapDocument } from './mapper'

export async function getDocumentById(id: string) {
  const document = await getPrisma().document.findUnique({
    where: { id },
    include: DOCUMENT_INCLUDE,
  })

  if (!document) {
    throw new DocumentError(`Dokument o id ${id} nie istnieje`, 404)
  }

  return mapDocument(document)
}
