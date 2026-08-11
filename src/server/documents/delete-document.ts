import { getPrisma } from '@/server/infrastructure/db/prisma'

import { DocumentError } from './errors'
import { assertDocumentMutable } from './policy'

export async function deleteDocument(id: string) {
  const prisma = getPrisma()

  await prisma.$transaction(async (tx) => {
    const existing = await tx.document.findUnique({
      where: { id },
      select: { id: true, source: true },
    })

    if (!existing) {
      throw new DocumentError(`Dokument o id ${id} nie istnieje`, 404)
    }

    assertDocumentMutable(existing.source, 'usunąć')

    await tx.document.delete({ where: { id } })
  })
}
