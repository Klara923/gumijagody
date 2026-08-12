import Link from 'next/link'

import {
  Alert,
  Field,
  PageShell,
  buttonClassName,
  controlClassName,
  tableClassName,
  tdClassName,
  thClassName,
} from '@/components/ui-kit'
import { listCategoryOptions } from '@/server/categories/list-categories'
import { listContractors } from '@/server/contractors/list-contractors'
import { listDocuments } from '@/server/documents/list-documents'
import { listDocumentsQuerySchema } from '@/server/documents/schemas'
import { getPrisma } from '@/server/infrastructure/db/prisma'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function DocumentsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const parsed = listDocumentsQuerySchema.safeParse({
    stage: 'ACCEPTED',
    sortBy: first(params.sortBy),
    sortOrder: first(params.sortOrder),
    typeId: first(params.typeId),
    contractorId: first(params.contractorId),
    categoryId: first(params.categoryId),
    issueDateFrom: first(params.issueDateFrom),
    issueDateTo: first(params.issueDateTo),
    dueDateFrom: first(params.dueDateFrom),
    dueDateTo: first(params.dueDateTo),
  })

  const types = await getPrisma().documentType.findMany({ orderBy: { name: 'asc' } })
  const categories = await listCategoryOptions()
  const contractors = await listContractors()
  const items = parsed.success ? await listDocuments(parsed.data) : []

  return (
    <PageShell
      wide
      title="Rejestr dokumentów"
      description="Zaakceptowane dokumenty. Filtruj i otwieraj szczegóły."
    >
      <p>
        <Link href="/documents/new" className={buttonClassName}>
          Dodaj dokument
        </Link>
      </p>

      {!parsed.success && <Alert>{parsed.error.issues[0]?.message}</Alert>}

      <form method="get" className="grid max-w-xl gap-3 rounded-lg border border-zinc-200 bg-white p-4">
        <Field label="Typ">
          <select name="typeId" defaultValue={first(params.typeId) ?? ''} className={controlClassName}>
            <option value="">Wszystkie</option>
            {types.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Kontrahent">
          <select
            name="contractorId"
            defaultValue={first(params.contractorId) ?? ''}
            className={controlClassName}
          >
            <option value="">Wszystkie</option>
            {contractors.map((contractor) => (
              <option key={contractor.id} value={contractor.id}>
                {contractor.name}
                {contractor.nip ? ` (${contractor.nip})` : ''}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Kategoria">
          <select
            name="categoryId"
            defaultValue={first(params.categoryId) ?? ''}
            className={controlClassName}
          >
            <option value="">Wszystkie</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Data wystawienia od">
            <input
              type="date"
              name="issueDateFrom"
              defaultValue={first(params.issueDateFrom) ?? ''}
              className={controlClassName}
            />
          </Field>
          <Field label="Data wystawienia do">
            <input
              type="date"
              name="issueDateTo"
              defaultValue={first(params.issueDateTo) ?? ''}
              className={controlClassName}
            />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Termin płatności od">
            <input
              type="date"
              name="dueDateFrom"
              defaultValue={first(params.dueDateFrom) ?? ''}
              className={controlClassName}
            />
          </Field>
          <Field label="Termin płatności do">
            <input
              type="date"
              name="dueDateTo"
              defaultValue={first(params.dueDateTo) ?? ''}
              className={controlClassName}
            />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Sortuj po">
            <select name="sortBy" defaultValue={first(params.sortBy) ?? 'issueDate'} className={controlClassName}>
              <option value="issueDate">Data wystawienia</option>
              <option value="dueDate">Termin płatności</option>
            </select>
          </Field>
          <Field label="Kierunek">
            <select name="sortOrder" defaultValue={first(params.sortOrder) ?? 'desc'} className={controlClassName}>
              <option value="desc">Malejąco</option>
              <option value="asc">Rosnąco</option>
            </select>
          </Field>
        </div>
        <button type="submit" className={buttonClassName}>
          Filtruj
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className={tableClassName}>
          <thead>
            <tr>
              <th className={thClassName}>Numer</th>
              <th className={thClassName}>Typ</th>
              <th className={thClassName}>Kontrahent</th>
              <th className={thClassName}>Kategoria</th>
              <th className={thClassName}>Data</th>
              <th className={thClassName}>Brutto</th>
              <th className={thClassName}>Źródło</th>
              <th className={thClassName}></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td className={tdClassName} colSpan={8}>
                  Brak dokumentów w rejestrze
                </td>
              </tr>
            ) : (
              items.map((document) => (
                <tr key={document.id}>
                  <td className={tdClassName}>{document.number}</td>
                  <td className={tdClassName}>{document.type.name}</td>
                  <td className={tdClassName}>{document.contractor.name}</td>
                  <td className={tdClassName}>{document.category?.name ?? '—'}</td>
                  <td className={tdClassName}>{document.issueDate}</td>
                  <td className={tdClassName}>
                    {document.grossAmount} {document.currency}
                  </td>
                  <td className={tdClassName}>{document.source}</td>
                  <td className={`${tdClassName} space-x-2 whitespace-nowrap`}>
                    <Link href={`/documents/${document.id}/preview`} className="underline">
                      Podgląd
                    </Link>
                    <Link href={`/documents/${document.id}`} className="underline">
                      Szczegóły
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  )
}
