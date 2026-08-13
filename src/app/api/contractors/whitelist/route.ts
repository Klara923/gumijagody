import { NextResponse } from 'next/server'

import { checkBankAccountOnWhitelist } from '@/server/contractors/check-bank-account'
import { ContractorLookupError } from '@/server/contractors/wl-api'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const nip = url.searchParams.get('nip') ?? ''
  const account = url.searchParams.get('account') ?? ''

  try {
    const result = await checkBankAccountOnWhitelist(nip, account)
    return NextResponse.json(result)
  } catch (error) {
    const status = error instanceof ContractorLookupError ? error.status : 500
    const message =
      error instanceof ContractorLookupError
        ? error.message
        : 'Nie udało się sprawdzić rachunku na białej liście'
    return NextResponse.json({ error: message }, { status })
  }
}
