import { isPrismaUniqueViolation } from '@/server/infrastructure/db/unique-violation'
import { getPrisma } from '@/server/infrastructure/db/prisma'

import { CategoryError } from './errors'
import { normalizeKeyword } from './match-keyword-rule'
import type { UpdateKeywordRuleInput } from './schemas'

export async function updateKeywordRule(id: string, input: UpdateKeywordRuleInput) {
  const prisma = getPrisma()
  const existing = await prisma.categoryKeywordRule.findUnique({ where: { id } })
  if (!existing) {
    throw new CategoryError(`Reguła o id ${id} nie istnieje`, 404)
  }

  if (input.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: input.categoryId } })
    if (!category) {
      throw new CategoryError(`Kategoria o id ${input.categoryId} nie istnieje`, 400)
    }
  }

  const keyword = input.keyword !== undefined ? normalizeKeyword(input.keyword) : undefined

  try {
    const rule = await prisma.categoryKeywordRule.update({
      where: { id },
      data: {
        ...(keyword !== undefined ? { keyword } : {}),
        ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
        ...(input.priority !== undefined ? { priority: input.priority } : {}),
      },
    })
    return {
      id: rule.id,
      keyword: rule.keyword,
      categoryId: rule.categoryId,
      priority: rule.priority,
    }
  } catch (error) {
    if (isPrismaUniqueViolation(error)) {
      throw new CategoryError(`Reguła dla słowa „${keyword}” już istnieje`, 409)
    }
    throw error
  }
}
