const LOOKUP_TIMEOUT_MS = 10_000

export const WL_API_BASE = 'https://wl-api.mf.gov.pl'

export class ContractorLookupError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ContractorLookupError'
    this.status = status
  }
}

export function todayInWarsaw() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Warsaw' }).format(new Date())
}

export async function fetchWlApi(pathAndQuery: string): Promise<unknown> {
  let response: Response
  try {
    response = await fetch(`${WL_API_BASE}${pathAndQuery}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
      cache: 'no-store',
    })
  } catch {
    throw new ContractorLookupError('Nie udało się połączyć z wykazem podatników VAT', 503)
  }

  if (response.status === 429) {
    throw new ContractorLookupError(
      'Wykaz podatników odrzucił zapytanie (limit dzienny). Spróbuj jutro.',
      429,
    )
  }

  if (response.status === 400) {
    throw new ContractorLookupError('Wykaz odrzucił NIP albo numer rachunku', 400)
  }

  if (!response.ok) {
    throw new ContractorLookupError('Wykaz podatników VAT nie przyjął zapytania', 502)
  }

  return response.json()
}
