import { fieldErrorsFromCaught, fieldErrorsFromZod, valuesFromFormData } from './form-field-errors'
import { createDocumentBodySchema, updateDocumentBodySchema } from './schemas'

describe('fieldErrorsFromZod', () => {
  it('maps nested contractor paths and amount mismatch to form fields', () => {
    const parsed = createDocumentBodySchema.safeParse({
      number: 'FV/1',
      typeId: 'type-1',
      contractor: { name: 'Test', nip: '123', bankAccount: '123' },
      issueDate: '2026-08-15',
      netAmount: '100.00',
      vatAmount: '23.00',
      grossAmount: '100.00',
      currency: 'PLN',
    })

    expect(parsed.success).toBe(false)
    if (parsed.success) return

    const errors = fieldErrorsFromZod(parsed.error)
    expect(errors.contractorNip).toMatch(/NIP/i)
    expect(errors.contractorBankAccount).toMatch(/rachunk/i)
    expect(errors.grossAmount).toMatch(/brutto/i)
  })
})

describe('fieldErrorsFromCaught', () => {
  it('puts a duplicate-number error on the number field', () => {
    expect(
      fieldErrorsFromCaught('Dokument o numerze "FV/1" dla tego kontrahenta już istnieje'),
    ).toEqual({
      number: 'Dokument o numerze "FV/1" dla tego kontrahenta już istnieje',
    })
  })

  it('puts upload and XML parse errors on the file field', () => {
    expect(fieldErrorsFromCaught('Ten plik został już wgrany wcześniej')).toEqual({
      file: 'Ten plik został już wgrany wcześniej',
    })
    expect(fieldErrorsFromCaught('Brak numeru faktury (P_2) w XML')).toEqual({
      file: 'Brak numeru faktury (P_2) w XML',
    })
  })

  it('puts a due-before-issue DocumentError on the dueDate field', () => {
    expect(
      fieldErrorsFromCaught('Termin płatności nie może być wcześniejszy niż data wystawienia'),
    ).toEqual({
      dueDate: 'Termin płatności nie może być wcześniejszy niż data wystawienia',
    })
  })
})

describe('updateDocumentBodySchema field errors', () => {
  it('puts a due-before-issue refine on the dueDate field', () => {
    const parsed = updateDocumentBodySchema.safeParse({
      issueDate: '2026-08-15',
      dueDate: '2026-08-01',
    })

    expect(parsed.success).toBe(false)
    if (parsed.success) return

    expect(fieldErrorsFromZod(parsed.error)).toEqual({
      dueDate: 'Termin płatności nie może być wcześniejszy niż data wystawienia',
    })
  })
})

describe('valuesFromFormData', () => {
  it('keeps submitted fields so the form can restore them after an error', () => {
    const formData = new FormData()
    formData.set('number', 'FV/1')
    formData.set('contractorName', 'Orlen')
    formData.set('netAmount', '100.00')
    formData.set('paymentAccount', '123')

    expect(valuesFromFormData(formData)).toMatchObject({
      number: 'FV/1',
      contractorName: 'Orlen',
      netAmount: '100.00',
      paymentAccount: '123',
      typeId: '',
    })
  })
})
