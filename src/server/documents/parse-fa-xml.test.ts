import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { DocumentError } from '@/server/documents/errors'
import { parseFaXml } from '@/server/documents/parse-fa-xml'

function fixture(name: string) {
  return readFileSync(join(process.cwd(), 'fixtures/ksef', name), 'utf8')
}

describe('parseFaXml', () => {
  it('reads a FA(2) invoice number, parties, amounts, and lines', () => {
    const invoice = parseFaXml(fixture('FA2.xml'))

    expect(invoice.formVariant).toBe('FA (2)')
    expect(invoice.number).toBe('FK2023/08/31')
    expect(invoice.issueDate).toBe('2023-08-31')
    expect(invoice.dueDate).toBe('2023-09-14')
    expect(invoice.currency).toBe('PLN')
    expect(invoice.netAmount).toBe('4001.49')
    expect(invoice.grossAmount).toBe('4001.49')
    expect(invoice.paymentAccount).toBe('61109010140000071219812874')
    expect(invoice.seller).toEqual(
      expect.objectContaining({
        name: 'ABC AGD sp. z o. o.',
        nip: '9781399259',
        address: 'ul. Kwiatowa 1, 00-001 Warszawa, PL',
      }),
    )
    expect(invoice.buyer).toEqual(
      expect.objectContaining({
        name: 'Gumijagoda Sp. z o.o.',
        nip: '4728391059',
        address: 'ul. Gumijska 1, 34-400 Nowy Targ, PL',
      }),
    )
    expect(invoice.lines.map((line) => line.name)).toEqual(['Sprzedaż towarów 23%', 'GTU_1'])
  })

  it('reads a FA(3) invoice including the due date and line items', () => {
    const invoice = parseFaXml(fixture('FA3.xml'))

    expect(invoice.formVariant).toBe('FA (3)')
    expect(invoice.number).toBe('FV2026/02/150')
    expect(invoice.issueDate).toBe('2026-02-15')
    expect(invoice.dueDate).toBe('2026-03-01')
    expect(invoice.paymentAccount).toBe('61109010140000071219812874')
    expect(invoice.netAmount).toBe('1667.61')
    expect(invoice.grossAmount).toBe('2051.00')
    expect(invoice.lines).toHaveLength(3)
    expect(invoice.lines[0]).toEqual(
      expect.objectContaining({ name: 'lodówka Zimnotech mk1', vatRate: '23' }),
    )
  })

  it.each([
    ['FA2-05.xml', 'FK/TEST/2026/005', '246.00'],
    ['FA2-06.xml', 'FK/TEST/2026/006', '430.50'],
    ['FA2-07.xml', 'FK/TEST/2026/007', '98.40'],
    ['FA2-08.xml', 'FK/TEST/2026/008', '787.20'],
    ['FA3-05.xml', 'FV/TEST/2026/105', '504.30'],
    ['FA3-06.xml', 'FV/TEST/2026/106', '639.60'],
    ['FA3-07.xml', 'FV/TEST/2026/107', '226.50'],
    ['FA3-08.xml', 'FV/TEST/2026/108', '1082.40'],
  ])('reads upload fixture %s', (name, number, gross) => {
    const invoice = parseFaXml(fixture(name))

    expect(invoice.number).toBe(number)
    expect(invoice.grossAmount).toBe(gross)
    expect(invoice.dueDate).toBeDefined()
    expect(invoice.paymentAccount).toBe('61109010140000071219812874')
    expect(invoice.buyer.nip).toBe('4728391059')
    expect(invoice.seller.address).toBeDefined()
    expect(invoice.buyer.address).toBeDefined()
    expect(invoice.lines.length).toBeGreaterThan(0)
    expect(invoice.lines[0]?.quantity).toBeDefined()
    expect(invoice.lines[0]?.unit).toBeDefined()
  })

  it('throws DocumentError for XML that is not a FA invoice', () => {
    expect(() => parseFaXml('<root/>')).toThrow(DocumentError)
    expect(() => parseFaXml('<root/>')).toThrow('Nie rozpoznano faktury FA(2)/FA(3)')
  })

  it('throws DocumentError when the invoice number is missing', () => {
    const xml = `
      <Faktura>
        <Fa>
          <P_1>2026-01-01</P_1>
          <P_13_1>100</P_13_1>
          <P_14_1>23</P_14_1>
          <P_15>123</P_15>
        </Fa>
      </Faktura>
    `
    expect(() => parseFaXml(xml)).toThrow('Brak numeru faktury')
  })
})
