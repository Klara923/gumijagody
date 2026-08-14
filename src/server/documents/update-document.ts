import { getPrisma } from '@/server/infrastructure/db/prisma'
import { isPrismaUniqueViolation } from '@/server/infrastructure/db/unique-violation'
import { toCents } from '@/server/validation'

import { resolveContractor, requireContractorId } from './contractors'
import { DocumentError } from './errors'
import { DOCUMENT_INCLUDE, mapDocument } from './mapper'
import { assertDocumentMutable } from './policy'
import type { UpdateDocumentInput } from './schemas'

export async function updateDocument(id: string, input: UpdateDocumentInput) {
  const prisma = getPrisma()

  if (
    input.netAmount !== undefined &&
    input.vatAmount !== undefined &&
    input.grossAmount !== undefined &&
    toCents(input.netAmount) + toCents(input.vatAmount) !== toCents(input.grossAmount)
  ) {
    throw new DocumentError('Kwota brutto musi być sumą netto i VAT', 400)
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.document.findUnique({ where: { id } })
      if (!existing) {
        throw new DocumentError(`Dokument o id ${id} nie istnieje`, 404)
      }

      assertDocumentMutable(existing.source, 'edytować')

      if (input.typeId) {
        const type = await tx.documentType.findUnique({ where: { id: input.typeId } })
        if (!type) {
          throw new DocumentError(`Typ dokumentu o id ${input.typeId} nie istnieje`, 400)
        }
      }

      if (input.categoryId) {
        const category = await tx.category.findUnique({ where: { id: input.categoryId } })
        if (!category) {
          throw new DocumentError(`Kategoria o id ${input.categoryId} nie istnieje`, 400)
        }
      }

      const issueDate = input.issueDate ?? existing.issueDate
      const dueDate = input.dueDate === undefined ? existing.dueDate : input.dueDate

      if (dueDate && dueDate.getTime() < issueDate.getTime()) {
        throw new DocumentError(
          'Termin płatności nie może być wcześniejszy niż data wystawienia',
          400,
        )
      }

      let contractorId = existing.contractorId
      if (input.contractor) {
        contractorId = await resolveContractor(tx, input.contractor)
      } else if (input.contractorId) {
        contractorId = await requireContractorId(tx, input.contractorId)
      }

      const document = await tx.document.update({
        where: { id },
        data: {
          ...(input.number !== undefined ? { number: input.number } : {}),
          ...(input.typeId !== undefined ? { typeId: input.typeId } : {}),
          contractorId,
          ...(input.issueDate !== undefined ? { issueDate: input.issueDate } : {}),
          ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
          ...(input.netAmount !== undefined ? { netAmount: input.netAmount } : {}),
          ...(input.vatAmount !== undefined ? { vatAmount: input.vatAmount } : {}),
          ...(input.grossAmount !== undefined ? { grossAmount: input.grossAmount } : {}),
          ...(input.currency !== undefined ? { currency: input.currency } : {}),
          ...(input.paymentAccount !== undefined
            ? { paymentAccount: input.paymentAccount }
            : {}),
          ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
        },
        include: DOCUMENT_INCLUDE,
      })

      return mapDocument(document)
    })
  } catch (error) {
    if (error instanceof DocumentError) throw error
    if (isPrismaUniqueViolation(error)) {
      throw new DocumentError(
        `Dokument o numerze "${input.number ?? id}" dla tego kontrahenta już istnieje`,
        409,
      )
    }
    throw error
  }
}
