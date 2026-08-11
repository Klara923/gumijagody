import { z } from 'zod'

export const listDocumentsQuerySchema = z.object({
  stage: z.enum(['BUFFER', 'ACCEPTED']),
})

export type ListDocumentsQuery = z.infer<typeof listDocumentsQuerySchema>
