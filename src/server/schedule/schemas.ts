import { z } from 'zod'

export function normalizeTimeHhMm(value: string): string {
  const trimmed = value.trim()
  const match = /^(\d{1,2}):([0-5]\d)(?::[0-5]\d)?$/.exec(trimmed)
  if (!match) return trimmed
  return `${match[1].padStart(2, '0')}:${match[2]}`
}

const timeHhMm = z
  .string()
  .trim()
  .transform(normalizeTimeHhMm)
  .refine(
    (value) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value),
    'Godzina musi być w formacie HH:MM',
  )

export const updateScheduleSettingsBodySchema = z
  .object({
    enabled: z.boolean(),
    timezone: z.string().trim().min(1).default('Europe/Warsaw'),
    lookbackDays: z.number().int().min(1).max(93),
    invoiceKinds: z
      .array(z.enum(['COST', 'SALES']))
      .min(1, 'Wybierz co najmniej jeden rodzaj faktur'),
    runTimes: z.array(timeHhMm).max(24, 'Maksymalnie 24 uruchomienia na dobę'),
  })
  .refine((data) => !data.enabled || data.runTimes.length > 0, {
    message: 'Włączony harmonogram wymaga co najmniej jednej godziny uruchomienia',
    path: ['runTimes'],
  })

export type UpdateScheduleSettingsInput = z.infer<typeof updateScheduleSettingsBodySchema>
