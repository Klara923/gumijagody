import { isPrismaUniqueViolation } from '@/server/infrastructure/db/unique-violation'
import { getPrisma } from '@/server/infrastructure/db/prisma'

import { CategoryError } from './errors'
import { normalizeKeyword } from './match-keyword-rule'
import type { CreateKeywordRuleInput } from './schemas'

export async function createKeywordRule(input: CreateKeywordRuleInput) {
  const prisma = getPrisma()
  const keyword = normalizeKeyword(input.keyword)
  const category = await prisma.category.findUnique({ where: { id: input.categoryId } })
  if (!category) {
    throw new CategoryError(`Kategoria o id ${input.categoryId} nie istnieje`, 400)
  }

  try {
    const rule = await prisma.categoryKeywordRule.create({
      data: {
        keyword,
        categoryId: input.categoryId,
        priority: input.priority ?? 100,
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
