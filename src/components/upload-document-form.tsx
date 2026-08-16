'use client'

import { useActionState } from 'react'

import { ContractorLookupFields } from '@/components/contractor-lookup-fields'
import { FileDropField } from '@/components/file-drop-field'
import { Field, buttonClassName, fieldControlClassName } from '@/components/ui-kit'
import { uploadDocumentAction, type DocumentFormState } from '@/server/documents/actions'

const initialState: DocumentFormState = { errors: {}, values: {}, attempt: 0 }

export function UploadDocumentForm({ types }: { types: Array<{ id: string; label: string }> }) {
  const [state, action, pending] = useActionState(uploadDocumentAction, initialState)
  const errors = state.errors
  const values = state.values

  return (
    <form action={action} className="grid gap-4">
      <FileDropField error={errors.file} errorKey={state.attempt} />

      <fieldset key={state.attempt} className="grid gap-3 rounded-lg border border-border p-3">
        <legend className="px-1 text-sm font-medium text-foreground">Metadane (wymagane dla PDF)</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Numer" error={errors.number}>
            <input
              name="number"
              defaultValue={values.number}
              aria-invalid={Boolean(errors.number)}
              className={fieldControlClassName(Boolean(errors.number))}
            />
          </Field>
          <Field label="Typ" error={errors.typeId}>
            <select
              name="typeId"
              defaultValue={values.typeId}
              aria-invalid={Boolean(errors.typeId)}
              className={fieldControlClassName(Boolean(errors.typeId))}
            >
              <option value="">Wybierz…</option>
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <ContractorLookupFields errors={errors} values={values} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Data wystawienia" error={errors.issueDate}>
            <input
              type="date"
              name="issueDate"
              defaultValue={values.issueDate}
              aria-invalid={Boolean(errors.issueDate)}
              className={fieldControlClassName(Boolean(errors.issueDate))}
            />
          </Field>
          <Field label="Termin płatności" error={errors.dueDate}>
            <input
              type="date"
              name="dueDate"
              defaultValue={values.dueDate}
              aria-invalid={Boolean(errors.dueDate)}
              className={fieldControlClassName(Boolean(errors.dueDate))}
            />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Netto" error={errors.netAmount}>
            <input
              name="netAmount"
              placeholder="100.00"
              defaultValue={values.netAmount}
              aria-invalid={Boolean(errors.netAmount)}
              className={fieldControlClassName(Boolean(errors.netAmount))}
            />
          </Field>
          <Field label="VAT" error={errors.vatAmount}>
            <input
              name="vatAmount"
              placeholder="23.00"
              defaultValue={values.vatAmount}
              aria-invalid={Boolean(errors.vatAmount)}
              className={fieldControlClassName(Boolean(errors.vatAmount))}
            />
          </Field>
          <Field label="Brutto" error={errors.grossAmount}>
            <input
              name="grossAmount"
              placeholder="123.00"
              defaultValue={values.grossAmount}
              aria-invalid={Boolean(errors.grossAmount)}
              className={fieldControlClassName(Boolean(errors.grossAmount))}
            />
          </Field>
        </div>
        <Field label="Waluta" error={errors.currency}>
          <input
            name="currency"
            defaultValue={values.currency || 'PLN'}
            aria-invalid={Boolean(errors.currency)}
            className={`${fieldControlClassName(Boolean(errors.currency))} max-w-32`}
          />
        </Field>
        <Field
          label="Rachunek do zapłaty (opcjonalnie)"
          hint="NRB (26 cyfr) albo IBAN. Przy XML brany z pliku."
          error={errors.paymentAccount}
        >
          <input
            name="paymentAccount"
            autoComplete="off"
            placeholder="PL61 1090 1014 0000 0712 1981 2874"
            defaultValue={values.paymentAccount}
            aria-invalid={Boolean(errors.paymentAccount)}
            className={fieldControlClassName(Boolean(errors.paymentAccount))}
          />
        </Field>
      </fieldset>

      {errors.form ? <p className="text-xs text-destructive">{errors.form}</p> : null}
      <div>
        <button type="submit" disabled={pending} className={buttonClassName}>
          {pending ? 'Wgrywam…' : 'Wgraj do bufora'}
        </button>
      </div>
    </form>
  )
}
