'use server'

import { revalidatePath } from 'next/cache'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { redirect } from 'next/navigation'

import { createDocumentType } from '@/server/document-types/create-document-type'
import { deleteDocumentType } from '@/server/document-types/delete-document-type'
import { DocumentTypeError } from '@/server/document-types/errors'
import {
  createDocumentTypeBodySchema,
  updateDocumentTypeBodySchema,
} from '@/server/document-types/schemas'
import { updateDocumentType } from '@/server/document-types/update-document-type'

function formString(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}

function optionalFormString(formData: FormData, key: string) {
  const value = formString(formData, key).trim()
  return value === '' ? undefined : value
}

function redirectWithError(error: unknown): never {
  if (isRedirectError(error)) throw error

  const message =
    error instanceof DocumentTypeError
      ? error.message
      : typeof error === 'string'
        ? error
        : error instanceof Error
          ? error.message
          : 'Nieoczekiwany błąd'
  redirect(`/document-types?error=${encodeURIComponent(message)}`)
}

function revalidateDocumentTypePaths() {
  revalidatePath('/document-types')
  revalidatePath('/documents')
  revalidatePath('/documents/new')
  revalidatePath('/documents/upload')
  revalidatePath('/buffer')
}

export async function createDocumentTypeAction(formData: FormData) {
  const parsed = createDocumentTypeBodySchema.safeParse({
    name: formString(formData, 'name'),
    direction: formString(formData, 'direction'),
  })
  if (!parsed.success) {
    redirectWithError(parsed.error.issues[0]?.message ?? 'Nieprawidłowe dane')
  }

  try {
    await createDocumentType(parsed.data)
    revalidateDocumentTypePaths()
    redirect('/document-types?created=1')
  } catch (error) {
    redirectWithError(error)
  }
}

export async function updateDocumentTypeAction(formData: FormData) {
  const id = formString(formData, 'id')
  const parsed = updateDocumentTypeBodySchema.safeParse({
    name: optionalFormString(formData, 'name'),
    direction: optionalFormString(formData, 'direction'),
  })
  if (!parsed.success) {
    redirectWithError(parsed.error.issues[0]?.message ?? 'Nieprawidłowe dane')
  }

  try {
    await updateDocumentType(id, parsed.data)
    revalidateDocumentTypePaths()
    redirect('/document-types?saved=1')
  } catch (error) {
    redirectWithError(error)
  }
}

export async function deleteDocumentTypeAction(formData: FormData) {
  const id = formString(formData, 'id')

  try {
    await deleteDocumentType(id)
    revalidateDocumentTypePaths()
    redirect('/document-types?deleted=1')
  } catch (error) {
    redirectWithError(error)
  }
}
