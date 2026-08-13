import { getPrisma } from '@/server/infrastructure/db/prisma'

import { CategoryError } from './errors'

export async function deleteKeywordRule(id: string) {
  const prisma = getPrisma()
  const existing = await prisma.categoryKeywordRule.findUnique({ where: { id } })
  if (!existing) {
    throw new CategoryError(`Reguła o id ${id} nie istnieje`, 404)
  }

  await prisma.categoryKeywordRule.delete({ where: { id } })
}
