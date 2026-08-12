import { getPrisma } from '@/server/infrastructure/db/prisma'
import { CategoryError } from '@/server/categories/errors'

import type { UpdateContractorDefaultCategoryInput } from '@/server/categories/schemas'

export async function updateContractorDefaultCategory(
  contractorId: string,
  input: UpdateContractorDefaultCategoryInput,
) {
  const prisma = getPrisma()
  const contractor = await prisma.contractor.findUnique({ where: { id: contractorId } })
  if (!contractor) {
    throw new CategoryError(`Kontrahent o id ${contractorId} nie istnieje`, 404)
  }

  if (input.defaultCategoryId) {
    const category = await prisma.category.findUnique({
      where: { id: input.defaultCategoryId },
    })
    if (!category) {
      throw new CategoryError(
        `Kategoria o id ${input.defaultCategoryId} nie istnieje`,
        400,
      )
    }
  }

  const updated = await prisma.contractor.update({
    where: { id: contractorId },
    data: { defaultCategoryId: input.defaultCategoryId },
    include: {
      defaultCategory: { select: { id: true, name: true } },
    },
  })

  return {
    id: updated.id,
    name: updated.name,
    nip: updated.nip,
    defaultCategory: updated.defaultCategory
      ? { id: updated.defaultCategory.id, name: updated.defaultCategory.name }
      : null,
  }
}
