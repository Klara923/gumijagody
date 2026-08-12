import { NextResponse } from 'next/server'
import type { z } from 'zod'

import { DocumentError } from '@/server/documents/errors'
import { importFromKsef } from '@/server/documents/import-from-ksef'
import { importFromKsefBodySchema } from '@/server/documents/schemas'
import { KsefError } from '@/server/infrastructure/ksef/errors'

export const dynamic = 'force-dynamic'

function validationResponse(message: string, error: z.ZodError) {
  return NextResponse.json(
    {
      error: message,
      details: error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    },
    { status: 400 },
  )
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Treść żądania musi być poprawnym JSON-em' }, { status: 400 })
  }

  const parsed = importFromKsefBodySchema.safeParse(body)
  if (!parsed.success) {
    return validationResponse('Nieprawidłowe dane pobierania z KSeF', parsed.error)
  }

  try {
    const result = await importFromKsef(parsed.data)
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof DocumentError) {
      return NextResponse.json(
        { error: error.message, ...(error.details ? { details: error.details } : {}) },
        { status: error.status },
      )
    }
    if (error instanceof KsefError) {
      return NextResponse.json(
        {
          error: error.message,
          ...(error.details ? { details: error.details } : {}),
        },
        { status: error.httpStatus && error.httpStatus < 500 ? error.httpStatus : 502 },
      )
    }
    throw error
  }
}
