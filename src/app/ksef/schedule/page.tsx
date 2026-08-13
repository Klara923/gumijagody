import Link from 'next/link'

import { ConfirmDelete } from '@/components/confirm-delete'
import {
  Card,
  CardTitle,
  EnumBadge,
  Field,
  PageShell,
  buttonClassName,
  buttonSecondaryClassName,
  controlClassName,
  tableClassName,
  tdClassName,
  thClassName,
  trClassName,
} from '@/components/ui-kit'
import { IMPORT_STATUS, INVOICE_KIND } from '@/lib/labels'
import { getPrisma } from '@/server/infrastructure/db/prisma'
import {
  removeScheduleTimeAction,
  runScheduleNowAction,
  updateScheduleSettingsAction,
} from '@/server/schedule/actions'
import { getScheduleSettings } from '@/server/schedule/settings'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function KsefSchedulePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const error = first(params.error)
  const saved = first(params.saved)
  const ran = first(params.ran)
  const imported = first(params.imported)
  const duplicates = first(params.duplicates)

  const settings = await getScheduleSettings()
  const recentRuns = await getPrisma().importRun.findMany({
    where: { trigger: 'SCHEDULED' },
    orderBy: { startedAt: 'desc' },
    take: 10,
  })

  return (
    <PageShell
      title="Harmonogram KSeF"
      description="Wiele godzin na dobę. Lokalnie node-cron sprawdza minutę. Na Vercel Hobby cron woła raz na dobę — dodatkowe godziny ustawisz przez cron-job.org na POST /api/cron/ksef."
      flash={
        error
          ? { message: error }
          : saved
            ? { tone: 'ok', message: 'Zapisano harmonogram.' }
            : ran
              ? {
                  tone: 'ok',
                  message: `Uruchomiono teraz — zaimportowano ${imported ?? '0'}, duplikaty ${duplicates ?? '0'}.`,
                }
              : null
      }
      actions={
        <Link href="/ksef/import" className={buttonSecondaryClassName}>
          Ręczny import
        </Link>
      }
    >

      <Card>
        <CardTitle>Ustawienia</CardTitle>
        <form action={updateScheduleSettingsAction} className="grid max-w-lg gap-3">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" name="enabled" defaultChecked={settings.enabled} />
            Włącz automatyczne pobieranie
          </label>

          <Field label="Strefa czasowa">
            <input
              name="timezone"
              defaultValue={settings.timezone}
              required
              className={controlClassName}
            />
          </Field>

          <Field label="Lookback (dni wstecz, włącznie z dziś)">
            <input
              type="number"
              name="lookbackDays"
              min={1}
              max={93}
              defaultValue={settings.lookbackDays}
              required
              className={controlClassName}
            />
          </Field>

          <fieldset className="grid gap-2 text-sm text-foreground">
            <legend className="font-medium">Rodzaje faktur</legend>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="invoiceKinds"
                value="COST"
                defaultChecked={settings.invoiceKinds.includes('COST')}
              />
              Kosztowe
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="invoiceKinds"
                value="SALES"
                defaultChecked={settings.invoiceKinds.includes('SALES')}
              />
              Sprzedażowe
            </label>
          </fieldset>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Godziny uruchomienia</p>
            {settings.runTimes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Brak godzin — dodaj co najmniej jedną.</p>
            ) : (
              <ul className="space-y-2">
                {settings.runTimes.map((time) => (
                  <li key={time} className="flex items-center gap-2">
                    <input type="hidden" name="runTimes" value={time} />
                    <span className="rounded-md border border-border bg-muted px-3 py-1.5 text-sm">
                      {time}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Field label="Dodaj godzinę (HH:MM)">
              <input type="time" name="newTime" className={controlClassName} />
            </Field>
          </div>

          <button type="submit" className={buttonClassName}>
            Zapisz harmonogram
          </button>
        </form>

        {settings.runTimes.length > 0 ? (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium text-foreground">Usuń godzinę</p>
            <div className="flex flex-wrap gap-2">
              {settings.runTimes.map((time) => (
                <ConfirmDelete
                  key={`remove-${time}`}
                  action={removeScheduleTimeAction}
                  fields={{ removeTime: time }}
                  label={`Usuń ${time}`}
                  title={`Usunąć godzinę ${time} z harmonogramu?`}
                  description="Kolejne automatyczne pobrania o tej godzinie nie wystartują."
                />
              ))}
            </div>
          </div>
        ) : null}

        <form action={runScheduleNowAction} className="mt-4">
          <button type="submit" className={buttonSecondaryClassName}>
            Uruchom teraz (ignoruje godzinę)
          </button>
        </form>

        <p className="mt-3 text-xs text-muted-foreground">
          Ostatnie uruchomienie:{' '}
          {settings.lastRunAt ? new Date(settings.lastRunAt).toLocaleString('pl-PL') : '—'}
        </p>
      </Card>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground">Ostatnie uruchomienia z harmonogramu</h2>
        <Card className="overflow-x-auto p-0">
          <table className={tableClassName}>
            <thead>
              <tr>
                <th className={thClassName}>Start</th>
                <th className={thClassName}>Rodzaj</th>
                <th className={thClassName}>Status</th>
                <th className={thClassName}>Import / duplikaty</th>
                <th className={thClassName}>Zakres</th>
              </tr>
            </thead>
            <tbody>
              {recentRuns.length === 0 ? (
                <tr>
                  <td className={tdClassName} colSpan={5}>
                    Brak uruchomień z harmonogramu.
                  </td>
                </tr>
              ) : (
                recentRuns.map((run) => (
                  <tr key={run.id} className={trClassName}>
                    <td className={tdClassName}>{run.startedAt.toLocaleString('pl-PL')}</td>
                    <td className={tdClassName}>
                      <EnumBadge value={run.invoiceKind} labels={INVOICE_KIND} />
                    </td>
                    <td className={tdClassName}>
                      <EnumBadge value={run.status} labels={IMPORT_STATUS} />
                    </td>
                    <td className={tdClassName}>
                      {run.importedCount} / {run.duplicateCount}
                    </td>
                    <td className={tdClassName}>
                      {run.rangeFrom.toISOString().slice(0, 10)} →{' '}
                      {run.rangeTo.toISOString().slice(0, 10)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      </section>
    </PageShell>
  )
}
