import { isValidNip } from '@/server/validation'

import { ContractorLookupError, fetchWlApi, todayInWarsaw } from './wl-api'

export type WhitelistCheckResult = {
  matched: boolean
  nip: string
  requestId: string | null
}

function toNrb(accountRaw: string): string {
  const normalized = accountRaw.replace(/[\s-]/g, '').toUpperCase()
  if (/^PL\d{26}$/.test(normalized)) return normalized.slice(2)
  if (/^\d{26}$/.test(normalized)) return normalized
  throw new ContractorLookupError(
    'Numer rachunku musi być polskim NRB (26 cyfr) albo IBAN PL',
    400,
  )
}

export async function checkBankAccountOnWhitelist(
  nipRaw: string,
  accountRaw: string,
): Promise<WhitelistCheckResult> {
  const nip = nipRaw.replace(/[\s-]/g, '')
  if (!isValidNip(nip)) {
    throw new ContractorLookupError('NIP musi mieć 10 cyfr i poprawną sumę kontrolną', 400)
  }

  const nrb = toNrb(accountRaw)
  const date = todayInWarsaw()
  const payload = (await fetchWlApi(
    `/api/check/nip/${nip}/bank-account/${nrb}?date=${date}`,
  )) as {
    result?: { accountAssigned?: string; requestId?: string }
  }

  const assigned = payload.result?.accountAssigned?.toUpperCase()
  if (assigned !== 'TAK' && assigned !== 'NIE') {
    throw new ContractorLookupError('Wykaz nie zwrócił jednoznacznej odpowiedzi TAK/NIE', 502)
  }

  return {
    matched: assigned === 'TAK',
    nip,
    requestId: payload.result?.requestId ?? null,
  }
}
