import type { KsefInvoiceKind } from '@/generated/prisma/client'
import { getEnv } from '@/server/env'

import type { InvoiceMetadata } from './schemas'

export type KsefSubjectType = 'Subject1' | 'Subject2'

export type ListInvoicesQuery = {
  subjectType: KsefSubjectType
  from: Date
  to: Date
  limit?: number
}

export type ListInvoicesResult = {
  invoices: InvoiceMetadata[]
  isTruncated: boolean
}

export type KsefInvoiceClient = {
  listInvoiceMetadata: (query: ListInvoicesQuery) => Promise<ListInvoicesResult>
  downloadInvoiceXml: (ksefNumber: string) => Promise<Buffer>
}

export function subjectTypeForKind(kind: KsefInvoiceKind): KsefSubjectType {
  return kind === 'COST' ? 'Subject2' : 'Subject1'
}

export async function getKsefInvoiceClient(): Promise<KsefInvoiceClient> {
  const env = getEnv()
  if (env.KSEF_CLIENT === 'mock') {
    const { createMockKsefInvoiceClient } = await import('./mock-invoices')
    return createMockKsefInvoiceClient()
  }

  const { createHttpKsefInvoiceClient } = await import('./http-invoices')
  return createHttpKsefInvoiceClient()
}
