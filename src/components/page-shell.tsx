import type { ReactNode } from 'react'
import { headers } from 'next/headers'

import { Flash } from '@/components/flash'
import { readFlashFromHeaders } from '@/server/http/flash'

export async function PageShell({
  title,
  description,
  meta,
  actions,
  flash,
  children,
}: {
  title: string
  description?: string
  meta?: ReactNode
  actions?: ReactNode
  flash?: { tone?: 'error' | 'ok'; message: string } | null
  children: ReactNode
}) {
  const shown = flash ?? readFlashFromHeaders(await headers())

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      {shown?.message ? <Flash tone={shown.tone}>{shown.message}</Flash> : null}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          {description ? <p className="max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
          {meta}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </header>
      <div className="mt-6 space-y-6">{children}</div>
    </main>
  )
}
