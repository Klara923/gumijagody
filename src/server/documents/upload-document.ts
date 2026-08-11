import { createHash } from 'node:crypto'

import type { AttachmentKind, DocumentDirection } from '@/generated/prisma/client'
import { getEnv } from '@/server/env'
import { getPrisma } from '@/server/infrastructure/db/prisma'
import {
  isValidBankAccount,
  isValidNip,
  normalizeBankAccount,
  toCents,
} from '@/server/validation'

import { resolveContractor } from './contractors'
import { DocumentError, isPrismaUniqueViolation } from './errors'
import { DOCUMENT_INCLUDE, mapDocument } from './mapper'
import { parseFaXml } from './parse-fa-xml'
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

function checksumOf(content: Buffer): string {
  return createHash('sha256').update(content).digest('hex')
}

function parseDateOnly(value: string, field: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new DocumentError(`${field} musi być w formacie RRRR-MM-DD`, 400)
  }
  const date = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new DocumentError(`"${value}" nie jest istniejącą datą (${field})`, 400)
  }
  return date
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

async function requireSystemType(direction: DocumentDirection) {
  const type = await getPrisma().documentType.findFirst({
    where: { direction, isSystem: true },
    orderBy: { createdAt: 'asc' },
  })
  if (!type) {
    throw new DocumentError(
      `Brak systemowego typu dokumentu dla kierunku ${direction}`,
      500,
    )
  }
  return type
}

function contractorFromParty(party: { name: string; nip?: string }) {
  const nip = party.nip?.replace(/[\s-]/g, '')
  if (nip && !isValidNip(nip)) {
    throw new DocumentError(`NIP kontrahenta z XML ma niepoprawną sumę kontrolną: ${nip}`, 400)
  }
  return {
    name: party.name,
    ...(nip ? { nip } : {}),
  }
}

function optionalValidAccount(value: string | undefined): string | undefined {
  if (!value) return undefined
  if (!isValidBankAccount(value)) return undefined
  return normalizeBankAccount(value)
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

async function uploadXml(file: UploadFile) {
  const xml = file.content.toString('utf8')
  const parsed = parseFaXml(xml)
  const ourNip = getEnv().KSEF_NIP

  if (!ourNip) {
    throw new DocumentError(
      'Do rozpoznania kierunku faktury z XML ustaw KSEF_NIP w konfiguracji',
      400,
    )
  }

  const sellerNip = parsed.seller.nip
  const buyerNip = parsed.buyer.nip
  const weAreSeller = sellerNip === ourNip
  const weAreBuyer = buyerNip === ourNip

  if (weAreSeller === weAreBuyer) {
    throw new DocumentError(
      `Nie udało się ustalić kierunku faktury względem NIP ${ourNip} (sprzedawca/nabywca)`,
      400,
    )
  }

  const direction: DocumentDirection = weAreBuyer ? 'PAYABLE' : 'RECEIVABLE'
  const type = await requireSystemType(direction)
  const counterparty = weAreBuyer ? parsed.seller : parsed.buyer
  const issueDate = parseDateOnly(parsed.issueDate, 'Data wystawienia')
  const dueDate = parsed.dueDate
    ? parseDateOnly(parsed.dueDate, 'Termin płatności')
    : undefined

  if (dueDate && dueDate.getTime() < issueDate.getTime()) {
    throw new DocumentError(
      'Termin płatności nie może być wcześniejszy niż data wystawienia',
      400,
    )
  }

  if (toCents(parsed.netAmount) + toCents(parsed.vatAmount) !== toCents(parsed.grossAmount)) {
    throw new DocumentError('Kwoty z XML nie sumują się (netto + VAT ≠ brutto)', 400)
  }

  return createUploadDocument({
    number: parsed.number,
    typeId: type.id,
    contractor: contractorFromParty(counterparty),
    issueDate,
    ...(dueDate ? { dueDate } : {}),
    netAmount: parsed.netAmount,
    vatAmount: parsed.vatAmount,
    grossAmount: parsed.grossAmount,
    currency: parsed.currency,
    paymentAccount: optionalValidAccount(parsed.paymentAccount),
    attachment: {
      kind: 'KSEF_XML',
      filename: file.filename,
      mimeType: file.mimeType || 'application/xml',
      content: file.content,
      checksum: checksumOf(file.content),
    },
  })
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
    return uploadXml(file)
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
