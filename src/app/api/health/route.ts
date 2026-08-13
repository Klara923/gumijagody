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
    })
  } catch {
    return NextResponse.json(
      {
        status: 'error',
        database: 'down',
        latencyMs: Math.round(performance.now() - startedAt),
      },
      { status: 503 },
    )
  }
}
