import { getPrisma } from '@/server/infrastructure/db/prisma'

import { DocumentError } from './errors'

export async function deleteDocument(id: string) {
  const prisma = getPrisma()

  const existing = await prisma.document.findUnique({
    where: { id },
    select: { id: true },
  })

  if (!existing) {
    throw new DocumentError(`Dokument o id ${id} nie istnieje`, 404)
  }

  await prisma.document.delete({ where: { id } })
}
