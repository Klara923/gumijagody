import type { Prisma } from '@/generated/prisma/client'

export const DOCUMENT_INCLUDE = {
  type: true,
  contractor: true,
  category: true,
} as const

export type DocumentWithRelations = Prisma.DocumentGetPayload<{
  include: typeof DOCUMENT_INCLUDE
}>

const toDateOnly = (date: Date) => date.toISOString().slice(0, 10)

export function mapDocument(document: DocumentWithRelations) {
  return {
    id: document.id,
    number: document.number,
    issueDate: toDateOnly(document.issueDate),
    dueDate: document.dueDate ? toDateOnly(document.dueDate) : null,
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
  }
}
