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
