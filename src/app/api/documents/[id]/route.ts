import { NextResponse } from 'next/server'

import { DocumentError } from '@/server/documents/errors'
import { getDocumentById } from '@/server/documents/get-document'

export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params

  try {
    const document = await getDocumentById(id)
    return NextResponse.json(document)
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
