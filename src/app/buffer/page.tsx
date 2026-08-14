import Link from 'next/link'

import { PreviewButton } from '@/components/document-preview-drawer'
import { ListPagination } from '@/components/list-pagination'
import { SelectAllCheckbox } from '@/components/select-all-checkbox'
import {
  Card,
  EmptyState,
  EnumBadge,
  PageShell,
  buttonClassName,
  buttonSecondaryClassName,
  tableClassName,
  tdClassName,
  textLinkClassName,
  thClassName,
  trClassName,
} from '@/components/ui-kit'
import { DOCUMENT_SOURCE } from '@/lib/labels'
import { first } from '@/lib/search-params'
import { acceptDocumentsAction } from '@/server/documents/actions'
import { listDocuments } from '@/server/documents/list-documents'
import { listDocumentsQuerySchema } from '@/server/documents/schemas'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default async function BufferPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const error = first(params.error)
  const accepted = first(params.accepted)
  const uploaded = first(params.uploaded)
  const parsed = listDocumentsQuerySchema.safeParse({
    stage: 'BUFFER',
    sortBy: 'issueDate',
    sortOrder: 'desc',
    page: first(params.page),
  })
  const listed = await listDocuments(
    parsed.success
      ? parsed.data
      : { stage: 'BUFFER', sortBy: 'issueDate', sortOrder: 'desc', page: 1 },
  )
  const items = listed.items

  const flash = error
    ? { tone: 'error' as const, message: error }
    : accepted
      ? { tone: 'ok' as const, message: 'Zaakceptowano wybrane dokumenty.' }
      : uploaded
        ? { tone: 'ok' as const, message: 'Wgrano dokument do bufora.' }
        : null

  return (
    <PageShell
      title="Bufor"
      description="Dokumenty oczekujące na akceptację przed przeniesieniem do rejestru."
      flash={flash}
      actions={
        <>
          <Link href="/documents/upload" className={buttonSecondaryClassName}>
            Wgraj
          </Link>
          <Link href="/ksef/import" className={buttonClassName}>
            Pobierz z KSeF
          </Link>
        </>
      }
    >
      {items.length === 0 && listed.page <= 1 ? (
        <EmptyState
          title="Bufor jest pusty"
          description="Wgraj PDF albo XML, albo pobierz faktury z KSeF. Po akceptacji trafią do rejestru."
        >
          <div className="flex flex-wrap gap-2">
            <Link href="/documents/upload" className={buttonClassName}>
              Wgraj PDF / XML
            </Link>
            <Link href="/ksef/import" className={buttonSecondaryClassName}>
              Pobierz z KSeF
            </Link>
          </div>
        </EmptyState>
      ) : (
        <div className="space-y-4">
          <form action={acceptDocumentsAction} className="space-y-4">
            <Card className="overflow-x-auto p-0">
              <table className={tableClassName}>
                <thead>
                  <tr>
                    <th className={`${thClassName} w-10`}>
                      <SelectAllCheckbox />
                    </th>
                    <th className={thClassName}>Numer</th>
                    <th className={thClassName}>Typ</th>
                    <th className={thClassName}>Kontrahent</th>
                    <th className={thClassName}>Kategoria</th>
                    <th className={thClassName}>Data</th>
                    <th className={thClassName}>Brutto</th>
                    <th className={thClassName}>Źródło</th>
                    <th className={`${thClassName} w-36`}>Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((document) => (
                    <tr key={document.id} className={trClassName}>
                      <td className={tdClassName}>
                        <input type="checkbox" name="ids" value={document.id} />
                      </td>
                      <td className={`${tdClassName} truncate`}>{document.number}</td>
                      <td className={`${tdClassName} truncate`}>{document.type.name}</td>
                      <td className={`${tdClassName} truncate`}>{document.contractor.name}</td>
                      <td className={`${tdClassName} truncate`}>{document.category?.name ?? '—'}</td>
                      <td className={tdClassName}>{document.issueDate}</td>
                      <td className={`${tdClassName} tabular-nums`}>
                        {document.grossAmount} {document.currency}
                      </td>
                      <td className={tdClassName}>
                        <EnumBadge value={document.source} labels={DOCUMENT_SOURCE} />
                      </td>
                      <td className={`${tdClassName} space-x-3 whitespace-nowrap`}>
                        <PreviewButton documentId={document.id} />
                        <Link href={`/documents/${document.id}`} className={textLinkClassName}>
                          Szczegóły
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
            <button type="submit" className={buttonClassName}>
              Akceptuj zaznaczone
            </button>
          </form>
          <ListPagination
            pathname="/buffer"
            searchParams={params}
            page={listed.page}
            pageSize={listed.pageSize}
            hasMore={listed.hasMore}
          />
        </div>
      )}
    </PageShell>
  )
}
