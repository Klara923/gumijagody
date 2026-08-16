'use server'

import { revalidatePath } from 'next/cache'

import { formString, redirectWithError } from '@/server/http/form'
import { redirectWithOk } from '@/server/http/flash'
import { runScheduledKsefImport } from '@/server/schedule/run-scheduled-import'
import {
  normalizeTimeHhMm,
  updateScheduleSettingsBodySchema,
} from '@/server/schedule/schemas'
import { updateScheduleSettings } from '@/server/schedule/settings'

export async function updateScheduleSettingsAction(formData: FormData) {
  const runTimes = formData
    .getAll('runTimes')
    .filter((value): value is string => typeof value === 'string' && value.trim() !== '')
    .map(normalizeTimeHhMm)
  const newTime = normalizeTimeHhMm(formString(formData, 'newTime'))
  if (newTime) runTimes.push(newTime)

  const invoiceKinds = formData
    .getAll('invoiceKinds')
    .filter((value): value is 'COST' | 'SALES' => value === 'COST' || value === 'SALES')

  const raw = {
    enabled: formData.get('enabled') === 'on' || formData.get('enabled') === 'true',
    timezone: formString(formData, 'timezone') || 'Europe/Warsaw',
    lookbackDays: Number(formString(formData, 'lookbackDays')),
    invoiceKinds,
    runTimes,
  }

  const parsed = updateScheduleSettingsBodySchema.safeParse(raw)
  if (!parsed.success) {
    return await redirectWithError(
      '/ksef/schedule',
      parsed.error.issues[0]?.message ?? 'Nieprawidłowe dane harmonogramu',
    )
  }

  try {
    await updateScheduleSettings(parsed.data)
    revalidatePath('/ksef/schedule')
    revalidatePath('/ksef/import')
    return await redirectWithOk('/ksef/schedule', 'Zapisano harmonogram.')
  } catch (error) {
    return await redirectWithError('/ksef/schedule', error)
  }
}

export async function removeScheduleTimeAction(formData: FormData) {
  const removeTime = normalizeTimeHhMm(formString(formData, 'removeTime'))
  const { getScheduleSettings } = await import('@/server/schedule/settings')
  const current = await getScheduleSettings()
  const nextTimes = current.runTimes.filter((time) => time !== removeTime)

  const parsed = updateScheduleSettingsBodySchema.safeParse({
    enabled: current.enabled,
    timezone: current.timezone,
    lookbackDays: current.lookbackDays,
    invoiceKinds: current.invoiceKinds,
    runTimes: nextTimes,
  })
  if (!parsed.success) {
    return await redirectWithError(
      '/ksef/schedule',
      parsed.error.issues[0]?.message ?? 'Nieprawidłowe dane harmonogramu',
    )
  }

  try {
    await updateScheduleSettings(parsed.data)
    revalidatePath('/ksef/schedule')
    return await redirectWithOk('/ksef/schedule', 'Zapisano harmonogram.')
  } catch (error) {
    return await redirectWithError('/ksef/schedule', error)
  }
}

export async function runScheduleNowAction() {
  try {
    const result = await runScheduledKsefImport({ force: true })
    revalidatePath('/ksef/schedule')
    revalidatePath('/buffer')
    revalidatePath('/documents')

    const imported = result.results?.reduce((sum, item) => sum + item.importedCount, 0) ?? 0
    const duplicates = result.results?.reduce((sum, item) => sum + item.duplicateCount, 0) ?? 0
    return await redirectWithOk(
      '/ksef/schedule',
      `Uruchomiono teraz — zaimportowano ${imported}, duplikaty ${duplicates}.`,
    )
  } catch (error) {
    return await redirectWithError('/ksef/schedule', error)
  }
}
