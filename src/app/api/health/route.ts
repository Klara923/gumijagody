import { NextResponse } from 'next/server'

import { getPrisma } from '@/server/infrastructure/db/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const startedAt = performance.now()

  try {
    await getPrisma().$queryRaw`SELECT 1`

    return NextResponse.json({
      status: 'ok',
      database: 'up',
      latencyMs: Math.round(performance.now() - startedAt),
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    const code =
      error && typeof error === 'object' && 'code' in error ? String(error.code) : undefined

    return NextResponse.json(
      {
        status: 'error',
        database: 'down',
        code,
        message: error instanceof Error ? error.message.trim() : 'Nieznany błąd połączenia z bazą',
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    )
  }
}
