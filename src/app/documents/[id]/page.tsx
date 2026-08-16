import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ConfirmDelete } from '@/components/confirm-delete'
import { EditDocumentForm } from '@/components/edit-document-form'
import { PageShell } from '@/components/page-shell'
import {
  Card,
  EnumBadge,
  buttonClassName,
  buttonSecondaryClassName,
  controlClassName,
} from '@/components/ui-kit'
import { DOCUMENT_SOURCE, DOCUMENT_STAGE } from '@/lib/labels'
import { listCategoryOptions } from '@/server/categories/list-categories'
import { listDocumentTypes } from '@/server/document-types/list-document-types'
import { assignDocumentCategoryAction, deleteDocumentAction } from '@/server/documents/actions'
import { DocumentError } from '@/server/documents/errors'
import { getDocumentById } from '@/server/documents/get-document'
import { MUTABLE_DOCUMENT_SOURCES } from '@/server/documents/policy'

type RouteParams = Promise<{ id: string }>

export async function generateMetadata({ params }: { params: RouteParams }): Promise<Metadata> {
  const { id } = await params
  try {
    const document = await getDocumentById(id)
    return { title: document.number }
  } catch {
    return { title: 'Dokument' }
  }
}

export default async function DocumentDetailPage({ params }: { params: RouteParams }) {
  const { id } = await params

  let document
  try {
    document = await getDocumentById(id)
  } catch (err) {
    if (err instanceof DocumentError && err.status === 404) notFound()
    throw err
  }

  const types = await listDocumentTypes()
  const categories = await listCategoryOptions()
  const editable = MUTABLE_DOCUMENT_SOURCES.has(document.source)
  const backHref = document.stage === 'BUFFER' ? '/buffer' : '/documents'

  return (
    <PageShell
      title={document.number}
      meta={
        <div className="flex flex-wrap gap-2 pt-1">
          <EnumBadge value={document.stage} labels={DOCUMENT_STAGE} />
          <EnumBadge value={document.source} labels={DOCUMENT_SOURCE} />
        </div>
      }
      actions={
        <>
          <Link href={backHref} className={buttonSecondaryClassName}>
            Wróć
          </Link>
          <Link href={`/documents/${document.id}/preview`} className={buttonClassName}>
            Podgląd
          </Link>
        </>
      }
    >

      {!editable ? (
        <Card className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            Dokument z KSeF — dane faktury tylko do odczytu; kategorię możesz zmienić.
          </p>
          <p>Typ: {document.type.name}</p>
          <p>
            Kontrahent: {document.contractor.name}
            {document.contractor.nip ? ` (${document.contractor.nip})` : ''}
          </p>
          <p>Data wystawienia: {document.issueDate}</p>
          <p>Termin: {document.dueDate ?? '—'}</p>
          <p>
            Netto / VAT / Brutto: {document.netAmount} / {document.vatAmount} / {document.grossAmount}{' '}
            {document.currency}
          </p>
          <p>Rachunek do zapłaty: {document.paymentAccount ?? '—'}</p>
          <p>Kategoria: {document.category?.name ?? '—'}</p>
          <form action={assignDocumentCategoryAction} className="flex flex-wrap gap-2 pt-2">
            <input type="hidden" name="id" value={document.id} />
            <select name="categoryId" defaultValue={document.category?.id ?? ''} className={controlClassName}>
              <option value="">— brak —</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
            <button type="submit" className={buttonClassName}>
              Zapisz kategorię
            </button>
          </form>
        </Card>
      ) : (
        <>
          <Card>
            <EditDocumentForm document={document} types={types} categories={categories} />
          </Card>

          <ConfirmDelete
            action={deleteDocumentAction}
            fields={{ id: document.id }}
            label="Usuń dokument"
            title={`Usunąć dokument ${document.number}?`}
            description="Zniknie z bufora albo rejestru. Tej operacji nie da się cofnąć."
          />
        </>
      )}
    </PageShell>
  )
}
