'use server'

import { revalidatePath } from 'next/cache'

import { updateRegisterColumnsBodySchema } from '@/server/table-preferences/schemas'
import { updateRegisterVisibleColumns } from '@/server/table-preferences/update-table-preference'

export async function saveRegisterColumnsAction(visibleColumns: string[]) {
  const parsed = updateRegisterColumnsBodySchema.safeParse({ visibleColumns })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Nieprawidłowe kolumny' }
  }

  try {
    await updateRegisterVisibleColumns(parsed.data)
    revalidatePath('/documents')
    return { error: null }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Nie udało się zapisać kolumn',
    }
  }
}
