import { isValidNip } from '@/server/validation'

const LOOKUP_TIMEOUT_MS = 10_000
const API_BASE = 'https://wl-api.mf.gov.pl'

export type ContractorLookupResult = {
  name: string
  nip: string
  street: string | null
  postalCode: string | null
  city: string | null
  bankAccount: string | null
  statusVat: string | null
}

export class ContractorLookupError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ContractorLookupError'
    this.status = status
  }
}

function todayInWarsaw() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Warsaw' }).format(new Date())
}

function parsePolishAddress(raw: string | null | undefined) {
  if (!raw || raw.trim() === '') {
    return { street: null, postalCode: null, city: null }
  }

  const normalized = raw.replace(/\s+/g, ' ').trim()
  const match = normalized.match(/^(.*?)[,\s]+(\d{2}-\d{3})\s+(.+)$/)
  if (!match) {
    return { street: normalized, postalCode: null, city: null }
  }

  return {
    street: match[1].replace(/,$/, '').trim() || null,
    postalCode: match[2],
    city: match[3].trim() || null,
  }
}

type WlSubject = {
  name?: string | null
  nip?: string | null
  workingAddress?: string | null
  residenceAddress?: string | null
  accountNumbers?: string[] | null
  statusVat?: string | null
}

export async function lookupContractorByNip(nipRaw: string): Promise<ContractorLookupResult> {
  const nip = nipRaw.replace(/[\s-]/g, '')
  if (!isValidNip(nip)) {
    throw new ContractorLookupError('NIP musi mieć 10 cyfr i poprawną sumę kontrolną', 400)
  }

  const date = todayInWarsaw()
  const url = `${API_BASE}/api/search/nip/${nip}?date=${date}`

  let response: Response
  try {
    response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
      cache: 'no-store',
    })
  } catch {
    throw new ContractorLookupError('Nie udało się połączyć z wykazem podatników VAT', 503)
  }

  if (response.status === 429) {
    throw new ContractorLookupError(
      'Wykaz podatników odrzucił zapytanie (limit 100 wyszukań dziennie). Spróbuj jutro.',
      429,
    )
  }

  if (!response.ok) {
    throw new ContractorLookupError('Wykaz podatników VAT nie przyjął zapytania', 502)
  }

  const payload = (await response.json()) as { result?: { subject?: WlSubject | null } }
  const subject = payload.result?.subject
  if (!subject) {
    throw new ContractorLookupError('Ten NIP nie figuruje w wykazie podatników VAT', 404)
  }

  const name = subject.name?.trim()
  if (!name) {
    throw new ContractorLookupError('Wykaz nie zwrócił nazwy podmiotu dla tego NIP', 404)
  }

  const address = parsePolishAddress(subject.workingAddress || subject.residenceAddress)
  const bankAccount = subject.accountNumbers?.find((value) => value.trim() !== '') ?? null

  return {
    name,
    nip: subject.nip?.replace(/[\s-]/g, '') || nip,
    street: address.street,
    postalCode: address.postalCode,
    city: address.city,
    bankAccount,
    statusVat: subject.statusVat ?? null,
  }
}
