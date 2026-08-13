import { z } from 'zod'

export const documentDirectionSchema = z.enum(['RECEIVABLE', 'PAYABLE'])

export const createDocumentTypeBodySchema = z.object({
  name: z.string().trim().min(1, 'Nazwa typu jest wymagana').max(120),
  direction: documentDirectionSchema,
})

export type CreateDocumentTypeInput = z.infer<typeof createDocumentTypeBodySchema>

export const updateDocumentTypeBodySchema = z
  .object({
    name: z.string().trim().min(1, 'Nazwa typu jest wymagana').max(120).optional(),
    direction: documentDirectionSchema.optional(),
  })
  .refine((body) => body.name !== undefined || body.direction !== undefined, {
    message: 'Podaj nazwę lub kierunek do aktualizacji',
  })

export type UpdateDocumentTypeInput = z.infer<typeof updateDocumentTypeBodySchema>
