import { z } from 'zod'
import { isValidBankAccount, isValidNip, normalizeBankAccount, toCents } from '@/server/validation'

export const listDocumentsQuerySchema = z.object({
  stage: z.enum(['BUFFER', 'ACCEPTED']),
})

export type ListDocumentsQuery = z.infer<typeof listDocumentsQuerySchema>

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data musi być w formacie RRRR-MM-DD')
  .transform((value, ctx) => {
    const date = new Date(`${value}T00:00:00.000Z`)
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
      ctx.addIssue({ code: 'custom', message: `"${value}" nie jest istniejącą datą` })
      return z.NEVER
    }
    return date
  })

const amount = z
  .string()
  .trim()
  .regex(/^-?\d{1,12}(\.\d{1,2})?$/, 'Kwota musi być liczbą z maksymalnie dwoma miejscami po przecinku')

const bankAccount = z
  .string()
  .trim()
  .refine(isValidBankAccount, 'Numer rachunku ma niepoprawny format lub sumę kontrolną (NRB/IBAN)')
  .transform(normalizeBankAccount)

const contractorInputSchema = z.object({
  name: z.string().trim().min(1, 'Nazwa kontrahenta jest wymagana'),
  nip: z
    .string()
    .trim()
    .refine(isValidNip, 'NIP musi mieć 10 cyfr i poprawną sumę kontrolną')
    .transform((value) => value.replace(/[\s-]/g, ''))
    .optional(),
  street: z.string().trim().min(1).optional(),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{2}-\d{3}$/, 'Kod pocztowy musi mieć format 00-000')
    .optional(),
  city: z.string().trim().min(1).optional(),
  country: z
    .string()
    .trim()
    .length(2, 'Kod kraju musi mieć 2 znaki')
    .transform((value) => value.toUpperCase())
    .optional(),
  bankAccount: bankAccount.optional(),
})

export const createDocumentBodySchema = z
  .object({
    number: z.string().trim().min(1, 'Numer dokumentu jest wymagany'),
    typeId: z.string().trim().min(1, 'Typ dokumentu jest wymagany'),
    contractorId: z.string().trim().min(1).optional(),
    contractor: contractorInputSchema.optional(),
    issueDate: dateOnly,
    dueDate: dateOnly.optional(),
    netAmount: amount,
    vatAmount: amount,
    grossAmount: amount,
    currency: z
      .string()
      .trim()
      .length(3, 'Waluta musi być trzyliterowym kodem ISO 4217')
      .transform((value) => value.toUpperCase())
      .default('PLN'),
    paymentAccount: bankAccount.optional(),
    categoryId: z.string().trim().min(1).optional(),
  })
  .refine((body) => Boolean(body.contractorId) !== Boolean(body.contractor), {
    message: 'Podaj dokładnie jedno z pól: contractorId (istniejący) albo contractor (nowy)',
    path: ['contractor'],
  })
  .refine((body) => toCents(body.netAmount) + toCents(body.vatAmount) === toCents(body.grossAmount), {
    message: 'Kwota brutto musi być sumą netto i VAT',
    path: ['grossAmount'],
  })
  .refine((body) => !body.dueDate || body.dueDate.getTime() >= body.issueDate.getTime(), {
    message: 'Termin płatności nie może być wcześniejszy niż data wystawienia',
    path: ['dueDate'],
  })

export type CreateDocumentInput = z.infer<typeof createDocumentBodySchema>
