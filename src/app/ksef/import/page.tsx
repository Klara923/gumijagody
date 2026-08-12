import { importFromKsefAction } from '@/server/documents/actions'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function daysAgoIso(days: number): string {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() - days)
  return date.toISOString().slice(0, 10)
}

export default async function KsefImportPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const error = first(params.error)
  const imported = first(params.imported)
  const duplicates = first(params.duplicates)
  const found = first(params.found)
  const importError = first(params.importError)

  return (
    <main style={{ padding: '1rem', maxWidth: 560 }}>
      <h1>Pobieranie z KSeF</h1>
      <p>
        Pobierz faktury kosztowe lub sprzedażowe z zakresu dat. Trafiają do bufora; duplikaty (ten
        sam numer KSeF) są pomijane.
      </p>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      {imported !== undefined && (
        <p>
          Znaleziono {found ?? '?'}, zaimportowano {imported}, duplikaty {duplicates ?? '0'}.
        </p>
      )}
      {importError && (
        <pre style={{ whiteSpace: 'pre-wrap', color: 'crimson', fontSize: 13 }}>{importError}</pre>
      )}

      <form action={importFromKsefAction} style={{ display: 'grid', gap: '0.75rem' }}>
        <label>
          Od
          <input
            type="date"
            name="rangeFrom"
            required
            defaultValue={daysAgoIso(30)}
            style={{ display: 'block', width: '100%' }}
          />
        </label>
        <label>
          Do
          <input
            type="date"
            name="rangeTo"
            required
            defaultValue={todayIso()}
            style={{ display: 'block', width: '100%' }}
          />
        </label>
        <label>
          Rodzaj
          <select name="invoiceKind" required defaultValue="COST" style={{ display: 'block', width: '100%' }}>
            <option value="COST">Kosztowe (jako nabywca)</option>
            <option value="SALES">Sprzedażowe (jako sprzedawca)</option>
          </select>
        </label>
        <button type="submit">Pobierz do bufora</button>
      </form>
    </main>
  )
}
