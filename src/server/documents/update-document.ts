import { getPrisma } from '@/server/infrastructure/db/prisma'
import { toCents } from '@/server/validation'

import { DocumentError, isPrismaUniqueViolation } from './errors'
import { DOCUMENT_INCLUDE, mapDocument } from './mapper'
import type { UpdateDocumentInput } from './schemas'

const EDITABLE_SOURCES = new Set(['MANUAL', 'UPLOAD'])

export async function updateDocument(id: string, input: UpdateDocumentInput) {
  const prisma = getPrisma()

  const existing = await prisma.document.findUnique({ where: { id } })
  if (!existing) {
    throw new DocumentError(`Dokument o id ${id} nie istnieje`, 404)
  }

  if (!EDITABLE_SOURCES.has(existing.source)) {
    throw new DocumentError(
      'Dokumentów pobranych z KSeF nie edytuje się ręcznie — dane pochodzą ze źródła zewnętrznego',
      400,
    )
  }

  if (input.typeId) {
    const type = await prisma.documentType.findUnique({ where: { id: input.typeId } })
    if (!type) {
      throw new DocumentError(`Typ dokumentu o id ${input.typeId} nie istnieje`, 400)
    }
  }

  if (input.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: input.categoryId } })
    if (!category) {
      throw new DocumentError(`Kategoria o id ${input.categoryId} nie istnieje`, 400)
    }
  }

  const issueDate = input.issueDate ?? existing.issueDate
  const dueDate =
    input.dueDate === undefined ? existing.dueDate : input.dueDate

  if (dueDate && dueDate.getTime() < issueDate.getTime()) {
    throw new DocumentError(
      'Termin płatności nie może być wcześniejszy niż data wystawienia',
      400,
      undefined,
    )
  }

  if (input.netAmount && input.vatAmount && input.grossAmount) {
    if (toCents(input.netAmount) + toCents(input.vatAmount) !== toCents(input.grossAmount)) {
      throw new DocumentError('Kwota brutto musi być sumą netto i VAT', 400)
    }
  }

  try {
    return await prisma.$transaction(async (tx) => {
      let contractorId = existing.contractorId

      if (input.contractor) {
        const nip = input.contractor.nip ?? null
        const data = {
          name: input.contractor.name,
          nip,
          street: input.contractor.street ?? null,
          postalCode: input.contractor.postalCode ?? null,
          city: input.contractor.city ?? null,
          country: input.contractor.country ?? 'PL',
          bankAccount: input.contractor.bankAccount ?? null,
        }

        const contractor = nip
          ? await tx.contractor.upsert({ where: { nip }, create: data, update: data })
          : await tx.contractor.create({ data })

        contractorId = contractor.id
      } else if (input.contractorId) {
        const found = await tx.contractor.findUnique({ where: { id: input.contractorId } })
        if (!found) {
          throw new DocumentError(`Kontrahent o id ${input.contractorId} nie istnieje`, 400)
        }
        contractorId = found.id
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
        `Dokument o numerze "${input.number ?? existing.number}" dla tego kontrahenta już istnieje`,
        409,
      )
    }
    throw error
  }
}
