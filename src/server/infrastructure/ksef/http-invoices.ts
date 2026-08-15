import { authenticateWithKsefToken } from './authenticator'
import type { KsefInvoiceClient, ListInvoicesQuery, ListInvoicesResult } from './client'
import { getKsefCredentials } from './config'
import { ksefFetch, ksefFetchXml } from './http'
import { KSEF_MAX_DATE_WINDOWS } from './limits'
import {
  queryInvoicesMetadataResponseSchema,
  type InvoiceMetadata,
} from './schemas'

const PAGE_SIZE = 100

function dayStartIso(date: Date): string {
  return `${date.toISOString().slice(0, 10)}T00:00:00.000Z`
}

function dayEndIso(date: Date): string {
  return `${date.toISOString().slice(0, 10)}T23:59:59.999Z`
}

export async function createHttpKsefInvoiceClient(): Promise<KsefInvoiceClient> {
  const credentials = getKsefCredentials()
  const session = await authenticateWithKsefToken(credentials)
  const bearer = session.accessToken.token
  const { baseUrl } = credentials

  return {
    async listInvoiceMetadata(query: ListInvoicesQuery): Promise<ListInvoicesResult> {
      const rangeTo = dayEndIso(query.to)
      let rangeFrom = dayStartIso(query.from)
      const invoices: InvoiceMetadata[] = []
      const seen = new Set<string>()
      let unfinishedTruncation = false

      for (let window = 0; window < KSEF_MAX_DATE_WINDOWS; window += 1) {
        let pageOffset = 0
        let windowTruncated = false
        let lastIssueDate: string | undefined

        for (;;) {
          const path =
            `/invoices/query/metadata?pageOffset=${pageOffset}` +
            `&pageSize=${PAGE_SIZE}&sortOrder=Asc`

          const page = await ksefFetch(baseUrl, path, {
            schema: queryInvoicesMetadataResponseSchema,
            method: 'POST',
            bearer,
            body: {
              subjectType: query.subjectType,
              dateRange: {
                dateType: 'Issue',
                from: rangeFrom,
                to: rangeTo,
              },
            },
          })

          for (const invoice of page.invoices) {
            if (seen.has(invoice.ksefNumber)) continue
            if (query.limit && invoices.length >= query.limit) {
              return { invoices, isTruncated: true }
            }
            seen.add(invoice.ksefNumber)
            invoices.push(invoice)
            lastIssueDate = invoice.issueDate
          }

          if (query.limit && invoices.length >= query.limit) {
            return { invoices, isTruncated: page.hasMore || page.isTruncated }
          }

          if (!page.hasMore) {
            windowTruncated = false
            break
          }

          if (page.isTruncated) {
            windowTruncated = true
            break
          }

          pageOffset += 1
        }

        if (!windowTruncated) {
          unfinishedTruncation = false
          break
        }

        if (!lastIssueDate) {
          unfinishedTruncation = true
          break
        }

        const nextFrom = `${lastIssueDate}T00:00:00.000Z`
        if (nextFrom <= rangeFrom) {
          unfinishedTruncation = true
          break
        }

        rangeFrom = nextFrom
        unfinishedTruncation = window === KSEF_MAX_DATE_WINDOWS - 1
      }

      return {
        invoices,
        isTruncated: unfinishedTruncation,
      }
    },

    async downloadInvoiceXml(ksefNumber: string): Promise<Buffer> {
      return ksefFetchXml(baseUrl, `/invoices/ksef/${encodeURIComponent(ksefNumber)}`, {
        bearer,
      })
    },
  }
}
