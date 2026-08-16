import type { Metadata } from 'next'

import { PageShell } from '@/components/page-shell'
import { Card, Field, buttonClassName, fieldControlClassName } from '@/components/ui-kit'
import { APP_NAME, COMPANY_CONTEXT_LABEL, COMPANY_NAME } from '@/lib/brand'
import { first } from '@/lib/search-params'
import { safeInternalPath } from '@/lib/session'
import { loginAction } from '@/server/auth/actions'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export const metadata: Metadata = { title: 'Logowanie' }

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const invalid = Boolean(first(params.error))
  const from = safeInternalPath(first(params.from))

  return (
    <PageShell
      title={`Wejście do ${APP_NAME}`}
      description={`Jeden wspólny dostęp, bez kont i ról. ${COMPANY_CONTEXT_LABEL}: ${COMPANY_NAME}.`}
    >
      <Card className="max-w-md">
        <form action={loginAction} className="grid gap-3">
          <input type="hidden" name="from" value={from} />
          <Field label="Hasło" error={invalid ? 'Nieprawidłowe hasło' : undefined}>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              aria-invalid={invalid}
              className={fieldControlClassName(invalid)}
            />
          </Field>
          <div>
            <button type="submit" className={buttonClassName}>
              Wejdź
            </button>
          </div>
        </form>
      </Card>
    </PageShell>
  )
}
