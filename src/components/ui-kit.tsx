import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'
import type { BadgeTone } from '@/lib/labels'

export function PageShell({
  title,
  description,
  meta,
  children,
  wide = false,
}: {
  title: string
  description?: string
  meta?: ReactNode
  children: ReactNode
  wide?: boolean
}) {
  return (
    <main className={cn('mx-auto w-full px-4 py-8', wide ? 'max-w-5xl' : 'max-w-3xl')}>
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        {meta}
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
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="grid gap-1 text-sm text-foreground">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  )
}

export const controlClassName =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30'

export const buttonClassName =
  'inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90'

export const buttonSecondaryClassName =
  'inline-flex items-center justify-center rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted'

export const buttonDestructiveClassName =
  'inline-flex items-center justify-center rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/15'

export const tableClassName = 'w-full border-collapse text-left text-sm'

export const thClassName =
  'border-b border-border bg-muted/70 px-3 py-2 font-medium text-muted-foreground'

export const tdClassName = 'border-b border-border/80 px-3 py-2 text-foreground'
