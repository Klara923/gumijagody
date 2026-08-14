import type { Prisma } from '@/generated/prisma/client'

import { DocumentError } from '@/server/documents/errors'

import { matchKeywordCategoryId } from './match-keyword-rule'

export function chooseDocumentCategoryId(input: {
  explicitCategoryId?: string | null
  contractorDefaultCategoryId?: string | null
  keywordCategoryId?: string | null
}): string | null {
  if (input.explicitCategoryId) return input.explicitCategoryId
  if (input.contractorDefaultCategoryId) return input.contractorDefaultCategoryId
  return input.keywordCategoryId ?? null
}

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
    return chooseDocumentCategoryId({ explicitCategoryId: category.id })
  }

  if (input.contractorDefaultCategoryId) {
    return chooseDocumentCategoryId({
      contractorDefaultCategoryId: input.contractorDefaultCategoryId,
    })
  }

  const rules = await tx.categoryKeywordRule.findMany({
    select: { keyword: true, categoryId: true, priority: true },
  })

  return chooseDocumentCategoryId({
    keywordCategoryId: matchKeywordCategoryId(input.texts, rules),
  })
}

