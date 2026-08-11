import Link from 'next/link'

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
  const items = parsed.success ? await listDocuments(parsed.data) : []

  return (
    <main style={{ padding: '1rem' }}>
      <h1>Rejestr dokumentów</h1>
      <p>
        <Link href="/documents/new">Dodaj dokument</Link>
      </p>

      {!parsed.success && (
        <p style={{ color: 'crimson' }}>
          Nieprawidłowe filtry: {parsed.error.issues[0]?.message}
        </p>
      )}

      <form method="get" style={{ display: 'grid', gap: '0.5rem', maxWidth: 480, marginBottom: '1rem' }}>
        <label>
          Typ{' '}
          <select name="typeId" defaultValue={first(params.typeId) ?? ''}>
            <option value="">Wszystkie</option>
            {types.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Data wystawienia od{' '}
          <input type="date" name="issueDateFrom" defaultValue={first(params.issueDateFrom) ?? ''} />
        </label>
        <label>
          Data wystawienia do{' '}
          <input type="date" name="issueDateTo" defaultValue={first(params.issueDateTo) ?? ''} />
        </label>
        <label>
          Sortuj po{' '}
          <select name="sortBy" defaultValue={first(params.sortBy) ?? 'issueDate'}>
            <option value="issueDate">Data wystawienia</option>
            <option value="dueDate">Termin płatności</option>
          </select>
        </label>
        <label>
          Kierunek{' '}
          <select name="sortOrder" defaultValue={first(params.sortOrder) ?? 'desc'}>
            <option value="desc">Malejąco</option>
            <option value="asc">Rosnąco</option>
          </select>
        </label>
        <button type="submit">Filtruj</button>
      </form>

      <table border={1} cellPadding={6} style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th>Numer</th>
            <th>Typ</th>
            <th>Kontrahent</th>
            <th>Data</th>
            <th>Brutto</th>
            <th>Źródło</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={7}>Brak dokumentów w rejestrze</td>
            </tr>
          ) : (
            items.map((document) => (
              <tr key={document.id}>
                <td>{document.number}</td>
                <td>{document.type.name}</td>
                <td>{document.contractor.name}</td>
                <td>{document.issueDate}</td>
                <td>
                  {document.grossAmount} {document.currency}
                </td>
                <td>{document.source}</td>
                <td>
                  <Link href={`/documents/${document.id}`}>Szczegóły</Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </main>
  )
}
