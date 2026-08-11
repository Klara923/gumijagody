import { NextResponse } from 'next/server'
import type { z } from 'zod'

import { acceptDocuments } from '@/server/documents/accept-documents'
import { DocumentError } from '@/server/documents/errors'
import { acceptDocumentsBodySchema } from '@/server/documents/schemas'

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

  const parsed = acceptDocumentsBodySchema.safeParse(body)
  if (!parsed.success) {
    return validationResponse('Nieprawidłowe dane akceptacji', parsed.error)
  }

  try {
    const result = await acceptDocuments(parsed.data)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof DocumentError) {
      return NextResponse.json(
        { error: error.message, ...(error.details ? { details: error.details } : {}) },
        { status: error.status },
      )
    }
    throw error
  }
}
