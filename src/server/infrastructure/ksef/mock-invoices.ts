import { getEnv } from '@/server/env'

import type { KsefInvoiceClient, ListInvoicesQuery } from './client'
import type { InvoiceMetadata } from './schemas'

function buildSampleXml(input: {
  number: string
  issueDate: string
  dueDate: string
  sellerNip: string
  sellerName: string
  buyerNip: string
  buyerName: string
  net: string
  vat: string
  gross: string
}): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Faktura>
  <Fa>
    <KodWaluty>PLN</KodWaluty>
    <P_1>${input.issueDate}</P_1>
    <P_2>${input.number}</P_2>
    <P_6>${input.dueDate}</P_6>
    <P_13_1>${input.net}</P_13_1>
    <P_14_1>${input.vat}</P_14_1>
    <P_15>${input.gross}</P_15>
  </Fa>
  <Podmiot1>
    <DaneIdentyfikacyjne>
      <NIP>${input.sellerNip}</NIP>
      <Nazwa>${input.sellerName}</Nazwa>
    </DaneIdentyfikacyjne>
  </Podmiot1>
  <Podmiot2>
    <DaneIdentyfikacyjne>
      <NIP>${input.buyerNip}</NIP>
      <Nazwa>${input.buyerName}</Nazwa>
    </DaneIdentyfikacyjne>
  </Podmiot2>
</Faktura>
`
}

export function createMockKsefInvoiceClient(): KsefInvoiceClient {
  const ourNip = getEnv().KSEF_NIP ?? '4728391059'
  const samples: Array<{ metadata: InvoiceMetadata; xml: string }> = [
    {
      metadata: {
        ksefNumber: `MOCK-COST-${ourNip}-001`,
        invoiceNumber: 'FV/MOCK/COST/001',
        issueDate: '2026-08-05',
        netAmount: 100,
        vatAmount: 23,
        grossAmount: 123,
        currency: 'PLN',
        seller: { nip: '5250001003', name: 'Mock Dostawca Sp. z o.o.' },
        buyer: { identifier: { type: 'Nip', value: ourNip }, name: 'Gumijagoda Sp. z o.o.' },
      },
      xml: buildSampleXml({
        number: 'FV/MOCK/COST/001',
        issueDate: '2026-08-05',
        dueDate: '2026-08-20',
        sellerNip: '5250001003',
        sellerName: 'Mock Dostawca Sp. z o.o.',
        buyerNip: ourNip,
        buyerName: 'Gumijagoda Sp. z o.o.',
        net: '100.00',
        vat: '23.00',
        gross: '123.00',
      }),
    },
    {
      metadata: {
        ksefNumber: `MOCK-SALES-${ourNip}-001`,
        invoiceNumber: 'FV/MOCK/SALES/001',
        issueDate: '2026-08-06',
        netAmount: 200,
        vatAmount: 46,
        grossAmount: 246,
        currency: 'PLN',
        seller: { nip: ourNip, name: 'Gumijagoda Sp. z o.o.' },
        buyer: {
          identifier: { type: 'Nip', value: '1130001004' },
          name: 'Mock Odbiorca Sp. z o.o.',
        },
      },
      xml: buildSampleXml({
        number: 'FV/MOCK/SALES/001',
        issueDate: '2026-08-06',
        dueDate: '2026-08-21',
        sellerNip: ourNip,
        sellerName: 'Gumijagoda Sp. z o.o.',
        buyerNip: '1130001004',
        buyerName: 'Mock Odbiorca Sp. z o.o.',
        net: '200.00',
        vat: '46.00',
        gross: '246.00',
      }),
    },
  ]

  return {
    async listInvoiceMetadata(query: ListInvoicesQuery) {
      const invoices = samples
        .filter((sample) => {
          const issue = new Date(`${sample.metadata.issueDate}T00:00:00.000Z`)
          if (issue < query.from || issue > query.to) return false
          if (query.subjectType === 'Subject2') {
            return sample.metadata.buyer.identifier.value === ourNip
          }
          return sample.metadata.seller.nip === ourNip
        })
        .map((sample) => sample.metadata)

      if (query.limit && invoices.length > query.limit) {
        return { invoices: invoices.slice(0, query.limit), isTruncated: true }
      }

      return { invoices, isTruncated: false }
    },

    async downloadInvoiceXml(ksefNumber: string): Promise<Buffer> {
      const sample = samples.find((item) => item.metadata.ksefNumber === ksefNumber)
      if (!sample) {
        throw new Error(`Mock KSeF: brak faktury ${ksefNumber}`)
      }
      return Buffer.from(sample.xml, 'utf8')
    },
  }
}
