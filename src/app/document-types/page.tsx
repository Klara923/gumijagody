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
import {
  createDocumentTypeAction,
  deleteDocumentTypeAction,
  updateDocumentTypeAction,
} from '@/server/document-types/actions'
import { listDocumentTypes } from '@/server/document-types/list-document-types'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function DocumentTypesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const error = first(params.error)
  const created = first(params.created)
  const saved = first(params.saved)
  const deleted = first(params.deleted)
  const types = await listDocumentTypes()

  return (
    <PageShell
      wide
      title="Typy dokumentów"
      description="Typ systemowy ma kierunek należność albo zobowiązanie. Własne typy (nota obciążeniowa, odsetkowa, karna) dodajesz tutaj i wybierasz na dokumencie."
    >
      {error && <Alert>{error}</Alert>}
      {created && <Alert tone="ok">Dodano typ.</Alert>}
      {saved && <Alert tone="ok">Zapisano typ.</Alert>}
      {deleted && <Alert tone="ok">Usunięto typ.</Alert>}

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Dodaj własny typ</h2>
        <form action={createDocumentTypeAction} className="grid max-w-md gap-3">
          <Field label="Nazwa">
            <input name="name" required placeholder="Nota obciążeniowa" className={controlClassName} />
          </Field>
          <Field label="Kierunek">
            <select name="direction" required defaultValue="PAYABLE" className={controlClassName}>
              <option value="PAYABLE">Zobowiązanie (do zapłaty)</option>
              <option value="RECEIVABLE">Należność (do otrzymania)</option>
            </select>
          </Field>
          <button type="submit" className={buttonClassName}>
            Dodaj
          </button>
        </form>
      </section>

      <section className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className={tableClassName}>
          <thead>
            <tr>
              <th className={thClassName}>Nazwa</th>
              <th className={thClassName}>Kierunek</th>
              <th className={thClassName}>Dokumenty</th>
              <th className={thClassName} />
            </tr>
          </thead>
          <tbody>
            {types.map((type) => (
              <tr key={type.id}>
                <td className={tdClassName}>
                  {type.isSystem ? (
                    type.name
                  ) : (
                    <form action={updateDocumentTypeAction} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="id" value={type.id} />
                      <input name="name" defaultValue={type.name} required className={controlClassName} />
                      <select
                        name="direction"
                        defaultValue={type.direction}
                        className={controlClassName}
                      >
                        <option value="PAYABLE">Zobowiązanie</option>
                        <option value="RECEIVABLE">Należność</option>
                      </select>
                      <button type="submit" className={buttonClassName}>
                        Zapisz
                      </button>
                    </form>
                  )}
                </td>
                <td className={tdClassName}>
                  {type.direction === 'RECEIVABLE' ? 'należność' : 'zobowiązanie'}
                  {type.isSystem ? ' · systemowy' : ''}
                </td>
                <td className={tdClassName}>{type.documentsCount}</td>
                <td className={tdClassName}>
                  {type.isSystem ? (
                    <span className="text-xs text-zinc-500">Nie usuwa się</span>
                  ) : (
                    <form action={deleteDocumentTypeAction}>
                      <input type="hidden" name="id" value={type.id} />
                      <button type="submit" className={buttonSecondaryClassName}>
                        Usuń
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </PageShell>
  )
}
