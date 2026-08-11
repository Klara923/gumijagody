import { uploadDocumentAction } from '@/server/documents/actions'
import { getPrisma } from '@/server/infrastructure/db/prisma'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function UploadDocumentPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const error = first(params.error)
  const types = await getPrisma().documentType.findMany({ orderBy: { name: 'asc' } })

  return (
    <main style={{ padding: '1rem', maxWidth: 640 }}>
      <h1>Upload PDF / XML</h1>
      <p>
        XML FA(2)/FA(3) trafia do bufora z danymi wyciągniętymi z pliku. PDF wymaga ręcznego
        uzupełnienia pól poniżej.
      </p>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      <form action={uploadDocumentAction} style={{ display: 'grid', gap: '0.75rem' }}>
        <label>
          Plik (PDF lub XML)
          <input
            type="file"
            name="file"
            accept=".pdf,.xml,application/pdf,application/xml,text/xml"
            required
            style={{ display: 'block', width: '100%' }}
          />
        </label>

        <fieldset style={{ border: '1px solid #ccc', padding: '0.75rem' }}>
          <legend>Metadane (wymagane dla PDF)</legend>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <label>
              Numer
              <input name="number" style={{ display: 'block', width: '100%' }} />
            </label>
            <label>
              Typ
              <select name="typeId" style={{ display: 'block', width: '100%' }}>
                <option value="">Wybierz…</option>
                {types.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Kontrahent — nazwa
              <input name="contractorName" style={{ display: 'block', width: '100%' }} />
            </label>
            <label>
              Kontrahent — NIP
              <input name="contractorNip" style={{ display: 'block', width: '100%' }} />
            </label>
            <label>
              Data wystawienia
              <input type="date" name="issueDate" style={{ display: 'block', width: '100%' }} />
            </label>
            <label>
              Termin płatności
              <input type="date" name="dueDate" style={{ display: 'block', width: '100%' }} />
            </label>
            <label>
              Netto
              <input name="netAmount" placeholder="100.00" style={{ display: 'block', width: '100%' }} />
            </label>
            <label>
              VAT
              <input name="vatAmount" placeholder="23.00" style={{ display: 'block', width: '100%' }} />
            </label>
            <label>
              Brutto
              <input
                name="grossAmount"
                placeholder="123.00"
                style={{ display: 'block', width: '100%' }}
              />
            </label>
            <label>
              Waluta
              <input name="currency" defaultValue="PLN" style={{ display: 'block', width: '100%' }} />
            </label>
          </div>
        </fieldset>

        <button type="submit">Wgraj do bufora</button>
      </form>
    </main>
  )
}
