import { getPrisma } from '@/server/infrastructure/db/prisma'

import {
  DEFAULT_VISIBLE_COLUMNS,
  REGISTER_VIEW,
  resolveVisibleColumns,
  type RegisterColumnId,
} from './register-columns'

export async function getRegisterVisibleColumns(): Promise<RegisterColumnId[]> {
  const preference = await getPrisma().tablePreference.findUnique({
    where: { view: REGISTER_VIEW },
    select: { visibleColumns: true },
  })

  return resolveVisibleColumns(preference?.visibleColumns ?? DEFAULT_VISIBLE_COLUMNS)
}
