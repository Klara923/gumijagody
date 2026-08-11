import { getPrisma } from '@/server/infrastructure/db/prisma'
import { DocumentError } from './errors'
import { DOCUMENT_INCLUDE, mapDocument } from './mapper'
import type { CreateDocumentInput } from './schemas'

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === 'P2002'
  )
}

export async function createDocument(input: CreateDocumentInput) {
  const prisma = getPrisma()

  const type = await prisma.documentType.findUnique({ where: { id: input.typeId } })
  if (!type) {
    throw new DocumentError(`Typ dokumentu o id ${input.typeId} nie istnieje`, 400)
  }

  if (input.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: input.categoryId } })
    if (!category) {
      throw new DocumentError(`Kategoria o id ${input.categoryId} nie istnieje`, 400)
    }
  }

  try {
    return await prisma.$transaction(async (tx) => {
      let contractorId: string

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
        const existing = await tx.contractor.findUnique({ where: { id: input.contractorId } })
        if (!existing) {
          throw new DocumentError(`Kontrahent o id ${input.contractorId} nie istnieje`, 400)
        }
        contractorId = existing.id
      } else {
        throw new DocumentError('Dokument musi być powiązany z kontrahentem', 400)
      }

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
          categoryId: input.categoryId ?? null,
          source: 'MANUAL',
          stage: 'ACCEPTED',
          acceptedAt: new Date(),
        },
        include: DOCUMENT_INCLUDE,
      })

      return mapDocument(document)
    })
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new DocumentError(
        `Dokument o numerze "${input.number}" dla tego kontrahenta już istnieje`,
        409,
      )
    }
    throw error
  }
}
