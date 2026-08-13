import { isPrismaUniqueViolation } from '@/server/documents/errors'
import { getPrisma } from '@/server/infrastructure/db/prisma'

import { DocumentTypeError } from './errors'
import type { UpdateDocumentTypeInput } from './schemas'

export async function updateDocumentType(id: string, input: UpdateDocumentTypeInput) {
  const prisma = getPrisma()
  const existing = await prisma.documentType.findUnique({ where: { id } })

  if (!existing) {
    throw new DocumentTypeError(`Typ dokumentu o id ${id} nie istnieje`, 404)
  }

  if (existing.isSystem) {
    throw new DocumentTypeError('Typów systemowych nie można edytować', 400)
  }

  try {
    const type = await prisma.documentType.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.direction !== undefined ? { direction: input.direction } : {}),
      },
    })
    return {
      id: type.id,
      name: type.name,
      direction: type.direction,
      isSystem: type.isSystem,
    }
  } catch (error) {
    if (isPrismaUniqueViolation(error)) {
      throw new DocumentTypeError(`Typ dokumentu "${input.name}" już istnieje`, 409)
    }
    throw error
  }
}
