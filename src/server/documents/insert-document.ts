import type {
  AttachmentKind,
  DocumentSource,
  DocumentStage,
  Prisma,
} from '@/generated/prisma/client'
import { resolveDocumentCategoryId } from '@/server/categories/resolve-document-category'
import { getPrisma } from '@/server/infrastructure/db/prisma'
import { isPrismaUniqueViolation } from '@/server/infrastructure/db/unique-violation'

import { resolveContractor, requireContractorId, type ContractorInput } from './contractors'
import { DocumentError } from './errors'
import { DOCUMENT_INCLUDE, mapDocument } from './mapper'

type Tx = Prisma.TransactionClient

export type InsertDocumentAttachment = {
  kind: AttachmentKind
  filename: string
  mimeType: string
  content: Buffer
  checksum: string
}

export type InsertDocumentInput = {
  number: string
  typeId: string
  contractor?: ContractorInput
  contractorId?: string
  issueDate: Date
  dueDate?: Date | null
  netAmount: string
  vatAmount: string
  grossAmount: string
  currency: string
  paymentAccount?: string | null
  categoryId?: string | null
  extraCategoryTexts?: string[]
  source: DocumentSource
  stage: DocumentStage
  acceptedAt?: Date | null
  ksefNumber?: string | null
  importRunId?: string | null
  attachment?: InsertDocumentAttachment
}

export function documentNumberConflict(number: string) {
  return new DocumentError(
    `Dokument o numerze "${number}" dla tego kontrahenta już istnieje`,
    409,
  )
}

export async function insertDocument(tx: Tx, input: InsertDocumentInput) {
  const type = await tx.documentType.findUnique({ where: { id: input.typeId } })
  if (!type) {
    throw new DocumentError(`Typ dokumentu o id ${input.typeId} nie istnieje`, 400)
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
  const categoryId = await resolveDocumentCategoryId(tx, {
    explicitCategoryId: input.categoryId,
    contractorDefaultCategoryId: contractor.defaultCategoryId,
    texts: [input.number, contractor.name, contractor.nip, ...(input.extraCategoryTexts ?? [])],
  })

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
      source: input.source,
      stage: input.stage,
      acceptedAt: input.acceptedAt ?? null,
      ksefNumber: input.ksefNumber ?? null,
      importRunId: input.importRunId ?? null,
    },
    include: DOCUMENT_INCLUDE,
  })

  if (input.attachment) {
    await tx.attachment.create({
      data: {
        documentId: document.id,
        kind: input.attachment.kind,
        filename: input.attachment.filename,
        mimeType: input.attachment.mimeType,
        sizeBytes: input.attachment.content.byteLength,
        checksum: input.attachment.checksum,
        content: Uint8Array.from(input.attachment.content),
      },
    })
  }

  return mapDocument(document)
}

export async function insertDocumentInTransaction(input: InsertDocumentInput) {
  try {
    return await getPrisma().$transaction((tx) => insertDocument(tx, input))
  } catch (error) {
    if (error instanceof DocumentError) throw error
    if (isPrismaUniqueViolation(error)) {
      throw documentNumberConflict(input.number)
    }
    throw error
  }
}
