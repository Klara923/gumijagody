import { ContractorLookupFields } from '@/components/contractor-lookup-fields'
import { Card, Field, PageShell, buttonClassName, controlClassName } from '@/components/ui-kit'
import { first } from '@/lib/search-params'
import { listCategoryOptions } from '@/server/categories/list-categories'
import { listDocumentTypes } from '@/server/document-types/list-document-types'
import { createDocumentAction } from '@/server/documents/actions'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default async function NewDocumentPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const error = first(params.error)
  const types = await listDocumentTypes()
  const categories = await listCategoryOptions()

  return (
    <PageShell
      title="Wpis ręczny"
      description="Ręczne dodanie trafia od razu do rejestru."
      flash={error ? { message: error } : null}
    >
      <Card className="max-w-2xl">
        <form action={createDocumentAction} className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
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
          </div>
          <ContractorLookupFields requiredName />
          <Field label="Kategoria (opcjonalnie)">
            <select name="categoryId" defaultValue="" className={controlClassName}>
              <option value="">— brak / wg reguły kontrahenta lub słowa kluczowego —</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Data wystawienia">
              <input type="date" name="issueDate" required className={controlClassName} />
            </Field>
            <Field label="Termin płatności">
              <input type="date" name="dueDate" className={controlClassName} />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Netto">
              <input name="netAmount" required placeholder="100.00" className={controlClassName} />
            </Field>
            <Field label="VAT">
              <input name="vatAmount" required placeholder="23.00" className={controlClassName} />
            </Field>
            <Field label="Brutto">
              <input name="grossAmount" required placeholder="123.00" className={controlClassName} />
            </Field>
          </div>
          <Field label="Waluta">
            <input name="currency" defaultValue="PLN" className={`${controlClassName} max-w-32`} />
          </Field>
          <Field label="Rachunek do zapłaty (opcjonalnie)" hint="NRB (26 cyfr) albo IBAN.">
            <input
              name="paymentAccount"
              autoComplete="off"
              placeholder="PL61 1090 1014 0000 0712 1981 2874"
              className={controlClassName}
            />
          </Field>
          <div>
            <button type="submit" className={buttonClassName}>
              Zapisz
            </button>
          </div>
        </form>
      </Card>
    </PageShell>
  )
}
