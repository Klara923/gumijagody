import type { KsefInvoiceKind } from '@/generated/prisma/client'

import { getPrisma } from '@/server/infrastructure/db/prisma'

import type { UpdateScheduleSettingsInput } from './schemas'

const SINGLETON_ID = 'singleton'

function uniqueSortedTimes(times: string[]) {
  return [...new Set(times)].sort()
}

export async function getScheduleSettings() {
  const prisma = getPrisma()
  const existing = await prisma.scheduleSetting.findUnique({ where: { id: SINGLETON_ID } })
  if (existing) {
    return {
      id: existing.id,
      enabled: existing.enabled,
      timezone: existing.timezone,
      lookbackDays: existing.lookbackDays,
      invoiceKinds: existing.invoiceKinds,
      runTimes: existing.runTimes,
      lastRunAt: existing.lastRunAt?.toISOString() ?? null,
      updatedAt: existing.updatedAt.toISOString(),
    }
  }

  const created = await prisma.scheduleSetting.create({
    data: {
      id: SINGLETON_ID,
      enabled: false,
      timezone: 'Europe/Warsaw',
      lookbackDays: 7,
      invoiceKinds: ['COST', 'SALES'],
      runTimes: ['01:00', '02:00', '03:00'],
    },
  })

  return {
    id: created.id,
    enabled: created.enabled,
    timezone: created.timezone,
    lookbackDays: created.lookbackDays,
    invoiceKinds: created.invoiceKinds,
    runTimes: created.runTimes,
    lastRunAt: created.lastRunAt?.toISOString() ?? null,
    updatedAt: created.updatedAt.toISOString(),
  }
}

export async function updateScheduleSettings(input: UpdateScheduleSettingsInput) {
  const prisma = getPrisma()
  await getScheduleSettings()

  const updated = await prisma.scheduleSetting.update({
    where: { id: SINGLETON_ID },
    data: {
      enabled: input.enabled,
      timezone: input.timezone,
      lookbackDays: input.lookbackDays,
      invoiceKinds: input.invoiceKinds as KsefInvoiceKind[],
      runTimes: uniqueSortedTimes(input.runTimes),
    },
  })

  return {
    id: updated.id,
    enabled: updated.enabled,
    timezone: updated.timezone,
    lookbackDays: updated.lookbackDays,
    invoiceKinds: updated.invoiceKinds,
    runTimes: updated.runTimes,
    lastRunAt: updated.lastRunAt?.toISOString() ?? null,
    updatedAt: updated.updatedAt.toISOString(),
  }
}
