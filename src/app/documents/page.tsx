import Link from 'next/link'

import { RegisterColumnsTable } from '@/components/register-columns-table'
import { Card, Field, PageShell, buttonClassName, buttonSecondaryClassName, controlClassName } from '@/components/ui-kit'
import { first } from '@/lib/search-params'
import { listCategoryOptions } from '@/server/categories/list-categories'
import { listContractors } from '@/server/contractors/list-contractors'
import { listDocumentTypes } from '@/server/document-types/list-document-types'
import { listDocuments } from '@/server/documents/list-documents'
import { listDocumentsQuerySchema } from '@/server/documents/schemas'
import { getRegisterVisibleColumns } from '@/server/table-preferences/get-table-preference'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

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

  const types = await listDocumentTypes()
  const categories = await listCategoryOptions()
  const contractors = await listContractors()
  const items = parsed.success ? await listDocuments(parsed.data) : []
  const visibleColumns = await getRegisterVisibleColumns()
  const hasFilters = Boolean(
    first(params.typeId) ||
      first(params.contractorId) ||
      first(params.categoryId) ||
      first(params.issueDateFrom) ||
      first(params.issueDateTo) ||
      first(params.dueDateFrom) ||
      first(params.dueDateTo),
  )

  return (
    <PageShell
      title="Rejestr dokumentów"
      description="Zaakceptowane dokumenty. Filtruj, pokaż lub ukryj kolumny i otwieraj szczegóły."
      flash={parsed.success ? null : { message: parsed.error.issues[0]?.message ?? 'Nieprawidłowe filtry' }}
      actions={
        <Link href="/documents/new" className={buttonClassName}>
          Dodaj dokument
        </Link>
      }
    >
      <Card>
        <form method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Typ">
            <select name="typeId" defaultValue={first(params.typeId) ?? ''} className={controlClassName}>
              <option value="">Wszystkie</option>
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
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
          <Field label="Sortuj po">
            <select name="sortBy" defaultValue={first(params.sortBy) ?? 'issueDate'} className={controlClassName}>
              <option value="issueDate">Data wystawienia</option>
              <option value="dueDate">Termin płatności</option>
            </select>
          </Field>
          <Field label="Wystawienie od">
            <input
              type="date"
              name="issueDateFrom"
              defaultValue={first(params.issueDateFrom) ?? ''}
              className={controlClassName}
            />
          </Field>
          <Field label="Wystawienie do">
            <input
              type="date"
              name="issueDateTo"
              defaultValue={first(params.issueDateTo) ?? ''}
              className={controlClassName}
            />
          </Field>
          <Field label="Termin od">
            <input
              type="date"
              name="dueDateFrom"
              defaultValue={first(params.dueDateFrom) ?? ''}
              className={controlClassName}
            />
          </Field>
          <Field label="Termin do">
            <input
              type="date"
              name="dueDateTo"
              defaultValue={first(params.dueDateTo) ?? ''}
              className={controlClassName}
            />
          </Field>
          <Field label="Kierunek">
            <select name="sortOrder" defaultValue={first(params.sortOrder) ?? 'desc'} className={controlClassName}>
              <option value="desc">Malejąco</option>
              <option value="asc">Rosnąco</option>
            </select>
          </Field>
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
            <button type="submit" className={buttonClassName}>
              Filtruj
            </button>
            {hasFilters ? (
              <Link href="/documents" className={buttonSecondaryClassName}>
                Wyczyść
              </Link>
            ) : null}
          </div>
        </form>
      </Card>

      <RegisterColumnsTable documents={items} initialVisibleColumns={visibleColumns} />
    </PageShell>
  )
}
