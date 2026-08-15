'use client'

import { useActionState } from 'react'

import { Field, buttonClassName, fieldControlClassName } from '@/components/ui-kit'
import { updateDocumentAction, type DocumentFormState } from '@/server/documents/actions'

type EditDocument = {
  id: string
  number: string
  issueDate: string
  dueDate: string | null
  netAmount: string
  vatAmount: string
  grossAmount: string
  currency: string
  paymentAccount: string | null
  type: { id: string }
  contractor: { id: string; name: string; nip: string | null }
  category: { id: string } | null
}

function initialStateFrom(document: EditDocument): DocumentFormState {
  return {
    errors: {},
    values: {
      number: document.number,
      typeId: document.type.id,
      categoryId: document.category?.id ?? '',
      issueDate: document.issueDate,
      dueDate: document.dueDate ?? '',
      netAmount: document.netAmount,
      vatAmount: document.vatAmount,
      grossAmount: document.grossAmount,
      currency: document.currency,
      paymentAccount: document.paymentAccount ?? '',
    },
    attempt: 0,
  }
}

export function EditDocumentForm({
  document,
  types,
  categories,
}: {
  document: EditDocument
  types: Array<{ id: string; label: string }>
  categories: Array<{ id: string; label: string }>
}) {
  const [state, action, pending] = useActionState(updateDocumentAction, initialStateFrom(document))
  const errors = state.errors
  const values = state.values

  return (
    <form key={state.attempt} action={action} className="grid gap-3">
      <input type="hidden" name="id" value={document.id} />
      <input type="hidden" name="contractorId" value={document.contractor.id} />
      <Field label="Numer" error={errors.number}>
        <input
          name="number"
          required
          defaultValue={values.number}
          aria-invalid={Boolean(errors.number)}
          className={fieldControlClassName(Boolean(errors.number))}
        />
      </Field>
      <Field label="Typ" error={errors.typeId}>
        <select
          name="typeId"
          required
          defaultValue={values.typeId}
          aria-invalid={Boolean(errors.typeId)}
          className={fieldControlClassName(Boolean(errors.typeId))}
        >
          {types.map((type) => (
            <option key={type.id} value={type.id}>
              {type.label}
            </option>
          ))}
        </select>
      </Field>
      <p className="text-sm text-muted-foreground">
        Kontrahent: {document.contractor.name}
        {document.contractor.nip ? ` (${document.contractor.nip})` : ''}
      </p>
      <Field label="Kategoria" error={errors.categoryId}>
        <select
          name="categoryId"
          defaultValue={values.categoryId ?? ''}
          aria-invalid={Boolean(errors.categoryId)}
          className={fieldControlClassName(Boolean(errors.categoryId))}
        >
          <option value="">— brak —</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Data wystawienia" error={errors.issueDate}>
        <input
          type="date"
          name="issueDate"
          required
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
      <Field label="Netto" error={errors.netAmount}>
        <input
          name="netAmount"
          required
          defaultValue={values.netAmount}
          aria-invalid={Boolean(errors.netAmount)}
          className={fieldControlClassName(Boolean(errors.netAmount))}
        />
      </Field>
      <Field label="VAT" error={errors.vatAmount}>
        <input
          name="vatAmount"
          required
          defaultValue={values.vatAmount}
          aria-invalid={Boolean(errors.vatAmount)}
          className={fieldControlClassName(Boolean(errors.vatAmount))}
        />
      </Field>
      <Field label="Brutto" error={errors.grossAmount}>
        <input
          name="grossAmount"
          required
          defaultValue={values.grossAmount}
          aria-invalid={Boolean(errors.grossAmount)}
          className={fieldControlClassName(Boolean(errors.grossAmount))}
        />
      </Field>
      <Field label="Waluta" error={errors.currency}>
        <input
          name="currency"
          defaultValue={values.currency}
          aria-invalid={Boolean(errors.currency)}
          className={fieldControlClassName(Boolean(errors.currency))}
        />
      </Field>
      <Field
        label="Rachunek do zapłaty (opcjonalnie)"
        hint="NRB (26 cyfr) albo IBAN. Puste pole kasuje rachunek."
        error={errors.paymentAccount}
      >
        <input
          name="paymentAccount"
          defaultValue={values.paymentAccount}
          autoComplete="off"
          placeholder="PL61 1090 1014 0000 0712 1981 2874"
          aria-invalid={Boolean(errors.paymentAccount)}
          className={fieldControlClassName(Boolean(errors.paymentAccount))}
        />
      </Field>
      {errors.form ? <p className="text-xs text-destructive">{errors.form}</p> : null}
      <button type="submit" disabled={pending} className={buttonClassName}>
        {pending ? 'Zapisuję…' : 'Zapisz zmiany'}
      </button>
    </form>
  )
}
