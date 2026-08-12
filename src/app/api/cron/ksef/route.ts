import { NextResponse } from 'next/server'

import { getEnv } from '@/server/env'
import { runScheduledKsefImport } from '@/server/schedule/run-scheduled-import'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

function extractSecret(request: Request) {
  const header = request.headers.get('authorization')
  if (header?.startsWith('Bearer ')) return header.slice('Bearer '.length).trim()
  return request.headers.get('x-cron-secret')?.trim() || null
}

export async function POST(request: Request) {
  try {
    const env = getEnv()
    if (!env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'CRON_SECRET nie jest skonfigurowany — endpoint crona jest wyłączony' },
        { status: 503 },
      )
    }

    const provided = extractSecret(request)
    if (!provided || provided !== env.CRON_SECRET) {
      return unauthorized()
    }

    const force = new URL(request.url).searchParams.get('force') === '1'
    const result = await runScheduledKsefImport({ force })
    return NextResponse.json(result)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Nieoczekiwany błąd crona KSeF'
    console.error('[api/cron/ksef]', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
