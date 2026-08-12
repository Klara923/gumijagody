import Link from 'next/link'

import {
  Alert,
  Field,
  PageShell,
  buttonClassName,
  buttonSecondaryClassName,
  controlClassName,
  tableClassName,
  tdClassName,
  thClassName,
} from '@/components/ui-kit'
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
      description="Wiele godzin na dobę (np. 01:00, 02:00, 03:00). Lokalnie: node-cron co minutę. Na Vercel: cron w vercel.json → POST /api/cron/ksef (wymaga CRON_SECRET)."
    >
      <p className="flex flex-wrap gap-2">
        <Link href="/ksef/import" className={buttonSecondaryClassName}>
          Ręczny import
        </Link>
      </p>

      {error && <Alert>{error}</Alert>}
      {saved && <Alert tone="ok">Zapisano harmonogram.</Alert>}
      {ran && (
        <Alert tone="ok">
          Uruchomiono teraz — zaimportowano {imported ?? '0'}, duplikaty {duplicates ?? '0'}.
        </Alert>
      )}

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Ustawienia</h2>
        <form action={updateScheduleSettingsAction} className="grid max-w-lg gap-3">
          <label className="flex items-center gap-2 text-sm text-zinc-800">
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

          <fieldset className="grid gap-2 text-sm text-zinc-800">
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
            <p className="text-sm font-medium text-zinc-700">Godziny uruchomienia</p>
            {settings.runTimes.length === 0 ? (
              <p className="text-sm text-zinc-500">Brak godzin — dodaj co najmniej jedną.</p>
            ) : (
              <ul className="space-y-2">
                {settings.runTimes.map((time) => (
                  <li key={time} className="flex items-center gap-2">
                    <input type="hidden" name="runTimes" value={time} />
                    <span className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm">
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
            <p className="text-sm font-medium text-zinc-700">Usuń godzinę</p>
            <div className="flex flex-wrap gap-2">
              {settings.runTimes.map((time) => (
                <form key={`remove-${time}`} action={removeScheduleTimeAction}>
                  <input type="hidden" name="removeTime" value={time} />
                  <button type="submit" className={buttonSecondaryClassName}>
                    Usuń {time}
                  </button>
                </form>
              ))}
            </div>
          </div>
        ) : null}

        <form action={runScheduleNowAction} className="mt-4">
          <button type="submit" className={buttonSecondaryClassName}>
            Uruchom teraz (ignoruje godzinę)
          </button>
        </form>

        <p className="mt-3 text-xs text-zinc-500">
          Ostatnie uruchomienie:{' '}
          {settings.lastRunAt ? new Date(settings.lastRunAt).toLocaleString('pl-PL') : '—'}
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-zinc-900">Ostatnie uruchomienia SCHEDULED</h2>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
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
                  <tr key={run.id}>
                    <td className={tdClassName}>{run.startedAt.toLocaleString('pl-PL')}</td>
                    <td className={tdClassName}>{run.invoiceKind}</td>
                    <td className={tdClassName}>{run.status}</td>
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
        </div>
      </section>
    </PageShell>
  )
}
