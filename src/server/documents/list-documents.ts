import type { Prisma } from '@/generated/prisma/client'

import { listCategorySubtreeIds } from '@/server/categories/list-categories'
import { getPrisma } from '@/server/infrastructure/db/prisma'

import { DOCUMENT_INCLUDE, mapDocument } from './mapper'
import type { ListDocumentsQuery } from './schemas'

export const DOCUMENT_PAGE_SIZE = 50

export async function listDocuments(query: ListDocumentsQuery) {
  const categoryIds = query.categoryId
    ? await listCategorySubtreeIds(query.categoryId)
    : null

  const where: Prisma.DocumentWhereInput = {
    stage: query.stage,
    ...(query.typeId ? { typeId: query.typeId } : {}),
    ...(query.contractorId ? { contractorId: query.contractorId } : {}),
    ...(categoryIds ? { categoryId: { in: categoryIds } } : {}),
    ...(query.issueDateFrom || query.issueDateTo
      ? {
          issueDate: {
            ...(query.issueDateFrom ? { gte: query.issueDateFrom } : {}),
            ...(query.issueDateTo ? { lte: query.issueDateTo } : {}),
          },
        }
      : {}),
    ...(query.dueDateFrom || query.dueDateTo
      ? {
          dueDate: {
            ...(query.dueDateFrom ? { gte: query.dueDateFrom } : {}),
            ...(query.dueDateTo ? { lte: query.dueDateTo } : {}),
          },
        }
      : {}),
  }

  const page = query.page
  const rows = await getPrisma().document.findMany({
    where,
    orderBy: { [query.sortBy]: query.sortOrder },
    include: DOCUMENT_INCLUDE,
    skip: (page - 1) * DOCUMENT_PAGE_SIZE,
    take: DOCUMENT_PAGE_SIZE + 1,
  })

  const hasMore = rows.length > DOCUMENT_PAGE_SIZE
  const items = (hasMore ? rows.slice(0, DOCUMENT_PAGE_SIZE) : rows).map(mapDocument)

  return { items, page, pageSize: DOCUMENT_PAGE_SIZE, hasMore }
}
