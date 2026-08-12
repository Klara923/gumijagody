import { getPrisma } from '@/server/infrastructure/db/prisma'

import { CategoryError } from './errors'

export async function deleteCategory(id: string) {
  const prisma = getPrisma()
  const existing = await prisma.category.findUnique({
    where: { id },
    include: {
      _count: { select: { children: true, documents: true, defaultForContractors: true } },
    },
  })

  if (!existing) {
    throw new CategoryError(`Kategoria o id ${id} nie istnieje`, 404)
  }

  if (existing._count.children > 0) {
    throw new CategoryError('Najpierw usuń lub przenieś podkategorie', 400)
  }

  await prisma.$transaction(async (tx) => {
    if (existing._count.defaultForContractors > 0) {
      await tx.contractor.updateMany({
        where: { defaultCategoryId: id },
        data: { defaultCategoryId: null },
      })
    }

    if (existing._count.documents > 0) {
      await tx.document.updateMany({
        where: { categoryId: id },
        data: { categoryId: null },
      })
    }

    await tx.category.delete({ where: { id } })
  })
}
