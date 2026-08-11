import { NextResponse } from 'next/server'

import { listDocuments } from '@/server/documents/list-documents'
import { listDocumentsQuerySchema } from '@/server/documents/schemas'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const parsed = listDocumentsQuerySchema.safeParse({
    stage: url.searchParams.get('stage') ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Nieprawidłowe parametry zapytania',
        details: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
      { status: 400 },
    )
  }

  const items = await listDocuments(parsed.data)

  return NextResponse.json({ items })
}
