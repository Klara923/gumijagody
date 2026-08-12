import Link from 'next/link'
import { notFound } from 'next/navigation'

import {
  Alert,
  Field,
  PageShell,
  buttonClassName,
  buttonSecondaryClassName,
  controlClassName,
} from '@/components/ui-kit'
import { listCategoryOptions } from '@/server/categories/list-categories'
import {
  assignDocumentCategoryAction,
  deleteDocumentAction,
  updateDocumentAction,
} from '@/server/documents/actions'
import { DocumentError } from '@/server/documents/errors'
import { getDocumentById } from '@/server/documents/get-document'
import { getPrisma } from '@/server/infrastructure/db/prisma'

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

  const types = await getPrisma().documentType.findMany({ orderBy: { name: 'asc' } })
  const categories = await listCategoryOptions()
  const editable = document.source === 'MANUAL' || document.source === 'UPLOAD'
  const backHref = document.stage === 'BUFFER' ? '/buffer' : '/documents'

  return (
    <PageShell title={document.number} description={`Stage: ${document.stage} · Źródło: ${document.source}`}>
      <p>
        <Link href={backHref} className="text-sm text-zinc-600 underline">
          ← Wróć
        </Link>
      </p>

      {error && <Alert>{error}</Alert>}
      {saved && <Alert tone="ok">Zapisano.</Alert>}

      {!editable ? (
        <div className="space-y-2 rounded-lg border border-zinc-200 bg-white p-4 text-sm">
          <p className="text-zinc-600">Dokument z KSeF — dane faktury tylko do odczytu; kategorię możesz zmienić.</p>
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
        </div>
      ) : (
        <>
          <form action={updateDocumentAction} className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4">
            <input type="hidden" name="id" value={document.id} />
            <input type="hidden" name="contractorId" value={document.contractor.id} />
            <Field label="Numer">
              <input name="number" defaultValue={document.number} required className={controlClassName} />
            </Field>
            <Field label="Typ">
              <select name="typeId" defaultValue={document.type.id} required className={controlClassName}>
                {types.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </Field>
            <p className="text-sm text-zinc-600">
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

          <form action={deleteDocumentAction}>
            <input type="hidden" name="id" value={document.id} />
            <button type="submit" className={buttonSecondaryClassName}>
              Usuń dokument
            </button>
          </form>
        </>
      )}
    </PageShell>
  )
}
