import { importFromKsef } from '@/server/documents/import-from-ksef'
import { DocumentError } from '@/server/documents/errors'
import { getPrisma } from '@/server/infrastructure/db/prisma'
import { KsefError } from '@/server/infrastructure/ksef/errors'

import { getScheduleSettings } from './settings'
import {
  addDaysToDateOnly,
  formatDateInZone,
  formatTimeInZone,
  toUtcDateOnly,
} from './timezone'

const SINGLETON_ID = 'singleton'

export type ScheduledImportResult = {
  skipped?: boolean
  reason?: string
  results?: Array<{
    invoiceKind: 'COST' | 'SALES'
    status: string
    importedCount: number
    duplicateCount: number
    foundCount: number
    error: string | null
  }>
}

async function claimScheduleSlot(minGapMs: number) {
  const prisma = getPrisma()
  const threshold = new Date(Date.now() - minGapMs)
  const claimed = await prisma.scheduleSetting.updateMany({
    where: {
      id: SINGLETON_ID,
      OR: [{ lastRunAt: null }, { lastRunAt: { lt: threshold } }],
    },
    data: { lastRunAt: new Date() },
  })
  return claimed.count > 0
}

export async function runScheduledKsefImport(options?: {
  force?: boolean
}): Promise<ScheduledImportResult> {
  const settings = await getScheduleSettings()
  const force = options?.force ?? false

  if (!force && !settings.enabled) {
    return { skipped: true, reason: 'Harmonogram wyłączony' }
  }

  if (!force) {
    if (settings.runTimes.length === 0) {
      return { skipped: true, reason: 'Brak godzin w harmonogramie' }
    }

    const now = new Date()
    const currentTime = formatTimeInZone(now, settings.timezone)
    if (!settings.runTimes.includes(currentTime)) {
      return { skipped: true, reason: `Brak slotu dla ${currentTime}` }
    }

    if (settings.lastRunAt) {
      const last = new Date(settings.lastRunAt)
      const sameSlot =
        formatDateInZone(last, settings.timezone) === formatDateInZone(now, settings.timezone) &&
        formatTimeInZone(last, settings.timezone) === currentTime
      if (sameSlot) {
        return { skipped: true, reason: 'Slot już uruchomiony' }
      }
    }

    const claimed = await claimScheduleSlot(50_000)
    if (!claimed) {
      return { skipped: true, reason: 'Równoległe uruchomienie zablokowane' }
    }
  } else {
    await getPrisma().scheduleSetting.update({
      where: { id: SINGLETON_ID },
      data: { lastRunAt: new Date() },
    })
  }

  const today = formatDateInZone(new Date(), settings.timezone)
  const rangeTo = toUtcDateOnly(today)
  const rangeFrom = toUtcDateOnly(addDaysToDateOnly(today, -(settings.lookbackDays - 1)))

  const results: NonNullable<ScheduledImportResult['results']> = []
  for (const invoiceKind of settings.invoiceKinds) {
    try {
      const result = await importFromKsef(
        { rangeFrom, rangeTo, invoiceKind },
        { trigger: 'SCHEDULED' },
      )
      results.push({
        invoiceKind,
        status: result.status,
        importedCount: result.importedCount,
        duplicateCount: result.duplicateCount,
        foundCount: result.foundCount,
        error: result.error,
      })
    } catch (error) {
      const message =
        error instanceof DocumentError ||
        error instanceof KsefError ||
        error instanceof Error
          ? error.message
          : 'Nieoczekiwany błąd importu'
      results.push({
        invoiceKind,
        status: 'FAILED',
        importedCount: 0,
        duplicateCount: 0,
        foundCount: 0,
        error: message,
      })
    }
  }

  return { results }
}
