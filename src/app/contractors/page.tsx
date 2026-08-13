import {
  Card,
  EmptyState,
  PageShell,
  buttonClassName,
  controlClassName,
  tableClassName,
  tdClassName,
  thClassName,
  trClassName,
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
      title="Kontrahenci — reguła kategorii"
      description="Domyślna kategoria ma pierwszeństwo przed słowami kluczowymi. Przy uploadzie i imporcie KSeF dokument dostanie ją automatycznie."
      flash={
        error ? { message: error } : saved ? { tone: 'ok', message: 'Zapisano regułę.' } : null
      }
    >
      {contractors.length === 0 ? (
        <EmptyState
          title="Brak kontrahentów"
          description="Pojawią się po dodaniu albo wgraniu dokumentu."
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className={tableClassName}>
            <thead>
              <tr>
                <th className={thClassName}>Nazwa</th>
                <th className={thClassName}>NIP</th>
                <th className={`${thClassName} w-28`}>Dokumenty</th>
                <th className={thClassName}>Domyślna kategoria</th>
              </tr>
            </thead>
            <tbody>
              {contractors.map((contractor) => (
                <tr key={contractor.id} className={trClassName}>
                  <td className={`${tdClassName} truncate`}>{contractor.name}</td>
                  <td className={`${tdClassName} tabular-nums`}>{contractor.nip ?? '—'}</td>
                  <td className={`${tdClassName} tabular-nums`}>{contractor.documentsCount}</td>
                  <td className={tdClassName}>
                    <form
                      action={updateContractorDefaultCategoryAction}
                      className="flex items-center gap-2"
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
        </Card>
      )}
    </PageShell>
  )
}
