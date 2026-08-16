'use server'

import { revalidatePath } from 'next/cache'

import { createDocumentType } from '@/server/document-types/create-document-type'
import { deleteDocumentType } from '@/server/document-types/delete-document-type'
import {
  createDocumentTypeBodySchema,
  updateDocumentTypeBodySchema,
} from '@/server/document-types/schemas'
import { updateDocumentType } from '@/server/document-types/update-document-type'
import { formString, optionalFormString, redirectWithError } from '@/server/http/form'
import { redirectWithOk } from '@/server/http/flash'

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
    return await redirectWithError('/document-types', parsed.error.issues[0]?.message ?? 'Nieprawidłowe dane')
  }

  try {
    await createDocumentType(parsed.data)
    revalidateDocumentTypePaths()
    return await redirectWithOk('/document-types', 'Dodano typ.')
  } catch (error) {
    return await redirectWithError('/document-types', error)
  }
}

export async function updateDocumentTypeAction(formData: FormData) {
  const id = formString(formData, 'id')
  const parsed = updateDocumentTypeBodySchema.safeParse({
    name: optionalFormString(formData, 'name'),
    direction: optionalFormString(formData, 'direction'),
  })
  if (!parsed.success) {
    return await redirectWithError('/document-types', parsed.error.issues[0]?.message ?? 'Nieprawidłowe dane')
  }

  try {
    await updateDocumentType(id, parsed.data)
    revalidateDocumentTypePaths()
    return await redirectWithOk('/document-types', 'Zapisano typ.')
  } catch (error) {
    return await redirectWithError('/document-types', error)
  }
}

export async function deleteDocumentTypeAction(formData: FormData) {
  const id = formString(formData, 'id')

  try {
    await deleteDocumentType(id)
    revalidateDocumentTypePaths()
    return await redirectWithOk('/document-types', 'Usunięto typ.')
  } catch (error) {
    return await redirectWithError('/document-types', error)
  }
}
