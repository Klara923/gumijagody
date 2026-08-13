'use client'

import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

export function Flash({
  tone = 'error',
  children,
}: {
  tone?: 'error' | 'ok'
  children: string
}) {
  const [open, setOpen] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => setOpen(false), 7000)
    return () => window.clearTimeout(timer)
  }, [])

  if (!open) return null

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'pointer-events-auto fixed top-16 right-4 z-50 w-[min(calc(100%-2rem),22rem)] rounded-lg border px-3 py-2.5 text-sm shadow-lg',
        tone === 'error'
          ? 'border-red-200 bg-red-50 text-red-800'
          : 'border-emerald-200 bg-emerald-50 text-emerald-800',
      )}
    >
      <div className="flex items-start gap-3">
        <p className="min-w-0 flex-1">{children}</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="shrink-0 text-current/70 hover:text-current"
          aria-label="Zamknij komunikat"
        >
          ×
        </button>
      </div>
    </div>
  )
}
