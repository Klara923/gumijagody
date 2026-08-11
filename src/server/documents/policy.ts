import { DocumentError } from './errors'

export const MUTABLE_DOCUMENT_SOURCES = new Set(['MANUAL', 'UPLOAD'])

export function assertDocumentMutable(source: string, action: 'edytować' | 'usunąć') {
  if (!MUTABLE_DOCUMENT_SOURCES.has(source)) {
    throw new DocumentError(
      `Dokumentów pobranych z KSeF nie wolno ${action} — dane pochodzą ze źródła zewnętrznego`,
      400,
    )
  }
}
