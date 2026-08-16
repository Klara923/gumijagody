import type { Metadata } from 'next'
import Link from 'next/link'

import { PageShell } from '@/components/page-shell'
import { Card, Field, buttonClassName, buttonSecondaryClassName, controlClassName } from '@/components/ui-kit'
import { first } from '@/lib/search-params'
import { importFromKsefAction } from '@/server/documents/actions'
import { KSEF_DEMO_INVOICE_LIMIT } from '@/server/infrastructure/ksef/limits'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export const metadata: Metadata = { title: 'Pobieranie z KSeF' }

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
  const imported = first(params.imported)
  const duplicates = first(params.duplicates)
  const found = first(params.found)
  const importError = first(params.importError)

  const flash = importError
    ? { tone: 'error' as const, message: importError }
    : imported !== undefined
      ? {
          tone: 'ok' as const,
          message: `Znaleziono ${found ?? '?'}, zaimportowano ${imported}, duplikaty ${duplicates ?? '0'}.`,
        }
      : null

  return (
    <PageShell
      title="Pobieranie z KSeF"
      description={`Do bufora schodzi najwyżej ${KSEF_DEMO_INVOICE_LIMIT} faktur na run (query metadata, małe zakresy). Na wdrożeniu ustaw KSEF_CLIENT=http. Duplikaty (ten sam numer KSeF) są pomijane.`}
      flash={flash}
      actions={
        <Link href="/ksef/schedule" className={buttonSecondaryClassName}>
          Harmonogram
        </Link>
      }
    >
      <Card className="max-w-2xl">
        <form action={importFromKsefAction} className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
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
          </div>
          <Field label="Rodzaj">
            <select name="invoiceKind" required defaultValue="COST" className={controlClassName}>
              <option value="COST">Kosztowe (jako nabywca)</option>
              <option value="SALES">Sprzedażowe (jako sprzedawca)</option>
            </select>
          </Field>
          <div>
            <button type="submit" className={buttonClassName}>
              Pobierz do bufora
            </button>
          </div>
        </form>
      </Card>
    </PageShell>
  )
}
