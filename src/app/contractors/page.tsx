import {
  Alert,
  PageShell,
  buttonClassName,
  controlClassName,
  tableClassName,
  tdClassName,
  thClassName,
} from '@/components/ui-kit'
import { updateContractorDefaultCategoryAction } from '@/server/categories/actions'
import { listCategoryOptions } from '@/server/categories/list-categories'
import { listContractors } from '@/server/contractors/list-contractors'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function ContractorsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const error = first(params.error)
  const saved = first(params.saved)
  const contractors = await listContractors()
  const categories = await listCategoryOptions()

  return (
    <PageShell
      wide
      title="Kontrahenci — reguła kategorii"
      description="Ustaw domyślną kategorię. Przy uploadzie / imporcie KSeF dokument dostanie ją automatycznie."
    >
      {error && <Alert>{error}</Alert>}
      {saved && <Alert tone="ok">Zapisano regułę.</Alert>}

      {contractors.length === 0 ? (
        <p className="text-sm text-zinc-600">Brak kontrahentów — pojawią się po dodaniu dokumentów.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className={tableClassName}>
            <thead>
              <tr>
                <th className={thClassName}>Nazwa</th>
                <th className={thClassName}>NIP</th>
                <th className={thClassName}>Dokumenty</th>
                <th className={thClassName}>Domyślna kategoria</th>
              </tr>
            </thead>
            <tbody>
              {contractors.map((contractor) => (
                <tr key={contractor.id}>
                  <td className={tdClassName}>{contractor.name}</td>
                  <td className={tdClassName}>{contractor.nip ?? '—'}</td>
                  <td className={tdClassName}>{contractor.documentsCount}</td>
                  <td className={tdClassName}>
                    <form
                      action={updateContractorDefaultCategoryAction}
                      className="flex flex-wrap items-center gap-2"
                    >
                      <input type="hidden" name="contractorId" value={contractor.id} />
                      <select
                        name="defaultCategoryId"
                        defaultValue={contractor.defaultCategory?.id ?? ''}
                        className={controlClassName}
                      >
                        <option value="">— brak —</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                      <button type="submit" className={buttonClassName}>
                        Zapisz
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  )
}
