import type { ReactNode } from 'react'

import { Flash } from '@/components/flash'
import type { BadgeTone } from '@/lib/labels'
import { cn } from '@/lib/utils'

export function PageShell({
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
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      {flash?.message ? <Flash tone={flash.tone}>{flash.message}</Flash> : null}
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

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        'rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm',
        className,
      )}
    >
      {children}
    </section>
  )
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-3 text-sm font-semibold text-foreground">{children}</h2>
}

export function EmptyState({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children?: ReactNode
}) {
  return (
    <Card className="grid justify-items-start gap-3 py-10">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description ? <p className="max-w-md text-sm text-muted-foreground">{description}</p> : null}
      {children}
    </Card>
  )
}

const badgeToneClassName: Record<BadgeTone, string> = {
  neutral: 'border-border bg-muted text-muted-foreground',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  danger: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-sky-200 bg-sky-50 text-sky-900',
}

export function Badge({
  tone = 'neutral',
  children,
}: {
  tone?: BadgeTone
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        badgeToneClassName[tone],
      )}
    >
      {children}
    </span>
  )
}

export function EnumBadge({
  value,
  labels,
}: {
  value: string
  labels: Record<string, { label: string; tone: BadgeTone }>
}) {
  const meta = labels[value] ?? { label: value, tone: 'neutral' as const }
  return <Badge tone={meta.tone}>{meta.label}</Badge>
}

export function Alert({
  tone = 'error',
  children,
}: {
  tone?: 'error' | 'ok'
  children: ReactNode
}) {
  return (
    <p
      className={
        tone === 'error'
          ? 'rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800'
          : 'rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800'
      }
    >
      {children}
    </p>
  )
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="grid gap-1 text-sm text-foreground">
      <span className="font-medium">{label}</span>
      {children}
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  )
}

export const controlClassName =
  'h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30'

export const buttonClassName =
  'inline-flex h-9 shrink-0 cursor-pointer items-center justify-center rounded-md bg-primary px-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50'

export const buttonSecondaryClassName =
  'inline-flex h-9 shrink-0 cursor-pointer items-center justify-center rounded-md border border-border bg-background px-3.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50'

export const buttonDestructiveClassName =
  'inline-flex h-9 shrink-0 cursor-pointer items-center justify-center rounded-md border border-destructive/20 bg-destructive/10 px-3.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/15 disabled:cursor-not-allowed disabled:opacity-50'

export const textLinkClassName =
  'cursor-pointer text-sm font-medium text-foreground underline-offset-4 hover:underline'

export const tableClassName = 'w-full min-w-[40rem] table-fixed border-collapse text-left text-sm'

export const thClassName =
  'border-b border-border bg-muted/70 px-3 py-2.5 font-medium text-muted-foreground'

export const tdClassName = 'border-b border-border/80 px-3 py-2.5 text-foreground'

export const trClassName = 'hover:bg-muted/40'
