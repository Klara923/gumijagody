import { z } from 'zod'

/**
 * Pusta zmienna w pliku `.env` (np. `KSEF_TOKEN=""`) oznacza brak wartości, a nie pusty string.
 * Bez tej normalizacji szablon `.env.example` z pustymi polami wywracałby walidację.
 */
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema.optional())

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL jest wymagany'),

  KSEF_CLIENT: z.enum(['mock', 'http']).default('mock'),
  KSEF_API_BASE_URL: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.url().default('https://api-test.ksef.mf.gov.pl/v2'),
  ),
  KSEF_NIP: optional(z.string().regex(/^\d{10}$/, 'KSEF_NIP musi mieć dokładnie 10 cyfr')),
  KSEF_TOKEN: optional(z.string().min(1)),

  CRON_SECRET: optional(z.string().min(1)),
})

export type Env = z.infer<typeof envSchema>

let cached: Env | undefined

/**
 * Walidacja jest leniwa i wykonuje się przy pierwszym użyciu, a nie przy imporcie modułu -
 * dzięki temu `next build` nie wymaga dostępu do sekretów produkcyjnych.
 */
export function getEnv(): Env {
  if (cached) return cached

  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n')
    throw new Error(`Nieprawidłowa konfiguracja środowiska:\n${details}`)
  }

  cached = parsed.data
  return cached
}
