import { getPrisma } from '@/server/infrastructure/db/prisma'

import { DocumentError } from './errors'
import { ingestFaXmlDocument, checksumOf } from './ingest-fa-xml'
import { insertDocumentInTransaction } from './insert-document'
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

async function uploadPdf(file: UploadFile, metadata: UploadPdfMetadata) {
  return insertDocumentInTransaction({
    number: metadata.number,
    typeId: metadata.typeId,
    contractor: metadata.contractor,
    issueDate: metadata.issueDate,
    dueDate: metadata.dueDate,
    netAmount: metadata.netAmount,
    vatAmount: metadata.vatAmount,
    grossAmount: metadata.grossAmount,
    currency: metadata.currency,
    paymentAccount: metadata.paymentAccount,
    categoryId: metadata.categoryId,
    source: 'UPLOAD',
    stage: 'BUFFER',
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
