import {
  Alert,
  Field,
  PageShell,
  buttonClassName,
  controlClassName,
} from '@/components/ui-kit'
import { uploadDocumentAction } from '@/server/documents/actions'
import { getPrisma } from '@/server/infrastructure/db/prisma'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function UploadDocumentPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const error = first(params.error)
  const types = await getPrisma().documentType.findMany({ orderBy: { name: 'asc' } })

  return (
    <PageShell
      title="Upload PDF / XML"
      description="XML FA wgrywa dane automatycznie. PDF wymaga metadanych poniżej. Pliki testowe: fixtures/ksef/."
    >
      {error && <Alert>{error}</Alert>}

      <form action={uploadDocumentAction} className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4">
        <Field label="Plik (PDF lub XML)">
          <input
            type="file"
            name="file"
            accept=".pdf,.xml,application/pdf,application/xml,text/xml"
            required
            className={controlClassName}
          />
        </Field>

        <fieldset className="grid gap-3 rounded-md border border-zinc-200 p-3">
          <legend className="px-1 text-sm font-medium text-zinc-700">Metadane (wymagane dla PDF)</legend>
          <Field label="Numer">
            <input name="number" className={controlClassName} />
          </Field>
          <Field label="Typ">
            <select name="typeId" className={controlClassName}>
              <option value="">Wybierz…</option>
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Kontrahent — nazwa">
            <input name="contractorName" className={controlClassName} />
          </Field>
          <Field label="Kontrahent — NIP">
            <input name="contractorNip" className={controlClassName} />
          </Field>
          <Field label="Data wystawienia">
            <input type="date" name="issueDate" className={controlClassName} />
          </Field>
          <Field label="Termin płatności">
            <input type="date" name="dueDate" className={controlClassName} />
          </Field>
          <Field label="Netto">
            <input name="netAmount" placeholder="100.00" className={controlClassName} />
          </Field>
          <Field label="VAT">
            <input name="vatAmount" placeholder="23.00" className={controlClassName} />
          </Field>
          <Field label="Brutto">
            <input name="grossAmount" placeholder="123.00" className={controlClassName} />
          </Field>
          <Field label="Waluta">
            <input name="currency" defaultValue="PLN" className={controlClassName} />
          </Field>
        </fieldset>

        <button type="submit" className={buttonClassName}>
          Wgraj do bufora
        </button>
      </form>
    </PageShell>
  )
}
