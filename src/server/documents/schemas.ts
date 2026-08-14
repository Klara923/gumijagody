import { z } from 'zod'
import { isValidBankAccount, isValidNip, normalizeBankAccount, toCents } from '@/server/validation'

function emptyToUndefined<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((value) => (value === '' || value === null ? undefined : value), schema)
}

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

export const listDocumentsQuerySchema = z
  .object({
    stage: z.enum(['BUFFER', 'ACCEPTED']),
    sortBy: emptyToUndefined(z.enum(['issueDate', 'dueDate'])).default('issueDate'),
    sortOrder: emptyToUndefined(z.enum(['asc', 'desc'])).default('desc'),
    typeId: emptyToUndefined(z.string().trim().min(1).optional()),
    contractorId: emptyToUndefined(z.string().trim().min(1).optional()),
    categoryId: emptyToUndefined(z.string().trim().min(1).optional()),
    issueDateFrom: emptyToUndefined(dateOnly.optional()),
    issueDateTo: emptyToUndefined(dateOnly.optional()),
    dueDateFrom: emptyToUndefined(dateOnly.optional()),
    dueDateTo: emptyToUndefined(dateOnly.optional()),
    page: z.preprocess(
      (value) => (value === '' || value === null || value === undefined ? 1 : value),
      z.coerce.number().int().min(1).max(10_000),
    ),
  })
  .refine(
    (query) =>
      !query.issueDateFrom ||
      !query.issueDateTo ||
      query.issueDateFrom.getTime() <= query.issueDateTo.getTime(),
    {
      message: 'issueDateFrom nie może być późniejsze niż issueDateTo',
      path: ['issueDateTo'],
    },
  )
  .refine(
    (query) =>
      !query.dueDateFrom ||
      !query.dueDateTo ||
      query.dueDateFrom.getTime() <= query.dueDateTo.getTime(),
    {
      message: 'dueDateFrom nie może być późniejsze niż dueDateTo',
      path: ['dueDateTo'],
    },
  )

export type ListDocumentsQuery = z.infer<typeof listDocumentsQuerySchema>

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

export const updateDocumentBodySchema = z
  .object({
    number: z.string().trim().min(1, 'Numer dokumentu jest wymagany').optional(),
    typeId: z.string().trim().min(1, 'Typ dokumentu jest wymagany').optional(),
    contractorId: z.string().trim().min(1).optional(),
    contractor: contractorInputSchema.optional(),
    issueDate: dateOnly.optional(),
    dueDate: dateOnly.nullable().optional(),
    netAmount: amount.optional(),
    vatAmount: amount.optional(),
    grossAmount: amount.optional(),
    currency: z
      .string()
      .trim()
      .length(3, 'Waluta musi być trzyliterowym kodem ISO 4217')
      .transform((value) => value.toUpperCase())
      .optional(),
    paymentAccount: bankAccount.nullable().optional(),
    categoryId: z.string().trim().min(1).nullable().optional(),
  })
  .refine((body) => Object.values(body).some((value) => value !== undefined), {
    message: 'Przekaż co najmniej jedno pole do aktualizacji',
  })
  .refine((body) => !(body.contractorId && body.contractor), {
    message: 'Podaj co najwyżej jedno z pól: contractorId albo contractor',
    path: ['contractor'],
  })
  .superRefine((body, ctx) => {
    const provided = [body.netAmount, body.vatAmount, body.grossAmount].filter(
      (value) => value !== undefined,
    ).length

    if (provided > 0 && provided < 3) {
      ctx.addIssue({
        code: 'custom',
        message: 'Przy zmianie kwot podaj netto, VAT i brutto razem',
        path: ['grossAmount'],
      })
      return
    }

    if (
      provided === 3 &&
      toCents(body.netAmount!) + toCents(body.vatAmount!) !== toCents(body.grossAmount!)
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Kwota brutto musi być sumą netto i VAT',
        path: ['grossAmount'],
      })
    }
  })

export type UpdateDocumentInput = z.infer<typeof updateDocumentBodySchema>

export const acceptDocumentsBodySchema = z.object({
  ids: z
    .array(z.string().trim().min(1, 'Id dokumentu jest wymagane'))
    .min(1, 'Podaj co najmniej jeden dokument do akceptacji')
    .transform((ids) => [...new Set(ids)]),
})

export type AcceptDocumentsInput = z.infer<typeof acceptDocumentsBodySchema>

export const uploadPdfMetadataSchema = z
  .object({
    number: z.string().trim().min(1, 'Numer dokumentu jest wymagany'),
    typeId: z.string().trim().min(1, 'Typ dokumentu jest wymagany'),
    contractor: contractorInputSchema,
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
  .refine((body) => toCents(body.netAmount) + toCents(body.vatAmount) === toCents(body.grossAmount), {
    message: 'Kwota brutto musi być sumą netto i VAT',
    path: ['grossAmount'],
  })
  .refine((body) => !body.dueDate || body.dueDate.getTime() >= body.issueDate.getTime(), {
    message: 'Termin płatności nie może być wcześniejszy niż data wystawienia',
    path: ['dueDate'],
  })

export type UploadPdfMetadata = z.infer<typeof uploadPdfMetadataSchema>

export const importFromKsefBodySchema = z
  .object({
    rangeFrom: dateOnly,
    rangeTo: dateOnly,
    invoiceKind: z.enum(['COST', 'SALES']),
  })
  .refine((body) => body.rangeTo.getTime() >= body.rangeFrom.getTime(), {
    message: 'Data końcowa nie może być wcześniejsza niż początkowa',
    path: ['rangeTo'],
  })

export type ImportFromKsefInput = z.infer<typeof importFromKsefBodySchema>
