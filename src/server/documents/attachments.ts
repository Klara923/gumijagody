import { getPrisma } from '@/server/infrastructure/db/prisma'

import { DocumentError } from './errors'

export type AttachmentMeta = {
  id: string
  kind: 'KSEF_XML' | 'SOURCE_FILE'
  filename: string
  mimeType: string
  sizeBytes: number
}

export async function listDocumentAttachments(documentId: string): Promise<AttachmentMeta[]> {
  const attachments = await getPrisma().attachment.findMany({
    where: { documentId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      kind: true,
      filename: true,
      mimeType: true,
      sizeBytes: true,
    },
  })

  return attachments
}

export async function getDocumentAttachment(documentId: string, attachmentId: string) {
  const attachment = await getPrisma().attachment.findFirst({
    where: { id: attachmentId, documentId },
  })

  if (!attachment) {
    throw new DocumentError(`Załącznik o id ${attachmentId} nie istnieje`, 404)
  }

  return attachment
}
