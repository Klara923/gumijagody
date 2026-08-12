import type { AttachmentKind } from '@/generated/prisma/client'
import { getPrisma } from '@/server/infrastructure/db/prisma'

import { resolveContractor } from './contractors'
import { DocumentError, isPrismaUniqueViolation } from './errors'
import { ingestFaXmlDocument, checksumOf } from './ingest-fa-xml'
import { DOCUMENT_INCLUDE, mapDocument } from './mapper'
import {
  uploadPdfMetadataSchema,
  type UploadPdfMetadata,
} from './schemas'

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

export type UploadFile = {
  filename: string
  mimeType: string
  content: Buffer
}

function extensionOf(filename: string): string {
  const index = filename.lastIndexOf('.')
  return index >= 0 ? filename.slice(index + 1).toLowerCase() : ''
}

function isXmlFile(file: UploadFile): boolean {
  const ext = extensionOf(file.filename)
  return (
    ext === 'xml' ||
    file.mimeType === 'application/xml' ||
    file.mimeType === 'text/xml'
  )
}

function isPdfFile(file: UploadFile): boolean {
  const ext = extensionOf(file.filename)
  return ext === 'pdf' || file.mimeType === 'application/pdf'
}

async function ensureUniqueChecksum(checksum: string) {
  const existing = await getPrisma().attachment.findFirst({
    where: { checksum },
    select: { documentId: true },
  })
  if (existing) {
    throw new DocumentError('Ten plik został już wgrany wcześniej', 409, [
      existing.documentId,
    ])
  }
}

async function createUploadDocument(input: {
  number: string
  typeId: string
  contractor: {
    name: string
    nip?: string
    street?: string
    postalCode?: string
    city?: string
    country?: string
    bankAccount?: string
  }
  issueDate: Date
  dueDate?: Date
  netAmount: string
  vatAmount: string
  grossAmount: string
  currency: string
  paymentAccount?: string
  categoryId?: string
  attachment: {
    kind: AttachmentKind
    filename: string
    mimeType: string
    content: Buffer
    checksum: string
  }
}) {
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

      const contractorId = await resolveContractor(tx, input.contractor)
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
          source: 'UPLOAD',
          stage: 'BUFFER',
        },
        include: DOCUMENT_INCLUDE,
      })

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

async function uploadPdf(file: UploadFile, metadata: UploadPdfMetadata) {
  return createUploadDocument({
    number: metadata.number,
    typeId: metadata.typeId,
    contractor: metadata.contractor,
    issueDate: metadata.issueDate,
    ...(metadata.dueDate ? { dueDate: metadata.dueDate } : {}),
    netAmount: metadata.netAmount,
    vatAmount: metadata.vatAmount,
    grossAmount: metadata.grossAmount,
    currency: metadata.currency,
    paymentAccount: metadata.paymentAccount,
    categoryId: metadata.categoryId,
    attachment: {
      kind: 'SOURCE_FILE',
      filename: file.filename,
      mimeType: file.mimeType || 'application/pdf',
      content: file.content,
      checksum: checksumOf(file.content),
    },
  })
}

export async function uploadDocument(file: UploadFile, pdfMetadata?: unknown) {
  if (!file.filename.trim()) {
    throw new DocumentError('Nazwa pliku jest wymagana', 400)
  }
  if (file.content.byteLength === 0) {
    throw new DocumentError('Plik jest pusty', 400)
  }
  if (file.content.byteLength > MAX_UPLOAD_BYTES) {
    throw new DocumentError('Plik jest zbyt duży (limit 10 MB)', 400)
  }

  await ensureUniqueChecksum(checksumOf(file.content))

  if (isXmlFile(file)) {
    const result = await ingestFaXmlDocument({
      xml: file.content,
      filename: file.filename,
      source: 'UPLOAD',
      enforceChecksumUniqueness: false,
    })
    if (result.status === 'duplicate') {
      throw new DocumentError('Ten dokument został już wgrany wcześniej', 409, [
        result.documentId,
      ])
    }
    return result.document
  }

  if (isPdfFile(file)) {
    const parsed = uploadPdfMetadataSchema.safeParse(pdfMetadata)
    if (!parsed.success) {
      throw new DocumentError(
        parsed.error.issues[0]?.message ?? 'Nieprawidłowe dane metadanych PDF',
        400,
        parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
      )
    }
    return uploadPdf(file, parsed.data)
  }

  throw new DocumentError('Obsługiwane są tylko pliki PDF i XML', 400)
}
