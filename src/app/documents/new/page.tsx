import { ContractorLookupFields } from '@/components/contractor-lookup-fields'
import {
  Alert,
  Field,
  PageShell,
  buttonClassName,
  controlClassName,
} from '@/components/ui-kit'
import { listCategoryOptions } from '@/server/categories/list-categories'
import { listDocumentTypes } from '@/server/document-types/list-document-types'
import { createDocumentAction } from '@/server/documents/actions'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function NewDocumentPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const error = first(params.error)
  const types = await listDocumentTypes()
  const categories = await listCategoryOptions()

  return (
    <PageShell title="Nowy dokument" description="Ręczne dodanie trafia od razu do rejestru.">
      {error && <Alert>{error}</Alert>}

      <form action={createDocumentAction} className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4">
        <Field label="Numer">
          <input name="number" required className={controlClassName} />
        </Field>
        <Field label="Typ">
          <select name="typeId" required className={controlClassName}>
            <option value="">Wybierz…</option>
            {types.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>
        </Field>
        <ContractorLookupFields requiredName />
        <Field label="Kategoria (opcjonalnie)">
          <select name="categoryId" defaultValue="" className={controlClassName}>
            <option value="">— brak / wg reguły kontrahenta —</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Data wystawienia">
          <input type="date" name="issueDate" required className={controlClassName} />
        </Field>
        <Field label="Termin płatności">
          <input type="date" name="dueDate" className={controlClassName} />
        </Field>
        <Field label="Netto">
          <input name="netAmount" required placeholder="100.00" className={controlClassName} />
        </Field>
        <Field label="VAT">
          <input name="vatAmount" required placeholder="23.00" className={controlClassName} />
        </Field>
        <Field label="Brutto">
          <input name="grossAmount" required placeholder="123.00" className={controlClassName} />
        </Field>
        <Field label="Waluta">
          <input name="currency" defaultValue="PLN" className={controlClassName} />
        </Field>
        <button type="submit" className={buttonClassName}>
          Zapisz
        </button>
      </form>
    </PageShell>
  )
}
