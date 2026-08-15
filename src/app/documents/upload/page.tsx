import { ContractorLookupFields } from '@/components/contractor-lookup-fields'
import { FileDropField } from '@/components/file-drop-field'
import { Card, Field, PageShell, buttonClassName, controlClassName } from '@/components/ui-kit'
import { first } from '@/lib/search-params'
import { listDocumentTypes } from '@/server/document-types/list-document-types'
import { uploadDocumentAction } from '@/server/documents/actions'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default async function UploadDocumentPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const error = first(params.error)
  const types = await listDocumentTypes()

  return (
    <PageShell
      title="Wgraj PDF / XML"
      description="XML FA wczytuje dane automatycznie. Przy PDF uzupełnij metadane poniżej."
      flash={error ? { message: error } : null}
    >
      <Card className="max-w-2xl">
        <form action={uploadDocumentAction} className="grid gap-4">
          <FileDropField />

          <fieldset className="grid gap-3 rounded-lg border border-border p-3">
            <legend className="px-1 text-sm font-medium text-foreground">Metadane (wymagane dla PDF)</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Numer">
                <input name="number" className={controlClassName} />
              </Field>
              <Field label="Typ">
                <select name="typeId" className={controlClassName}>
                  <option value="">Wybierz…</option>
                  {types.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <ContractorLookupFields />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Data wystawienia">
                <input type="date" name="issueDate" className={controlClassName} />
              </Field>
              <Field label="Termin płatności">
                <input type="date" name="dueDate" className={controlClassName} />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Netto">
                <input name="netAmount" placeholder="100.00" className={controlClassName} />
              </Field>
              <Field label="VAT">
                <input name="vatAmount" placeholder="23.00" className={controlClassName} />
              </Field>
              <Field label="Brutto">
                <input name="grossAmount" placeholder="123.00" className={controlClassName} />
              </Field>
            </div>
            <Field label="Waluta">
              <input name="currency" defaultValue="PLN" className={`${controlClassName} max-w-32`} />
            </Field>
            <Field label="Rachunek do zapłaty (opcjonalnie)" hint="NRB (26 cyfr) albo IBAN. Przy XML brany z pliku.">
              <input
                name="paymentAccount"
                autoComplete="off"
                placeholder="PL61 1090 1014 0000 0712 1981 2874"
                className={controlClassName}
              />
            </Field>
          </fieldset>

          <div>
            <button type="submit" className={buttonClassName}>
              Wgraj do bufora
            </button>
          </div>
        </form>
      </Card>
    </PageShell>
  )
}
