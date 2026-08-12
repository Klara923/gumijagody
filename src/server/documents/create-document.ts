import { getPrisma } from '@/server/infrastructure/db/prisma'

import { resolveContractor, requireContractorId } from './contractors'
import { DocumentError, isPrismaUniqueViolation } from './errors'
import { DOCUMENT_INCLUDE, mapDocument } from './mapper'
import type { CreateDocumentInput } from './schemas'

export async function createDocument(input: CreateDocumentInput) {
  const prisma = getPrisma()

  try {
    return await prisma.$transaction(async (tx) => {
      const type = await tx.documentType.findUnique({ where: { id: input.typeId } })
      if (!type) {
        throw new DocumentError(`Typ dokumentu o id ${input.typeId} nie istnieje`, 400)
      }

      if (input.categoryId) {
        const category = await tx.category.findUnique({ where: { id: input.categoryId } })
        if (!category) {
          throw new DocumentError(`Kategoria o id ${input.categoryId} nie istnieje`, 400)
        }
      }

      let contractorId: string
      if (input.contractor) {
        contractorId = await resolveContractor(tx, input.contractor)
      } else if (input.contractorId) {
        contractorId = await requireContractorId(tx, input.contractorId)
      } else {
        throw new DocumentError('Dokument musi być powiązany z kontrahentem', 400)
      }

      const contractor = await tx.contractor.findUniqueOrThrow({ where: { id: contractorId } })
      const categoryId = input.categoryId ?? contractor.defaultCategoryId ?? null

      const document = await tx.document.create({
        data: {
          number: input.number,
          typeId: input.typeId,
          contractorId,
          issueDate: input.issueDate,
          dueDate: input.dueDate ?? null,
          netAmount: input.netAmount,
          vatAmount: input.vatAmount,
          grossAmount: input.grossAmount,
          currency: input.currency,
          paymentAccount: input.paymentAccount ?? null,
          categoryId,
          source: 'MANUAL',
          stage: 'ACCEPTED',
          acceptedAt: new Date(),
        },
        include: DOCUMENT_INCLUDE,
      })

      return mapDocument(document)
    })
  } catch (error) {
    if (error instanceof DocumentError) throw error
    if (isPrismaUniqueViolation(error)) {
      throw new DocumentError(
        `Dokument o numerze "${input.number}" dla tego kontrahenta już istnieje`,
        409,
      )
    }
    throw error
  }
}
