import { createHash } from 'node:crypto'

import type { DocumentDirection, DocumentSource } from '@/generated/prisma/client'
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

export function checksumOf(content: Buffer): string {
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

export type IngestFaXmlInput = {
  xml: Buffer
  filename: string
  source: Extract<DocumentSource, 'UPLOAD' | 'KSEF'>
  ksefNumber?: string
  importRunId?: string
  enforceChecksumUniqueness?: boolean
}

export async function ingestFaXmlDocument(input: IngestFaXmlInput) {
  const content = input.xml
  const checksum = checksumOf(content)

  if (input.enforceChecksumUniqueness !== false) {
    const existingAttachment = await getPrisma().attachment.findFirst({
      where: { checksum },
      select: { documentId: true },
    })
    if (existingAttachment) {
      throw new DocumentError('Ten plik został już wgrany wcześniej', 409, [
        existingAttachment.documentId,
      ])
    }
  }

  if (input.ksefNumber) {
    const existing = await getPrisma().document.findUnique({
      where: { ksefNumber: input.ksefNumber },
      select: { id: true },
    })
    if (existing) {
      return { status: 'duplicate' as const, documentId: existing.id }
    }
  }

  const parsed = parseFaXml(content.toString('utf8'))
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

  const prisma = getPrisma()

  try {
    const document = await prisma.$transaction(async (tx) => {
      const contractorId = await resolveContractor(tx, contractorFromParty(counterparty))
      const contractor = await tx.contractor.findUniqueOrThrow({ where: { id: contractorId } })

      const created = await tx.document.create({
        data: {
          number: parsed.number,
          typeId: type.id,
          contractorId,
          issueDate,
          dueDate: dueDate ?? null,
          netAmount: parsed.netAmount,
          vatAmount: parsed.vatAmount,
          grossAmount: parsed.grossAmount,
          currency: parsed.currency,
          paymentAccount: optionalValidAccount(parsed.paymentAccount) ?? null,
          categoryId: contractor.defaultCategoryId ?? null,
          source: input.source,
          ksefNumber: input.ksefNumber ?? null,
          stage: 'BUFFER',
          importRunId: input.importRunId ?? null,
        },
        include: DOCUMENT_INCLUDE,
      })

      await tx.attachment.create({
        data: {
          documentId: created.id,
          kind: 'KSEF_XML',
          filename: input.filename,
          mimeType: 'application/xml',
          sizeBytes: content.byteLength,
          checksum,
          content: Uint8Array.from(content),
        },
      })

      return created
    })

    return { status: 'created' as const, document: mapDocument(document) }
  } catch (error) {
    if (error instanceof DocumentError) throw error
    if (isPrismaUniqueViolation(error)) {
      if (input.ksefNumber) {
        const existing = await prisma.document.findUnique({
          where: { ksefNumber: input.ksefNumber },
          select: { id: true },
        })
        if (existing) {
          return { status: 'duplicate' as const, documentId: existing.id }
        }
      }
      throw new DocumentError(
        `Dokument o numerze "${parsed.number}" dla tego kontrahenta już istnieje`,
        409,
      )
    }
    throw error
  }
}
