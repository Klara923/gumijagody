import Link from 'next/link'

import {
  Alert,
  PageShell,
  buttonClassName,
  tableClassName,
  tdClassName,
  thClassName,
} from '@/components/ui-kit'
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
    <PageShell
      wide
      title="Bufor"
      description="Dokumenty oczekujące na akceptację przed przeniesieniem do rejestru."
    >
      {error && <Alert>{error}</Alert>}
      {accepted && <Alert tone="ok">Zaakceptowano wybrane dokumenty.</Alert>}
      {uploaded && <Alert tone="ok">Wgrano dokument do bufora.</Alert>}

      {items.length === 0 ? (
        <p className="text-sm text-zinc-600">Bufor jest pusty.</p>
      ) : (
        <form action={acceptDocumentsAction} className="space-y-4">
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
            <table className={tableClassName}>
              <thead>
                <tr>
                  <th className={thClassName}></th>
                  <th className={thClassName}>Numer</th>
                  <th className={thClassName}>Typ</th>
                  <th className={thClassName}>Kontrahent</th>
                  <th className={thClassName}>Data</th>
                  <th className={thClassName}>Brutto</th>
                  <th className={thClassName}>Źródło</th>
                  <th className={thClassName}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((document) => (
                  <tr key={document.id}>
                    <td className={tdClassName}>
                      <input type="checkbox" name="ids" value={document.id} />
                    </td>
                    <td className={tdClassName}>{document.number}</td>
                    <td className={tdClassName}>{document.type.name}</td>
                    <td className={tdClassName}>{document.contractor.name}</td>
                    <td className={tdClassName}>{document.issueDate}</td>
                    <td className={tdClassName}>
                      {document.grossAmount} {document.currency}
                    </td>
                    <td className={tdClassName}>{document.source}</td>
                    <td className={tdClassName}>
                      <Link href={`/documents/${document.id}`} className="underline">
                        Szczegóły
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="submit" className={buttonClassName}>
            Akceptuj zaznaczone
          </button>
        </form>
      )}
    </PageShell>
  )
}
