import { XMLParser } from 'fast-xml-parser'

import { DocumentError } from '@/server/documents/errors'

export type ParsedFaParty = {
  name: string
  nip?: string
  address?: string
}

export type ParsedFaLine = {
  lineNumber: string
  name: string
  unit?: string
  quantity?: string
  unitNetPrice?: string
  netAmount?: string
  vatRate?: string
}

export type ParsedFaInvoice = {
  number: string
  issueDate: string
  dueDate?: string
  netAmount: string
  vatAmount: string
  grossAmount: string
  currency: string
  paymentAccount?: string
  formVariant?: string
  seller: ParsedFaParty
  buyer: ParsedFaParty
  lines: ParsedFaLine[]
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}

function asArray(value: unknown): unknown[] {
  if (value === undefined || value === null) return []
  return Array.isArray(value) ? value : [value]
}

function firstValue(value: unknown): unknown {
  return Array.isArray(value) ? value[0] : value
}

function text(value: unknown): string | undefined {
  const raw = firstValue(value)
  if (raw === undefined || raw === null) return undefined
  if (typeof raw === 'string' || typeof raw === 'number' || typeof raw === 'boolean') {
    const normalized = String(raw).trim()
    return normalized === '' ? undefined : normalized
  }
  const nested = asRecord(raw)
  if (nested && '#text' in nested) return text(nested['#text'])
  return undefined
}

function attr(value: unknown, name: string): string | undefined {
  const nested = asRecord(firstValue(value))
  if (!nested) return undefined
  return text(nested[`@_${name}`]) ?? text(nested[name])
}

function optionalAmount(value: unknown): number | undefined {
  const raw = text(value)
  if (!raw) return undefined
  const number = Number(raw.replace(',', '.'))
  if (!Number.isFinite(number)) return undefined
  return number
}

function formatAmount(value: number): string {
  return value.toFixed(2)
}

function sumFields(node: Record<string, unknown>, keys: string[]): number {
  return keys.reduce((sum, key) => sum + (optionalAmount(node[key]) ?? 0), 0)
}

function party(node: unknown): ParsedFaParty {
  const root = asRecord(firstValue(node))
  const identity = asRecord(firstValue(root?.DaneIdentyfikacyjne))
  const name =
    text(identity?.Nazwa) ??
    text(identity?.PelnaNazwa) ??
    text(root?.Nazwa) ??
    'Nieznany kontrahent'
  const nip = text(identity?.NIP)?.replace(/[\s-]/g, '')
  const addressNode = asRecord(firstValue(root?.Adres))
  const addressParts = [
    text(addressNode?.AdresL1),
    text(addressNode?.AdresL2),
    text(addressNode?.KodKraju),
  ].filter(Boolean)
  return {
    name,
    ...(nip ? { nip } : {}),
    ...(addressParts.length > 0 ? { address: addressParts.join(', ') } : {}),
  }
}

function paymentAccount(fa: Record<string, unknown>): string | undefined {
  const payment = asRecord(firstValue(fa.Platnosc))
  return (
    text(payment?.NrRB) ??
    text(asRecord(firstValue(payment?.RachunekBankowy))?.NrRB) ??
    text(fa.NrRB)
  )
}

function lineItems(fa: Record<string, unknown>): ParsedFaLine[] {
  return asArray(fa.FaWiersz)
    .map((row) => {
      const item = asRecord(row)
      if (!item) return null
      const name = text(item.P_7)
      if (!name) return null
      return {
        lineNumber: text(item.NrWierszaFa) ?? '',
        name,
        ...(text(item.P_8A) ? { unit: text(item.P_8A) } : {}),
        ...(text(item.P_8B) ? { quantity: text(item.P_8B) } : {}),
        ...(text(item.P_9A) ? { unitNetPrice: text(item.P_9A) } : {}),
        ...(text(item.P_11) ? { netAmount: text(item.P_11) } : {}),
        ...(text(item.P_12) ? { vatRate: text(item.P_12) } : {}),
      }
    })
    .filter((row): row is ParsedFaLine => row !== null)
}

function findRoots(parsed: unknown): {
  invoice: Record<string, unknown>
  fa: Record<string, unknown>
} {
  const root = asRecord(parsed)
  if (!root) throw new DocumentError('XML faktury ma nieprawidłową strukturę', 400)

  const invoice = asRecord(firstValue(root.Faktura)) ?? root
  const fa = asRecord(firstValue(invoice.Fa))
  if (!fa) {
    throw new DocumentError(
      'Nie rozpoznano faktury FA(2)/FA(3) — brak węzła Fa',
      400,
    )
  }
  return { invoice, fa }
}

export function parseFaXml(xml: string): ParsedFaInvoice {
  const parser = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true,
    trimValues: true,
    // NRB ma 26 cyfr — bez tego fast-xml-parser robi z niego Number i psuje rachunek (6.11e+25).
    numberParseOptions: { skipLike: /^\d{16,}$/ },
  })

  let parsed: unknown
  try {
    parsed = parser.parse(xml)
  } catch {
    throw new DocumentError('Nie udało się sparsować pliku XML', 400)
  }

  const { invoice, fa } = findRoots(parsed)
  const number = text(fa.P_2)
  const issueDate = text(fa.P_1)

  if (!number) throw new DocumentError('Brak numeru faktury (P_2) w XML', 400)
  if (!issueDate) throw new DocumentError('Brak daty wystawienia (P_1) w XML', 400)

  const gross = optionalAmount(fa.P_15)
  if (gross === undefined) {
    throw new DocumentError('Brak kwoty brutto (P_15) w XML faktury', 400)
  }

  const netSum = sumFields(fa, [
    'P_13_1',
    'P_13_2',
    'P_13_3',
    'P_13_4',
    'P_13_5',
    'P_13_6',
    'P_13_7',
  ])
  const vatSum = sumFields(fa, [
    'P_14_1',
    'P_14_2',
    'P_14_3',
    'P_14_4',
    'P_14_5',
    'P_14_6',
    'P_14_7',
  ])

  let net = netSum
  let vat = vatSum
  if (net === 0 && vat === 0) {
    throw new DocumentError('Brak kwot netto/VAT w XML faktury', 400)
  }
  if (net === 0) net = gross - vat
  if (vat === 0) vat = gross - net

  const dueDate =
    text(fa.P_6) ?? text(asRecord(firstValue(fa.Platnosc))?.TerminPlatnosci)
  const account = paymentAccount(fa)
  const header = asRecord(firstValue(invoice.Naglowek))
  const formVariant =
    attr(header?.KodFormularza, 'kodSystemowy') ?? text(header?.KodFormularza)

  return {
    number,
    issueDate,
    ...(dueDate ? { dueDate } : {}),
    netAmount: formatAmount(net),
    vatAmount: formatAmount(gross - net),
    grossAmount: formatAmount(gross),
    currency: text(fa.KodWaluty) ?? 'PLN',
    ...(account ? { paymentAccount: account } : {}),
    ...(formVariant ? { formVariant } : {}),
    seller: party(invoice.Podmiot1 ?? fa.Podmiot1),
    buyer: party(invoice.Podmiot2 ?? fa.Podmiot2),
    lines: lineItems(fa),
  }
}
