import { isPrismaUniqueViolation } from '@/server/infrastructure/db/unique-violation'
import { getPrisma } from '@/server/infrastructure/db/prisma'

import { DocumentTypeError } from './errors'
import type { CreateDocumentTypeInput } from './schemas'

export async function createDocumentType(input: CreateDocumentTypeInput) {
  const prisma = getPrisma()

  try {
    const type = await prisma.documentType.create({
      data: {
        name: input.name,
        direction: input.direction,
        isSystem: false,
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
