import { getPrisma } from '@/server/infrastructure/db/prisma'
import { isPrismaUniqueViolation } from '@/server/documents/errors'

import { CategoryError } from './errors'
import type { CreateCategoryInput } from './schemas'

export async function createCategory(input: CreateCategoryInput) {
  const prisma = getPrisma()
  const parentId = input.parentId ?? null

  if (parentId) {
    const parent = await prisma.category.findUnique({ where: { id: parentId } })
    if (!parent) {
      throw new CategoryError(`Kategoria nadrzędna o id ${parentId} nie istnieje`, 400)
    }
  }

  try {
    const category = await prisma.category.create({
      data: {
        name: input.name,
        parentId,
      },
    })
    return {
      id: category.id,
      name: category.name,
      parentId: category.parentId,
    }
  } catch (error) {
    if (isPrismaUniqueViolation(error)) {
      throw new CategoryError(
        `Kategoria "${input.name}" już istnieje na tym poziomie drzewa`,
        409,
      )
    }
    throw error
  }
}
