'use server'

import { revalidatePath } from 'next/cache'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { redirect } from 'next/navigation'

import { CategoryError } from '@/server/categories/errors'
import { DocumentError } from '@/server/documents/errors'
import { KsefError } from '@/server/infrastructure/ksef/errors'
import { runScheduledKsefImport } from '@/server/schedule/run-scheduled-import'
import {
  normalizeTimeHhMm,
  updateScheduleSettingsBodySchema,
} from '@/server/schedule/schemas'
import { updateScheduleSettings } from '@/server/schedule/settings'

function formString(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}

function redirectWithError(path: string, error: unknown): never {
  if (isRedirectError(error)) throw error

  const message =
    error instanceof DocumentError ||
    error instanceof KsefError ||
    error instanceof CategoryError
      ? error.message
      : typeof error === 'string'
        ? error
        : error instanceof Error
          ? error.message
          : 'Nieoczekiwany błąd'
  redirect(`${path}?error=${encodeURIComponent(message)}`)
}

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
    redirectWithError(
      '/ksef/schedule',
      parsed.error.issues[0]?.message ?? 'Nieprawidłowe dane harmonogramu',
    )
  }

  try {
    await updateScheduleSettings(parsed.data)
    revalidatePath('/ksef/schedule')
    revalidatePath('/ksef/import')
    redirect('/ksef/schedule?saved=1')
  } catch (error) {
    redirectWithError('/ksef/schedule', error)
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
    redirectWithError(
      '/ksef/schedule',
      parsed.error.issues[0]?.message ?? 'Nieprawidłowe dane harmonogramu',
    )
  }

  try {
    await updateScheduleSettings(parsed.data)
    revalidatePath('/ksef/schedule')
    redirect('/ksef/schedule?saved=1')
  } catch (error) {
    redirectWithError('/ksef/schedule', error)
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
    const params = new URLSearchParams({
      ran: '1',
      imported: String(imported),
      duplicates: String(duplicates),
    })
    redirect(`/ksef/schedule?${params.toString()}`)
  } catch (error) {
    redirectWithError('/ksef/schedule', error)
  }
}
