import { getPrisma } from '@/server/infrastructure/db/prisma'
import {
  getKsefInvoiceClient,
  subjectTypeForKind,
} from '@/server/infrastructure/ksef/client'
import { KsefError } from '@/server/infrastructure/ksef/errors'
import {
  KSEF_DEMO_INVOICE_LIMIT,
  KSEF_MAX_DATE_RANGE_DAYS,
} from '@/server/infrastructure/ksef/limits'

import { DocumentError } from './errors'
import { ingestFaXmlDocument } from './ingest-fa-xml'
import type { ImportFromKsefInput } from './schemas'

function daysInclusive(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)) + 1
}

export async function importFromKsef(
  input: ImportFromKsefInput,
  options?: { trigger?: 'MANUAL' | 'SCHEDULED' },
) {
  if (input.rangeTo.getTime() < input.rangeFrom.getTime()) {
    throw new DocumentError('Zakres dat jest nieprawidłowy (od > do)', 400)
  }

  if (daysInclusive(input.rangeFrom, input.rangeTo) > KSEF_MAX_DATE_RANGE_DAYS) {
    throw new DocumentError('Maksymalny zakres pobierania to 3 miesiące', 400)
  }

  const trigger = options?.trigger ?? 'MANUAL'
  const prisma = getPrisma()
  const run = await prisma.importRun.create({
    data: {
      trigger,
      invoiceKind: input.invoiceKind,
      rangeFrom: input.rangeFrom,
      rangeTo: input.rangeTo,
      status: 'RUNNING',
    },
  })

  let importedCount = 0
  let duplicateCount = 0
  const errors: string[] = []

  try {
    const client = await getKsefInvoiceClient()
    const listed = await client.listInvoiceMetadata({
      subjectType: subjectTypeForKind(input.invoiceKind),
      from: input.rangeFrom,
      to: input.rangeTo,
      limit: KSEF_DEMO_INVOICE_LIMIT,
    })
    const metadata = listed.invoices

    if (listed.isTruncated) {
      errors.push(
        `Pobrano maksymalnie ${KSEF_DEMO_INVOICE_LIMIT} faktur albo KSeF uciął listę (isTruncated). Zawęź zakres. Przy dużym wolumenie właściwszy jest POST /invoices/exports — nie ma go w tym demo.`,
      )
    }

    for (const invoice of metadata) {
      const existing = await prisma.document.findUnique({
        where: { ksefNumber: invoice.ksefNumber },
        select: { id: true },
      })
      if (existing) {
        duplicateCount += 1
        continue
      }

      try {
        const xml = await client.downloadInvoiceXml(invoice.ksefNumber)
        const result = await ingestFaXmlDocument({
          xml,
          filename: `${invoice.ksefNumber}.xml`,
          source: 'KSEF',
          ksefNumber: invoice.ksefNumber,
          importRunId: run.id,
          enforceChecksumUniqueness: false,
        })

        if (result.status === 'duplicate') {
          duplicateCount += 1
        } else {
          importedCount += 1
        }
      } catch (error) {
        const message =
          error instanceof DocumentError || error instanceof KsefError || error instanceof Error
            ? error.message
            : 'Nieznany błąd przy imporcie faktury'
        errors.push(`${invoice.ksefNumber}: ${message}`)
      }
    }

    const failed = errors.length > 0 && importedCount === 0 && duplicateCount === 0
    const finished = await prisma.importRun.update({
      where: { id: run.id },
      data: {
        status: failed ? 'FAILED' : 'SUCCESS',
        finishedAt: new Date(),
        importedCount,
        duplicateCount,
        error: errors.length > 0 ? errors.slice(0, 20).join('\n') : null,
      },
    })

    return {
      id: finished.id,
      status: finished.status,
      importedCount: finished.importedCount,
      duplicateCount: finished.duplicateCount,
      foundCount: metadata.length,
      error: finished.error,
    }
  } catch (error) {
    const message =
      error instanceof KsefError || error instanceof DocumentError || error instanceof Error
        ? error.message
        : 'Nieoczekiwany błąd importu z KSeF'

    await prisma.importRun.update({
      where: { id: run.id },
      data: {
        status: 'FAILED',
        finishedAt: new Date(),
        importedCount,
        duplicateCount,
        error: message,
      },
    })

    if (error instanceof DocumentError || error instanceof KsefError) throw error
    throw new DocumentError(message, 502)
  }
}
