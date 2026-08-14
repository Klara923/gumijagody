import { z } from 'zod'

import { REGISTER_COLUMNS } from '@/lib/register-columns'

const registerColumnIdSchema = z.enum(
  REGISTER_COLUMNS.map((column) => column.id) as [
    (typeof REGISTER_COLUMNS)[number]['id'],
    ...(typeof REGISTER_COLUMNS)[number]['id'][],
  ],
)

export const updateRegisterColumnsBodySchema = z.object({
  visibleColumns: z.array(registerColumnIdSchema).min(1, 'Zostaw co najmniej jedną kolumnę'),
})

export type UpdateRegisterColumnsInput = z.infer<typeof updateRegisterColumnsBodySchema>
