import { NextResponse } from 'next/server'

import {
  ContractorLookupError,
  lookupContractorByNip,
} from '@/server/contractors/lookup-nip'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const nip = new URL(request.url).searchParams.get('nip') ?? ''

  try {
    const contractor = await lookupContractorByNip(nip)
    return NextResponse.json(contractor)
  } catch (error) {
    const status = error instanceof ContractorLookupError ? error.status : 500
    const message =
      error instanceof ContractorLookupError
        ? error.message
        : 'Nie udało się pobrać danych kontrahenta'
    return NextResponse.json({ error: message }, { status })
  }
}
