import { getPrisma } from '@/server/infrastructure/db/prisma'

import { REGISTER_VIEW, resolveVisibleColumns } from '@/lib/register-columns'
import type { UpdateRegisterColumnsInput } from './schemas'

export async function updateRegisterVisibleColumns(input: UpdateRegisterColumnsInput) {
  const visibleColumns = resolveVisibleColumns(input.visibleColumns)

  const preference = await getPrisma().tablePreference.upsert({
    where: { view: REGISTER_VIEW },
    create: {
      view: REGISTER_VIEW,
      visibleColumns,
    },
    update: { visibleColumns },
  })

  return resolveVisibleColumns(preference.visibleColumns)
}
