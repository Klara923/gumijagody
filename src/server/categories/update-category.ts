import { getPrisma } from '@/server/infrastructure/db/prisma'
import { isPrismaUniqueViolation } from '@/server/infrastructure/db/unique-violation'

import { CategoryError } from './errors'
import type { UpdateCategoryInput } from './schemas'

async function wouldCreateCycle(categoryId: string, nextParentId: string): Promise<boolean> {
  if (categoryId === nextParentId) return true

  const prisma = getPrisma()
  let currentId: string | null = nextParentId

  while (currentId) {
    if (currentId === categoryId) return true
    const parent: { parentId: string | null } | null = await prisma.category.findUnique({
      where: { id: currentId },
      select: { parentId: true },
    })
    currentId = parent?.parentId ?? null
  }

  return false
}

export async function updateCategory(id: string, input: UpdateCategoryInput) {
  const prisma = getPrisma()
  const existing = await prisma.category.findUnique({ where: { id } })
  if (!existing) {
    throw new CategoryError(`Kategoria o id ${id} nie istnieje`, 404)
  }

  if (input.parentId !== undefined && input.parentId !== null) {
    const parent = await prisma.category.findUnique({ where: { id: input.parentId } })
    if (!parent) {
      throw new CategoryError(`Kategoria nadrzędna o id ${input.parentId} nie istnieje`, 400)
    }
    if (await wouldCreateCycle(id, input.parentId)) {
      throw new CategoryError('Nie można przenieść kategorii pod własnego potomka', 400)
    }
  }

  try {
    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.parentId !== undefined ? { parentId: input.parentId } : {}),
      },
    })
    return {
      id: category.id,
      name: category.name,
      parentId: category.parentId,
    }
  } catch (error) {
    if (error instanceof CategoryError) throw error
    if (isPrismaUniqueViolation(error)) {
      throw new CategoryError(
        `Kategoria o tej nazwie już istnieje na wybranym poziomie drzewa`,
        409,
      )
    }
    throw error
  }
}
