import { getPrisma } from '@/server/infrastructure/db/prisma'

import { DocumentTypeError } from './errors'

export async function deleteDocumentType(id: string) {
  const prisma = getPrisma()
  const existing = await prisma.documentType.findUnique({
    where: { id },
    include: { _count: { select: { documents: true } } },
  })

  if (!existing) {
    throw new DocumentTypeError(`Typ dokumentu o id ${id} nie istnieje`, 404)
  }

  if (existing.isSystem) {
    throw new DocumentTypeError('Typów systemowych nie można usuwać', 400)
  }

  if (existing._count.documents > 0) {
    throw new DocumentTypeError(
      'Ten typ jest przypisany do dokumentów — najpierw zmień typ na dokumentach',
      400,
    )
  }

  await prisma.documentType.delete({ where: { id } })
}
