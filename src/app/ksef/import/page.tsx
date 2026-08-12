import {
  Alert,
  Field,
  PageShell,
  buttonClassName,
  controlClassName,
} from '@/components/ui-kit'
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
    <PageShell
      title="Pobieranie z KSeF"
      description="Faktury kosztowe lub sprzedażowe z zakresu dat trafiają do bufora. Duplikaty (ten sam numer KSeF) są pomijane."
    >
      {error && <Alert>{error}</Alert>}
      {imported !== undefined && (
        <Alert tone="ok">
          Znaleziono {found ?? '?'}, zaimportowano {imported}, duplikaty {duplicates ?? '0'}.
        </Alert>
      )}
      {importError && <Alert>{importError}</Alert>}

      <form action={importFromKsefAction} className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4">
        <Field label="Od">
          <input
            type="date"
            name="rangeFrom"
            required
            defaultValue={daysAgoIso(30)}
            className={controlClassName}
          />
        </Field>
        <Field label="Do">
          <input
            type="date"
            name="rangeTo"
            required
            defaultValue={todayIso()}
            className={controlClassName}
          />
        </Field>
        <Field label="Rodzaj">
          <select name="invoiceKind" required defaultValue="COST" className={controlClassName}>
            <option value="COST">Kosztowe (jako nabywca)</option>
            <option value="SALES">Sprzedażowe (jako sprzedawca)</option>
          </select>
        </Field>
        <button type="submit" className={buttonClassName}>
          Pobierz do bufora
        </button>
      </form>
    </PageShell>
  )
}
