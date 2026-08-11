import Link from 'next/link'
import { notFound } from 'next/navigation'

import { deleteDocumentAction, updateDocumentAction } from '@/server/documents/actions'
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
  const editable = document.source === 'MANUAL' || document.source === 'UPLOAD'

  return (
    <main style={{ padding: '1rem', maxWidth: 560 }}>
      <p>
        <Link href={document.stage === 'BUFFER' ? '/buffer' : '/documents'}>← Wróć</Link>
      </p>
      <h1>{document.number}</h1>
      <p>
        Stage: {document.stage} · Źródło: {document.source}
      </p>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      {saved && <p>Zapisano.</p>}

      {!editable ? (
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          <p>Dokument z KSeF — tylko podgląd (bez edycji i usuwania).</p>
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
        </div>
      ) : (
        <>
          <form action={updateDocumentAction} style={{ display: 'grid', gap: '0.75rem' }}>
            <input type="hidden" name="id" value={document.id} />
            <input type="hidden" name="contractorId" value={document.contractor.id} />
            <label>
              Numer
              <input
                name="number"
                defaultValue={document.number}
                required
                style={{ display: 'block', width: '100%' }}
              />
            </label>
            <label>
              Typ
              <select
                name="typeId"
                defaultValue={document.type.id}
                required
                style={{ display: 'block', width: '100%' }}
              >
                {types.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </label>
            <p>
              Kontrahent: {document.contractor.name}
              {document.contractor.nip ? ` (${document.contractor.nip})` : ''}
            </p>
            <label>
              Data wystawienia
              <input
                type="date"
                name="issueDate"
                defaultValue={document.issueDate}
                required
                style={{ display: 'block', width: '100%' }}
              />
            </label>
            <label>
              Termin płatności
              <input
                type="date"
                name="dueDate"
                defaultValue={document.dueDate ?? ''}
                style={{ display: 'block', width: '100%' }}
              />
            </label>
            <label>
              Netto
              <input
                name="netAmount"
                defaultValue={document.netAmount}
                required
                style={{ display: 'block', width: '100%' }}
              />
            </label>
            <label>
              VAT
              <input
                name="vatAmount"
                defaultValue={document.vatAmount}
                required
                style={{ display: 'block', width: '100%' }}
              />
            </label>
            <label>
              Brutto
              <input
                name="grossAmount"
                defaultValue={document.grossAmount}
                required
                style={{ display: 'block', width: '100%' }}
              />
            </label>
            <label>
              Waluta
              <input
                name="currency"
                defaultValue={document.currency}
                style={{ display: 'block', width: '100%' }}
              />
            </label>
            <button type="submit">Zapisz zmiany</button>
          </form>

          <form action={deleteDocumentAction} style={{ marginTop: '1.5rem' }}>
            <input type="hidden" name="id" value={document.id} />
            <button type="submit">Usuń dokument</button>
          </form>
        </>
      )}
    </main>
  )
}
