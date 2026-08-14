'use server'

import { DocumentError } from './errors'
import { getDocumentPreview } from './get-document-preview'

export async function loadDocumentPreviewAction(id: string) {
  try {
    const preview = await getDocumentPreview(id)
    return { ok: true as const, preview }
  } catch (error) {
    if (error instanceof DocumentError) {
      return { ok: false as const, error: error.message }
    }
    throw error
  }
}
