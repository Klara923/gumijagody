import { NextResponse } from 'next/server'
import type { z } from 'zod'

import { createDocument } from '@/server/documents/create-document'
import { DocumentError } from '@/server/documents/errors'
import { listDocuments } from '@/server/documents/list-documents'
import { createDocumentBodySchema, listDocumentsQuerySchema } from '@/server/documents/schemas'

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

export async function GET(request: Request) {
  const url = new URL(request.url)
  const parsed = listDocumentsQuerySchema.safeParse({
    stage: url.searchParams.get('stage') ?? undefined,
  })

  if (!parsed.success) {
    return validationResponse('Nieprawidłowe parametry zapytania', parsed.error)
  }

  const items = await listDocuments(parsed.data)

  return NextResponse.json({ items })
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Treść żądania musi być poprawnym JSON-em' }, { status: 400 })
  }

  const parsed = createDocumentBodySchema.safeParse(body)
  if (!parsed.success) {
    return validationResponse('Nieprawidłowe dane dokumentu', parsed.error)
  }

  try {
    const document = await createDocument(parsed.data)
    return NextResponse.json(document, { status: 201 })
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
