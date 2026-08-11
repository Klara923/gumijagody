import { NextResponse } from 'next/server'
import type { z } from 'zod'

import { deleteDocument } from '@/server/documents/delete-document'
import { DocumentError } from '@/server/documents/errors'
import { getDocumentById } from '@/server/documents/get-document'
import { updateDocumentBodySchema } from '@/server/documents/schemas'
import { updateDocument } from '@/server/documents/update-document'

export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ id: string }>
}

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

function documentErrorResponse(error: DocumentError) {
  return NextResponse.json(
    { error: error.message, ...(error.details ? { details: error.details } : {}) },
    { status: error.status },
  )
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params

  try {
    const document = await getDocumentById(id)
    return NextResponse.json(document)
  } catch (error) {
    if (error instanceof DocumentError) return documentErrorResponse(error)
    throw error
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Treść żądania musi być poprawnym JSON-em' }, { status: 400 })
  }

  const parsed = updateDocumentBodySchema.safeParse(body)
  if (!parsed.success) {
    return validationResponse('Nieprawidłowe dane dokumentu', parsed.error)
  }

  try {
    const document = await updateDocument(id, parsed.data)
    return NextResponse.json(document)
  } catch (error) {
    if (error instanceof DocumentError) return documentErrorResponse(error)
    throw error
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params

  try {
    await deleteDocument(id)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if (error instanceof DocumentError) return documentErrorResponse(error)
    throw error
  }
}
