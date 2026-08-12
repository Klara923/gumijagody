import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

import { getEnv } from '@/server/env'
import {
  getPrisma,
  getPrismaAdapterName,
  getPrismaConnectUrl,
  stripChannelBinding,
} from '@/server/infrastructure/db/prisma'

export const dynamic = 'force-dynamic'

function describeDatabaseUrl(databaseUrl: string) {
  try {
    const normalized = databaseUrl.replace(/^postgresql:/i, 'http:').replace(/^postgres:/i, 'http:')
    const url = new URL(normalized)
    return {
      host: url.hostname,
      database: url.pathname.replace(/^\//, '') || null,
      user: decodeURIComponent(url.username || '') || null,
      passwordLength: url.password.length,
      hasPoolerHost: url.hostname.includes('-pooler'),
      sslmode: url.searchParams.get('sslmode'),
      hasChannelBinding: url.searchParams.has('channel_binding'),
      endsWithQuote:
        databaseUrl.trim().endsWith("'") || databaseUrl.trim().endsWith('"'),
    }
  } catch {
    return {
      parseError: true,
      rawLength: databaseUrl.length,
      endsWithQuote:
        databaseUrl.trim().endsWith("'") || databaseUrl.trim().endsWith('"'),
    }
  }
}

async function probeHttp(connectionString: string) {
  try {
    const sql = neon(connectionString)
    await sql`SELECT 1`
    return { ok: true as const }
  } catch (error) {
    return {
      ok: false as const,
      message: error instanceof Error ? error.message.trim() : 'unknown',
    }
  }
}

export async function GET() {
  const startedAt = performance.now()

  let databaseUrl: string | undefined
  try {
    databaseUrl = getEnv().DATABASE_URL
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        database: 'down',
        message: error instanceof Error ? error.message.trim() : 'Błąd konfiguracji env',
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    )
  }

  const databaseUrlInfo = describeDatabaseUrl(databaseUrl)
  const connectUrl = getPrismaConnectUrl(databaseUrl)
  const httpProbe = await probeHttp(stripChannelBinding(databaseUrl))

  try {
    await getPrisma().$queryRaw`SELECT 1`

    return NextResponse.json({
      status: 'ok',
      database: 'up',
      adapter: getPrismaAdapterName(databaseUrl),
      connectHost: describeDatabaseUrl(connectUrl).host ?? null,
      httpProbe,
      latencyMs: Math.round(performance.now() - startedAt),
      databaseUrlInfo,
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
        adapter: getPrismaAdapterName(databaseUrl),
        connectHost: describeDatabaseUrl(connectUrl).host ?? null,
        httpProbe,
        databaseUrlInfo,
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    )
  }
}
