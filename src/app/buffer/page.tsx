import Link from 'next/link'

import { acceptDocumentsAction } from '@/server/documents/actions'
import { listDocuments } from '@/server/documents/list-documents'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function BufferPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const error = first(params.error)
  const accepted = first(params.accepted)
  const uploaded = first(params.uploaded)
  const items = await listDocuments({
    stage: 'BUFFER',
    sortBy: 'issueDate',
    sortOrder: 'desc',
  })

  return (
    <main style={{ padding: '1rem' }}>
      <h1>Bufor</h1>
      <p>Dokumenty oczekujące na akceptację przed przeniesieniem do rejestru.</p>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      {accepted && <p>Zaakceptowano wybrane dokumenty.</p>}
      {uploaded && <p>Wgrano dokument do bufora.</p>}

      {items.length === 0 ? (
        <p>Bufor jest pusty.</p>
      ) : (
        <form action={acceptDocumentsAction}>
          <table border={1} cellPadding={6} style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th></th>
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
              {items.map((document) => (
                <tr key={document.id}>
                  <td>
                    <input type="checkbox" name="ids" value={document.id} />
                  </td>
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
              ))}
            </tbody>
          </table>
          <p style={{ marginTop: '1rem' }}>
            <button type="submit">Akceptuj zaznaczone</button>
          </p>
        </form>
      )}
    </main>
  )
}
