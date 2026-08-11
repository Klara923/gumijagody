import { getPrisma } from '@/server/infrastructure/db/prisma'

import { DocumentError } from './errors'
import { DOCUMENT_INCLUDE, mapDocument } from './mapper'
import type { AcceptDocumentsInput } from './schemas'

export async function acceptDocuments(input: AcceptDocumentsInput) {
  const prisma = getPrisma()
  const { ids } = input

  return prisma.$transaction(async (tx) => {
    const documents = await tx.document.findMany({
      where: { id: { in: ids } },
    })

    if (documents.length !== ids.length) {
      const found = new Set(documents.map((document) => document.id))
      const missing = ids.filter((id) => !found.has(id))
      throw new DocumentError('Część dokumentów do akceptacji nie istnieje', 404, missing)
    }

    const notInBuffer = documents.filter((document) => document.stage !== 'BUFFER')
    if (notInBuffer.length > 0) {
      throw new DocumentError(
        'Akceptować można wyłącznie dokumenty ze stage BUFFER',
        400,
        notInBuffer.map((document) => document.id),
      )
    }

    const acceptedAt = new Date()

    await tx.document.updateMany({
      where: { id: { in: ids }, stage: 'BUFFER' },
      data: { stage: 'ACCEPTED', acceptedAt },
    })

    const accepted = await tx.document.findMany({
      where: { id: { in: ids } },
      orderBy: { issueDate: 'desc' },
      include: DOCUMENT_INCLUDE,
    })

    return {
      acceptedCount: accepted.length,
      items: accepted.map(mapDocument),
    }
  })
}
