import { XMLParser } from 'fast-xml-parser'

import { DocumentError } from '@/server/documents/errors'

export type ParsedFaInvoice = {
  number: string
  issueDate: string
  dueDate?: string
  netAmount: string
  vatAmount: string
  grossAmount: string
  currency: string
  paymentAccount?: string
  seller: { name: string; nip?: string }
  buyer: { name: string; nip?: string }
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
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

function party(node: unknown): { name: string; nip?: string } {
  const root = asRecord(firstValue(node))
  const identity = asRecord(firstValue(root?.DaneIdentyfikacyjne))
  const name =
    text(identity?.Nazwa) ??
    text(identity?.PelnaNazwa) ??
    text(root?.Nazwa) ??
    'Nieznany kontrahent'
  const nip = text(identity?.NIP)?.replace(/[\s-]/g, '')
  return { name, ...(nip ? { nip } : {}) }
}

function paymentAccount(fa: Record<string, unknown>): string | undefined {
  const payment = asRecord(firstValue(fa.Platnosc))
  return (
    text(payment?.NrRB) ??
    text(asRecord(firstValue(payment?.RachunekBankowy))?.NrRB) ??
    text(fa.NrRB)
  )
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

  return {
    number,
    issueDate,
    ...(dueDate ? { dueDate } : {}),
    netAmount: formatAmount(net),
    vatAmount: formatAmount(gross - net),
    grossAmount: formatAmount(gross),
    currency: text(fa.KodWaluty) ?? 'PLN',
    ...(account ? { paymentAccount: account } : {}),
    seller: party(invoice.Podmiot1 ?? fa.Podmiot1),
    buyer: party(invoice.Podmiot2 ?? fa.Podmiot2),
  }
}
