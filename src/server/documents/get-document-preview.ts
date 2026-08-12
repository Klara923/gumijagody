import { getPrisma } from '@/server/infrastructure/db/prisma'

import { listDocumentAttachments, type AttachmentMeta } from './attachments'
import { DocumentError } from './errors'
import { DOCUMENT_INCLUDE, mapDocument } from './mapper'
import { parseFaXml, type ParsedFaInvoice } from './parse-fa-xml'

export type DocumentPreview = {
  document: ReturnType<typeof mapDocument>
  attachments: Awaited<ReturnType<typeof listDocumentAttachments>>
  xmlInvoice: ParsedFaInvoice | null
  xmlParseFailed: boolean
  pdfAttachmentId: string | null
  xmlAttachmentId: string | null
}

function isPdfAttachment(item: AttachmentMeta) {
  const mime = item.mimeType.toLowerCase()
  const filename = item.filename.toLowerCase()
  return (
    item.kind === 'SOURCE_FILE' &&
    (mime.includes('pdf') || filename.endsWith('.pdf'))
  )
}

export async function getDocumentPreview(id: string): Promise<DocumentPreview> {
  const prisma = getPrisma()
  const document = await prisma.document.findUnique({
    where: { id },
    include: DOCUMENT_INCLUDE,
  })

  if (!document) {
    throw new DocumentError(`Dokument o id ${id} nie istnieje`, 404)
  }

  const attachments = await listDocumentAttachments(id)
  const pdfAttachment = attachments.find(isPdfAttachment)
  const xmlAttachment = attachments.find((item) => item.kind === 'KSEF_XML')

  let xmlInvoice: ParsedFaInvoice | null = null
  let xmlParseFailed = false
  if (xmlAttachment) {
    const row = await prisma.attachment.findUnique({
      where: { id: xmlAttachment.id },
      select: { content: true },
    })
    if (row) {
      const xml = Buffer.from(row.content).toString('utf8')
      try {
        xmlInvoice = parseFaXml(xml)
      } catch {
        xmlParseFailed = true
        xmlInvoice = null
      }
    }
  }

  return {
    document: mapDocument(document),
    attachments,
    xmlInvoice,
    xmlParseFailed,
    pdfAttachmentId: pdfAttachment?.id ?? null,
    xmlAttachmentId: xmlAttachment?.id ?? null,
  }
}
