import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ConfirmDelete } from '@/components/confirm-delete'
import {
  Alert,
  Card,
  EnumBadge,
  Field,
  PageShell,
  buttonClassName,
  buttonSecondaryClassName,
  controlClassName,
} from '@/components/ui-kit'
import { DOCUMENT_SOURCE, DOCUMENT_STAGE } from '@/lib/labels'
import { listCategoryOptions } from '@/server/categories/list-categories'
import { listDocumentTypes } from '@/server/document-types/list-document-types'
import {
  assignDocumentCategoryAction,
  deleteDocumentAction,
  updateDocumentAction,
} from '@/server/documents/actions'
import { DocumentError } from '@/server/documents/errors'
import { getDocumentById } from '@/server/documents/get-document'
import { MUTABLE_DOCUMENT_SOURCES } from '@/server/documents/policy'

type SearchParams = Promise<Record<string, string | string[] | undefined>>
type RouteParams = Promise<{ id: string }>

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function DocumentDetailPage({
  params,
  searchParams,
}: {
  params: RouteParams
  searchParams: SearchParams
}) {
  const { id } = await params
  const query = await searchParams
  const error = first(query.error)
  const saved = first(query.saved)

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
    >
      <p className="flex flex-wrap gap-3">
        <Link href={backHref} className={buttonSecondaryClassName}>
          ← Wróć
        </Link>
        <Link href={`/documents/${document.id}/preview`} className={buttonSecondaryClassName}>
          Podgląd dokumentu
        </Link>
      </p>

      {error && <Alert>{error}</Alert>}
      {saved && <Alert tone="ok">Zapisano.</Alert>}

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
          <form action={updateDocumentAction} className="grid gap-3">
            <input type="hidden" name="id" value={document.id} />
            <input type="hidden" name="contractorId" value={document.contractor.id} />
            <Field label="Numer">
              <input name="number" defaultValue={document.number} required className={controlClassName} />
            </Field>
            <Field label="Typ">
              <select name="typeId" defaultValue={document.type.id} required className={controlClassName}>
                {types.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>
            </Field>
            <p className="text-sm text-muted-foreground">
              Kontrahent: {document.contractor.name}
              {document.contractor.nip ? ` (${document.contractor.nip})` : ''}
            </p>
            <Field label="Kategoria">
              <select name="categoryId" defaultValue={document.category?.id ?? ''} className={controlClassName}>
                <option value="">— brak —</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Data wystawienia">
              <input
                type="date"
                name="issueDate"
                defaultValue={document.issueDate}
                required
                className={controlClassName}
              />
            </Field>
            <Field label="Termin płatności">
              <input
                type="date"
                name="dueDate"
                defaultValue={document.dueDate ?? ''}
                className={controlClassName}
              />
            </Field>
            <Field label="Netto">
              <input name="netAmount" defaultValue={document.netAmount} required className={controlClassName} />
            </Field>
            <Field label="VAT">
              <input name="vatAmount" defaultValue={document.vatAmount} required className={controlClassName} />
            </Field>
            <Field label="Brutto">
              <input
                name="grossAmount"
                defaultValue={document.grossAmount}
                required
                className={controlClassName}
              />
            </Field>
            <Field label="Waluta">
              <input name="currency" defaultValue={document.currency} className={controlClassName} />
            </Field>
            <button type="submit" className={buttonClassName}>
              Zapisz zmiany
            </button>
          </form>
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
