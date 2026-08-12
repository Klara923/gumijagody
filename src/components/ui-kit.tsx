import type { ReactNode } from 'react'

export function PageShell({
  title,
  description,
  children,
  wide = false,
}: {
  title: string
  description?: string
  children: ReactNode
  wide?: boolean
}) {
  return (
    <main className={`mx-auto w-full px-4 py-6 ${wide ? 'max-w-5xl' : 'max-w-3xl'}`}>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">{title}</h1>
      {description ? <p className="mt-1 text-sm text-zinc-600">{description}</p> : null}
      <div className="mt-6 space-y-6">{children}</div>
    </main>
  )
}

export function Alert({
  tone = 'error',
  children,
}: {
  tone?: 'error' | 'ok'
  children: ReactNode
}) {
  const className =
    tone === 'error'
      ? 'rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800'
      : 'rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800'
  return <p className={className}>{children}</p>
}

export function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="grid gap-1 text-sm text-zinc-700">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  )
}

export const controlClassName =
  'w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500'

export const buttonClassName =
  'inline-flex items-center justify-center rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800'

export const buttonSecondaryClassName =
  'inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50'

export const tableClassName = 'w-full border-collapse text-left text-sm'

export const thClassName = 'border-b border-zinc-200 bg-zinc-50 px-3 py-2 font-medium text-zinc-600'

export const tdClassName = 'border-b border-zinc-100 px-3 py-2 text-zinc-800'
