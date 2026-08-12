import { getPrisma } from '@/server/infrastructure/db/prisma'

import { DocumentError } from './errors'
import { DOCUMENT_INCLUDE, mapDocument } from './mapper'

export async function assignDocumentCategory(id: string, categoryId: string | null) {
  const prisma = getPrisma()

  return prisma.$transaction(async (tx) => {
    const existing = await tx.document.findUnique({ where: { id } })
    if (!existing) {
      throw new DocumentError(`Dokument o id ${id} nie istnieje`, 404)
    }

    if (categoryId) {
      const category = await tx.category.findUnique({ where: { id: categoryId } })
      if (!category) {
        throw new DocumentError(`Kategoria o id ${categoryId} nie istnieje`, 400)
      }
    }

    const document = await tx.document.update({
      where: { id },
      data: { categoryId },
      include: DOCUMENT_INCLUDE,
    })

    return mapDocument(document)
  })
}
