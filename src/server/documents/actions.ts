'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { acceptDocuments } from '@/server/documents/accept-documents'
import { createDocument } from '@/server/documents/create-document'
import { deleteDocument } from '@/server/documents/delete-document'
import { DocumentError } from '@/server/documents/errors'
import { updateDocument } from '@/server/documents/update-document'
import { uploadDocument } from '@/server/documents/upload-document'
import {
  acceptDocumentsBodySchema,
  createDocumentBodySchema,
  updateDocumentBodySchema,
} from '@/server/documents/schemas'

function formString(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}

function optionalFormString(formData: FormData, key: string) {
  const value = formString(formData, key).trim()
  return value === '' ? undefined : value
}

function redirectWithError(path: string, error: unknown): never {
  const message =
    error instanceof DocumentError
      ? error.message
      : error instanceof Error
        ? error.message
        : 'Nieoczekiwany błąd'
  redirect(`${path}?error=${encodeURIComponent(message)}`)
}

export async function createDocumentAction(formData: FormData) {
  const raw = {
    number: formString(formData, 'number'),
    typeId: formString(formData, 'typeId'),
    contractor: {
      name: formString(formData, 'contractorName'),
      nip: optionalFormString(formData, 'contractorNip'),
    },
    issueDate: formString(formData, 'issueDate'),
    dueDate: optionalFormString(formData, 'dueDate'),
    netAmount: formString(formData, 'netAmount'),
    vatAmount: formString(formData, 'vatAmount'),
    grossAmount: formString(formData, 'grossAmount'),
    currency: optionalFormString(formData, 'currency') ?? 'PLN',
    paymentAccount: optionalFormString(formData, 'paymentAccount'),
  }

  const parsed = createDocumentBodySchema.safeParse(raw)
  if (!parsed.success) {
    redirectWithError('/documents/new', parsed.error.issues[0]?.message ?? 'Nieprawidłowe dane')
  }

  try {
    const document = await createDocument(parsed.data)
    revalidatePath('/documents')
    revalidatePath('/buffer')
    redirect(`/documents/${document.id}`)
  } catch (error) {
    redirectWithError('/documents/new', error)
  }
}

export async function updateDocumentAction(formData: FormData) {
  const id = formString(formData, 'id')
  const raw = {
    number: optionalFormString(formData, 'number'),
    typeId: optionalFormString(formData, 'typeId'),
    contractorId: optionalFormString(formData, 'contractorId'),
    issueDate: optionalFormString(formData, 'issueDate'),
    dueDate: optionalFormString(formData, 'dueDate'),
    netAmount: optionalFormString(formData, 'netAmount'),
    vatAmount: optionalFormString(formData, 'vatAmount'),
    grossAmount: optionalFormString(formData, 'grossAmount'),
    currency: optionalFormString(formData, 'currency'),
    paymentAccount: optionalFormString(formData, 'paymentAccount'),
  }

  const parsed = updateDocumentBodySchema.safeParse(raw)
  if (!parsed.success) {
    redirectWithError(
      `/documents/${id}`,
      parsed.error.issues[0]?.message ?? 'Nieprawidłowe dane',
    )
  }

  try {
    await updateDocument(id, parsed.data)
    revalidatePath('/documents')
    revalidatePath('/buffer')
    revalidatePath(`/documents/${id}`)
    redirect(`/documents/${id}?saved=1`)
  } catch (error) {
    redirectWithError(`/documents/${id}`, error)
  }
}

export async function deleteDocumentAction(formData: FormData) {
  const id = formString(formData, 'id')

  try {
    await deleteDocument(id)
    revalidatePath('/documents')
    revalidatePath('/buffer')
    redirect('/documents')
  } catch (error) {
    redirectWithError(`/documents/${id}`, error)
  }
}

export async function acceptDocumentsAction(formData: FormData) {
  const ids = formData
    .getAll('ids')
    .filter((value): value is string => typeof value === 'string' && value.trim() !== '')

  const parsed = acceptDocumentsBodySchema.safeParse({ ids })
  if (!parsed.success) {
    redirectWithError('/buffer', parsed.error.issues[0]?.message ?? 'Nieprawidłowe dane')
  }

  try {
    await acceptDocuments(parsed.data)
    revalidatePath('/documents')
    revalidatePath('/buffer')
    redirect('/buffer?accepted=1')
  } catch (error) {
    redirectWithError('/buffer', error)
  }
}

export async function uploadDocumentAction(formData: FormData) {
  const fileValue = formData.get('file')
  if (!(fileValue instanceof File) || fileValue.size === 0) {
    redirectWithError('/documents/upload', 'Wybierz plik PDF lub XML')
  }

  const content = Buffer.from(await fileValue.arrayBuffer())
  const metadata = {
    number: formString(formData, 'number'),
    typeId: formString(formData, 'typeId'),
    contractor: {
      name: formString(formData, 'contractorName'),
      nip: optionalFormString(formData, 'contractorNip'),
    },
    issueDate: formString(formData, 'issueDate'),
    dueDate: optionalFormString(formData, 'dueDate'),
    netAmount: formString(formData, 'netAmount'),
    vatAmount: formString(formData, 'vatAmount'),
    grossAmount: formString(formData, 'grossAmount'),
    currency: optionalFormString(formData, 'currency') ?? 'PLN',
    paymentAccount: optionalFormString(formData, 'paymentAccount'),
    categoryId: optionalFormString(formData, 'categoryId'),
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
    revalidatePath('/documents')
    revalidatePath('/buffer')
    redirect(`/buffer?uploaded=${encodeURIComponent(document.id)}`)
  } catch (error) {
    redirectWithError('/documents/upload', error)
  }
}
