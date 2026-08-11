import { NextResponse } from 'next/server'

import { DocumentError } from '@/server/documents/errors'
import { uploadDocument } from '@/server/documents/upload-document'

export const dynamic = 'force-dynamic'

function optionalString(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

export async function POST(request: Request) {
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json(
      { error: 'Treść żądania musi być multipart/form-data' },
      { status: 400 },
    )
  }

  const fileValue = formData.get('file')
  if (!(fileValue instanceof File)) {
    return NextResponse.json({ error: 'Pole file jest wymagane' }, { status: 400 })
  }

  const content = Buffer.from(await fileValue.arrayBuffer())
  const metadata = {
    number: String(formData.get('number') ?? ''),
    typeId: String(formData.get('typeId') ?? ''),
    contractor: {
      name: String(formData.get('contractorName') ?? ''),
      nip: optionalString(formData.get('contractorNip')),
    },
    issueDate: String(formData.get('issueDate') ?? ''),
    dueDate: optionalString(formData.get('dueDate')),
    netAmount: String(formData.get('netAmount') ?? ''),
    vatAmount: String(formData.get('vatAmount') ?? ''),
    grossAmount: String(formData.get('grossAmount') ?? ''),
    currency: optionalString(formData.get('currency')) ?? 'PLN',
    paymentAccount: optionalString(formData.get('paymentAccount')),
    categoryId: optionalString(formData.get('categoryId')),
  }

  try {
    const document = await uploadDocument(
      {
        filename: fileValue.name,
        mimeType: fileValue.type || 'application/octet-stream',
        content,
      },
      metadata,
    )
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
