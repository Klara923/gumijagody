import { z } from 'zod'

export const createCategoryBodySchema = z.object({
  name: z.string().trim().min(1, 'Nazwa kategorii jest wymagana').max(120),
  parentId: z.string().trim().min(1).nullable().optional(),
})

export type CreateCategoryInput = z.infer<typeof createCategoryBodySchema>

export const updateCategoryBodySchema = z
  .object({
    name: z.string().trim().min(1, 'Nazwa kategorii jest wymagana').max(120).optional(),
    parentId: z.string().trim().min(1).nullable().optional(),
  })
  .refine((body) => body.name !== undefined || body.parentId !== undefined, {
    message: 'Podaj nazwę lub kategorię nadrzędną do aktualizacji',
  })

export type UpdateCategoryInput = z.infer<typeof updateCategoryBodySchema>

export const updateContractorDefaultCategoryBodySchema = z.object({
  defaultCategoryId: z.string().trim().min(1).nullable(),
})

export type UpdateContractorDefaultCategoryInput = z.infer<
  typeof updateContractorDefaultCategoryBodySchema
>

const keywordSchema = z
  .string()
  .trim()
  .min(2, 'Słowo kluczowe musi mieć co najmniej 2 znaki')
  .max(80, 'Słowo kluczowe jest za długie')

const prioritySchema = z.coerce
  .number()
  .int('Kolejność musi być liczbą całkowitą')
  .min(0, 'Kolejność nie może być ujemna')
  .max(9999, 'Kolejność jest za duża')

export const createKeywordRuleBodySchema = z.object({
  keyword: keywordSchema,
  categoryId: z.string().trim().min(1, 'Wybierz kategorię'),
  priority: prioritySchema.optional(),
})

export type CreateKeywordRuleInput = z.infer<typeof createKeywordRuleBodySchema>

export const updateKeywordRuleBodySchema = z
  .object({
    keyword: keywordSchema.optional(),
    categoryId: z.string().trim().min(1, 'Wybierz kategorię').optional(),
    priority: prioritySchema.optional(),
  })
  .refine(
    (body) =>
      body.keyword !== undefined || body.categoryId !== undefined || body.priority !== undefined,
    { message: 'Podaj słowo kluczowe, kategorię lub kolejność' },
  )

export type UpdateKeywordRuleInput = z.infer<typeof updateKeywordRuleBodySchema>
