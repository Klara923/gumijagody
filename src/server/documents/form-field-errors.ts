export const DOCUMENT_FORM_FIELD_NAMES = [
  'number',
  'typeId',
  'contractorNip',
  'contractorName',
  'contractorStreet',
  'contractorPostalCode',
  'contractorCity',
  'contractorBankAccount',
  'categoryId',
  'issueDate',
  'dueDate',
  'netAmount',
  'vatAmount',
  'grossAmount',
  'currency',
  'paymentAccount',
] as const

export type DocumentFormState = {
  errors: Record<string, string>
  values: Record<string, string>
  attempt: number
}

export function valuesFromFormData(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {}
  for (const name of DOCUMENT_FORM_FIELD_NAMES) {
    const value = formData.get(name)
    values[name] = typeof value === 'string' ? value : ''
  }
  return values
}

export function failedDocumentFormState(
  prev: DocumentFormState,
  formData: FormData,
  errors: Record<string, string>,
): DocumentFormState {
  return {
    errors,
    values: valuesFromFormData(formData),
    attempt: (prev.attempt ?? 0) + 1,
  }
}

const CONTRACTOR_FORM_FIELDS: Record<string, string> = {
  name: 'contractorName',
  nip: 'contractorNip',
  street: 'contractorStreet',
  postalCode: 'contractorPostalCode',
  city: 'contractorCity',
  bankAccount: 'contractorBankAccount',
}

export function fieldErrorsFromZod(error: {
  issues: Array<{ path: PropertyKey[]; message: string }>
}): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = formKeyFromPath(issue.path)
    if (!errors[key]) errors[key] = issue.message
  }
  return errors
}

export function fieldErrorsFromCaught(error: unknown): Record<string, string> {
  const message =
    typeof error === 'string'
      ? error
      : error instanceof Error
        ? error.message
        : 'Nieoczekiwany błąd'
  if (/numer/i.test(message) && !/plik|xml/i.test(message)) return { number: message }
  if (/typ dokumentu/i.test(message)) return { typeId: message }
  if (/kategori/i.test(message)) return { categoryId: message }
  if (/rachunk/i.test(message)) return { paymentAccount: message }
  if (/plik|xml|pdf|wgrany wcześniej|wybierz plik/i.test(message)) return { file: message }
  if (/nip/i.test(message)) return { contractorNip: message }
  if (/kontrahent/i.test(message)) return { contractorName: message }
  if (/brutto|netto|vat/i.test(message)) return { grossAmount: message }
  return { form: message }
}

function formKeyFromPath(path: PropertyKey[]) {
  const [head, nested] = path.map(String)
  if (head === 'contractor') {
    return (nested && CONTRACTOR_FORM_FIELDS[nested]) || 'contractorName'
  }
  return head || 'form'
}
