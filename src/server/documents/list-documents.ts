import { getPrisma } from '@/server/infrastructure/db/prisma'

import type { ListDocumentsQuery } from './schemas'

export async function listDocuments(query: ListDocumentsQuery) {
  const documents = await getPrisma().document.findMany({
    where: { stage: query.stage },
    orderBy: { issueDate: 'desc' },
    include: {
      type: true,
      contractor: true,
      category: true,
    },
  })

  return documents.map((document) => ({
    id: document.id,
    number: document.number,
    issueDate: document.issueDate.toISOString().slice(0, 10),
    dueDate: document.dueDate ? document.dueDate.toISOString().slice(0, 10) : null,
    netAmount: document.netAmount.toString(),
    vatAmount: document.vatAmount.toString(),
    grossAmount: document.grossAmount.toString(),
    currency: document.currency,
    paymentAccount: document.paymentAccount,
    source: document.source,
    ksefNumber: document.ksefNumber,
    stage: document.stage,
    acceptedAt: document.acceptedAt?.toISOString() ?? null,
    type: {
      id: document.type.id,
      name: document.type.name,
      direction: document.type.direction,
    },
    contractor: {
      id: document.contractor.id,
      name: document.contractor.name,
      nip: document.contractor.nip,
    },
    category: document.category
      ? {
          id: document.category.id,
          name: document.category.name,
        }
      : null,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
  }))
}
