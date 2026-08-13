import type { Prisma } from '@/generated/prisma/client'

import { DocumentError } from '@/server/documents/errors'

import { matchKeywordCategoryId } from './match-keyword-rule'

export async function resolveDocumentCategoryId(
  tx: Prisma.TransactionClient,
  input: {
    explicitCategoryId?: string | null
    contractorDefaultCategoryId?: string | null
    texts: Array<string | null | undefined>
  },
): Promise<string | null> {
  if (input.explicitCategoryId) {
    const category = await tx.category.findUnique({ where: { id: input.explicitCategoryId } })
    if (!category) {
      throw new DocumentError(`Kategoria o id ${input.explicitCategoryId} nie istnieje`, 400)
    }
    return category.id
  }

  if (input.contractorDefaultCategoryId) {
    return input.contractorDefaultCategoryId
  }

  const rules = await tx.categoryKeywordRule.findMany({
    select: { keyword: true, categoryId: true, priority: true },
  })

  return matchKeywordCategoryId(input.texts, rules)
}
